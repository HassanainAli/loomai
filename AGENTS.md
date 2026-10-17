# Architecture rules

- Use the existing TanStack Start file router for navigation, not a second router; this preserves SSR and typed route integration.
- Keep the application state machine and desktop landing on `/`; public legal routes use a shared standalone layout outside the app frames so they work without authentication on any screen size.