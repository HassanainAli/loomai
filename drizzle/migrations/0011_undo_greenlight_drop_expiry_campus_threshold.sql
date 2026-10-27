ALTER TABLE public.match_settings ADD COLUMN min_campus_participants integer NOT NULL DEFAULT 20;

CREATE OR REPLACE FUNCTION public.guard_match_status()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  IF pg_trigger_depth() = 1 AND current_user = 'authenticated' THEN
    IF NOT ((OLD.status = 'pending' AND NEW.status IN ('greenlit','passed'))
            OR (OLD.status = 'greenlit' AND NEW.status = 'pending'))
       OR NEW.drop_date < public.current_drop_date() - 1
       OR NEW.partner_status IS DISTINCT FROM OLD.partner_status
       OR NEW.score IS DISTINCT FROM OLD.score OR NEW.similarity_score IS DISTINCT FROM OLD.similarity_score
       OR NEW.matched_user_id IS DISTINCT FROM OLD.matched_user_id OR NEW.drop_date IS DISTINCT FROM OLD.drop_date THEN
      RAISE EXCEPTION 'Invalid match update.' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END $function$;

-- Graceful actions: returns ok | expired | invalid instead of raising.
CREATE OR REPLACE FUNCTION public.respond_to_match(p_match uuid, p_action text)
RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path TO 'public' AS $$
DECLARE m public.matches%ROWTYPE;
BEGIN
  SELECT * INTO m FROM public.matches WHERE id = p_match AND user_id = auth.uid();
  IF NOT FOUND THEN RETURN 'invalid'; END IF;
  IF m.status IN ('expired','closed','ended') OR m.drop_date < public.current_drop_date() - 1 THEN RETURN 'expired'; END IF;
  IF p_action = 'undo' THEN
    IF m.status <> 'greenlit' THEN RETURN 'invalid'; END IF;
    UPDATE public.matches SET status = 'pending' WHERE id = p_match;
  ELSIF p_action IN ('greenlit','passed') THEN
    IF m.status <> 'pending' THEN RETURN 'invalid'; END IF;
    UPDATE public.matches SET status = p_action WHERE id = p_match;
  ELSE
    RETURN 'invalid';
  END IF;
  RETURN 'ok';
END $$;
GRANT EXECUTE ON FUNCTION public.respond_to_match(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.campus_participant_count(p_campus text)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT count(*)::int FROM public.profiles p
  WHERE p.campus_hub = p_campus AND p.gender IS NOT NULL AND p.target_preference IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'admin')
$$;
REVOKE ALL ON FUNCTION public.campus_participant_count(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_campus_status()
RETURNS TABLE(campus text, participants integer, threshold integer, unlocked boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT p.campus_hub, public.campus_participant_count(p.campus_hub), s.min_campus_participants,
         public.campus_participant_count(p.campus_hub) >= s.min_campus_participants
  FROM public.profiles p CROSS JOIN public.match_settings s
  WHERE p.id = auth.uid() AND s.id = 1
$$;
GRANT EXECUTE ON FUNCTION public.get_campus_status() TO authenticated;

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
    WITH unlocked AS (
      SELECT p.campus_hub FROM public.profiles p
      WHERE p.campus_hub IS NOT NULL AND p.gender IS NOT NULL AND p.target_preference IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'admin')
      GROUP BY p.campus_hub HAVING count(*) >= s.min_campus_participants
    ), today AS (
      SELECT DISTINCT ON (pr.user_id) pr.user_id, pr.answer_embedding AS emb
      FROM public.prompt_responses pr
      WHERE pr.drop_date = p_drop AND pr.answer_embedding IS NOT NULL
      ORDER BY pr.user_id, pr.created_at DESC
    ), eligible AS (
      SELECT t.user_id, t.emb, p.gender, p.target_preference, p.baseline_embedding,
             coalesce(mp.balance, 'mirror') AS balance, mp.intention
      FROM today t
      JOIN public.profiles p ON p.id = t.user_id
      JOIN unlocked u ON u.campus_hub = p.campus_hub
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
  PERFORM public.expire_old_matches(p_drop);
  RETURN created;
END $function$;