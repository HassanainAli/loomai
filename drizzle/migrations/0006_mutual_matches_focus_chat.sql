CREATE TABLE public.match_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL,
  user_b uuid NOT NULL,
  drop_date date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','ended')),
  ended_by uuid,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_a, user_b, drop_date),
  CHECK (user_a < user_b)
);
GRANT SELECT ON public.match_threads TO authenticated;
GRANT ALL ON public.match_threads TO service_role;
ALTER TABLE public.match_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY mt_select_member ON public.match_threads FOR SELECT TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b);
CREATE INDEX match_threads_active_a ON public.match_threads (user_a) WHERE status = 'active';
CREATE INDEX match_threads_active_b ON public.match_threads (user_b) WHERE status = 'active';

CREATE TABLE public.match_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.match_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);
CREATE INDEX match_messages_thread ON public.match_messages (thread_id, created_at);
GRANT SELECT, INSERT ON public.match_messages TO authenticated;
GRANT ALL ON public.match_messages TO service_role;
ALTER TABLE public.match_messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_thread_member(_thread uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.match_threads t WHERE t.id = _thread AND (t.user_a = _user OR t.user_b = _user))
$$;

CREATE POLICY mm_select_member ON public.match_messages FOR SELECT TO authenticated
  USING (public.is_thread_member(thread_id, auth.uid()));
CREATE POLICY mm_insert_member ON public.match_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_thread_member(thread_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.validate_match_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.body := btrim(NEW.body);
  IF length(NEW.body) < 1 OR length(NEW.body) > 1000 THEN
    RAISE EXCEPTION 'Messages must be 1 to 1000 characters.' USING ERRCODE = 'check_violation';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.match_threads WHERE id = NEW.thread_id AND status = 'active') THEN
    RAISE EXCEPTION 'This connection has ended.' USING ERRCODE = 'check_violation';
  END IF;
  NEW.created_at := now();
  NEW.read_at := NULL;
  RETURN NEW;
END $$;
CREATE TRIGGER match_messages_validate BEFORE INSERT ON public.match_messages
  FOR EACH ROW EXECUTE FUNCTION public.validate_match_message();

ALTER TABLE public.match_history ADD COLUMN thread_id uuid, ADD COLUMN matched_user_id uuid;

-- Partner sync + mutual detection. Nested updates (depth > 1) are skipped to avoid re-entry.
CREATE OR REPLACE FUNCTION public.sync_match_partner_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE partner_st text;
BEGIN
  IF pg_trigger_depth() > 1 OR NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;
  NEW.updated_at := now();
  SELECT status INTO partner_st FROM public.matches
   WHERE user_id = NEW.matched_user_id AND matched_user_id = NEW.user_id AND drop_date = NEW.drop_date;
  IF NEW.status = 'greenlit' AND partner_st = 'greenlit' THEN
    NEW.status := 'mutual';
    NEW.partner_status := 'mutual';
    UPDATE public.matches SET status = 'mutual', partner_status = 'mutual', updated_at = now()
     WHERE user_id = NEW.matched_user_id AND matched_user_id = NEW.user_id AND drop_date = NEW.drop_date;
    INSERT INTO public.match_threads (user_a, user_b, drop_date)
    VALUES (least(NEW.user_id, NEW.matched_user_id), greatest(NEW.user_id, NEW.matched_user_id), NEW.drop_date)
    ON CONFLICT DO NOTHING;
  ELSE
    UPDATE public.matches SET partner_status = NEW.status, updated_at = now()
     WHERE user_id = NEW.matched_user_id AND matched_user_id = NEW.user_id AND drop_date = NEW.drop_date;
  END IF;
  RETURN NEW;
END $$;

-- Users may only set their own row to greenlit or passed from pending.
CREATE OR REPLACE FUNCTION public.guard_match_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF pg_trigger_depth() = 1 AND current_user = 'authenticated' THEN
    IF NEW.status NOT IN ('greenlit','passed') OR OLD.status <> 'pending'
       OR NEW.partner_status IS DISTINCT FROM OLD.partner_status
       OR NEW.score IS DISTINCT FROM OLD.score OR NEW.similarity_score IS DISTINCT FROM OLD.similarity_score
       OR NEW.matched_user_id IS DISTINCT FROM OLD.matched_user_id OR NEW.drop_date IS DISTINCT FROM OLD.drop_date THEN
      RAISE EXCEPTION 'Invalid match update.' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER matches_aa_guard BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.guard_match_status();

CREATE OR REPLACE FUNCTION public.end_connection(p_thread uuid, p_reason text, p_note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t public.match_threads%ROWTYPE; other uuid;
BEGIN
  SELECT * INTO t FROM public.match_threads WHERE id = p_thread FOR UPDATE;
  IF NOT FOUND OR auth.uid() NOT IN (t.user_a, t.user_b) THEN
    RAISE EXCEPTION 'Not allowed.' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF t.status = 'ended' THEN RETURN; END IF;
  other := CASE WHEN t.user_a = auth.uid() THEN t.user_b ELSE t.user_a END;
  UPDATE public.match_threads SET status = 'ended', ended_by = auth.uid(), ended_at = now() WHERE id = p_thread;
  UPDATE public.matches SET status = 'ended', partner_status = 'ended', updated_at = now()
   WHERE user_id = auth.uid() AND matched_user_id = other AND drop_date = t.drop_date;
  UPDATE public.matches SET status = 'ended', partner_status = 'ended', updated_at = now()
   WHERE user_id = other AND matched_user_id = auth.uid() AND drop_date = t.drop_date;
  INSERT INTO public.match_history (user_id, separation_category, open_feedback, thread_id, matched_user_id)
  VALUES (auth.uid(), left(coalesce(p_reason,'Other'), 100), nullif(left(btrim(coalesce(p_note,'')), 500), ''), p_thread, other);
  INSERT INTO public.user_blocks (blocker_id, blocked_id)
  SELECT auth.uid(), other WHERE NOT EXISTS (SELECT 1 FROM public.user_blocks WHERE blocker_id = auth.uid() AND blocked_id = other);
  INSERT INTO public.user_blocks (blocker_id, blocked_id)
  SELECT other, auth.uid() WHERE NOT EXISTS (SELECT 1 FROM public.user_blocks WHERE blocker_id = other AND blocked_id = auth.uid());
END $$;
GRANT EXECUTE ON FUNCTION public.end_connection(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_thread_read(p_thread uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.match_messages SET read_at = now()
   WHERE thread_id = p_thread AND sender_id <> auth.uid() AND read_at IS NULL
     AND public.is_thread_member(p_thread, auth.uid());
$$;
GRANT EXECUTE ON FUNCTION public.mark_thread_read(uuid) TO authenticated;

DROP FUNCTION public.get_my_matches();
CREATE FUNCTION public.get_my_matches()
RETURNS TABLE(match_id uuid, drop_date date, matched_user_id uuid, display_name text, campus_hub text, date_of_birth text, height_in smallint, intention text, balance text, seed_prompts jsonb, daily_answer text, my_answer text, prompt_text text, similarity_score real, status text, partner_status text, thread_id uuid, unread_count integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH latest AS (SELECT max(drop_date) d FROM public.matches WHERE user_id = auth.uid())
  SELECT m.id, m.drop_date, m.matched_user_id, p.display_name, p.campus_hub,
         u.raw_user_meta_data->>'date_of_birth', p.height_in, mp.intention, mp.balance, p.seed_prompts,
         (SELECT r.response_text FROM public.prompt_responses r WHERE r.user_id = m.matched_user_id AND r.drop_date = m.drop_date ORDER BY r.created_at DESC LIMIT 1),
         (SELECT r.response_text FROM public.prompt_responses r WHERE r.user_id = m.user_id AND r.drop_date = m.drop_date ORDER BY r.created_at DESC LIMIT 1),
         (SELECT dp.prompt_text FROM public.prompt_responses r JOIN public.daily_prompts dp ON dp.id = r.prompt_id WHERE r.user_id = m.user_id AND r.drop_date = m.drop_date ORDER BY r.created_at DESC LIMIT 1),
         m.similarity_score,
         -- Hide the partner's choice unless both said yes.
         CASE WHEN m.status = 'mutual' THEN 'mutual' ELSE m.status END,
         CASE WHEN m.status = 'mutual' THEN 'mutual' ELSE 'hidden' END,
         t.id,
         coalesce((SELECT count(*)::int FROM public.match_messages mm WHERE mm.thread_id = t.id AND mm.sender_id <> auth.uid() AND mm.read_at IS NULL), 0)
  FROM public.matches m
  CROSS JOIN latest
  JOIN public.profiles p ON p.id = m.matched_user_id
  LEFT JOIN auth.users u ON u.id = m.matched_user_id
  LEFT JOIN public.match_threads t ON t.drop_date = m.drop_date AND t.status = 'active'
       AND t.user_a = least(m.user_id, m.matched_user_id) AND t.user_b = greatest(m.user_id, m.matched_user_id)
  LEFT JOIN LATERAL (SELECT x.intention, x.balance FROM public.matching_preferences x WHERE x.user_id = m.matched_user_id ORDER BY x.updated_at DESC LIMIT 1) mp ON true
  WHERE m.user_id = auth.uid()
    AND m.status NOT IN ('ended','passed')
    AND (m.drop_date = latest.d OR t.id IS NOT NULL)
  ORDER BY (t.id IS NOT NULL) DESC, m.score DESC
$$;
GRANT EXECUTE ON FUNCTION public.get_my_matches() TO authenticated;

CREATE OR REPLACE FUNCTION public.generate_nightly_matches(p_drop date)
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  s public.match_settings%ROWTYPE;
  c record;
  created integer := 0;
BEGIN
  SELECT * INTO s FROM public.match_settings WHERE id = 1;
  DROP TABLE IF EXISTS pg_temp._counts;
  CREATE TEMP TABLE _counts (user_id uuid PRIMARY KEY, n int NOT NULL) ON COMMIT DROP;
  INSERT INTO _counts SELECT user_id, count(*) FROM public.matches WHERE drop_date = p_drop GROUP BY user_id;
  FOR c IN
    WITH today AS (
      SELECT DISTINCT ON (pr.user_id) pr.user_id, pr.answer_embedding AS emb
      FROM public.prompt_responses pr
      WHERE pr.drop_date = p_drop AND pr.answer_embedding IS NOT NULL
      ORDER BY pr.user_id, pr.created_at DESC
    ), eligible AS (
      SELECT t.user_id, t.emb, p.gender, p.target_preference, p.baseline_embedding,
             coalesce(mp.balance, 'mirror') AS balance, mp.intention
      FROM today t
      JOIN public.profiles p ON p.id = t.user_id
      LEFT JOIN LATERAL (
        SELECT m.balance, m.intention, m.pause_matching FROM public.matching_preferences m
        WHERE m.user_id = t.user_id ORDER BY m.updated_at DESC LIMIT 1
      ) mp ON true
      WHERE coalesce(mp.pause_matching, false) = false
        AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = t.user_id AND ur.role = 'admin')
        AND NOT EXISTS (SELECT 1 FROM public.match_threads th WHERE th.status = 'active' AND (th.user_a = t.user_id OR th.user_b = t.user_id))
    ), pairs AS (
      SELECT a.user_id AS ua, b.user_id AS ub, a.balance AS ba, b.balance AS bb,
             (a.intention IS NOT NULL AND a.intention = b.intention) AS same_intent,
             (1 - (a.emb <=> b.emb))::real AS daily_sim,
             CASE WHEN a.baseline_embedding IS NOT NULL AND b.baseline_embedding IS NOT NULL
                  THEN (1 - (a.baseline_embedding <=> b.baseline_embedding))::real END AS base_sim
      FROM eligible a JOIN eligible b ON a.user_id < b.user_id
      WHERE public.gender_fits(a.target_preference, b.gender)
        AND public.gender_fits(b.target_preference, a.gender)
        AND NOT EXISTS (SELECT 1 FROM public.user_blocks x
                        WHERE (x.blocker_id = a.user_id AND x.blocked_id = b.user_id)
                           OR (x.blocker_id = b.user_id AND x.blocked_id = a.user_id))
        AND NOT EXISTS (SELECT 1 FROM public.matches m
                        WHERE m.user_id = a.user_id AND m.matched_user_id = b.user_id
                          AND m.drop_date > p_drop - s.repeat_cooldown_days AND m.drop_date <= p_drop)
    ), scored AS (
      SELECT *,
        CASE WHEN base_sim IS NOT NULL AND s.baseline_weight > 0
             THEN (s.daily_weight * daily_sim + s.baseline_weight * base_sim) / (s.daily_weight + s.baseline_weight)
             ELSE daily_sim END::real AS blended
      FROM pairs
    )
    SELECT ua, ub, daily_sim,
      ((public.balance_fit(ba, blended, s.counterweight_target) + public.balance_fit(bb, blended, s.counterweight_target)) / 2
        + CASE WHEN same_intent THEN s.intent_bonus ELSE 0 END)::real AS score
    FROM scored
    ORDER BY score DESC, ua, ub
  LOOP
    IF coalesce((SELECT n FROM _counts WHERE user_id = c.ua), 0) >= s.max_matches_per_user
       OR coalesce((SELECT n FROM _counts WHERE user_id = c.ub), 0) >= s.max_matches_per_user THEN
      CONTINUE;
    END IF;
    INSERT INTO public.matches (drop_date, user_id, matched_user_id, similarity_score, score)
    VALUES (p_drop, c.ua, c.ub, c.daily_sim, c.score), (p_drop, c.ub, c.ua, c.daily_sim, c.score)
    ON CONFLICT DO NOTHING;
    INSERT INTO _counts VALUES (c.ua, 1), (c.ub, 1)
      ON CONFLICT (user_id) DO UPDATE SET n = _counts.n + 1;
    created := created + 1;
  END LOOP;
  UPDATE public.matches SET status = 'expired'
   WHERE drop_date < p_drop AND status IN ('pending','greenlit');
  RETURN created;
END $function$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.match_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_threads;