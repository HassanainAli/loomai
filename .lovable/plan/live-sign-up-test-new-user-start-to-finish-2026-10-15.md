# Live sign-up test (new user, start to finish)

Goal: confirm that a brand-new person can sign up and get all the way through the app today, and report back a simple "works / broken" list.

## What I'll do
1. Open the preview in a test browser and sign up with a fresh test address (e.g. `loomtest+<date>@uw.edu`).
2. Walk through all 4 onboarding steps, including the Spec Sheet (name, campus, birth date, phone, photo).
3. Answer the daily prompt and send it.
4. Open the queue / profile screens and press "View Alignment Spec" to see whether the Gemma connection responds or says "Engine offline".
5. Check the backend to confirm the test account's profile, preferences and prompt answer were actually saved.
6. Take screenshots at each step.

## What you'll get
- A short checklist: each step marked working or broken, with what went wrong if broken.
- No code changes in this pass. Any fixes will be proposed separately.

## Cleanup
- Delete the test account and its saved data afterwards so it doesn't show up in your user list.
