# Fix the daily prompt layout on iPhone Safari

## What's wrong

The new placeholder text fits now. The layout is still broken:

1. **The answer box sits right under the question** instead of at the bottom of the screen, which leaves a big empty area below it.
2. **The guest preview bar is hidden.** Only a sliver shows at the very bottom, behind Safari's address bar.

Both problems have the same cause. On phones, the app frame is set to be "at least as tall as the screen" and has no fixed height. The daily prompt screen relies on the frame's height to push the answer box down, so the box never moves. iPhone Safari also counts the area behind its toolbar as part of the screen, so anything pinned to the bottom (like the guest bar) ends up hidden behind it.

This only happens below tablet width. On a Mac, the app shows inside the phone mockup, which has a fixed height, so it looks fine there.

## The fix

1. **Make the phone frame exactly the height of the visible screen on mobile.** Use the "dynamic viewport" height, which adjusts when Safari's toolbar shows or hides. Tablet and desktop sizes stay the same.
2. **Pin the answer box to the bottom** of the daily prompt screen, with extra space for the iPhone home bar so the box doesn't sit under it.
3. **Let the three screens that don't scroll yet scroll** (daily prompt, onboarding 3, 8pm drop). That way content on small phones never gets cut off now that the frame has a fixed height. The other screens already scroll.
4. **Check the result** in a mobile-size browser: answer box at the bottom, guest bar visible above it, and the sign-in and spec sheet screens still scrolling normally.

## Technical details

- `src/loom/Shell.tsx`: change the inner frame from `min-h-screen` to `h-[100dvh]` on mobile (keep `sm:h-[800px]`). Change the outer wrapper to `min-h-[100dvh]`.
- `src/loom/screens/DailyGate.tsx`: add `overflow-y-auto` to the root. Change the input wrapper's bottom padding to `pb-[max(1.5rem,env(safe-area-inset-bottom))]`. Add bottom clearance so the guest bar (`bottom-3`) doesn't cover the input.
- `Onboard3.tsx` and `Anticipation.tsx`: add `overflow-y-auto` to the root.
- Requires `viewport-fit=cover` in the root viewport meta for `env(safe-area-inset-bottom)` to work. Check `__root.tsx` and add it if it's missing.
- No logic, data or guest-mode behavior changes.
