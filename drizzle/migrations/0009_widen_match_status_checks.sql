ALTER TABLE public.matches DROP CONSTRAINT matches_status_check;
ALTER TABLE public.matches ADD CONSTRAINT matches_status_check CHECK (status IN ('pending','greenlit','passed','expired','mutual','ended'));
ALTER TABLE public.matches DROP CONSTRAINT matches_partner_status_check;
ALTER TABLE public.matches ADD CONSTRAINT matches_partner_status_check CHECK (partner_status IN ('pending','greenlit','passed','expired','mutual','ended'));