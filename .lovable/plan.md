# God Mode (Admin Command Center)

A private `/admin` page, styled in neon noir, that only your admin account can open. It lets you pause matching, adjust the campus minimum, run a drop on demand, create/wipe test students, and see live numbers. All protection lives in the database, not the page.

## What you get

```text
/admin
 ├─ Engine switch      Pause / Resume all nightly drops (one tap, confirm dialog)
 ├─ Campus minimum     Number field (e.g. 20 -> 2 for testing), save
 ├─ Run drop now       Runs tonight's matching immediately, shows result (pairs made, campuses skipped)
 ├─ Test students      "Seed 2 testers" (loomtest-1/2@uw.edu, onboarded, answered today)
 │                     "Wipe test data" (removes only loomtest-* accounts and everything tied to them)
 ├─ Loom+ testers      Grant / revoke Loom+ by email
 └─ Live stats         Onboarded students per campus, answered today, active chats, last drop time + outcome
```

- Entry: small "God mode" badge on the app only for admins. Everyone else (signed out, students, guests) sees a plain "Page not found" — no hint the page exists.
- Every action asks for confirmation and shows a success/error message.
- Built deletable: test-student tools live in their own module so they can be removed before launch.

## Security sweep (built in, then verified)

1. **Server checks every action.** Each admin action is a protected server function that verifies the signed-in token, then asks the database `has_role(user, 'admin')`. The page guard is cosmetic only.
2. **Database is the final lock.** New admin database functions re-check `has_role(auth.uid(),'admin')` themselves and raise an error otherwise; execute is granted only to signed-in users (never anonymous), so even a direct API call by a student fails.
3. **Settings can't be edited by students.** Confirm `match_settings`, `user_roles`, and `loom_plus_members` have no student-writable policies; changes only through admin functions.
4. **Test wipe can't touch real people.** Wipe deletes only accounts whose email matches exactly `loomtest-<n>@uw.edu` and that carry a `is_test_account` marker set at seed time; never the admin.
5. **Privileged key stays on the server.** Account creation/deletion uses the admin client loaded inside the handler only after the admin check; never imported into page code.
6. **Inputs validated.** Campus minimum limited to 1–500; emails validated; no raw SQL from the page.
7. **Audit log.** New `admin_actions` table records who did what and when (admin-read only).
8. **Sweep at the end:** run the database security scan and linter, then test as (a) signed out, (b) a student test account, (c) admin — confirming only (c) can see stats or trigger anything. Results reported back.

## Technical details

- Migration:
  - `match_settings.engine_paused boolean not null default false`; `generate_nightly_matches` returns early when true (one extra check per day).
  - `match_drop_runs` (started_at, drop_date, pairs_created, skipped_campuses, triggered_by 'cron'|'admin'); nightly function writes a row.
  - `admin_actions` (admin_id, action, details jsonb, created_at), RLS select via `has_role`.
  - `profiles.is_test_account boolean default false`.
  - Security-definer RPCs, each starting with the admin check: `admin_get_stats()`, `admin_set_engine_paused(bool)`, `admin_set_campus_minimum(int)`, `admin_run_drop_now()`, `admin_set_loom_plus(email, bool)`. Grants: authenticated only; revoke from public/anon.
- Server functions `src/lib/admin.functions.ts` with `requireSupabaseAuth`; seeding/wipe in `src/lib/admin-testers.functions.ts` (admin client via dynamic import, embeddings via existing `embedText`).
- Route `src/routes/_authenticated/admin.tsx` (managed auth gate) — renders "not found" unless `has_role` check succeeds; own head() with noindex.
- Tests: Vitest for input validation (campus minimum bounds, test-email pattern) and wipe filter only matching `loomtest-*`.
- AGENTS.md: record admin RPC + audit-log rule.
