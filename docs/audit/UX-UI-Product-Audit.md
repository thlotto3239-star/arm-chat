# Arm Chat — UX/UI Product Audit

> Senior Product Designer + UX Researcher audit (Phase 1 → 2 → 3 per user prompt)
> Date: 2026-08-04 (Sprint 0B post-mortem)
> Reference standards: WhatsApp, Telegram, Discord, Messenger, LINE
> Design Single Source of Truth: `stitch_arm_chat_whatsapp_design_system/`

---

## Executive Summary

| Page | Score | Critical | High | Med | Low | Verdict |
|---|---|---|---|---|---|---|
| `/login` | 38/100 | 2 | 3 | 2 | 0 | C — full migration |
| `/register` | 22/100 | 2 | 1 | 2 | 1 | C — full migration |
| `/onboarding` | 30/100 | 1 | 3 | 2 | 2 | C — full migration |
| `/chats` (inbox) | 41/100 | 2 | 3 | 6 | 2 | C — full migration |
| `/chat/[id]` (room) | 47/100 | 1 | 4 | 11 | 2 | C — full migration |
| `/call/[id]` | 22/100 | 2 | 4 | 1 | 0 | A — rebuild with LiveKit |
| `/friends/add` | 40/100 | 0 | 4 | 3 | 1 | B — fix bugs + add features |
| `/qr` | 28/100 | 2 | 0 | 3 | 0 | A — install decoder, honor deep link |
| `/stories` | 31/100 | 1 | 5 | 1 | 2 | A — full viewer + bento + FAB |
| `/settings` | 36/100 | 1 | 6 | 2 | 1 | A — bento + missing sections |
| `Navbar` | 42/100 | 2 | 2 | 1 | 2 | A — mobile nav + OneSignal logout |
| Landing `/` | 55/100 | 0 | 2 | 2 | 2 | B — OG tags + CTA routing |
| `Footer` | 46/100 | 0 | 1 | 1 | 3 | B — real Policy/Terms links |
| **Avg** | **36.7/100** | **14** | **38** | **36** | **16** | Most pages: **C (full migration)** |

---

## Phase 1+2+3: Per-Page Audit Detailed

The detailed per-page audits are in `docs/audit/pages/` (separate files for readability):

- `01-login.md`
- `02-register.md`
- `03-onboarding.md`
- `04-chats-inbox.md`
- `05-chat-room.md`
- `06-call.md`
- `07-friends-add.md`
- `08-qr.md`
- `09-stories.md`
- `10-settings.md`
- `11-navbar.md`
- `12-landing.md`
- `13-footer.md`

---

## Top Systemic Findings (cross-page)

### S1. Security Theater
- Login phone OTP: `Math.random` displayed on same device (`login:82-83`)
- Google OAuth failures silently route to `/onboarding` (`login:68-72`)
- Register never calls `signUp` (`register:15-22` — pure `setTimeout`)
- Onboarding never checks username uniqueness, shows hardcoded "available" (`onboarding:201`)

### S2. No Mobile Navigation
- Navbar hides all 6 nav links below `lg` breakpoint (`Navbar:118`)
- No hamburger, no bottom-nav drawer
- Mobile users can only tap brand logo

### S3. OneSignal Logout Missing (Privacy Bug)
- `OneSignal.login()` called on sign-in (`Navbar:42-48`)
- Never calls `OneSignal.logout()` on sign-out (verified: grep across `src` returns 0)
- Effect: push notifications delivered to next user of shared device with previous user's identity

### S4. Hardcoded Presence/Unread Everywhere
- `chats/page.tsx:143` `unread: 0` always
- `chats/page.tsx:144` `online: true` always
- `chat/[id]/page.tsx:120` `isOnline: true` always
- `chat/[id]/page.tsx:501` `done_all` (read receipt) always rendered for own messages
- No realtime updates in inbox (`chats/page.tsx` 43-185 — only one-shot fetch)

### S5. Call Page is Fake
- LiveKit dependencies installed (`package.json:12-13,17`) but never imported in call page
- Uses raw `getUserMedia` — local selfie preview only (`call/[id]:31-34`)
- No remote participant, no call-state machine, no ringing/incoming/rejected/busy
- "LiveKit/WebRTC encrypted" label is misleading (`call/[id]:124`)
- `call_logs` inserts 2 rows per call, never links them (`call/[id]:48-53,94-99`)
- Screen-share button does nothing (`call/[id]:198-206`)

### S6. QR Scanner is a Placebo
- Only `qrcode.react` (renders QR) installed — no decoder (`jsqr`/`zxing`/`html5-qrcode`)
- Scan tab opens camera but decodes nothing (`qr:43-68`)
- Deep link `/friends/add?user=...` encoded in QR but never honored on receiving page
- Permission-denied just `console.warn` (`qr:52-54`) — silent failure

### S7. Stories Feed Not Real
- No realtime (`stories:27-29` one-shot fetch)
- Image-only (no text status) (`stories:173`)
- Viewer static modal — no progress/autoplay/tap/swipe/keyboard (`stories:245-284`)
- Caption hardcoded (`stories:139`)
- No "Viewed" grayed section
- Layout is avatar-rows, not bento tiles per design

### S8. Settings Missing Production Sections
- No Change Password
- No Device Management / Sessions
- No Profile Visibility selector
- No Block List (despite friends page allowing one-way block — then no unblock surface)
- No Delete Account Danger Zone + confirmation modal
- Inverted layout (single column vs design's sidebar + 12-col bento)
- Toggles are plain buttons — no `role="switch"` / `aria-checked` (WCAG violation)
- Jargon exposed: "(DND)", "(Push Categories)", "(Calls & WebRTC)"

### S9. Onboarding is Single-Step (Not 3-Step)
- Design specifies: Step 1 Profile → Step 2 Auto-UID + Invite Link → Step 3 QR Card
- Implementation has only Step 1
- Missing auto-generated `ARM-XXXX-TH` user ID
- Missing invite link with share button
- Missing QR add-friend card
- Missing progress indicator
- Navbar/Footer NOT suppressed (violates explicit design rule `arm_chat_2:136`)

### S10. Chat Room Missing Production Features
- Reply quote shows static "ตอบกลับข้อความก่อนหน้า" not real message (`chat/[id]:438`)
- Message menu hover-only — unreachable on mobile (`chat/[id]:486`)
- No forward, copy, pin/star — only reply/edit/delete
- No date separators between days
- No infinite scroll (loads all messages, no limit)
- Voice recorder shows seconds counter only — no waveform
- Typing indicator text-only, no 3-dot animation
- No empty state ("Say hi") in fresh chat
- No full-screen image viewer
- No file MIME/size validation
- No poll entry (design `arm_chat_26` unused)
- Reactions only 2 emoji (❤️👍), no toggle off

### S11. Inbox `chats/page.tsx` Auto-Seeds Fake Content
- Auto-creates "กลุ่มนักพัฒนา Arm Chat (Official)" for new users (`chats:64-91`)
- Auto-inserts welcome message from user to themselves
- Fabricates fake call log with `"สายโทรผ่าน WebRTC"` 3rd-party image (`chats:168-178`)

### S12. Technical Jargon in User-Visible UI (Confirmed)
- Login: "Standard User Role" (`login:126, 193`)
- Onboarding: "Supabase Storage" (`onboarding:173`)
- Settings: "(DND)", "(Push Categories)", "(Calls & WebRTC)" (`settings:145, 205, 211`)
- Chats: "Supabase Cloud", "ฐานข้อมูล Supabase", "WebRTC", "พูดคุยกันหลายคนบน Supabase" (`chats:85, 172, 233, 308, 406`)
- Flow page: "LiveKit", "Supabase", "PostgreSQL" (entire page is "public" route)
- Test-suite page: claims "Production Test 100% passed" but 21 of 24 tests are `setTimeout(800)` + force-success

### S13. Landing Page SEO + CTA Routing
- No OG tags, no Twitter Card, no JSON-LD (verified via grep — 0 matches)
- Hero CTA routes to `/chats` (skipping auth gate)
- Secondary CTA `/call/demo-room` exposed to anonymous users
- Exposes hex color code `#fff8f0` in user-visible copy (`page.tsx:53`)
- Uses raw `<img>` instead of `next/image` (`page.tsx:75`)

### S14. Footer Policy Links are Inert Spans
- `End-to-End Encryption`, `นโยบายความเป็นส่วนตัว`, `เงื่อนไขการให้บริการ` — all `<span>` (`Footer:45-48`)
- `/privacy` and `/terms` routes don't exist (verified via directory listing)
- Visual promise of pages that don't exist

### S15. Navbar Active Route Exact Match Bug
- `pathname === link.href` (`Navbar:120`)
- `/chats/123` doesn't highlight `/chats` parent link
- Should use `startsWith` for non-root routes

---

## Design-Source Matrix (Quick Reference for Sprint 2 Page Migration)

| Page | Stitch design folder | Use case |
|---|---|---|
| Login | `arm_chat_1` | 2-CTA Google→Phone, +66 prefix, 4-digit OTP, success anim |
| Forgot password | `arm_chat_39` (lines 228-243 recovery pattern) | New `/forgot-password` route |
| Register | `arm_chat_1` (no separate register design — first-login = register) | Decide: delete or pivot |
| Onboarding | `arm_chat_2` | 3-step journey, auto-UID, invite link, QR card |
| Inbox | `arm_chat_3` | Bento layout, sidebar, FAB, grouped/online/pinned |
| Chat room | `arm_chat_4` (composer/header), `arm_chat_22` (message menu), `arm_chat_27` (contact info) | Reply quote, toolbar, info pages |
| Group chat | `arm_chat_5` / `arm_chat_6` (manage) | Group admin, members, settings |
| Poll | `arm_chat_26` | Poll composer in chat |
| Voice call | `arm_chat_23` | Pulse avatar, dial pad, speaker toggle |
| Video call | `1_1_arm_chat` | Full-bleed remote, PiP self, control rows |
| Large meeting | `arm_chat_large_meeting` | Focus + gallery |
| Gallery view | `gallery_view_arm_chat` | 3-col grid, +N overflow |
| Friends list | `arm_chat_9` | Pending mini-card, search bar, contact grid |
| Blocked list | `arm_chat_21` | Per-row Unblock |
| Device mgmt | `arm_chat_11`, `arm_chat_31` | Sessions, scan-to-link device |
| Privacy | `arm_chat_18` | Visibility select |
| Notification center | `arm_chat_7` | Dropdown / popup |
| Adv. notifications | `arm_chat_38` | Categorized mute |
| Stories | `stories_arm_chat` | Bento feed, FAB cluster, viewed section |
| Settings | `arm_chat_8` | Sidebar + 12-col bento, 4 cards |
| Block list | `arm_chat_21` | Settings → Privacy deep page |
| Call history | `arm_chat_17` | Per-call row, missed section |
| Chat backup | `arm_chat_16` | Storage deep page |
| Chat wallpaper | `arm_chat_28` | Theme picker |
| Screen lock | `arm_chat_29` | PIN + auto-lock config |
| Delete account | `arm_chat_36` | Danger Zone modal |
| Landing | `arm_chat_landing_page` | Hero, features, security bento |
| User flow diagram | `arm_chat_flow` | Static doc — leave |

---

## Phase 2 Decision Summary (Per Page Category)

### Category A — Keep (UX/UI correct)
**0 pages** qualified for full A. The app needs migration on every primary surface.

### Category B — UX correct, visual/fix only
- **Friends Add** (B — bug fixes + realtime + debounce + block mgmt)
- **Landing** (B — OG tags + CTA routing + hex removal)
- **Footer** (B — wire real Policy/Terms links + create legal pages)

### Category C — Full migration to stitch design
- **Login, Register, Onboarding** (3 pages auth)
- **Inbox, Chat Room** (2 pages chat)
- **Stories, Settings** (full migration to bento + missing sections)

### Category A — Rebuild with real backend integration
- **Call page** (rebuild with real LiveKit — currently fake)
- **QR page** (install decoder library + honor deep link)
- **Navbar** (add mobile bottom-nav + OneSignal logout + ARIA dropdown)

---

## Required DB Schema Changes to Support Audit Fixes

From `docs/db-assumptions.md` (Track B):
- `friendships` table (for blocks + outgoing pending)
- `call_logs` table with `receiver_id` + `status: ringing|connecting|in-progress|completed|declined|missed|busy` + `started_at` + `ended_at` + `duration_seconds`
- `notifications_history` table with `is_read` per-row
- `room_members` table with `muted_until` + `is_pinned` + `is_archived`
- `messages` columns: `reply_to_id`, `reactions`, `is_edited`, `deleted_at`, `status: 'sent'|'delivered'|'read'`
- `rooms` columns: `avatar_url`, `description`, `banner`, `last_read_at` (per user) or separate `room_members.last_read_at`
- `stories` columns: `views_count`, `reactions`, `viewed_by` table, `media_type: 'text'|'image'|'video'`
- `profiles`: `user_code` (the `ARM-XXXX-TH`), `profile_visibility`, `add_token` (refreshable QR token), `last_seen_at` for presence
- `push_devices` table for OneSignal device registration + per-device mute
- `call_offers` (or realtime broadcast channel) for incoming-call push to callee
- `story_views` table for per-user "viewed" tracking
- `messages_pinned` table or `messages.is_pinned` for starred messages
- Triggers: `handle_new_user` (auto-create profile + assign user_code)
- RLS policies on all existing tables + new tables
- Storage bucket: `stories` (missing per schema)
- Storage policies: `storage.objects` RLS for avatars/chat-media/stories

---

## Recommended Sprint 2 Page Migration Order (by severity + dependency)

1. **Auth chrome fix** — create `(auth)/layout.tsx` to drop Navbar/Footer, apply to login/register/onboarding → fixes 3 pages' chrome violation in one movement
2. **Onboarding** — 3-step journey, auto-UID, invite link, QR card (C)
3. **Login** — 2-CTA Google→Phone, real OTP, forgot password link, error surfacing (C)
4. **Register decision** — delete or real signUp
5. **Stories** — bento grid, FAB cluster, viewer with progress/keyboard/swipe, viewed section, text status (A/C)
6. **Settings** — sidebar + bento layout, Change Password, Device mgmt, Block list, Danger Zone (A/C)
7. **Navbar** — mobile bottom-nav, OneSignal logout, ARIA dropdown, active route startsWith (A)
8. **Chat Room** — reply real quote, mobile long-press menu, read receipts, date separators, infinite scroll, voice waveform, full-screen media, file validation, empty state, contact-info page (C)
9. **Inbox** — realtime, real unread/presence, FAB, pin/archive, group preview, relative timestamps (C)
10. **Call** — LiveKit integration, call-state machine, voice vs video, screen share, camera flip, speaker, multi-participant grid (A — rebuild)
11. **QR** — install jsqr, decode loop, permission-denied UX, honor deep link in friends/add, refreshable add_token (A — rebuild)
12. **Friends Add** — realtime pending, debounce, block mgmt tab, outgoing pending state, fix isFriend bug, atomic accept RPC (B)
13. **Landing** — OG tags, JSON-LD, hero CTA → /login, hex removal, bento security card (B)
14. **Footer** — real Policy/Terms links + create legal pages (B)

---

## Production-Ready Definition of Done (per page, after migration)

A page is Production Ready when:

### UX
- ✅ Flow matches one of the reference apps (WhatsApp/Telegram/Messenger/LINE)
- ✅ User understands on first interaction (no "what now?" moments)
- ✅ No interaction violates chat-product pattern

### UI
- ✅ Uses components from `src/shared/design-system/`
- ✅ Responsive at mobile (375px), tablet (768px), desktop (1280px)
- ✅ Accessible (ARIA + keyboard + WCAG AA contrast + reduced-motion)
- ✅ No technical jargon in user-visible JSX literals (Supabase/LiveKit/WebRTC/etc)

### Code
- ✅ Page is thin re-export (`export { X } from "@/modules/..."`)
- ✅ No direct SDK import
- ✅ Uses Service interface via Context
- ✅ Realtime channel cleanup on unmount
- ✅ Loading + empty + error states present
- ✅ Passes Vitest service-layer tests + Playwright smoke

### Acceptance
- Build pass + Lighthouse ≥ 95 + a11y score ≥ 95 + manual review confirms visual parity with the matching stitch folder

---

## Next Steps

1. Save this audit as `docs/audit/UX-UI-Product-Audit.md` (this file)
2. Per-page detailed audits → `docs/audit/pages/*.md` (linked above)
3. Sprint 1 Design System must include: MessageBubble, ChatInput, VoiceRecorder, CallControls (based on audit findings)
4. Track B schema migrations must add: `friendships`, `call_logs`, `notifications_history`, `room_members`, `push_devices`, `story_views`, `call_offers`, plus columns listed above
5. Sprint 2 page migration in order (above)
6. Each migration uses Feature Flag with expiry per ADR 0005

---

Audit complete. Source of evidence: line-number-cited code inspection. NOT VERIFIED flags used for runtime/browser-only claims.