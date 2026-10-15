CREATE OR REPLACE FUNCTION public.enforce_adult_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  dob_text text := NEW.raw_user_meta_data->>'date_of_birth';
  dob date;
BEGIN
  IF dob_text IS NULL OR btrim(dob_text) = '' THEN
    RAISE EXCEPTION 'Date of birth is required.' USING ERRCODE = 'check_violation';
  END IF;
  IF dob_text !~ '^\d{4}-\d{2}-\d{2}$' THEN
    RAISE EXCEPTION 'Please enter a valid date of birth.' USING ERRCODE = 'check_violation';
  END IF;
  BEGIN
    dob := dob_text::date;
  EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'Please enter a valid date of birth.' USING ERRCODE = 'check_violation';
  END;
  IF to_char(dob, 'YYYY-MM-DD') <> dob_text OR dob > current_date THEN
    RAISE EXCEPTION 'Please enter a valid date of birth.' USING ERRCODE = 'check_violation';
  END IF;
  IF dob > (current_date - interval '18 years')::date THEN
    RAISE EXCEPTION 'You must be 18 or older to join Loom.' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_adult_signup() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_adult_signup_trigger ON auth.users;
CREATE TRIGGER enforce_adult_signup_trigger
BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.enforce_adult_signup();