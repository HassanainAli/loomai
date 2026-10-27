DO $do$
DECLARE def text;
BEGIN
  def := pg_get_functiondef('public.generate_nightly_matches(date)'::regprocedure);
  def := replace(def,
    E'UPDATE public.matches SET status = ''expired''\n   WHERE drop_date < p_drop AND status IN (''pending'',''greenlit'');',
    'PERFORM public.expire_old_matches(p_drop);');
  IF position('expire_old_matches' in def) = 0 THEN
    RAISE EXCEPTION 'expiry statement not found';
  END IF;
  EXECUTE def;
END $do$;