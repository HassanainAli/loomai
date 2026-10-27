# Sprint 4: Mutual Matches and Focus Mode

## Goal
When two students both tap Green Light, they unlock a real, private, in-app chat (Focus Mode). Ending a connection saves feedback, blocks a rematch, and returns both students to the 8pm drop. No email or SMS notifications.

## What students will experience
1. **One-sided Green Light** — your choice is saved quietly. The match card in your Queue shows "Waiting on them". The other person is never told you said yes.
2. **Pass** — the card goes away. The other person is never told.
3. **Mutual Green Light** — both cards change to "It's a match". Tapping it opens Focus Mode.
4. **Focus Mode chat** — real messages, delivered live, only visible to the two people in the match. While you are in Focus Mode, you are left out of new 8pm drops ("Daily matching paused" banner becomes true).
5. **End Connection** — keep the current reason picker plus optional note. Ending:
   - saves the reason and note (for Sprint 5 learning),
   - closes the chat for both people (other side sees "This connection has ended"),
   - permanently stops the two from being matched again,
   - puts both back into the daily drop.
6. **Unread dot** — in-app only: a small magenta dot on the match card when there are new messages.

## Rules
- Chat opens only when both said yes.
- Only the two matched students can read or send messages, enforced by the database.
- Messages: text only, 1 to 1000 characters, no photos or links preview for the pilot.
- One active Focus Mode connection at a time per student.
- Ended chats are read-only, then hidden from the Queue.

## Out of scope (Sprint 5 and later)
- AI analysis of end-connection feedback, Loom+ paid features.
- Report/safety review tools for admins (only the "Report user" reason is stored now).
- Push, email, or SMS notifications.

## Technical details
- **Schema (additive migration)**
  - `match_threads`: one row per mutual pair (`id`, `user_a`, `user_b`, `drop_date`, `status` active|ended, `ended_by`, `ended_at`). Created by a trigger extending `sync_match_partner_status` when both match rows are `greenlit`; also sets `matches.status = 'mutual'` on both rows.
  - `match_messages`: `id`, `thread_id`, `sender_id`, `body`, `created_at`, `read_at`. Validation trigger for length and active thread.
  - RLS: select/insert only when `auth.uid()` is a thread member; insert also requires `sender_id = auth.uid()` and thread active. GRANTs to authenticated and service_role. No anon.
  - Realtime enabled on `match_messages` and `match_threads`.
  - `match_history`: add nullable `thread_id`, `matched_user_id`.
- **RPCs (security definer, check membership)**
  - `end_connection(thread_id, reason, note)`: marks thread ended, inserts `match_history`, inserts `user_blocks` both directions, clears focus pause.
  - `get_my_matches()` extended to return mutual state and thread id.
- **Matching engine**: `generate_nightly_matches` skips users with an active thread (new filter, no scoring change). Pre-existing `user_blocks` filter covers no-rematch.
- **Frontend**
  - `Queue.tsx`: render Waiting / It's a match / Ended states, unread dot.
  - `Profile.tsx` / `index.tsx`: Green Light no longer jumps to Focus unless mutual.
  - `Focus.tsx`: replace mock messages and in-memory blacklist with live query + Realtime subscription in `useEffect` (unique channel, cleanup), send via insert, End Connection via RPC.
  - Guest mode keeps current mock chat.
- **Tests**: Vitest for state mapping (pending/mutual/ended) and message length rule; SQL checks that a non-member cannot read or send, and that ending blocks the pair from the next drop.
- **AGENTS.md**: record that chat access is enforced by thread membership in the database and that active threads exclude users from the drop.
