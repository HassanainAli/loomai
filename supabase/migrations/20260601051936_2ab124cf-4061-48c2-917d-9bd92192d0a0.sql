
CREATE EXTENSION IF NOT EXISTS vector;

-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  gender text,
  campus_hub text,
  target_preference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- matching_preferences
CREATE TABLE public.matching_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campus_lock boolean NOT NULL DEFAULT true,
  pause_matching boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matching_preferences TO authenticated;
GRANT ALL ON public.matching_preferences TO service_role;
ALTER TABLE public.matching_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mp_select_own" ON public.matching_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "mp_insert_own" ON public.matching_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mp_update_own" ON public.matching_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mp_delete_own" ON public.matching_preferences FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- prompt_responses (with max length enforced server-side)
CREATE TABLE public.prompt_responses (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  response_text text NOT NULL CHECK (char_length(response_text) BETWEEN 1 AND 2000),
  embedding vector(384),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompt_responses TO authenticated;
GRANT ALL ON public.prompt_responses TO service_role;
ALTER TABLE public.prompt_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pr_select_own" ON public.prompt_responses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "pr_insert_own" ON public.prompt_responses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pr_update_own" ON public.prompt_responses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pr_delete_own" ON public.prompt_responses FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- match_history (open_feedback capped at 1000 chars)
CREATE TABLE public.match_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  separation_category text NOT NULL CHECK (char_length(separation_category) BETWEEN 1 AND 100),
  open_feedback text CHECK (open_feedback IS NULL OR char_length(open_feedback) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_history TO authenticated;
GRANT ALL ON public.match_history TO service_role;
ALTER TABLE public.match_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mh_select_own" ON public.match_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "mh_insert_own" ON public.match_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- updated_at trigger helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_mp_updated_at BEFORE UPDATE ON public.matching_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- handle_new_user: auto-create a profile row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
