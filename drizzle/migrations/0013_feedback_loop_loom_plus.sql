ALTER TABLE public.match_settings
  ADD COLUMN IF NOT EXISTS feedback_penalty_weight real NOT NULL DEFAULT 0.05,
  ADD COLUMN IF NOT EXISTS feedback_decay_days smallint NOT NULL DEFAULT 14,
  ADD COLUMN IF NOT EXISTS feedback_focus_boost real NOT NULL DEFAULT 0.5;

ALTER TABLE public.match_history ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'end_connection';
ALTER TABLE public.match_history ALTER COLUMN thread_id DROP NOT NULL;

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS base_sim real,
  ADD COLUMN IF NOT EXISTS style_fit real,
  ADD COLUMN IF NOT EXISTS feedback_penalty real;

CREATE TABLE IF NOT EXISTS public.loom_plus_members (
  user_id uuid PRIMARY KEY,
  granted_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.loom_plus_members TO authenticated;
GRANT ALL ON public.loom_plus_members TO service_role;
ALTER TABLE public.loom_plus_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY lpm_select_own ON public.loom_plus_members FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY lpm_admin_all ON public.loom_plus_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT INSERT, DELETE ON public.loom_plus_members TO authenticated;

CREATE OR REPLACE FUNCTION public.log_recalibration(p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF p_reason NOT IN ('Energy/pacing was off','Core values didn''t align','Not my type physically','Add a new dealbreaker') THEN
    RAISE EXCEPTION 'invalid reason';
  END IF;
  INSERT INTO public.match_history (user_id, separation_category, source) VALUES (auth.uid(), p_reason, 'recalibrate');
END $$;
REVOKE ALL ON FUNCTION public.log_recalibration(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.log_recalibration(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_match_diagnostics(p_match uuid)
RETURNS TABLE(unlocked boolean, daily_sim real, base_sim real, style_fit real, score real)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE plus boolean;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.matches m WHERE m.id = p_match AND m.user_id = auth.uid()) THEN RETURN; END IF;
  plus := EXISTS (SELECT 1 FROM public.loom_plus_members l WHERE l.user_id = auth.uid());
  IF NOT plus THEN
    RETURN QUERY SELECT false, NULL::real, NULL::real, NULL::real, NULL::real; RETURN;
  END IF;
  RETURN QUERY SELECT true, m.similarity_score, m.base_sim, m.style_fit, m.score FROM public.matches m WHERE m.id = p_match;
END $$;
REVOKE ALL ON FUNCTION public.get_match_diagnostics(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_match_diagnostics(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.generate_nightly_matches(p_drop date)
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'extensions'
AS $function$
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
    WITH unlocked AS (
      SELECT p.campus_hub FROM public.profiles p
      WHERE p.campus_hub IS NOT NULL AND p.gender IS NOT NULL AND p.target_preference IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id AND ur.role = 'admin')
      GROUP BY p.campus_hub HAVING count(*) >= s.min_campus_participants
    ), today AS (
      SELECT DISTINCT ON (pr.user_id) pr.user_id, pr.answer_embedding AS emb
      FROM public.prompt_responses pr
      WHERE pr.drop_date = p_drop AND pr.answer_embedding IS NOT NULL
      ORDER BY pr.user_id, pr.created_at DESC
    ), fb AS (
      SELECT h.user_id,
        count(*) FILTER (WHERE h.separation_category = 'Core values didn''t align') AS values_n,
        count(*) FILTER (WHERE h.separation_category = 'Energy/pacing was off') AS energy_n
      FROM public.match_history h
      WHERE h.created_at > now() - make_interval(days => s.feedback_decay_days)
      GROUP BY h.user_id
    ), eligible AS (
      SELECT t.user_id, t.emb, p.gender, p.target_preference, p.baseline_embedding,
             coalesce(mp.balance, 'mirror') AS balance, mp.intention,
             (coalesce(fb.values_n, 0) > 0) AS values_focus,
             (coalesce(fb.energy_n, 0) > 0) AS energy_focus
      FROM today t
      JOIN public.profiles p ON p.id = t.user_id
      JOIN unlocked u ON u.campus_hub = p.campus_hub
      LEFT JOIN fb ON fb.user_id = t.user_id
      LEFT JOIN LATERAL (
        SELECT m.balance, m.intention, m.pause_matching FROM public.matching_preferences m
        WHERE m.user_id = t.user_id ORDER BY m.updated_at DESC LIMIT 1
      ) mp ON true
      WHERE coalesce(mp.pause_matching, false) = false
        AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = t.user_id AND ur.role = 'admin')
        AND NOT EXISTS (SELECT 1 FROM public.match_threads th WHERE th.status = 'active' AND (th.user_a = t.user_id OR th.user_b = t.user_id))
    ), pairs AS (
      SELECT a.user_id AS ua, b.user_id AS ub, a.balance AS ba, b.balance AS bb,
             a.values_focus AS va, b.values_focus AS vb, a.energy_focus AS ea, b.energy_focus AS eb,
             (a.intention IS NOT NULL AND a.intention = b.intention) AS same_intent,
             (1 - (a.emb <=> b.emb))::real AS daily_sim,
             CASE WHEN a.baseline_embedding IS NOT NULL AND b.baseline_embedding IS NOT NULL
                  THEN (1 - (a.baseline_embedding <=> b.baseline_embedding))::real END AS base_sim,
             -- similarity of each candidate to people the other recently ended with
             (SELECT max(1 - (b.baseline_embedding <=> ep.baseline_embedding)) FROM public.match_history h
               JOIN public.profiles ep ON ep.id = h.matched_user_id
               WHERE h.user_id = a.user_id AND h.source = 'end_connection'
                 AND h.created_at > now() - make_interval(days => s.feedback_decay_days)
                 AND b.baseline_embedding IS NOT NULL AND ep.baseline_embedding IS NOT NULL)::real AS a_ex_sim,
             (SELECT max(1 - (a.baseline_embedding <=> ep.baseline_embedding)) FROM public.match_history h
               JOIN public.profiles ep ON ep.id = h.matched_user_id
               WHERE h.user_id = b.user_id AND h.source = 'end_connection'
                 AND h.created_at > now() - make_interval(days => s.feedback_decay_days)
                 AND a.baseline_embedding IS NOT NULL AND ep.baseline_embedding IS NOT NULL)::real AS b_ex_sim
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
    ), sided AS (
      SELECT *,
        public.balance_fit(ba, CASE WHEN va THEN daily_sim ELSE blended END, s.counterweight_target)
          * CASE WHEN ea THEN 1 + s.feedback_focus_boost ELSE 1 END
          / CASE WHEN ea THEN 1 + s.feedback_focus_boost ELSE 1 END AS fit_a,
        public.balance_fit(bb, CASE WHEN vb THEN daily_sim ELSE blended END, s.counterweight_target) AS fit_b,
        (s.feedback_penalty_weight * (greatest(coalesce(a_ex_sim, 0), 0) + greatest(coalesce(b_ex_sim, 0), 0)) / 2)::real AS penalty
      FROM scored
    )
    SELECT ua, ub, daily_sim, base_sim, ((fit_a + fit_b) / 2)::real AS style_fit, penalty,
      ((CASE WHEN ea OR eb
              THEN ((fit_a + fit_b) / 2) * (1 + s.feedback_focus_boost) - s.feedback_focus_boost * blended
              ELSE (fit_a + fit_b) / 2 END)
        + CASE WHEN same_intent THEN s.intent_bonus ELSE 0 END
        - penalty)::real AS score
    FROM sided
    ORDER BY score DESC, ua, ub
  LOOP
    IF coalesce((SELECT n FROM _counts WHERE user_id = c.ua), 0) >= s.max_matches_per_user
       OR coalesce((SELECT n FROM _counts WHERE user_id = c.ub), 0) >= s.max_matches_per_user THEN
      CONTINUE;
    END IF;
    INSERT INTO public.matches (drop_date, user_id, matched_user_id, similarity_score, score, base_sim, style_fit, feedback_penalty)
    VALUES (p_drop, c.ua, c.ub, c.daily_sim, c.score, c.base_sim, c.style_fit, c.penalty),
           (p_drop, c.ub, c.ua, c.daily_sim, c.score, c.base_sim, c.style_fit, c.penalty)
    ON CONFLICT DO NOTHING;
    INSERT INTO _counts VALUES (c.ua, 1), (c.ub, 1)
      ON CONFLICT (user_id) DO UPDATE SET n = _counts.n + 1;
    created := created + 1;
  END LOOP;
  PERFORM public.expire_old_matches(p_drop);
  RETURN created;
END $function$;