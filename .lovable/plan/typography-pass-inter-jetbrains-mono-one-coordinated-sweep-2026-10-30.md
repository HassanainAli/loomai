# Typography pass — Inter + JetBrains Mono, one coordinated sweep

Scope: consistency and readability only. Colors, layouts, spacing, interactions and behavior stay as they are, unless the audit requires a change.

## Order of work

1. **Load the fonts.** Add Google Fonts `<link>` tags (preconnect + Inter 400–900, JetBrains Mono 400–700, `display=swap`) to the root head. Before going further, confirm in the browser that both fonts load (`document.fonts.check`).
2. **Tokens in `src/styles.css`.**
   - `@theme`: `--font-sans: "Inter", ui-sans-serif, system-ui, sans-serif` and `--font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace`. Existing `font-mono` classes then pick up the real font with no extra edits.
   - Set `body` to the sans font. Enable `font-feature-settings` and `-webkit-font-smoothing`.
   - Add a few small `@utility` type styles: `type-eyebrow` (mono label), `type-display`, `type-numeric` (tabular-nums). These are starting values to check on screen, not fixed rules.
3. **Wordmark component** (`src/loom/Wordmark.tsx`): `loom` plus a bold yellow `#FACC15` period, with size variants. It replaces the inline copies in Shell, DesktopLanding (where the magenta period becomes yellow), LegalLayout and admin.
4. **Apply the type styles to screens:** DesktopLanding, LegalLayout, Auth, Onboard1–3, SpecSheet, DailyGate, Anticipation, Queue, Profile, Focus.
   - Remove the duplicated inline `MONO` style objects in favor of `font-mono`.
   - Keep mono only on technical items: eyebrow labels, countdowns, metrics, status chips. Remove it where it hurts readability, such as long body paragraphs like the landing "System Integrity" copy. Form fields stay sans.
   - Timers get `tabular-nums`. They switch to mono only where the mono look is part of the design.
   - Relax tracking on any heading where tight tracking clips or crowds.
   - Fix heading levels to match each element's role (one h1 per screen, h2/h3 for sections), without changing how they look.
   - The admin page stays mono. Only its wordmark changes.
5. **Visual check** with Playwright at 390×844 and 1280×1800 on the landing, legal pages, guest-mode app screens and Focus chat. Check font loading, fallback (fonts blocked), wordmark consistency, clipping, overflow, wrapping and spacing regressions. Fix any problems this pass introduced.
6. **Report:** files changed, key decisions, which screens were actually inspected, and anything left unverified (for example, screens that need a signed-in session or a live match).

## Technical notes
- Google Fonts load through `<link>` in `__root.tsx`, never through a CSS `@import`.
- No changes to logic or the database. Existing tests should still pass. I'll run vitest at the end.
- The memory note on typography will get the final font and wordmark rules.
