CREATE TABLE public.daily_prompts (
  id serial PRIMARY KEY,
  sequence integer NOT NULL UNIQUE,
  prompt_text text NOT NULL,
  category text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.daily_prompts TO anon, authenticated;
GRANT ALL ON public.daily_prompts TO service_role;
ALTER TABLE public.daily_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY dp_select_active ON public.daily_prompts FOR SELECT TO anon, authenticated USING (is_active);

ALTER TABLE public.prompt_responses ADD COLUMN prompt_id integer REFERENCES public.daily_prompts(id);
ALTER TABLE public.prompt_responses ADD COLUMN drop_date date;

-- Drop day flips at 8pm Pacific: shift LA local time forward 4h, take the date.
CREATE OR REPLACE FUNCTION public.current_drop_date()
RETURNS date LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT ((now() AT TIME ZONE 'America/Los_Angeles') + interval '4 hours')::date
$$;

CREATE OR REPLACE FUNCTION public.get_current_prompt()
RETURNS TABLE (id integer, prompt_text text, category text, drop_date date)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH active AS (
    SELECT p.id, p.prompt_text, p.category, row_number() OVER (ORDER BY p.sequence) - 1 AS rn,
           count(*) OVER () AS total
    FROM public.daily_prompts p WHERE p.is_active
  )
  SELECT a.id, a.prompt_text, a.category, public.current_drop_date()
  FROM active a
  WHERE a.rn = ((public.current_drop_date() - date '2026-10-22') % a.total + a.total) % a.total
$$;
GRANT EXECUTE ON FUNCTION public.get_current_prompt() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_drop_date() TO anon, authenticated;