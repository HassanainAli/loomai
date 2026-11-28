# Architecture rules

- Use the existing TanStack Start file router for navigation, not a second router; this preserves SSR and typed route integration.
- Keep the application state machine and desktop landing on `/`; public legal routes use a shared standalone layout outside the app frames so they work without authentication on any screen size.- Nightly matching runs entirely in Postgres (`generate_nightly_matches`, scheduled by pg_cron at both possible 8pm Pacific UTC hours, idempotent); tunable weights live in `match_settings` so scoring changes need no migration.
- Embeddings are created server-side in `src/lib/embeddings.server.ts` with one fixed model/dimension (OpenAI REST first, AI gateway fallback) so every stored vector stays comparable and the code stays portable.
- Roles live only in `public.user_roles` (checked via `has_role`); accounts with the `admin` role are excluded from the eligible pool inside `generate_nightly_matches`, so staff never match regardless of user-editable settings.
- Focus Mode chat access is enforced in the database by `match_threads` membership (RLS + `end_connection` RPC); a thread is created only by the matches trigger when both rows are greenlit, and users with an active thread are excluded from `generate_nightly_matches`.
- A student can have only one active Focus Mode thread: the first mutual green light closes their other open matches (status `closed`) in the `sync_match_partner_status` trigger; this keeps chats 1:1 without app-side checks.
- Idle threads (48h since `last_activity_at`) are ended by `auto_end_stale_threads()` via hourly pg_cron at :00, before the :01 drop job, so freed students rejoin that night's drop.
- Match actions go exclusively through `respond_to_match` (ok/expired/invalid/already_greenlit), with a persistent per-user/drop choice and serialized decisions; direct status updates are revoked so tabs, retries and ended chats cannot bypass the single final green light.
- Keep guest decision transitions in the browser-safe match-decisions module, and filter both live and demo queues with its shared open-state rule, so exploration is harmless and automatic closures never count as passes.
- Drops only run for campuses whose onboarded non-admin count meets `match_settings.min_campus_participants`; the queue shows progress via `get_campus_status`.
- Exit/recalibrate feedback lives in `match_history` (`source` column) and is applied inside `generate_nightly_matches` via `match_settings` feedback weights with a decay window; per-match score components are stored on `matches` for diagnostics.
- Loom+ access is the `loom_plus_members` table (admin-write only), read through `get_match_diagnostics`; never a user-editable profile column.
- Demo shortcuts (skip to drop, sample data) render only in guest mode; signed-in landing is chosen by `landingScreen` in `src/loom/flow.ts`.

- God Mode (`/admin`): every admin action is a security-definer RPC starting with `require_admin()` and writing `admin_actions`; drops run through `run_drop` (pause switch + `match_drop_runs` log). Test-account seed/wipe lives only in `src/lib/admin-testers.functions.ts` + `src/loom/dev/` and touches only `is_test_account` rows with `loomtest-N@uw.edu` emails, so it can be deleted before launch.

- The `loom.` wordmark is rendered only via `src/loom/Wordmark.tsx`; font families come from `--font-sans`/`--font-mono` tokens in styles.css (no inline fontFamily) so branding stays consistent.
- App emails use the managed email service through the server-only template helper, not application queues or generic browser send endpoints, because this project's sending and delivery tracking are platform-managed.
- Keep `/lovable/*` email routes outside login redirects and request guards; each handler authenticates its own caller so managed previews remain reachable.

- Match cards, self-preview, and guest cards use the same Profile renderer and public-field order, including saved daily answers; only partner comparisons, alignment, and actions differ, preventing demo and live layout drift.

- Guest account public defaults derive from the shared sample fixture with a separate identity; guest edits use a mutable copy so preview updates cannot overwrite either sample match.
- Keep account overlay navigation in the root app state and the guest reviewer bar above it, so direct demo jumps and account back actions never reopen stale menus.
- Keep guest main-journey and optional account navigation separate in the guest navigation module; restarting from Focus resets only demo match state, so repeated demos cannot alter live chat behavior.

- Store private profile photo paths, not signed URLs; storage policies authorize owners and current unblocked matches, with five-minute signed URLs so files are not publicly accessible.
- Use the shared photo editor for onboarding and account editing; photo changes save independently with compare-and-set ordering, and guest selections remain session-local to avoid writing demo data into live storage.
- Delete account photo objects through the Storage API before deleting their owner, so storage ownership does not block account deletion.
