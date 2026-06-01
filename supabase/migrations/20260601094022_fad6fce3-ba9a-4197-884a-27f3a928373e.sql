CREATE OR REPLACE FUNCTION public.enforce_edu_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NULL OR lower(NEW.email) !~ '\.edu$' THEN
    RAISE EXCEPTION 'Only .edu university email addresses are allowed.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_edu_email() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_edu_email_trigger ON auth.users;
CREATE TRIGGER enforce_edu_email_trigger
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.enforce_edu_email();