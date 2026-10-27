# Architecture rules

- Use the existing TanStack Start file router for navigation, not a second router; this preserves SSR and typed route integration.
- Keep the application state machine and desktop landing on `/`; public legal routes use a shared standalone layout outside the app frames so they work without authentication on any screen size.- Nightly matching runs entirely in Postgres (`generate_nightly_matches`, scheduled by pg_cron at both possible 8pm Pacific UTC hours, idempotent); tunable weights live in `match_settings` so scoring changes need no migration.
- Embeddings are created server-side in `src/lib/embeddings.server.ts` with one fixed model/dimension (OpenAI REST first, AI gateway fallback) so every stored vector stays comparable and the code stays portable.
- Roles live only in `public.user_roles` (checked via `has_role`); accounts with the `admin` role are excluded from the eligible pool inside `generate_nightly_matches`, so staff never match regardless of user-editable settings.
- Focus Mode chat access is enforced in the database by `match_threads` membership (RLS + `end_connection` RPC); a thread is created only by the matches trigger when both rows are greenlit, and users with an active thread are excluded from `generate_nightly_matches`.
- A student can have only one active Focus Mode thread: the first mutual green light closes their other open matches (status `closed`) in the `sync_match_partner_status` trigger; this keeps chats 1:1 without app-side checks.
- Idle threads (48h since `last_activity_at`) are ended by `auto_end_stale_threads()` via hourly pg_cron at :00, before the :01 drop job, so freed students rejoin that night's drop.
- Match actions go through the `respond_to_match` RPC (returns ok/expired/invalid) so drop rollovers are handled gracefully; green lights are final (enforced in `guard_match_status`) so undo can't be used to probe whether the partner said yes — backing out happens via `end_connection`.
- Drops only run for campuses whose onboarded non-admin count meets `match_settings.min_campus_participants`; the queue shows progress via `get_campus_status`.
- Exit/recalibrate feedback lives in `match_history` (`source` column) and is applied inside `generate_nightly_matches` via `match_settings` feedback weights with a decay window; per-match score components are stored on `matches` for diagnostics.
- Loom+ access is the `loom_plus_members` table (admin-write only), read through `get_match_diagnostics`; never a user-editable profile column.
- Demo shortcuts (skip to drop, sample data) render only in guest mode; signed-in landing is chosen by `landingScreen` in `src/loom/flow.ts`.
