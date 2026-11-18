ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS major text,
  ADD COLUMN IF NOT EXISTS class_year text,
  ADD COLUMN IF NOT EXISTS hobbies text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.profiles
  ADD CONSTRAINT chk_major_len CHECK (major IS NULL OR char_length(major) <= 60),
  ADD CONSTRAINT chk_class_year CHECK (class_year IS NULL OR class_year IN ('Freshman','Sophomore','Junior','Senior','Graduate Student')),
  ADD CONSTRAINT chk_hobbies CHECK (cardinality(hobbies) <= 5 AND array_to_string(hobbies, '') IS NOT NULL);

CREATE OR REPLACE FUNCTION public.validate_profile_hobbies()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE h text;
BEGIN
  FOREACH h IN ARRAY coalesce(NEW.hobbies, '{}') LOOP
    IF char_length(btrim(h)) < 1 OR char_length(h) > 14 THEN
      RAISE EXCEPTION 'Each interest must be 1 to 14 characters.' USING ERRCODE = 'check_violation';
    END IF;
  END LOOP;
  RETURN NEW;
END $$;
CREATE TRIGGER profiles_validate_hobbies BEFORE INSERT OR UPDATE OF hobbies ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_hobbies();

DROP FUNCTION IF EXISTS public.get_my_matches();
CREATE FUNCTION public.get_my_matches()
 RETURNS TABLE(match_id uuid, drop_date date, matched_user_id uuid, display_name text, campus_hub text, date_of_birth text, height_in smallint, intention text, balance text, seed_prompts jsonb, daily_answer text, my_answer text, prompt_text text, similarity_score real, status text, partner_status text, thread_id uuid, unread_count integer, major text, class_year text, hobbies text[])
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  WITH latest AS (SELECT max(drop_date) d FROM public.matches WHERE user_id = auth.uid())
  SELECT m.id, m.drop_date, m.matched_user_id, p.display_name, p.campus_hub,
         u.raw_user_meta_data->>'date_of_birth', NULL::smallint, mp.intention, mp.balance, p.seed_prompts,
         (SELECT r.response_text FROM public.prompt_responses r WHERE r.user_id = m.matched_user_id AND r.drop_date = m.drop_date ORDER BY r.created_at DESC LIMIT 1),
         (SELECT r.response_text FROM public.prompt_responses r WHERE r.user_id = m.user_id AND r.drop_date = m.drop_date ORDER BY r.created_at DESC LIMIT 1),
         (SELECT dp.prompt_text FROM public.prompt_responses r JOIN public.daily_prompts dp ON dp.id = r.prompt_id WHERE r.user_id = m.user_id AND r.drop_date = m.drop_date ORDER BY r.created_at DESC LIMIT 1),
         m.similarity_score, m.status,
         CASE WHEN m.status = 'mutual' THEN 'mutual' ELSE 'hidden' END,
         t.id,
         coalesce((SELECT count(*)::int FROM public.match_messages mm WHERE mm.thread_id = t.id AND mm.sender_id <> auth.uid() AND mm.read_at IS NULL), 0),
         p.major, p.class_year, p.hobbies
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
REVOKE ALL ON FUNCTION public.get_my_matches() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_my_matches() TO authenticated;