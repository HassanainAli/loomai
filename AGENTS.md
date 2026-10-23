# Architecture rules

- Use the existing TanStack Start file router for navigation, not a second router; this preserves SSR and typed route integration.
- Keep the application state machine and desktop landing on `/`; public legal routes use a shared standalone layout outside the app frames so they work without authentication on any screen size.- Nightly matching runs entirely in Postgres (`generate_nightly_matches`, scheduled by pg_cron at both possible 8pm Pacific UTC hours, idempotent); tunable weights live in `match_settings` so scoring changes need no migration.
- Embeddings are created server-side in `src/lib/embeddings.server.ts` with one fixed model/dimension (OpenAI REST first, AI gateway fallback) so every stored vector stays comparable and the code stays portable.
- Roles live only in `public.user_roles` (checked via `has_role`); accounts with the `admin` role are excluded from the eligible pool inside `generate_nightly_matches`, so staff never match regardless of user-editable settings.
