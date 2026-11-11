# Clean up the sign-in screen footer

## What changes
- Remove the bottom footer on the sign-in screen: the "Loom is a closed-loop network..." note plus the Privacy Policy and Terms of Service links.
- Keep the "By joining, you agree to our Terms of Service and Privacy Policy" line on the Create account screen, since that is where people actually agree to them.
- Desktop visitors can still open Privacy and Terms from the landing page's top bar and footer.

## Worth knowing
- On phones there is no landing page, so after this change the legal pages are only linked from the Create account screen. That still covers signup consent. If you'd also like a quiet link somewhere for signed-out phone users, say so and I'll add one.

## Check
- Look at the sign-in and Create account screens on desktop (inside the phone) and at phone size, and confirm the layout looks balanced with no leftover gap.

## Technical details
- Edit only `src/loom/screens/Auth.tsx`: delete the trailing `<p>` footer block after the form container. No logic changes.
