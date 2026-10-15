# Get Loom working again

## Where things stand
- The app is currently broken: the preview fails to load (error 500) because the profile screen pulls in server-only code the wrong way. Nothing else can be tested until this is fixed.
- The "View Alignment Spec" feature calls Google's Gemma directly with your own Google key. If those $100 credits expired, it fails with "Engine offline."

## Fix
1. **Unbreak the app** — rename the alignment file so it can be safely used from the profile screen. The preview loads again.
2. **Swap Gemma for Lovable AI** — run the Alignment Spec through Lovable's built-in AI (Google Gemini Flash). No Google key or separate credits needed; usage draws on your workspace's AI balance. Same prompt, same 2-sentence Neon-Noir output, same rate limit and sign-in requirement.
3. **Update the label** in the popup from "Engine · Gemma 4 (31B)" to "Engine · Gemini".
4. **Health check** — sign in as a test user and go through sign-up, onboarding, the daily prompt, and Alignment Spec. Then send you a short list of what works and what doesn't.
5. Then suggest publishing, since it's never been deployed.

## Technical details
- Move `src/server/alignment.functions.ts` to `src/server/alignment.functions.ts` stays a server fn module but must not sit under the import-protected `src/server/` path; relocate to `src/lib/alignment.functions.ts` and update the import in `Profile.tsx`.
- Replace `@google/genai` with a fetch to `https://ai.gateway.lovable.dev/v1/chat/completions` using `LOVABLE_API_KEY` (provision if missing), model `google/gemini-3-flash-preview`. Handle 429/402 with friendly messages. Remove `GEMINI_API_KEY` dependency and the `@google/genai` package.
- Keep `requireSupabaseAuth`, zod validation, and the per-IP limiter.
