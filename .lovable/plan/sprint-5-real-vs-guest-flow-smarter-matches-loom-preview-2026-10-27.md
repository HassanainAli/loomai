# Sprint 5 — Real vs. guest flow, smarter matches, Loom+ preview

## Goal
Real students only ever see real data and real timing. Guests keep every shortcut. Exit feedback starts improving future matches, and Loom+ diagnostics appear as a locked teaser.

## Part 1 — Split guest and real student flows
What changes for people:
- The "Skip to drop (demo)" button on the 8pm countdown shows only in guest mode.
- Sample matches, sample chat and sample alignment specs show only in guest mode. Real students with no matches see the honest empty-state message.
- The "pass 6 times, recalibrate" demo counter starts at 0 for real students (today it starts at 5 so it fires after one pass).
- Signing in sends students to the right screen based on today's state:
  - Active chat -> Focus chat
  - Matches waiting from tonight's drop -> Match queue
  - Already answered today's prompt -> 8pm countdown
  - Otherwise -> Daily prompt
- When the countdown hits 0:00:00 for a real student, the queue loads automatically (no button).
- The countdown uses Pacific time 8pm, so students in other time zones see the correct time left.

## Part 2 — Feedback makes future matches better
- When someone ends a connection, their reason (energy, values, physical, dealbreaker, note) is already saved. The nightly drop now uses it:
  - Candidates who are very similar to people a student recently ended with get a small score penalty.
  - Repeated "values didn't align" reasons put more weight on the daily-answer similarity; repeated "energy/pacing" reasons put more weight on match style.
- The "Let's recalibrate" screen saves the chosen reason into the same feedback so it counts too.
- All weights are adjustable settings, so tuning needs no rebuild. Penalty starts small and fades after 14 days.

## Part 3 — Loom+ alignment diagnostics (locked teaser)
- On a match profile, a "Why you matched" card shows a blurred breakdown (prompt overlap, values, style) with a "Loom+ coming soon" label.
- No payments in this sprint. A database flag marks Loom+ accounts so the admin can unlock it for testers; unlocked users see the real breakdown.
- The breakdown is computed from scores the nightly drop already stores, so it costs nothing extra.

## Part 4 — Pilot readiness check
- Run a full test with two non-admin student accounts: sign up, onboard, answer prompt, drop, green light both, chat, end connection, confirm feedback is applied next drop.
- Temporarily lower the campus minimum for the test, then restore it.

## Decisions to confirm
- Feedback penalty strength and 14-day fade (defaults above).
- Whether Loom+ teaser should show at all before payments exist.
- Payment provider is deferred to a later sprint.

## Technical details
- `Anticipation.tsx`: accept `isGuest`; render skip only for guests; compute target via `America/Los_Angeles`; call `onDrop` at zero for real users.
- `index.tsx`: after profile load, call `get_drop_state()` + `get_my_matches()` to choose the screen; `passStreak` initial 0 (5 only in guest); guard `MATCHES`/`CURRENT_USER_SPEC` fallbacks behind `guest`.
- Audit `Queue.tsx`, `Profile.tsx`, `Focus.tsx`, `SpecSheet` for any non-guest use of mock data.
- Migration: `match_settings` gains `feedback_penalty_weight`, `feedback_decay_days`; `generate_nightly_matches` subtracts penalty from cosine similarity to embeddings of recently ended partners and adjusts component weights per user from `match_feedback` aggregates; recalibrate writes to `match_feedback` with `source='recalibrate'`.
- Store per-match component scores on `matches` (if not already stored); `profiles.loom_plus boolean default false` settable only by admin via `has_role`; RPC `get_match_diagnostics(match_id)` returns full scores only when caller is a participant and has Loom+.
- Vitest: guest-only skip visibility helper, login routing helper (one test per state), Pacific countdown helper.
