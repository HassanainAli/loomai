# Sprint 4.5: Edge case fixes

## What students will experience
1. **First mutual wins** - when a student's first match turns mutual, their other match from that drop closes quietly. Neither person is told why; the card just goes away. Later green lights on that closed match do nothing.
2. **Ghosting auto-close (48 hours)** - if a chat has no messages for 48 hours (counted from the last message, or from when the chat opened), it closes for both people. They see "This connection ended after 48 hours of quiet", the pair won't be matched again, and both go back into the 8pm drop.
3. **Cleaner match list** - ended, passed, expired and closed matches are hidden. The empty screen gives the right reason:
   - Haven't answered today's prompt: "Answer today's prompt before 8 PM to enter tonight's drop."
   - Answered but no match last night: "No match this time. Answer today's prompt to try again tonight."
   - In an active chat: the open chat is shown with no new drop matches.
4. **Message retry** - a failed message stays in the chat marked "Didn't send - tap to retry" instead of disappearing back into the text box.

## Technical details
- Migration (additive):
  - Extend the mutual trigger: when a thread is created, set any other pending or greenlit match row for either user from the same drop to `closed` (both sides), widening the status check constraint.
  - `match_threads.last_activity_at timestamptz default now()`, bumped by a trigger on message insert.
  - `auto_end_stale_threads()` security definer: ends active threads idle for more than 48h, writes `match_history` with reason `Auto-closed (inactive)`, adds `user_blocks` both directions. Scheduled hourly with pg_cron and also called at the start of `generate_nightly_matches` so freed users are eligible that night.
  - `get_my_matches()` filters to pending, waiting and mutual-active only, and returns a `drop_state` hint (answered today, had match last drop) for the empty-state copy.
- Frontend: `Queue.tsx` empty states; `Focus.tsx` failed-message state with retry and auto-close banner text; `types.ts` mapping for new states.
- Tests: Vitest for status mapping and empty-state choice; SQL checks that a second mutual is blocked, an idle thread auto-closes at 48h and not 47h, and closed users rejoin the drop.
- AGENTS.md: record the one-active-chat rule and idle auto-close.
