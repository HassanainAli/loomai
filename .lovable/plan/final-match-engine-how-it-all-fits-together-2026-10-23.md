# Final match engine: how it all fits together

Every onboarding step and the daily prompt now have a place to be saved and a clear job. The database can handle both approaches (daily-only and the baseline blend), but launch uses daily-only matching: tonight's match comes from what both students said today.

## What each step does

```text
Step 1  Intent (Committed / Intentional) -> saved -> small score boost if both match
        Dealbreakers text box             -> removed
Step 2  3 seed answers                     -> saved as text (shown on match profile)
                                           -> one combined baseline embedding (saved, not used yet)
Step 3  Mirror / Counterweight             -> saved -> how similar a match should be
Step 4  Spec Sheet: gender, interested in  -> strict two-way filter (required)
        campus hub                         -> shown on profile only (Campus Lock removed)
        height                             -> saved as a number, small optional boost
Daily   Today's answer                     -> embedded -> main score for tonight's 8pm drop
```

## The nightly 8pm drop

1. **Hard filters:** both answered today's prompt, both have matching on, gender and interested-in fit both ways, not blocked, not matched together in the last 14 days.
2. **Score:** similarity between today's answers (100% daily at launch). Mirror prefers high similarity; Counterweight prefers moderate; if the two chose differently, average the two. Small boost when intents match.
3. **Pairing:** best pairs first, up to 2 matches per student, written for both students.
4. Baseline weight sits at 0 and can be raised later (for example 30%) without changing the database.

## Screens

- Step 1: remove dealbreakers box; save intent.
- Steps 2-3: save answers and choice instead of throwing them away.
- Spec Sheet: remove Campus Lock; save height as a number.
- Daily prompt: after saving an answer, create its embedding.
- Queue and match profile: show real matches (score %, today's answers side by side, their 3 seed answers, campus) instead of the Maya/Eli samples; greenlight / pass save. Alignment Spec shows the locked Loom+ card.
- Empty state when there's no match tonight, pointing to the daily prompt.

## Technical details

Migration (additive only):

- `profiles`: `seed_prompts jsonb`, `baseline_embedding vector(1536)`, `height_in smallint`.
- `matching_preferences`: `intention text` (check committed|intentional), `balance text not null default 'mirror'` (check mirror|counterweight). `campus_lock` marked DEPRECATED via comment, no longer read.
- `prompt_responses.embedding` used at 1536 dims (text-embedding-3-small); HNSW cosine index; unique (user_id, drop_date).
- `matches`: id, drop_date, user_id, matched_user_id, similarity_score, status, partner_status (pending|greenlit|passed|expired), timestamps, unique (user_id, drop_date, matched_user_id), no-self-match check. Grants + RLS: select/update own rows only; inserts by service role.
- `user_blocks`: blocker_id, blocked_id, unique pair; RLS own rows.
- `match_settings` (single row): `daily_weight 1.0`, `baseline_weight 0.0`, `counterweight_target 0.55`, `intent_bonus 0.05`, `height_bonus 0.02`.
- `generate_nightly_matches(drop_date)` security definer SQL function, service role only.
- Partner profile reads via a security definer function returning only matched partners' display fields.

Code:

- `src/lib/embeddings.server.ts`: OpenAI `/v1/embeddings` with `OPENAI_API_KEY`, fallback to the AI gateway.
- Server functions: embed daily answer, embed baseline after onboarding, update match status.
- `/api/public/cron-drop` protected by `CRON_SECRET`, scheduled at 8pm Pacific; dev-only "Run match drop" button for testing.
- Lift Onboard1-3 state into `src/routes/index.tsx`; guest mode keeps using samples and never writes.
- Tests: strict gender filter, no self/repeat matches, max 2 per student, Mirror vs Counterweight ordering.

Needs from you: `OPENAI_API_KEY` added when we build.

Added Embeddings_3_Small_API secret which is the OPENAI_API_KEY as you requested. 