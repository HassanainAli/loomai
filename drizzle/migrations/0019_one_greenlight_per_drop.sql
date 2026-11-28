CREATE TABLE public.drop_greenlight_choices (
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 drop_date date NOT NULL,
 match_id uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (user_id, drop_date)
);
GRANT SELECT ON public.drop_greenlight_choices TO authenticated;
GRANT ALL ON public.drop_greenlight_choices TO service_role;
ALTER TABLE public.drop_greenlight_choices ENABLE ROW LEVEL SECURITY;
CREATE POLICY choices_read_own ON public.drop_greenlight_choices FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
INSERT INTO public.drop_greenlight_choices (user_id, drop_date, match_id)
SELECT DISTINCT ON (user_id, drop_date) user_id, drop_date, id FROM public.matches
WHERE status IN ('greenlit','mutual','ended') ORDER BY user_id, drop_date, updated_at, id;

CREATE OR REPLACE FUNCTION public.respond_to_match(p_match uuid, p_action text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE m public.matches%ROWTYPE; choice uuid; caller uuid := auth.uid();
BEGIN
 IF caller IS NULL OR p_action IS NULL OR p_action NOT IN ('greenlit','passed') THEN RETURN 'invalid'; END IF;
 -- Serialize this student's decisions across tabs; the choice primary key also enforces the limit.
 PERFORM 1 FROM public.profiles WHERE id = caller FOR UPDATE;
 SELECT * INTO m FROM public.matches WHERE id = p_match AND user_id = caller FOR UPDATE;
 IF NOT FOUND THEN RETURN 'invalid'; END IF;
 IF m.drop_date <> public.current_drop_date() - 1 OR m.status IN ('expired','ended') THEN RETURN 'expired'; END IF;
 SELECT match_id INTO choice FROM public.drop_greenlight_choices WHERE user_id = caller AND drop_date = m.drop_date;
 IF p_action = 'greenlit' AND choice IS NOT NULL THEN
   IF choice = m.id AND m.status IN ('greenlit','mutual') THEN RETURN 'ok'; END IF;
   RETURN 'already_greenlit';
 END IF;
 IF m.status <> 'pending' THEN RETURN 'invalid'; END IF;
 IF p_action = 'greenlit' THEN
   INSERT INTO public.drop_greenlight_choices (user_id, drop_date, match_id) VALUES (caller, m.drop_date, m.id);
 END IF;
 UPDATE public.matches SET status = p_action WHERE id = m.id;
 IF p_action = 'greenlit' THEN
   UPDATE public.matches SET status = 'closed', updated_at = now()
   WHERE user_id = caller AND drop_date = m.drop_date AND id <> m.id AND status = 'pending';
 END IF;
 RETURN 'ok';
END $$;
REVOKE EXECUTE ON FUNCTION public.respond_to_match(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.respond_to_match(uuid, text) TO authenticated, service_role;
REVOKE UPDATE ON public.matches FROM authenticated;
REVOKE UPDATE (status) ON public.matches FROM authenticated;