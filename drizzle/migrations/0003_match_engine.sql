CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Onboarding signals
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS seed_prompts jsonb,
  ADD COLUMN IF NOT EXISTS baseline_embedding extensions.vector(1536),
  ADD COLUMN IF NOT EXISTS height_in smallint CHECK (height_in IS NULL OR height_in BETWEEN 48 AND 96);

ALTER TABLE public.matching_preferences
  ADD COLUMN IF NOT EXISTS intention text CHECK (intention IS NULL OR intention IN ('committed','intentional')),
  ADD COLUMN IF NOT EXISTS balance text NOT NULL DEFAULT 'mirror' CHECK (balance IN ('mirror','counterweight'));
COMMENT ON COLUMN public.matching_preferences.campus_lock IS 'DEPRECATED: all UW students share one pool; campus is display-only.';

ALTER TABLE public.prompt_responses
  ADD COLUMN IF NOT EXISTS answer_embedding extensions.vector(1536);
COMMENT ON COLUMN public.prompt_responses.embedding IS 'DEPRECATED: replaced by answer_embedding (text-embedding-3-small, 1536 dims).';
CREATE INDEX IF NOT EXISTS prompt_responses_answer_embedding_hnsw
  ON public.prompt_responses USING hnsw (answer_embedding extensions.vector_cosine_ops);
CREATE INDEX IF NOT EXISTS prompt_responses_drop_date_idx ON public.prompt_responses (drop_date, user_id);

-- Tunable weights (single row)
CREATE TABLE public.match_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  daily_weight real NOT NULL DEFAULT 1.0,
  baseline_weight real NOT NULL DEFAULT 0.0,
  counterweight_target real NOT NULL DEFAULT 0.55,
  intent_bonus real NOT NULL DEFAULT 0.05,
  height_bonus real NOT NULL DEFAULT 0.02,
  max_matches_per_user smallint NOT NULL DEFAULT 2,
  repeat_cooldown_days smallint NOT NULL DEFAULT 14
);
GRANT ALL ON public.match_settings TO service_role;
ALTER TABLE public.match_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.match_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Matches: one row per side
CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_date date NOT NULL,
  user_id uuid NOT NULL,
  matched_user_id uuid NOT NULL,
  similarity_score real NOT NULL,
  score real NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','greenlit','passed','expired')),
  partner_status text NOT NULL DEFAULT 'pending' CHECK (partner_status IN ('pending','greenlit','passed','expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT no_self_match CHECK (user_id <> matched_user_id),
  UNIQUE (user_id, drop_date, matched_user_id)
);
CREATE INDEX matches_user_drop_idx ON public.matches (user_id, drop_date DESC);
GRANT SELECT ON public.matches TO authenticated;
GRANT UPDATE (status) ON public.matches TO authenticated;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY matches_select_own ON public.matches FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY matches_update_own ON public.matches FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.sync_match_partner_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.updated_at := now();
    UPDATE public.matches SET partner_status = NEW.status, updated_at = now()
     WHERE user_id = NEW.matched_user_id AND matched_user_id = NEW.user_id AND drop_date = NEW.drop_date;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER matches_sync_partner BEFORE UPDATE OF status ON public.matches
  FOR EACH ROW WHEN (pg_trigger_depth() = 0) EXECUTE FUNCTION public.sync_match_partner_status();

-- Blocks
CREATE TABLE public.user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
GRANT SELECT, INSERT, DELETE ON public.user_blocks TO authenticated;
GRANT ALL ON public.user_blocks TO service_role;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY ub_select_own ON public.user_blocks FOR SELECT TO authenticated USING (auth.uid() = blocker_id);
CREATE POLICY ub_insert_own ON public.user_blocks FOR INSERT TO authenticated WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY ub_delete_own ON public.user_blocks FOR DELETE TO authenticated USING (auth.uid() = blocker_id);

-- Strict two-way gender fit
CREATE OR REPLACE FUNCTION public.gender_fits(pref text, gender text)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE pref
    WHEN 'Everyone' THEN gender IS NOT NULL
    WHEN 'Men' THEN gender = 'Man'
    WHEN 'Women' THEN gender = 'Woman'
    ELSE false END
$$;

CREATE OR REPLACE FUNCTION public.balance_fit(balance text, sim real, target real)
RETURNS real LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN balance = 'counterweight' THEN 1 - abs(sim - target) ELSE sim END
$$;

-- Nightly pairing
CREATE OR REPLACE FUNCTION public.generate_nightly_matches(p_drop date)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  s public.match_settings%ROWTYPE;
  c record;
  created integer := 0;
BEGIN
  SELECT * INTO s FROM public.match_settings WHERE id = 1;

  CREATE TEMP TABLE _counts (user_id uuid PRIMARY KEY, n int NOT NULL) ON COMMIT DROP;
  INSERT INTO _counts SELECT user_id, count(*) FROM public.matches WHERE drop_date = p_drop GROUP BY user_id;

  FOR c IN
    WITH today AS (
      SELECT DISTINCT ON (pr.user_id) pr.user_id, pr.answer_embedding AS emb
      FROM public.prompt_responses pr
      WHERE pr.drop_date = p_drop AND pr.answer_embedding IS NOT NULL
      ORDER BY pr.user_id, pr.created_at DESC
    ), eligible AS (
      SELECT t.user_id, t.emb, p.gender, p.target_preference, p.baseline_embedding,
             coalesce(mp.balance, 'mirror') AS balance, mp.intention
      FROM today t
      JOIN public.profiles p ON p.id = t.user_id
      LEFT JOIN LATERAL (
        SELECT m.balance, m.intention, m.pause_matching FROM public.matching_preferences m
        WHERE m.user_id = t.user_id ORDER BY m.updated_at DESC LIMIT 1
      ) mp ON true
      WHERE coalesce(mp.pause_matching, false) = false
    ), pairs AS (
      SELECT a.user_id AS ua, b.user_id AS ub, a.balance AS ba, b.balance AS bb,
             (a.intention IS NOT NULL AND a.intention = b.intention) AS same_intent,
             (1 - (a.emb <=> b.emb))::real AS daily_sim,
             CASE WHEN a.baseline_embedding IS NOT NULL AND b.baseline_embedding IS NOT NULL
                  THEN (1 - (a.baseline_embedding <=> b.baseline_embedding))::real END AS base_sim
      FROM eligible a JOIN eligible b ON a.user_id < b.user_id
      WHERE public.gender_fits(a.target_preference, b.gender)
        AND public.gender_fits(b.target_preference, a.gender)
        AND NOT EXISTS (SELECT 1 FROM public.user_blocks x
                        WHERE (x.blocker_id = a.user_id AND x.blocked_id = b.user_id)
                           OR (x.blocker_id = b.user_id AND x.blocked_id = a.user_id))
        AND NOT EXISTS (SELECT 1 FROM public.matches m
                        WHERE m.user_id = a.user_id AND m.matched_user_id = b.user_id
                          AND m.drop_date > p_drop - s.repeat_cooldown_days AND m.drop_date <> p_drop)
        AND NOT EXISTS (SELECT 1 FROM public.matches m
                        WHERE m.user_id = a.user_id AND m.matched_user_id = b.user_id AND m.drop_date = p_drop)
    ), scored AS (
      SELECT *,
        CASE WHEN base_sim IS NOT NULL AND s.baseline_weight > 0
             THEN (s.daily_weight * daily_sim + s.baseline_weight * base_sim) / (s.daily_weight + s.baseline_weight)
             ELSE daily_sim END::real AS blended
      FROM pairs
    )
    SELECT ua, ub, daily_sim,
      ((public.balance_fit(ba, blended, s.counterweight_target) + public.balance_fit(bb, blended, s.counterweight_target)) / 2
        + CASE WHEN same_intent THEN s.intent_bonus ELSE 0 END)::real AS score
    FROM scored
    ORDER BY score DESC, ua, ub
  LOOP
    IF coalesce((SELECT n FROM _counts WHERE user_id = c.ua), 0) >= s.max_matches_per_user
       OR coalesce((SELECT n FROM _counts WHERE user_id = c.ub), 0) >= s.max_matches_per_user THEN
      CONTINUE;
    END IF;
    INSERT INTO public.matches (drop_date, user_id, matched_user_id, similarity_score, score)
    VALUES (p_drop, c.ua, c.ub, c.daily_sim, c.score), (p_drop, c.ub, c.ua, c.daily_sim, c.score)
    ON CONFLICT DO NOTHING;
    INSERT INTO _counts VALUES (c.ua, 1), (c.ub, 1)
      ON CONFLICT (user_id) DO UPDATE SET n = _counts.n + 1;
    created := created + 1;
  END LOOP;

  UPDATE public.matches SET status = 'expired'
   WHERE drop_date < p_drop AND status = 'pending';
  RETURN created;
END $$;
REVOKE ALL ON FUNCTION public.generate_nightly_matches(date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_nightly_matches(date) TO service_role;

-- Read my latest drop with partner display fields only
CREATE OR REPLACE FUNCTION public.get_my_matches()
RETURNS TABLE (
  match_id uuid, drop_date date, matched_user_id uuid, display_name text, campus_hub text,
  date_of_birth text, height_in smallint, intention text, balance text, seed_prompts jsonb,
  daily_answer text, my_answer text, prompt_text text, similarity_score real,
  status text, partner_status text
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH latest AS (SELECT max(drop_date) d FROM public.matches WHERE user_id = auth.uid())
  SELECT m.id, m.drop_date, m.matched_user_id, p.display_name, p.campus_hub,
         u.raw_user_meta_data->>'date_of_birth', p.height_in, mp.intention, mp.balance, p.seed_prompts,
         (SELECT r.response_text FROM public.prompt_responses r WHERE r.user_id = m.matched_user_id AND r.drop_date = m.drop_date ORDER BY r.created_at DESC LIMIT 1),
         (SELECT r.response_text FROM public.prompt_responses r WHERE r.user_id = m.user_id AND r.drop_date = m.drop_date ORDER BY r.created_at DESC LIMIT 1),
         (SELECT dp.prompt_text FROM public.prompt_responses r JOIN public.daily_prompts dp ON dp.id = r.prompt_id WHERE r.user_id = m.user_id AND r.drop_date = m.drop_date ORDER BY r.created_at DESC LIMIT 1),
         m.similarity_score, m.status, m.partner_status
  FROM public.matches m
  JOIN latest ON m.drop_date = latest.d
  JOIN public.profiles p ON p.id = m.matched_user_id
  LEFT JOIN auth.users u ON u.id = m.matched_user_id
  LEFT JOIN LATERAL (SELECT x.intention, x.balance FROM public.matching_preferences x WHERE x.user_id = m.matched_user_id ORDER BY x.updated_at DESC LIMIT 1) mp ON true
  WHERE m.user_id = auth.uid()
  ORDER BY m.score DESC
$$;
REVOKE ALL ON FUNCTION public.get_my_matches() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_matches() TO authenticated;

-- 8pm Pacific: run at both possible UTC hours (DST); idempotent.
SELECT cron.schedule('loom-8pm-drop-pdt', '1 3 * * *', $c$SELECT public.generate_nightly_matches(public.current_drop_date() - 1)$c$);
SELECT cron.schedule('loom-8pm-drop-pst', '1 4 * * *', $c$SELECT public.generate_nightly_matches(public.current_drop_date() - 1)$c$);