CREATE OR REPLACE FUNCTION public.guard_match_status()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
BEGIN
  IF pg_trigger_depth() = 1 AND current_user = 'authenticated' THEN
    IF NOT (OLD.status = 'pending' AND NEW.status IN ('greenlit','passed'))
       OR NEW.drop_date < public.current_drop_date() - 1
       OR NEW.partner_status IS DISTINCT FROM OLD.partner_status
       OR NEW.score IS DISTINCT FROM OLD.score OR NEW.similarity_score IS DISTINCT FROM OLD.similarity_score
       OR NEW.matched_user_id IS DISTINCT FROM OLD.matched_user_id OR NEW.drop_date IS DISTINCT FROM OLD.drop_date THEN
      RAISE EXCEPTION 'Invalid match update.' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END $function$;

CREATE OR REPLACE FUNCTION public.respond_to_match(p_match uuid, p_action text)
RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path TO 'public' AS $$
DECLARE m public.matches%ROWTYPE;
BEGIN
  SELECT * INTO m FROM public.matches WHERE id = p_match AND user_id = auth.uid();
  IF NOT FOUND THEN RETURN 'invalid'; END IF;
  IF m.status IN ('expired','closed','ended') OR m.drop_date < public.current_drop_date() - 1 THEN RETURN 'expired'; END IF;
  IF p_action NOT IN ('greenlit','passed') OR m.status <> 'pending' THEN RETURN 'invalid'; END IF;
  UPDATE public.matches SET status = p_action WHERE id = p_match;
  RETURN 'ok';
END $$;