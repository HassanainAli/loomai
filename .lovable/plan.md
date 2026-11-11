# Fix the daily prompt answer box disappearing on desktop

## What's wrong

On a computer, clicking the answer box on the daily prompt makes it vanish below the bottom of the phone mockup.

The daily prompt has special code for iPhone keyboards. When you tap the box, it resizes the screen to match the space left above the keyboard. On a computer there is no on-screen keyboard, so it resizes the screen to the full browser window height (900px or more). The phone mockup is only about 750px tall and hides anything beyond its edge, so the answer box gets pushed out of view.

It also adds a "keyboard open" flag to the whole page, which hides the guest preview bar on desktop while the box is focused.

## The fix

1. **Only run the keyboard code on real phones.** It turns on only for touch devices below desktop width (the full-screen phone layout). Inside the desktop phone mockup, the daily prompt uses the normal layout with the answer box pinned to the bottom.
2. **Keep the iPhone behavior the same.** On a phone, tapping the box still keeps it just above the keyboard.
3. **Check it** in a desktop browser (1280 wide): sign in, open the daily prompt, click the box and type. The box should stay at the bottom of the phone. Then check a phone-size touch browser (390 x 844) to confirm the keyboard behavior still kicks in.

## Technical details

- `src/loom/screens/DailyGate.tsx`: in the `visualViewport` effect, skip the override (no `vv`, no `kb-open` class) unless `matchMedia("(pointer: coarse) and (max-width: 1023px)")` matches. 1023px lines up with the `lg` breakpoint where `index.tsx` swaps the mobile `Shell` for `DesktopLanding`.
- Also skip it when the component is inside the desktop frame. `index.tsx` mounts the app twice (once in the mobile wrapper, once in the desktop one), so add a guard using `closest(".nn-phone-screen")` on the textarea at focus time. That covers touch laptops and iPads in landscape.
- No changes to how answers are saved, matching, or guest mode.
