
## Why not disable RLS

`profiles` holds PII (display name, gender, campus, target preference) and `prompt_responses` holds personal prompt answers + embeddings. Disabling RLS — or adding a blanket `USING (true) WITH CHECK (true)` policy for `authenticated` — lets any signed-in user read and overwrite every other user's row using only the publishable key. The current policies are already the correct shape:

- `profiles_insert_own`: `WITH CHECK (auth.uid() = id)`
- `pr_insert_own`: `WITH CHECK (auth.uid() = user_id)`

If these reject the insert, the problem is in the request, not the policy. We need to find out which.

## Step 1 — Read the actual error (no code changes)

Open the onboarding form in the preview, trigger "Complete Profile", and capture the exact alert text + browser network response body for the failing PostgREST request. The Postgres error message will tell us definitively:

- `new row violates row-level security policy for table "profiles"` + `auth.uid() = null` context → no session token attached.
- Same error but token is attached → the `id` in the payload doesn't equal the authenticated user's UUID.
- A different error entirely (e.g. `null value in column "user_id"`) → not RLS at all.

I'll read the console/network logs in build mode to confirm.

## Step 2 — Verify the request has an auth header

In `src/loom/screens/SpecSheet.tsx` `handleComplete`, log:

```ts
const { data: userData, error: userErr } = await supabase.auth.getUser();
console.log("[onboarding] getUser:", { user: userData?.user?.id, err: userErr });
const { data: sess } = await supabase.auth.getSession();
console.log("[onboarding] session token present:", !!sess.session?.access_token);
console.log("[onboarding] payload id:", activeUserId);
```

This tells us in one click whether:
- `getUser()` returns a real UUID (session is alive), and
- `activeUserId` equals that UUID at the moment of the upsert.

## Step 3 — Apply the targeted fix based on what step 2 shows

- **If `getUser()` returns null** → user isn't actually signed in at that screen. Fix the navigation/guard so onboarding is only reachable post-auth, and surface a clear "please sign in" state instead of attempting the write.
- **If `getUser()` returns a UUID but `activeUserId` is null/different** → remove the `userId` prop fallback path entirely from the insert payload. Hard-require `activeUserId = userData.user.id` and abort early with a visible error if it's missing. Never send `id: null` or a stale prop value to upsert.
- **If `getUser()` returns a UUID, `activeUserId` matches, and the insert still fails** → re-check the request headers in DevTools. The `Authorization: Bearer …` header must be present. If missing, that's a client setup issue (proxy stripping headers, etc.) and we investigate from there.

## Step 4 — Same audit for `DailyGate.tsx` and `matching_preferences`

The submission also writes to `prompt_responses` and (per earlier history) `matching_preferences`. Apply the same "require real authenticated UUID, never fall back to a stale prop, fail loudly" rule to both.

## Step 5 — Clean up

Once the form submits cleanly, remove the temporary `console.log`s and `window.alert` calls added during earlier debugging rounds and replace them with a single user-facing toast on error.

## What I will NOT do

- Disable RLS on `profiles` or `prompt_responses`.
- Add an `ALL` policy with `USING (true) WITH CHECK (true)` for `authenticated`.
- Add an `anon` policy on either table.

If after step 2 you'd still rather disable RLS despite the security impact, say so explicitly and I'll do it — but I want you to see the diagnostic output first, because in 9/10 cases like this the fix is one line in the client and RLS was never the actual problem.
