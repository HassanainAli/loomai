# Save the Mirror / Counterweight choice (Step 3 of 4)

## Current state
The choice on Step 3 is not saved anywhere. It only lives on that screen and is thrown away when the student taps Next. No database column holds it, and the matching plan does not use it.

## What to build
1. Save the choice with the student's matching preferences when they finish onboarding.
2. Use it in the nightly 8pm drop ranking, after the strict gender/preference filter:
   - Mirror: rank candidates by highest answer similarity.
   - Counterweight: rank candidates closest to a moderate similarity band, so matches are related but not identical.
   - If the two students chose differently, use the average of both scores.
3. Existing accounts with no choice default to Mirror.

## Technical details
- Migration: add `balance text not null default 'mirror'` to `matching_preferences`, with a check for `'mirror' | 'counterweight'`.
- Lift the `Onboard3` choice into the root state (`onNext(choice)`), pass it to `SpecSheet`, and include it in the preferences insert/update.
- The pairing function reads `balance` per user when scoring candidate pairs.
