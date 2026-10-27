CREATE OR REPLACE FUNCTION public.sync_match_partner_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE partner_st text;
BEGIN
  IF pg_trigger_depth() > 1 OR NEW.status IS NOT DISTINCT FROM OLD.status
     OR current_setting('loom.skip_sync', true) = 'on' THEN
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

CREATE OR REPLACE FUNCTION public.expire_old_matches(p_drop date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM set_config('loom.skip_sync', 'on', true);
  UPDATE public.matches SET status = 'expired', partner_status = 'expired', updated_at = now()
   WHERE drop_date < p_drop AND status IN ('pending','greenlit');
  PERFORM set_config('loom.skip_sync', 'off', true);
END $$;
REVOKE EXECUTE ON FUNCTION public.expire_old_matches(date) FROM PUBLIC, anon, authenticated;