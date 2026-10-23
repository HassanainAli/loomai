CREATE OR REPLACE FUNCTION public.generate_nightly_matches(p_drop date)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  s public.match_settings%ROWTYPE;
  c record;
  created integer := 0;
BEGIN
  SELECT * INTO s FROM public.match_settings WHERE id = 1;

  DROP TABLE IF EXISTS pg_temp._counts;
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
                          AND m.drop_date > p_drop - s.repeat_cooldown_days AND m.drop_date <= p_drop)
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