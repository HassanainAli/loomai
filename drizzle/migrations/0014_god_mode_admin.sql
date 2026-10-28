ALTER TABLE public.match_settings ADD COLUMN engine_paused boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN is_test_account boolean NOT NULL DEFAULT false;

CREATE TABLE public.match_drop_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  drop_date date NOT NULL,
  pairs_created integer,
  outcome text NOT NULL,
  triggered_by text NOT NULL CHECK (triggered_by IN ('cron','admin'))
);
GRANT SELECT ON public.match_drop_runs TO authenticated;
GRANT ALL ON public.match_drop_runs TO service_role;
ALTER TABLE public.match_drop_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY mdr_admin_select ON public.match_drop_runs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_actions TO authenticated;
GRANT ALL ON public.admin_actions TO service_role;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY aa_admin_select ON public.admin_actions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Students must not flag themselves as test accounts (wipe safety).
CREATE OR REPLACE FUNCTION public.guard_test_flag() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF current_user IN ('authenticated','anon') THEN
    IF TG_OP = 'INSERT' THEN NEW.is_test_account := false;
    ELSE NEW.is_test_account := OLD.is_test_account; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER profiles_guard_test_flag BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_test_flag();

-- Single entry point for drops: honors pause, closes idle chats, logs the run.
CREATE OR REPLACE FUNCTION public.run_drop(p_drop date, p_trigger text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  IF (SELECT engine_paused FROM public.match_settings WHERE id = 1) THEN
    INSERT INTO public.match_drop_runs(drop_date, outcome, triggered_by) VALUES (p_drop, 'paused', p_trigger);
    RETURN 0;
  END IF;
  PERFORM public.auto_end_stale_threads();
  n := public.generate_nightly_matches(p_drop);
  INSERT INTO public.match_drop_runs(drop_date, pairs_created, outcome, triggered_by) VALUES (p_drop, n, 'ok', p_trigger);
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.run_drop(date, text) FROM PUBLIC, anon, authenticated;

SELECT cron.unschedule('loom-8pm-drop-pdt');
SELECT cron.unschedule('loom-8pm-drop-pst');
SELECT cron.schedule('loom-8pm-drop-pdt', '1 3 * * *', $c$SELECT public.run_drop(public.current_drop_date() - 1, 'cron')$c$);
SELECT cron.schedule('loom-8pm-drop-pst', '1 4 * * *', $c$SELECT public.run_drop(public.current_drop_date() - 1, 'cron')$c$);

CREATE OR REPLACE FUNCTION public.require_admin() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.admin_get_stats() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.require_admin();
  RETURN jsonb_build_object(
    'engine_paused', (SELECT engine_paused FROM match_settings WHERE id=1),
    'min_campus_participants', (SELECT min_campus_participants FROM match_settings WHERE id=1),
    'drop_date', current_drop_date(),
    'campuses', coalesce((SELECT jsonb_agg(jsonb_build_object('campus', c.campus, 'participants', c.n) ORDER BY c.campus)
       FROM (SELECT p.campus_hub campus, count(*) n FROM profiles p
             WHERE p.campus_hub IS NOT NULL AND p.gender IS NOT NULL AND p.target_preference IS NOT NULL
               AND NOT has_role(p.id,'admin') GROUP BY p.campus_hub) c), '[]'::jsonb),
    'answered_today', (SELECT count(DISTINCT user_id) FROM prompt_responses WHERE drop_date = current_drop_date()),
    'active_threads', (SELECT count(*) FROM match_threads WHERE status = 'active'),
    'test_accounts', (SELECT count(*) FROM profiles WHERE is_test_account),
    'last_run', (SELECT to_jsonb(r) FROM (SELECT started_at, drop_date, pairs_created, outcome, triggered_by FROM match_drop_runs ORDER BY started_at DESC LIMIT 1) r),
    'loom_plus', coalesce((SELECT jsonb_agg(u.email) FROM loom_plus_members l JOIN auth.users u ON u.id = l.user_id), '[]'::jsonb)
  );
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_engine_paused(p_paused boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.require_admin();
  UPDATE match_settings SET engine_paused = p_paused WHERE id = 1;
  INSERT INTO admin_actions(admin_id, action, details) VALUES (auth.uid(), 'set_engine_paused', jsonb_build_object('paused', p_paused));
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_campus_minimum(p_min integer) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.require_admin();
  IF p_min IS NULL OR p_min < 1 OR p_min > 500 THEN RAISE EXCEPTION 'campus minimum must be 1-500'; END IF;
  UPDATE match_settings SET min_campus_participants = p_min WHERE id = 1;
  INSERT INTO admin_actions(admin_id, action, details) VALUES (auth.uid(), 'set_campus_minimum', jsonb_build_object('min', p_min));
END $$;

CREATE OR REPLACE FUNCTION public.admin_run_drop_now() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  PERFORM public.require_admin();
  n := public.run_drop(current_drop_date(), 'admin');
  INSERT INTO admin_actions(admin_id, action, details) VALUES (auth.uid(), 'run_drop_now', jsonb_build_object('pairs', n));
  RETURN n;
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_loom_plus(p_email text, p_on boolean) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid;
BEGIN
  PERFORM public.require_admin();
  SELECT id INTO uid FROM auth.users WHERE lower(email) = lower(trim(p_email));
  IF uid IS NULL THEN RETURN 'not_found'; END IF;
  IF p_on THEN INSERT INTO loom_plus_members(user_id) VALUES (uid) ON CONFLICT DO NOTHING;
  ELSE DELETE FROM loom_plus_members WHERE user_id = uid; END IF;
  INSERT INTO admin_actions(admin_id, action, details) VALUES (auth.uid(), 'set_loom_plus', jsonb_build_object('email', p_email, 'on', p_on));
  RETURN 'ok';
END $$;

CREATE OR REPLACE FUNCTION public.admin_log_action(p_action text, p_details jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.require_admin();
  INSERT INTO admin_actions(admin_id, action, details) VALUES (auth.uid(), p_action, coalesce(p_details,'{}'::jsonb));
END $$;

REVOKE ALL ON FUNCTION public.require_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_get_stats() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_engine_paused(boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_campus_minimum(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_run_drop_now() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_loom_plus(text, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_log_action(text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.require_admin(), public.admin_get_stats(), public.admin_set_engine_paused(boolean),
  public.admin_set_campus_minimum(integer), public.admin_run_drop_now(), public.admin_set_loom_plus(text, boolean),
  public.admin_log_action(text, jsonb) TO authenticated;