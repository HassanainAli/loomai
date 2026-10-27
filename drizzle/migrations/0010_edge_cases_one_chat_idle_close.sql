ALTER TABLE public.matches DROP CONSTRAINT matches_status_check;
ALTER TABLE public.matches ADD CONSTRAINT matches_status_check CHECK (status = ANY (ARRAY['pending','greenlit','passed','expired','mutual','ended','closed']));
ALTER TABLE public.matches DROP CONSTRAINT matches_partner_status_check;
ALTER TABLE public.matches ADD CONSTRAINT matches_partner_status_check CHECK (partner_status = ANY (ARRAY['pending','greenlit','passed','expired','mutual','ended','closed']));

ALTER TABLE public.match_threads ADD COLUMN last_activity_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.bump_thread_activity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.match_threads SET last_activity_at = now() WHERE id = NEW.thread_id;
  RETURN NEW;
END $$;
CREATE TRIGGER match_messages_bump_activity AFTER INSERT ON public.match_messages
FOR EACH ROW EXECUTE FUNCTION public.bump_thread_activity();

CREATE OR REPLACE FUNCTION public.sync_match_partner_status()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE partner_st text;
BEGIN
  IF pg_trigger_depth() > 1 OR NEW.status IS NOT DISTINCT FROM OLD.status
     OR current_setting('loom.skip_sync', true) = 'on' THEN
    RETURN NEW;
  END IF;
  NEW.updated_at := now();
  SELECT status INTO partner_st FROM public.matches
   WHERE user_id = NEW.matched_user_id AND matched_user_id = NEW.user_id AND drop_date = NEW.drop_date;
  IF NEW.status = 'greenlit' AND partner_st = 'greenlit'
     AND NOT EXISTS (SELECT 1 FROM public.match_threads th WHERE th.status = 'active'
                     AND (th.user_a IN (NEW.user_id, NEW.matched_user_id) OR th.user_b IN (NEW.user_id, NEW.matched_user_id))) THEN
    NEW.status := 'mutual';
    NEW.partner_status := 'mutual';
    UPDATE public.matches SET status = 'mutual', partner_status = 'mutual', updated_at = now()
     WHERE user_id = NEW.matched_user_id AND matched_user_id = NEW.user_id AND drop_date = NEW.drop_date;
    INSERT INTO public.match_threads (user_a, user_b, drop_date)
    VALUES (least(NEW.user_id, NEW.matched_user_id), greatest(NEW.user_id, NEW.matched_user_id), NEW.drop_date)
    ON CONFLICT DO NOTHING;
    -- First mutual wins: quietly close every other open match touching either person.
    UPDATE public.matches SET status = 'closed', partner_status = 'closed', updated_at = now()
     WHERE status IN ('pending','greenlit')
       AND (user_id IN (NEW.user_id, NEW.matched_user_id) OR matched_user_id IN (NEW.user_id, NEW.matched_user_id))
       AND NOT (user_id IN (NEW.user_id, NEW.matched_user_id) AND matched_user_id IN (NEW.user_id, NEW.matched_user_id));
  ELSIF NEW.status <> 'greenlit' OR partner_st IS DISTINCT FROM 'greenlit' THEN
    UPDATE public.matches SET partner_status = NEW.status, updated_at = now()
     WHERE user_id = NEW.matched_user_id AND matched_user_id = NEW.user_id AND drop_date = NEW.drop_date;
  END IF;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.auto_end_stale_threads()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE t record; n integer := 0;
BEGIN
  FOR t IN SELECT * FROM public.match_threads WHERE status = 'active' AND last_activity_at <= now() - interval '48 hours' FOR UPDATE LOOP
    UPDATE public.match_threads SET status = 'ended', ended_by = NULL, ended_at = now() WHERE id = t.id;
    PERFORM set_config('loom.skip_sync', 'on', true);
    UPDATE public.matches SET status = 'ended', partner_status = 'ended', updated_at = now()
     WHERE drop_date = t.drop_date AND ((user_id = t.user_a AND matched_user_id = t.user_b) OR (user_id = t.user_b AND matched_user_id = t.user_a));
    PERFORM set_config('loom.skip_sync', 'off', true);
    INSERT INTO public.match_history (user_id, separation_category, thread_id, matched_user_id)
    VALUES (t.user_a, 'Auto-closed (inactive)', t.id, t.user_b), (t.user_b, 'Auto-closed (inactive)', t.id, t.user_a);
    INSERT INTO public.user_blocks (blocker_id, blocked_id)
    SELECT a, b FROM (VALUES (t.user_a, t.user_b), (t.user_b, t.user_a)) v(a, b)
    WHERE NOT EXISTS (SELECT 1 FROM public.user_blocks x WHERE x.blocker_id = v.a AND x.blocked_id = v.b);
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.auto_end_stale_threads() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_drop_state()
RETURNS TABLE(answered_today boolean, had_match_last_drop boolean, in_active_chat boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT
    EXISTS (SELECT 1 FROM public.prompt_responses WHERE user_id = auth.uid() AND drop_date = public.current_drop_date()),
    EXISTS (SELECT 1 FROM public.matches WHERE user_id = auth.uid() AND drop_date = public.current_drop_date() - 1),
    EXISTS (SELECT 1 FROM public.match_threads WHERE status = 'active' AND auth.uid() IN (user_a, user_b))
$$;
GRANT EXECUTE ON FUNCTION public.get_drop_state() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_matches()
 RETURNS TABLE(match_id uuid, drop_date date, matched_user_id uuid, display_name text, campus_hub text, date_of_birth text, height_in smallint, intention text, balance text, seed_prompts jsonb, daily_answer text, my_answer text, prompt_text text, similarity_score real, status text, partner_status text, thread_id uuid, unread_count integer)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  WITH latest AS (SELECT max(drop_date) d FROM public.matches WHERE user_id = auth.uid())
  SELECT m.id, m.drop_date, m.matched_user_id, p.display_name, p.campus_hub,
         u.raw_user_meta_data->>'date_of_birth', p.height_in, mp.intention, mp.balance, p.seed_prompts,
         (SELECT r.response_text FROM public.prompt_responses r WHERE r.user_id = m.matched_user_id AND r.drop_date = m.drop_date ORDER BY r.created_at DESC LIMIT 1),
         (SELECT r.response_text FROM public.prompt_responses r WHERE r.user_id = m.user_id AND r.drop_date = m.drop_date ORDER BY r.created_at DESC LIMIT 1),
         (SELECT dp.prompt_text FROM public.prompt_responses r JOIN public.daily_prompts dp ON dp.id = r.prompt_id WHERE r.user_id = m.user_id AND r.drop_date = m.drop_date ORDER BY r.created_at DESC LIMIT 1),
         m.similarity_score,
         m.status,
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
    AND (m.status IN ('pending','greenlit') AND m.drop_date = latest.d OR (m.status = 'mutual' AND t.id IS NOT NULL))
  ORDER BY (t.id IS NOT NULL) DESC, m.score DESC
$function$;

-- Run idle cleanup before each drop so freed students are eligible that night.
CREATE OR REPLACE FUNCTION public.generate_nightly_matches_wrapped(p_drop date)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM public.auto_end_stale_threads();
  RETURN public.generate_nightly_matches(p_drop);
END $$;
REVOKE ALL ON FUNCTION public.generate_nightly_matches_wrapped(date) FROM PUBLIC, anon, authenticated;

SELECT cron.schedule('loom-auto-end-stale-threads', '0 * * * *', $$SELECT public.auto_end_stale_threads();$$);