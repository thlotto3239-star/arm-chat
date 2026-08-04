# Arm Chat — UX/UI Audit Report

> Per Phase 1: Senior Product Designer + UX Researcher audit
> Source of truth: `stitch_arm_chat_whatsapp_design_system/`
> Comparison baseline: WhatsApp, Telegram, Discord, iMessage, modern SaaS
> Date: Sprint 0B → Phase 1 of design migration
> Full detail in `docs/audit/UX-UI-Product-Audit.md`

## Format Legend

Each problem entry follows the requested template:

```
Problem
Current implementation (file:line)
Expected behavior
Design system component to use (stitch folder)
Priority: P0 (Critical) / P1 (High) / P2 (Medium) / P3 (Low)
Required changes
```

---

## A. Authentication Surfaces

### A1. Login flow mismatched to design
- **Problem:** 3-tab IA (email/phone/Google) — design specifies 2-CTA (Google primary → Phone secondary). Email/password tab does not exist in design at all.
- **Current:** `src/app/(auth)/login/page.tsx:130-155` (3-tab segment), lines 163-205 (email/password form absent from design)
- **Expected:** Single options screen with Google CTA on top, divider "หรือ", Phone CTA below (per `arm_chat_1/code.html:149-164`)
- **Design system component:** `stitch_arm_chat_whatsapp_design_system/arm_chat_1` — step block "step-options"
- **Priority:** P1 (High)
- **Required changes:** Replace 3-tab structure with single options screen; remove email/password tab entirely (per Phase 9 rule); remove "Standard User Role" jargon (line 126, 193)

### A2. Phone OTP is client-side simulation, 6-digit instead of design's 4-digit, no +66 prefix
- **Problem:** OTP generated via `Math.random` and pre-inserted into readOnly inputs (bypassable). 6-digit per impl vs design's 4-digit. Phone field has no +66 prefix.
- **Current:** `login/page.tsx:82-83` (`Math.floor(100000 + Math.random() * 900000)`), line 21 (6 otpDigits), line 214-221 (no +66)
- **Expected:** Per Phase 9 spec, generate internal 6-digit code (note: design specifies 4-digit but Phase 9 mandates 6-digit and auto-fill), present +66 prefix, success animation
- **Design system component:** `arm_chat_1/code.html:166-219` (3 steps: options → phone → verify → success)
- **Priority:** P0 (Critical — security theater)
- **Required changes:** Implement internal 6-digit OTP with expiry + rate limit + secure random (`crypto.getRandomValues`); show +66 prefix; auto-fill on verify step; render success state per design before redirect

### A3. No "Forgot password" route
- **Problem:** Currently absent (grep returned zero). Email-tab users have no recovery path.
- **Current:** No `/forgot-password` route, no link anywhere
- **Expected:** Since Phase 9 reduces to Phone+Google only, this becomes obsolete — instead, phone users re-request OTP; Google users re-auth via Google
- **Design system component:** n/a (Phase 9 removes email/password → no password to recover)
- **Priority:** n/a (becomes moot after Phase 9)
- **Required changes:** Skip — Phase 9 eliminates email/password entirely

### A4. Google OAuth failures silently route to /onboarding
- **Problem:** OAuth error path `router.push('/onboarding')` (lines 69, 72) — masks failure as success.
- **Current:** `login/page.tsx:59-76`
- **Expected:** Surface error in styled `errorMsg` region (lines 157-161) per WhatsApp/Telegram error UX.
- **Design system component:** `arm_chat_1/code.html` error state convention (highlighted border)
- **Priority:** P0 (Critical — broken auth integrity)
- **Required changes:** Remove silent redirect branches; subscribe to `onAuthStateChange`; only navigate after confirmed `SIGNED_IN` event

### A5. Login auto-signs-up on email failure
- **Problem:** `handleEmailSignIn` (lines 40-47) silently calls `signUp` if `signInWithPassword` errors — typo password creates orphan account.
- **Current:** `login/page.tsx:35-56`
- **Expected:** Login ≠ registration. Remove auto-`signUp` fallback entirely.
- **Design system component:** `arm_chat_1` separates login vs registration implicitly.
- **Priority:** P0
- **Required changes:** Remove lines 40-47 — only `signInWithPassword` allowed. After Phase 9, this becomes moot (no email/password).

### A6. Navbar + Footer rendered on auth screen
- **Problem:** Marketing chrome wraps the auth card — design explicitly suppresses navbar on onboarding and uses minimal legal footer.
- **Current:** `login/page.tsx:116, 273` (`<Navbar/>` + `<Footer/>`)
- **Expected:** Auth layout strips global chrome, adds minimal legal-link footer (Terms/Privacy/Help)
- **Design system component:** `arm_chat_1/code.html:222-229` minimal footer
- **Priority:** P1
- **Required changes:** Create `src/app/(auth)/layout.tsx` removing `<Navbar/>` and `<Footer/>`; render minimal legal-link footer per design

### A7. Register page is dead code (fake)
- **Problem:** `handleRegister` uses `setTimeout(800ms) → router.push('/onboarding')` — no `supabase.auth.signUp` call at all.
- **Current:** `src/app/(auth)/register/page.tsx:15-22` — no `supabase` import even
- **Expected:** Per Phase 9, register becomes implicit — first phone-login or Google-login auto-creates the account; no separate page needed.
- **Design system component:** `arm_chat_1` (login IS registration on first use)
- **Priority:** P0
- **Required changes:** After Phase 9 unification, delete `/register` route entirely; redirect any direct URL hits to `/login`

### A8. Onboarding is single-step, design is 3-step journey
- **Problem:** Implementation is one profile form. Design specifies: Step 1 Profile → Step 2 Auto-UID + Invite Link → Step 3 QR Card.
- **Current:** `src/app/onboarding/page.tsx:145-222` (one form); missing UI for Steps 2-3 entirely.
- **Expected:** 3-step wizard with progress indicator, auto-generated `ARM-XXXX-TH` user ID, invite link, downloadable QR card
- **Design system component:** `stitch_arm_chat_whatsapp_design_system/arm_chat_2/code.html:138-281` (full 3-step structure)
- **Priority:** P0
- **Required changes:** Implement step state machine; show branding-column with progress rail (per design `arm_chat_2:138-170`); generate server-side `user_code` on profile INSERT (Track B schema migration needed); add share-link + QR card; suppress Navbar/Footer per explicit design rule (`arm_chat_2:136`)

### A9. Username availability is faked
- **Problem:** Onboarding always shows "✓ ชื่อผู้ใช้นี้สามารถใช้งานได้" unconditionally.
- **Current:** `onboarding/page.tsx:201` (static span)
- **Expected:** Debounced `profiles.username` lookup with real available/taken feedback.
- **Design system component:** `arm_chat_2/code.html:204-207` (check_circle feedback)
- **Priority:** P1
- **Required changes:** Wire debounced availability check; render check_circle only on confirmed-available; render taken state otherwise; verify `profiles.username` has UNIQUE constraint (Track B)

### A10. Onboarding uses UPDATE-only (no upsert for new users)
- **Problem:** `.update({...}).eq('id', user.id)` on a fresh profile affects zero rows — user enters `/chats` with no profile.
- **Current:** `onboarding/page.tsx:98-107`
- **Expected:** `.upsert` or explicit INSERT-on-not-found.
- **Design system component:** n/a (data pattern, not visual)
- **Priority:** P1
- **Required changes:** Switch to `upsert`; verify a `handle_new_user` trigger exists (Track B); guarantee a profile row is created during onboarding

### A11. "Supabase Storage" jargon leaked in avatar upload hint
- **Problem:** "คลิกเพื่ออัปโหลดรูปภาพโปรไฟล์ (Supabase Storage)" — exposes backend vendor.
- **Current:** `onboarding/page.tsx:173`
- **Expected:** Plain Thai: "อัปโหลดรูปภาพโปรไฟล์" (per `arm_chat_2:191`)
- **Design system component:** `arm_chat_2/code.html:191`
- **Priority:** P2
- **Required changes:** Remove " (Supabase Storage)" suffix

---

## B. Chat Surfaces

### B1. Chat list (Inbox) has no realtime
- **Problem:** Inbox fetches once; new messages don't update list preview.
- **Current:** `src/app/chats/page.tsx:43-185` — single useEffect, no `supabase.channel(...)`
- **Expected:** Subscribe to `postgres_changes` on messages table; bubble newly-active chats to top.
- **Design system component:** `arm_chat_3` (bento + sidebar + FAB)
- **Priority:** P0
- **Required changes:** Add realtime subscription to messages + rooms; resort on INSERT; mark preview dirty without re-fetching all rooms

### B2. Unread count hardcoded to 0
- **Problem:** `unread: 0` literal for every chat row.
- **Current:** `chats/page.tsx:143`
- **Expected:** Real unread = `count of messages.created_at > last_read_at` per room.
- **Design system component:** `arm_chat_3` unread pill (lines 218-220)
- **Priority:** P0
- **Required changes:** Add `last_read_at` to `room_members` (Track B); render green unread pill when > 0

### B3. Online status hardcoded to `true` for all
- **Problem:** Presence dot always green.
- **Current:** `chats/page.tsx:144`
- **Expected:** Real Supabase presence tracking.
- **Design system component:** `arm_chat_3` presence dot; `arm_chat_6` "เห็นล่าสุดเมื่อ ..." (members list lines 237-249)
- **Priority:** P1
- **Required changes:** Subscribe to presence channel; show/hide green dot per partner's actual status

### B4. Inbox auto-seeds fake "official dev group" + self welcome
- **Problem:** Onboarded users receive a fake group + a self-sent "เชื่อมต่อฐานข้อมูล Supabase" message.
- **Current:** `chats/page.tsx:64-91`
- **Expected:** Informative empty state with "เริ่มแชทใหม่" FAB (per WhatsApp)
- **Design system component:** `arm_chat_3` empty state + FAB (lines 297-303, 342-344)
- **Priority:** P1
- **Required changes:** Delete auto-seed; render empty state + FAB

### B5. Header exposes technical jargon ("Supabase Cloud", "WebRTC")
- **Problem:** Multiple places surface vendor names.
- **Current:** `chats/page.tsx:85, 172, 233, 308, 406`
- **Expected:** Clean Thai user-facing copy.
- **Design system component:** All stitch files use clean copy
- **Priority:** P1
- **Required changes:** Replace "Supabase Cloud" → "Arm Chat"; drop "WebRTC" labels; rewrite loading text

### B6. Inbox missing FAB + pin/archive section
- **Problem:** New-chat button is in-header only; no FAB; no pin/archive/mute per-row actions.
- **Current:** `chats/page.tsx:236-258`
- **Expected:** FAB bottom-right; long-press row → pin/archive/mute context menu.
- **Design system component:** `arm_chat_3` FAB + `arm_chat_22` context-menu (lines 224-250)
- **Priority:** P2
- **Required changes:** Add FAB; add long-press context menu; add `is_pinned`/`is_archived` to schema (Track B)

### B7. Chat Room reply quote is static placeholder
- **Problem:** Reply banner shows literal "ตอบกลับข้อความก่อนหน้า" not the actual replied-to text.
- **Current:** `src/app/chat/[id]/page.tsx:436-440`
- **Expected:** Real quoted message with sender + text + colored left border.
- **Design system component:** `arm_chat_22` highlighted bubble (lines 206-214)
- **Priority:** P1
- **Required changes:** Pre-fetch quoted messages; render sender + truncated text + tap-to-scroll-to-original

### B8. Message toolbar is hover-only (unreachable on mobile)
- **Problem:** `hidden group-hover:flex` — mobile users cannot react/reply/edit/delete.
- **Current:** `chat/[id]/page.tsx:486`
- **Expected:** Long-press → bottom action sheet on mobile; hover on desktop.
- **Design system component:** `arm_chat_22` context menu (lines 224-250) + 6-emoji reaction bar (lines 216-223)
- **Priority:** P0
- **Required changes:** Implement long-press handlers (`onPointerDown`/`onTouchStart`); render bottom-sheet menu; expand reactions to 6 emoji with toggle-off

### B9. Missing Forward/Copy/Pin/Star
- **Problem:** Toolbar has only reply/❤️/👍/edit/delete.
- **Current:** `chat/[id]/page.tsx:487-495`
- **Expected:** Per `arm_chat_22`: ตอบกลับ / คัดลอก / ส่งต่อ / ติดดาว / ลบ
- **Design system component:** `arm_chat_22` menu items (lines 226-249)
- **Priority:** P1
- **Required changes:** Add Copy (clipboard), Forward (recipient picker), Star/pin (persisted flag)

### B10. Read receipts are fake
- **Problem:** `done_all` icon rendered unconditionally for every own message — no real sent/delivered/read status.
- **Current:** `chat/[id]/page.tsx:501`
- **Expected:** WhatsApp-style: single tick (sent), double grey (delivered), double blue (read).
- **Design system component:** `arm_chat_4` status label "อ่านแล้ว" (line 264)
- **Priority:** P1
- **Required changes:** Add `messages.status` column (Track B); write read-receipt on message-visible event; render correct tick

### B11. No date separators between days
- **Problem:** Messages render flat with no "วันนี้ / เมื่อวานนี้ / DD MMM" pill.
- **Current:** `chat/[id]/page.tsx:432-505`
- **Expected:** Centered day-divider pill when day changes.
- **Design system component:** `arm_chat_4` (lines 247-249), `arm_chat_22` (lines 163-165)
- **Priority:** P2
- **Required changes:** Group messages by day; render centered pill before each new-day boundary

### B12. No infinite scroll (loads entire history)
- **Problem:** `select('*')` with no limit/range.
- **Current:** `chat/[id]/page.tsx:124-129`
- **Expected:** Page in chunks via IntersectionObserver on top sentinel.
- **Design system component:** n/a — standard chat pattern
- **Priority:** P2
- **Required changes:** Initial `.limit(50)` desc, reverse; IntersectionObserver on top to load older pages

### B13. Voice recorder has no waveform
- **Problem:** Only seconds counter + stop button — no waveform, no slide-to-cancel.
- **Current:** `chat/[id]/page.tsx:539-555`
- **Expected:** Live waveform via Web Audio AnalyserNode + slide-to-cancel + inline playback bubble with waveform.
- **Design system component:** `arm_chat_4` mic button (line 305)
- **Priority:** P2
- **Required changes:** Add AudioContext + analyser; render bars; "ปัดเพื่อยกเลิก"; inline waveform playback

### B14. Typing indicator is text-only, no 3-dot animation
- **Problem:** Replaces header presence instead of in-line bubble.
- **Current:** `chat/[id]/page.tsx:198-203, 415`
- **Expected:** Animated 3-dot bubble at bottom of message list when `typing` event fires.
- **Design system component:** `arm_chat_4` (lines 162-170 CSS + 268-275 markup)
- **Priority:** P2
- **Required changes:** Render 3-dot typing bubble inline; keep header presence independent; add CSS keyframes

### B15. No empty state for fresh chat ("Say hi")
- **Problem:** When `messages.length === 0`, nothing renders.
- **Current:** `chat/[id]/page.tsx:432-505` (no empty branch)
- **Expected:** Centered hero: avatar + "อดเปล่า… พูดคุยกันเลย!" + E2E note.
- **Design system component:** `arm_chat_27` (lines 180-190) or `arm_chat_5` hero card
- **Priority:** P2
- **Required changes:** Add `messages.length === 0` branch with hero card

### B16. No full-screen image viewer
- **Problem:** Image messages render inline cap; no click-to-lightbox.
- **Current:** `chat/[id]/page.tsx:451-455`
- **Expected:** Full-screen pinch-zoom lightbox with swipe between media in room.
- **Design system component:** `gallery_view_arm_chat` + `arm_chat_27` shared gallery (lines 193-217)
- **Priority:** P2
- **Required changes:** Wrap image with click handler; render full-screen overlay with swipe/zoom

### B17. File uploads not validated
- **Problem:** No MIME/size enforcement beyond `accept` attribute.
- **Current:** `chat/[id]/page.tsx:336-372`
- **Expected:** Max size (16 MB image / 100 MB doc), MIME whitelist, friendly Thai error toast.
- **Design system component:** n/a — standard validation
- **Priority:** P1
- **Required changes:** Add client-side size + MIME guard; replace `alert` with toast

### B18. Group rows missing "Sender:" preview prefix + stacked avatar
- **Problem:** Inbox group rows lack sender prefix; use single avatar instead of design's stacked dual.
- **Current:** `chats/page.tsx:373, 356`
- **Expected:** "{senderName}: {preview}" + stacked dual-avatar.
- **Design system component:** `arm_chat_3` group item (lines 241-260)
- **Priority:** P2
- **Required changes:** Resolve last-message sender; render prefix; stacked dual-avatar

### B19. Timestamps always HH:MM (no "เมื่อวานนี้" / weekday / date)
- **Problem:** All timestamps formatted `toLocaleTimeString` HH:MM.
- **Current:** `chats/page.tsx:135`
- **Expected:** Today → HH:MM; yesterday → "เมื่อวานนี้"; this week → weekday; older → DD/MM/YY.
- **Design system component:** `arm_chat_3` (lines 214, 234, 254, 271, 288)
- **Priority:** P2
- **Required changes:** Date formatter helper covering tiers

### B20. Chat room header has only ONE call affordance (videocam)
- **Problem:** Header lacks separate voice call, screen share, search, more_vert menu.
- **Current:** `chat/[id]/page.tsx:420-428`
- **Expected:** call + videocam + screen_share + divider + search + more_vert.
- **Design system component:** `arm_chat_4` header actions (lines 225-242)
- **Priority:** P2
- **Required changes:** Add separate audio call button, search, more_vert menu

### B21. No Contact Info / Group Info page reachable from header
- **Problem:** Tapping header avatar/name does nothing.
- **Current:** `chat/[id]/page.tsx:408-417` (plain div)
- **Expected:** `/chat/[id]/info` route showing Contact Info or Group Info
- **Design system component:** `arm_chat_27` (contact info) + `arm_chat_6` (manage group)
- **Priority:** P2
- **Required changes:** Make header a Link; render Contact Info (avatar, call/chat/video, shared media, mute/block/report) or Group Info (members, invite QR, stats)

### B22. Composer is plain text input (no emoji picker, no attachment sheet, no multiline)
- **Problem:** No emoji button, single-line `<input type="text">`, only file input.
- **Current:** `chat/[id]/page.tsx:523-573`
- **Expected:** `<textarea auto-grow>` + emoji button + "+" sheet (image/camera/file/location/contact/poll).
- **Design system component:** `arm_chat_4` composer (lines 288-313); `arm_chat_26` (poll)
- **Priority:** P2
- **Required changes:** Switch to textarea; add emoji button; add attachment sheet; poll composer

---

## C. Call Surfaces

### C1. Call page is fake LiveKit
- **Problem:** Imports only `useState/useEffect/useRef`, `Link`, `supabase` — no LiveKit.
- **Current:** `src/app/call/[id]/page.tsx:1-6` (imports), lines 31-34 (raw `getUserMedia`)
- **Expected:** Real LiveKit integration: `useVoiceCall`/`useVideoCall` from `@livekit/components-react`, fetch token from `/api/livekit/token`.
- **Design system component:** `1_1_arm_chat` (1:1 video) + `arm_chat_23` (voice) + `arm_chat_large_meeting` (group)
- **Priority:** P0 (Critical — deceptive trust claim "LiveKit/WebRTC encrypted")
- **Required changes:** Replace raw getUserMedia with LiveKit Room + VideoTrack + AudioTrack; render E2EE pill only when actually connected; remove fake Unsplash partner image

### C2. No call-state machine (no incoming/outgoing/rejected/busy)
- **Problem:** Page mounts straight into "in-call" UI; no ringing/accept/decline flow.
- **Current:** `call/[id]/page.tsx:22-66` (mounts media + inserts in-progress row immediately)
- **Expected:** `callState: idle|outgoing|incoming|connecting|connected|ended|missed|rejected|busy`; full-screen incoming screen with Accept/Decline rings.
- **Design system component:** `arm_chat_23` pulse-ring + Accept/Decline (lines 119-133, 184-190)
- **Priority:** P0
- **Required changes:** Introduce call-state machine; build incoming route; push call offers via Supabase Realtime `call_offers` broadcast; busy detection via presence

### C3. No voice vs video distinction
- **Problem:** `call_type` hardcoded to `'video'` at both inserts.
- **Current:** `call/[id]/page.tsx:51, 96`
- **Expected:** Parse `type=voice|video` from query; render distinct layout.
- **Design system component:** `arm_chat_23` (voice) + `1_1_arm_chat` (video)
- **Priority:** P1
- **Required changes:** Read `useSearchParams`; conditional layout; real `call_type` to DB insert

### C4. Three broken in-call controls
- **Problem:** (a) Screen-share button (lines 198-206) only toggles state — no `getDisplayMedia()`. (b) No camera-flip. (c) No speaker/Bluetooth selection.
- **Current:** `call/[id]/page.tsx:198-206` + grep for `switchCamera|facingMode|audioOutput` found only in qr/page.tsx
- **Expected:** Real `getDisplayMedia()` + camera switch via `applyConstraints({facingMode})` + `setSinkId` speaker picker (graceful degrade)
- **Design system component:** `1_1_arm_chat` secondary control row (lines 170-177) + `arm_chat_23` speaker toggle (lines 204-209)
- **Priority:** P1
- **Required changes:** Wire `getDisplayMedia`; add camera flip; add audio output picker with graceful degrade

### C5. No multi-participant grid
- **Problem:** Single local `<video>` + fake Unsplash partner — no remote tracks, no grid for groups.
- **Current:** `call/[id]/page.tsx:143-149, 162-172`
- **Expected:** LiveKit `useParticipants`; auto-fit grid for groups.
- **Design system component:** `arm_chat_large_meeting` (focus + gallery) + `gallery_view_arm_chat` (3-col grid with +N overflow)
- **Priority:** P1
- **Required changes:** Use LiveKit `ParticipantTile`; render `gallery_view_arm_chat` for ≤12, `arm_chat_large_meeting` for screen-share; resolve `rooms.is_group` to choose layout

### C6. Call history inserts two unlinked rows per call
- **Problem:** Row inserted with only `caller_id` on mount + second row with `status:'ended'` on hangup — neither linked, no `receiver_id`.
- **Current:** `call/[id]/page.tsx:48-53, 94-99`
- **Expected:** Single row per call with lifecycle: `ringing` → `connecting` → `in-progress` → `completed|declined|missed|busy` + `started_at`/`ended_at`/`duration_seconds`.
- **Design system component:** `arm_chat_9` pending card (lines 219-243) for visual anatomy
- **Priority:** P1
- **Required changes:** Insert one row on offer; UPDATE the same row on each transition; populate `receiver_id`; `call_logs` table to be added in Track B migration

### C7. Track-lifecycle bugs (toggle stops tracks enabled=false not stop, camera LED stays on)
- **Problem:** `toggleMic`/`toggleCam` set `track.enabled = false` only — camera LED stays on.
- **Current:** `call/[id]/page.tsx:68-84`
- **Expected:** `track.stop()` on camera-off (LED goes dark); `track.mute()` for soft/mic-toggle.
- **Design system component:** `1_1_arm_chat` toggleActive (lines 203-228)
- **Priority:** P2
- **Required changes:** On "off" path call `track.stop()`; re-acquire on "on" path; make cleanup idempotent

---

## D. Friends & QR

### D1. Friends page has no realtime pending
- **Problem:** `loadData()` runs once; pending badge frozen.
- **Current:** `src/app/friends/add/page.tsx:37-72`
- **Expected:** Subscribe to `friendships` INSERT.
- **Design system component:** `arm_chat_9` pending mini-card (lines 213-245)
- **Priority:** P1
- **Required changes:** Subscribe on `friend_id = currentUserId AND status = 'pending'`; append to `pendingRequests` on event; `animate-pulse` badge

### D2. Search not debounced — fires per keystroke
- **Problem:** `handleSearch` called on every keystroke; 2 queries fired per char.
- **Current:** `friends/add/page.tsx:74-116, 312`
- **Expected:** Debounce 300ms; only fire when ≥2 chars; `AbortController` to discard stale.
- **Design system component:** `arm_chat_9` search bar (lines 171-174)
- **Priority:** P1
- **Required changes:** Wrap in `useDebounce`; abort stale; defer spinner to 150ms post-typing

### D3. One-way block, no unblock surface anywhere
- **Problem:** Block works; no route to view/manage blocked users; unblock impossible.
- **Current:** `friends/add/page.tsx:156-168` (block only)
- **Expected:** Dedicated blocked-contacts screen + per-row Unblock.
- **Design system component:** `arm_chat_21` (blocked contacts list)
- **Priority:** P1
- **Required changes:** Add `บล็อก` tab or `/friends/blocked` route; reuse `arm_chat_21` row anatomy; toggle block↔unblock

### D4. Outgoing pending requests not shown
- **Problem:** Only incoming requests fetched; no representation of "awaiting reply".
- **Current:** `friends/add/page.tsx:52-56`
- **Expected:** Add outgoing-pending section with "รอการตอบรับ" pill on search results.
- **Design system component:** `arm_chat_9` (lines 213-245 — split Incoming/Outgoing)
- **Priority:** P2
- **Required changes:** Fetch outgoing; add `isOutgoingPending` flag; render pill

### D5. `handleSendFriendRequest` mislabels sent request as accepted friend
- **Problem:** Sets `isFriend: true` immediately; user can Start-Chat with non-friend.
- **Current:** `friends/add/page.tsx:127-129`
- **Expected:** Pending state — not friend until other side accepts.
- **Design system component:** `arm_chat_9` pending check-icon (lines 227-229)
- **Priority:** P1
- **Required changes:** Replace `isFriend: true` with `isOutgoingPending: true`; disable Start-Chat until acceptance; defense-in-depth server RPC `get_or_create_dm` validates

### D6. Accept uses native `alert()` + non-atomic 2-step
- **Problem:** `alert()` + update + insert without atomicity.
- **Current:** `friends/add/page.tsx:132-148`
- **Expected:** Toast library + atomic server-side RPC `accept_friendship`.
- **Design system component:** `arm_chat_9` inline accept button (line 227-229 — alert-free)
- **Priority:** P2
- **Required changes:** Replace alert with Sonner/toast; build `accept_friendship(request_id)` RPC; optimistic update

### D7. Start-Chat hides 4-step async behind single click
- **Problem:** No loading indicator, no mutex, double-click creates duplicate rooms.
- **Current:** `friends/add/page.tsx:170-208`
- **Expected:** Spinner + `startingChatId` lock + server-side idempotent RPC.
- **Design system component:** `arm_chat_9` contact-card (lines 272-352)
- **Priority:** P2
- **Required changes:** Add `startingChatId` state; lock button during in-flight; build `get_or_create_dm(user_a, user_b)` RPC

### D8. QR Scan tab does not decode
- **Problem:** Camera preview only — no decoder library.
- **Current:** `src/app/qr/page.tsx:43-68` + `package.json` (only `qrcode.react` for render)
- **Expected:** Real decoder (jsqr / zxing / html5-qrcode) with decode loop.
- **Design system component:** `qr_arm_chat` (corner brackets + scan-line + CTA)
- **Priority:** P0
- **Required changes:** Install `jsqr`; `requestAnimationFrame` decode loop; `ctx.drawImage` + `jsQR(imageData)`; parse URL → `router.push('/friends/add?user=' + username)`

### D9. Permission-denied silent failure
- **Problem:** `console.warn` only — user sees black box forever.
- **Current:** `qr/page.tsx:52-54`
- **Expected:** Inline error overlay: "ไม่สามารถเข้าถึงกล้องได้" + retry + "แสดงคิวอาร์ของฉันแทน" fallback.
- **Design system component:** `qr_arm_chat` (lines 156-188 — error variant of overlay)
- **Priority:** P1
- **Required changes:** Add `cameraError` state; render error overlay; offer fallback to My-Code tab + photo library upload fallback

### D10. Deep link `/friends/add?user=...` encoded but never honored
- **Problem:** Friends page doesn't read `?user=`.
- **Current:** `qr/page.tsx:34` (encodes), `friends/add/page.tsx` (greps returned no `useSearchParams`)
- **Expected:** Receiving page reads `?user=`, pre-renders confirm card.
- **Design system component:** `arm_chat_9` pending card (lines 219-243 — confirm-card anatomy)
- **Priority:** P0
- **Required changes:** In `friends/add/page.tsx` import `useSearchParams`; fetch profile; render "เพิ่ม [Name]..." confirm card

### D11. Missing scanner affordances (corner brackets, torch, gallery)
- **Problem:** Small dashed box, no torch, no gallery import.
- **Current:** `qr/page.tsx:141-154`
- **Expected:** Full-screen black viewport + corner brackets + torch toggle + gallery import.
- **Design system component:** `qr_arm_chat` (lines 150-191)
- **Priority:** P2
- **Required changes:** Make viewport full-bleed + `bg-black`; add corner brackets; torch via `applyConstraints` (graceful); photo library via `<input type="file">` + jsqr

### D12. My Code uses hardcoded domain + raw username in QR
- **Problem:** `https://arm-chat.vercel.app/friends/add?user=${profile.username}` — leakable, no refresh.
- **Current:** `qr/page.tsx:14, 34`
- **Expected:** Opaque refreshable `add_token`; native share-sheet.
- **Design system component:** `arm_chat_31` (refreshable QR + share)
- **Priority:** P2
- **Required changes:** Add `profiles.add_token` UUID column + 60s refill; use `navigator.share` if available

### D13. QR no scan-result feedback
- **Problem:** No haptic/beep/preview on decode.
- **Current:** `qr/page.tsx` (no result overlay)
- **Expected:** Haptic + sound + friend-preview modal before navigating.
- **Design system component:** `qr_arm_chat` CTA + `arm_chat_9` confirm card
- **Priority:** P2
- **Required changes:** Flash green + `navigator.vibrate(50)`; show "Found X, Add as friend?"; suspend decode loop while overlay up

---

## E. Stories

### E1. No realtime updates
- **Problem:** `fetchStories()` runs once on mount.
- **Current:** `src/app/stories/page.tsx:27-29`
- **Expected:** Subscribe to `stories` table INSERT.
- **Design system component:** `stories_arm_chat` (live nav state lines 154-158)
- **Priority:** P1
- **Required changes:** Add Supabase realtime; replace demo-story fallback with empty state

### E2. Image-only — no text status
- **Problem:** `accept="image/*"` only; no text composer.
- **Current:** `stories/page.tsx:173`
- **Expected:** Two composers: camera + text edit (`arm_chat_2` design text tile).
- **Design system component:** `stories_arm_chat` text tile (lines 245-259) + FAB cluster (lines 308-316)
- **Priority:** P1
- **Required changes:** Add text composer; persist `media_type: 'text'`; render `aspect-[3/4] bg-primary` text tile

### E3. Viewer static modal — no progress/autoplay/tap/swipe/keyboard
- **Problem:** Story modal has only an X button.
- **Current:** `stories/page.tsx:245-284`
- **Expected:** Full-screen overlay with segmented progress bar, autoplay 5-8s, tap-left/right, swipe, Arrow keys + Escape.
- **Design system component:** WhatsApp/IG story conventions (no explicit folder — implement)
- **Priority:** P0
- **Required changes:** Replace modal with full-screen progress-bar overlay; group items by `user_id`; keydown + touch swipe + tap zones; autoplay interval

### E4. No "Viewed" gray section
- **Problem:** All stories in undifferentiated grid.
- **Current:** `stories/page.tsx:213-239`
- **Expected:** Two sections: `อัปเดตล่าสุด` + `อัปเดตที่ดูแล้ว` with `opacity-60 grayscale`.
- **Design system component:** `stories_arm_chat` (lines 278-305)
- **Priority:** P1
- **Required changes:** Track viewed in `story_views` table (Track B); split render into two sections

### E5. No FAB cluster
- **Problem:** Only inline header button + My Story tile.
- **Current:** `stories/page.tsx:177-186, 190-204`
- **Expected:** Fixed bottom-right FAB cluster: 64px camera + 48px edit.
- **Design system component:** `stories_arm_chat` FAB cluster (lines 308-316)
- **Priority:** P1
- **Required changes:** Add fixed FAB cluster; remove inline header button

### E6. Feed layout is avatar-row list, not bento tile grid
- **Problem:** `grid-cols-1 sm:grid-cols-2` avatar rows.
- **Current:** `stories/page.tsx:213-239`
- **Expected:** 2/3/4-col grid with `aspect-[3/4]` media tiles + status-ring avatar top-left + name/time bottom.
- **Design system component:** `stories_arm_chat` Bento grid (lines 211-276) + `.status-ring` CSS (lines 19-23)
- **Priority:** P1
- **Required changes:** Rewrite to bento; add `.status-ring` CSS to globals; media-tile cards instead of avatar rows

### E7. Caption hardcoded on upload
- **Problem:** `caption: 'อัปเดตเรื่องราวใหม่ 📱'` literal.
- **Current:** `stories/page.tsx:139`
- **Expected:** User-authored caption composer.
- **Design system component:** IG Stories caption composer pattern
- **Priority:** P2
- **Required changes:** Add caption textarea step; render caption inside viewer with text-shadow gradient

### E8. Reactions no ARIA + no toggle-off
- **Problem:** Raw emoji buttons, no labels, immediate POST, no undo.
- **Current:** `stories/page.tsx:270-275, 89-103`
- **Expected:** ARIA labels + toggle + per-user tracking.
- **Design system component:** Telegram reaction toggle
- **Priority:** P3
- **Required changes:** Add aria-labels; toggle state; un-react via decrement

---

## F. Settings + Navbar + Landing + Footer

### F1. Settings layout single-column, design is sidebar + bento 12-col
- **Problem:** Single `max-w-4xl` stacked card.
- **Current:** `src/app/settings/page.tsx:81-278`
- **Expected:** Left `w-64` sidebar + 12-column bento grid (Profile 8 col, Status 4 col, Security+Privacy 6, Notif+DangerZone 6).
- **Design system component:** `arm_chat_8` (lines 124-294)
- **Priority:** P1
- **Required changes:** Restructure to sidebar + bento per design

### F2. No "Change Password" + no Device Management
- **Problem:** Missing both rows.
- **Current:** `settings/page.tsx` (no handler, no UI)
- **Expected:** "เปลี่ยนรหัสผ่าน" row + "จัดการอุปกรณ์ที่เข้าสู่ระบบ" with "2 อุปกรณ์" pill.
- **Design system component:** `arm_chat_8` (lines 217-220 password, 221-227 devices) + `arm_chat_11` (devices deep)
- **Priority:** P1
- **Required changes:** Add Security card rows; deep-link to `/settings/security` and `/settings/devices`; wire Supabase `auth.updateUser({password})` + `auth.admin.listSessions`

### F3. No Profile Visibility select + no Blocked list link
- **Problem:** Two missing privacy surface.
- **Current:** `settings/page.tsx` (none)
- **Expected:** Visibility `<select>` (ทุกคน/เฉพาะเพื่อน/ไม่มีใครเลย) + "รายชื่อที่บล็อก" button.
- **Design system component:** `arm_chat_8` (lines 236-247) + `arm_chat_18` (privacy deep) + `arm_chat_21` (blocked list)
- **Priority:** P1
- **Required changes:** Add privacy card; persist `profile_visibility`; deep-link to `/settings/privacy` + `/friends/blocked`

### F4. No Delete Account Danger Zone confirmation modal
- **Problem:** Only red sign-out button.
- **Current:** `settings/page.tsx:270-276`
- **Expected:** Inverted `bg-ink text-white` Danger Zone card + "ลบบัญชีผู้ใช้ถาวร" button → modal with Escape-to-close.
- **Design system component:** `arm_chat_8` Danger Zone (lines 282-294) + Modal (lines 330-343 + 358-360 Escape handler)
- **Priority:** P0 (data-loss + GDPR/RTTF compliance)
- **Required changes:** Replace lone sign-out with two actions in danger-zone card; modal with Escape; wire to delete user

### F5. Toggles not accessible switches
- **Problem:** Plain `<button>` no `role="switch"`/`aria-checked`.
- **Current:** `settings/page.tsx:153-168, 217-233`
- **Expected:** `<label><input type="checkbox" class="sr-only peer">` pattern.
- **Design system component:** `arm_chat_8` (lines 264-278)
- **Priority:** P1
- **Required changes:** Replace each custom toggle with the label-peer pattern; or add `role="switch"` + `aria-checked` + `aria-label`

### F6. Jargon exposed ("DND", "Push Categories", "Calls & WebRTC")
- **Problem:** Section headers leak implementation jargon.
- **Current:** `settings/page.tsx:145, 205, 211`
- **Expected:** Clean Thai only ("โหมดห้ามรบกวน", "ประเภทการแจ้งเตือน", "แจ้งเตือนการโทร").
- **Design system component:** `arm_chat_8` (lines 255-278)
- **Priority:** P2
- **Required changes:** Strip "(DND)", "(Push Categories)", "(Calls & WebRTC)" parentheticals

### F7. Profile-edit routes to `/onboarding`
- **Problem:** Conflates first-run with profile edit.
- **Current:** `settings/page.tsx:101` (`href="/onboarding"`)
- **Expected:** `/settings/profile` route OR inline edit per `arm_chat_8` (lines 188-196).
- **Design system component:** `arm_chat_8` Profile card
- **Priority:** P1
- **Required changes:** Repoint href; or inline edit per design

### F8. No Status card sibling to Profile
- **Problem:** Missing right-side status card.
- **Current:** `settings/page.tsx` (none)
- **Expected:** `bg-secondary-container md:col-span-4` "สถานะบัญชี" card with pulse-dot "ออนไลน์".
- **Design system component:** `arm_chat_8` (lines 198-208)
- **Priority:** P3
- **Required changes:** Add companion Status card

### F9. Navbar missing mobile nav (no hamburger, no bottom-nav)
- **Problem:** All 6 nav links vanish below `lg` breakpoint.
- **Current:** `src/components/Navbar.tsx:118`
- **Expected:** Fixed bottom-nav for mobile.
- **Design system component:** `stories_arm_chat` bottom-nav (lines 317-339) + `arm_chat_8` settings bottom-nav (lines 311-329)
- **Priority:** P0
- **Required changes:** Add bottom-nav with chat/stories/groups/call/settings; active state pill per design (lines 323-326); hide on `lg+`

### F10. OneSignal logout never called (privacy bug)
- **Problem:** Sign-out leaves push identity bound to device → next shared-device user receives previous user's notifications.
- **Current:** `Navbar.tsx:42-48` login only; no logout anywhere (grep confirmed)
- **Expected:** Call `OneSignal.logout()` on sign-out.
- **Design system component:** n/a
- **Priority:** P0
- **Required changes:** In `handleSignOut` (settings) + Navbar else-branch, push to `window.OneSignalDeferred` calling `OneSignal.logout()`

### F11. Active-route highlight exact match bug
- **Problem:** `pathname === link.href` — nested routes lose highlight.
- **Current:** `Navbar.tsx:120`
- **Expected:** `startsWith` for non-root routes.
- **Design system component:** `arm_chat_8` (active pill lines 323-326)
- **Priority:** P1
- **Required changes:** Replace with `link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)`

### F12. Notification dropdown no ARIA + no focus-trap + no Escape
- **Problem:** Trigger lacks `aria-haspopup`/`aria-expanded`/`aria-controls`; dropdown lacks role/Escape/click-outside.
- **Current:** `Navbar.tsx:142-189`
- **Expected:** WAI-ARIA Disclosure/Menu pattern.
- **Design system component:** `arm_chat_7` (Notification Center)
- **Priority:** P1
- **Required changes:** Add ARIA attrs; `role="menu"`/`role="menuitem"`; Escape keydown; click-outside listener; focus-trap

### F13. Landing no OG / Twitter / JSON-LD / canonical
- **Problem:** No `openGraph`/`twitter`/`alternates.canonical`/JSON-LD in metadata.
- **Current:** `src/app/layout.tsx:5-19`
- **Expected:** Full OG tags + Twitter card + canonical + `WebApplication` JSON-LD.
- **Design system component:** n/a
- **Priority:** P1
- **Required changes:** Expand `metadata` with `metadataBase`, OG, Twitter, canonical IDs; add SoftwareApplication/WebApplication JSON-LD `<script>`

### F14. Landing hero CTA routes straight into `/chats` (auth gate skip)
- **Problem:** Hero CTA bypasses login gate.
- **Current:** `src/app/page.tsx:28, 35`
- **Expected:** `/login` (or `/onboarding`).
- **Design system component:** `arm_chat_landing_page` (hero default CTA → registration)
- **Priority:** P1
- **Required changes:** Change `href="/chats"` → `href="/login"`; gate `/call/demo-room` link behind `session?.user`

### F15. Landing exposes hex code in user-visible copy
- **Problem:** "ออกแบบด้วยโทนสีครีมอุ่น `#fff8f0` เพื่อถนอมสายตา" — backticks render bottom to non-tech users.
- **Current:** `src/app/page.tsx:53`
- **Expected:** Prose only: "ออกแบบด้วยโทนสีครีมอุ่น เพื่อถนอมสายตา"
- **Design system component:** `arm_chat_landing_page` (line 114 — hex in CSS comment only)
- **Priority:** P2
- **Required changes:** Remove the backtick `\`#fff8f0\` inline code span

### F16. Footer Policy links are inert spans
- **Problem:** Privacy/Terms/E2EE are `<span>` no `href`.
- **Current:** `src/components/Footer.tsx:45-48`
- **Expected:** Real `/privacy` and `/terms` route pages + real `<Link>`.
- **Design system component:** `arm_chat_8` footer (lines 305-309) + `arm_chat_landing_page` (lines 258-262)
- **Priority:** P1
- **Required changes:** Create `/privacy` and `/terms` routes; convert spans to `<Link>`; drop dead "สถาปัตยกรรมระบบ" column or convert to real anchors

### F17. Footer hardcoded vercel.app host leaks staging impression
- **Problem:** `arm-chat.vercel.app` shown in footer caption.
- **Current:** `Footer.tsx:58`
- **Expected:** Custom domain or omit.
- **Design system component:** `arm_chat_landing_page` (line 256 brand text only)
- **Priority:** P3
- **Required changes:** Replace with custom domain or omit

---

## Summary Counts

| Surface area | P0 | P1 | P2 | P3 | Total |
|---|---|---|---|---|---|
| Auth (A1-A11) | 4 | 5 | 2 | 0 | 11 |
| Chat list/room (B1-B22) | 2 | 6 | 11 | 0 | 22 |
| Call (C1-C7) | 2 | 4 | 1 | 0 | 7 |
| Friends+QR (D1-D13) | 3 | 3 | 6 | 1 | 13 |
| Stories (E1-E8) | 1 | 5 | 1 | 1 | 8 |
| Settings+Navbar+Landing+Footer (F1-F17) | 3 | 8 | 3 | 3 | 17 |
| **Total** | **15** | **31** | **24** | **5** | **78** |

15 Critical / 31 High / 24 Medium / 5 Low = 78 issues total

## Migration Order (Phase 2+ execution)

Group by feature for atomic commits:

1. Skeletal chrome: `(auth)/layout.tsx` strips Navbar/Footer → fixes A6 for all auth pages
2. Design system foundation: tokens update + AppLogo (circular) + Button + Input + Avatar + Icon
3. Auth rewrite (per Phase 9): unified Phone+Google / no email-password / internal 6-digit OTP / "Welcome to Arm Chat" card → fixes A1-A5, A7
4. Onboarding 3-step + auto-UID + invite link + QR card → A8-A11
5. Navbar: bottom-nav + OneSignal logout + ARIA + startsWith → F9-F12
6. Stories: bento + FAB + viewer + viewed-section → E1-E6
7. Settings: sidebar + bento + missing sections + Danger Zone + toggle roles → F1-F8
8. Chat Room: reply quote + long-press menu + read receipts + date separators + infinite scroll + empty state + image viewer + composer + voice waveform → B7-B14, B15-B17, B20-B22
9. Inbox: realtime + unread + presence + FAB + pin/archive + timestamp tiers → B1-B6, B18-B19
10. Call: real LiveKit + state machine + voice vs video + screen share + grid → C1-C7
11. QR: install jsqr + decode loop + permission UX + deep link + scanner affordances → D8-D13
12. Friends: realtime + debounce + block mgmt + atomic accept + Start-Chat mutex → D1-D7
13. Landing: OG tags + CTA routing + JSON-LD + hex removal → F13-F15
14. Footer: real Policy/Terms links + dead column removal → F16-F17
15. Emoji removal: replace all emoji with Material Symbols across src/

Each group → gates (tsc + lint + build) + commit.

---

End of audit report. Full per-page detail preserved in `docs/audit/UX-UI-Product-Audit.md`.