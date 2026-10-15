# Get Loom working again

## Where things stand
- The app is currently broken: the preview fails to load (error 500) because the profile screen pulls in server-only code the wrong way. Nothing else can be tested until this is fixed.
- The "View Alignment Spec" feature calls Google's Gemma directly with your own Google key. If those $100 credits expired, it fails with "Engine offline."

## Fix
1. **Unbreak the app** — rename the alignment file so it can be safely used from the profile screen. The preview loads again.
2. **Leave Gemma as-is for now** — no changes to the Alignment Spec engine. If the credits expired it will keep showing "Engine offline" until we revisit it.
3. (No label change.)
4. **Health check** — sign in as a test user and go through sign-up, onboarding, the daily prompt, and Alignment Spec. Then send you a short list of what works and what doesn't.
5. Then suggest publishing, since it's never been deployed.

## Technical details
- Relocate `src/server/alignment.functions.ts` out of the import-protected `src/server/` path to `src/lib/alignment.functions.ts` and update the import in `Profile.tsx`.
- Gemma call, `GEMINI_API_KEY`, `requireSupabaseAuth`, zod validation, and the per-IP limiter stay unchanged.
