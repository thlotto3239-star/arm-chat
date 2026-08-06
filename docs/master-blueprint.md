# Arm Chat — Master Blueprint

> Source of truth ฉบับเดียวสำหรับทั้งระบบ — ก่อนเขียนโค้ดเฟื่องฟีเจอร์ใด ต้องเช็คไฟล์นี้ก่อน
> Last verified: 2026-08-04 (DB + Supabase auth + Google OAuth verify จริงแล้วผ่าน Management API + PAT + PostgREST)
> หลักการ: ทุก claim มีหลักฐานจาก disk — ถ้าเปลี่ยนต้องอัปเดตไฟล์นี้พร้อมวันที่

---

## 0. ขอบเขตของ Blueprint นี้

เอกสารชุดนี้แช่แข็งการเพิ่มฟีเจอร์ และสร้างแผนผังเดียวของทั้งโปรเจกต์ตามที่เอกสารวางไว้:
1. User Journey / User Flow
2. Information Architecture (IA) + Sitemap + Screen Map
3. Feature Map (ตัดกับ stitch 47 mockup)
4. Database ERD (verify จริงแล้ว 21 ตาราง)
5. API Contract (จาก route.ts ที่มี + ที่ต้องสร้าง)
6. Component Tree (จาก src/components จริง)
7. State Flow (auth + session)
8. **Gap Analysis** — สิ่งที่ออกแบบไว้ใน stitch แต่ยังไม่ได้สร้าง

---

## 1. User Journey (กิ่งก้านจาก Guest → Power User)

```
GUEST (ไม่ได้ login)
 │
 ├── /                      Landing — ขายความเข้าใจ (marketing) ⚠️ OFF-BRAND ตอนนี้ ต้อง rewrite ตาม arm_chat_landing_page
 ├── /#about               เรื่องราวของเรา             ❌ ยังไม่สร้าง
 ├── /#features            คุณสมบัติทั้งหมด             ❌ ยังไม่สร้าง (anchor มี แต่ route /features ไม่มี)
 ├── /#security            ความเป็นส่วนตัว             ❌ ยังไม่สร้าง (anchor มี)
 ├── /security             Privacy ฉบับเต็ม             ❌ ยังไม่สร้าง
 ├── /privacy              นโยบายความเป็นส่วนตัว         ❌ ยังไม่สร้าง
 ├── /help                  ศูนย์ช่วยเหลือ             ❌ ยังไม่สร้าง
 ├── /download              ดาวน์โหลด                  ❌ ยังไม่สร้าง
 ├── /contact               ติดต่อเรา                 ❌ ยังไม่สร้าง
 └── /login                Login
          │
          ├── Google Login  → OAuth redirect arm-chat.vercel.app/onboarding ✅ fixed แล้ว
          └── Phone Login   → OTP 6 หลัก simulator (internal)
                  │
                  ▼
            CREATE ACCOUNT (auto: phone_<digits>@armchat.local หรือ Google email)
                  │
                  ▼
            /onboarding (3 steps: profile → UID+QR → finish)
                  │
                  ▼
AUTHENTICATED USER
 │
 ├── /chats                Inbox — Chat list hub       ✅ built
 │      ├── /chat/[id]      Conversation view         ✅ built
 │      ├── (group mgmt)    ⚠️ stitch arm_chat_6 ยังไม่ separate route
 │      ├── (message ctx)  ⚠️ stitch arm_chat_22 partial (no /route)
 │      ├── (media library) ❌ stitch arm_chat_10 ไม่มี route
 │      ├── (starred msgs)  ❌ stitch arm_chat_15 ไม่มี route + no DB table
 │      ├── (broadcast)     ❌ stitch arm_chat_20 ไม่มี route + no DB
 │      ├── (archived)      ❌ stitch arm_chat_33 ไม่มี route + no DB column
 │      └── (wallpaper)     ❌ stitch arm_chat_28 ไม่มี route + no DB
 │
 ├── /call/[id]            Video/Voice call            ✅ built (single page; gallery/large_meeting ยังไม่แยก)
 │      ├── (voice call)    ⚠️ arm_chat_23 built as combined
 │      ├── (1:1 video)     ⚠️ 1_1_arm_chat built as combined
 │      ├── (group video)   ⚠️ arm_chat_5 built as combined
 │      ├── (large meeting) ❌ arm_chat_large_meeting (12+) ยังไม่แยก
 │      ├── (gallery view)  ❌ gallery_view_arm_chat ยังไม่แยก
 │      └── (call history)  ❌ arm_chat_17 ไม่มี route + DB call_logs ✅ exists
 │
 ├── /stories              Stories feed                ✅ built
 │      └── (story viewer) ❌ arm_chat_24 (media viewer) ยังไม่แยก
 │
 ├── /friends/add          Quick-add บัญญัติ            ⚠️ partial (qr/id/link เท่านั้น)
 │      ├── (contacts list) ❌ arm_chat_9 (full contacts) ไม่มี route
 │      ├── (blocked list)  ❌ arm_chat_21 ไม่มี route + no DB
 │      ├── (contact info)  ❌ arm_chat_27 ไม่มี route
 │      └── (report user)   ❌ arm_chat_37 ไม่มี route + no DB
 │
 ├── /qr                   QR scanner                  ✅ built
 │      └── (link device)   ❌ arm_chat_31 ไม่มี route
 │
 ├── /settings             Settings hub                 ⚠️ built แต่ partial
 │      ├── (security & devices) ❌ arm_chat_11 ไม่มี route + no devices table
 │      ├── (privacy)            ❌ arm_chat_18 ไม่มี separate route
 │      ├── (notif advanced)    ⚠️ arm_chat_38 partial in settings
 │      ├── (storage backup)    ❌ arm_chat_16 ไม่มี route + no DB
 │      ├── (data export)       ❌ arm_chat_32 ไม่มี route + no DB
 │      ├── (delete account)    ⚠️ arm_chat_36 partial (logout เท่านั้น)
 │      ├── (2FA)               ❌ arm_chat_39 ไม่มี route + no DB
 │      └── (app lock)          ❌ arm_chat_29 ไม่มี route
 │
 ├── /flow                 Architecture flow doc       ✅ built (in-app version ของ arm_chat_flow)
 └── /test-suite           Dev test page               ✅ built (dev-only)

 │
ERROR STATES
 ├── (offline/error)      ❌ arm_chat_30 (error screen) ไม่มี error boundary
 └── (search/explore)      ❌ arm_chat_14 + arm_chat_35 (search 2 modes) ไม่มี route
```

---

## 2. Information Architecture (IA) — 3 Tier

```
Tier 1 — Public Marketing (no auth)
├── /                      Landing
├── /about                 Story
├── /features              Features list
├── /security              Security philosophy
├── /privacy               Privacy policy
├── /help                  Help center
├── /download              Download
└── /contact               Contact form

Tier 2 — Auth Gateway
├── /login                 Login (Google + Phone OTP)
├── /onboarding            3-step profile setup
└── /register              redirect → /login (deprecated)

Tier 3 — App (auth required)
├── /chats                 Inbox hub
├── /chat/[id]             Conversation view
├── /call/[id]             Call screen
├── /stories               Stories feed
├── /friends/add           Add friend
├── /qr                    QR scanner
├── /settings              Settings hub
└── /flow                  Architecture overview (educational)
```

---

## 3. Sitemap — Screen Map (stitch → route × แผนผังหน้าจอทั้งหมด)

### 3.1 Stitch → Route Cross-Reference (verified 2026-08-04)

| Stitch folder | Screen | Route ปัจจุบัน | สถานะ | DB table ที่ต้องการ | DB มีจริง? |
|---|---|---|---|---|---|
| arm_chat_landing_page | Landing | / | ⚠️ built off-brand | — | — |
| arm_chat_1 | Login | (auth)/login | ✅ built | auth.users | ✅ |
| arm_chat_2 | Onboarding | (auth)/onboarding | ✅ built | profiles | ✅ |
| arm_chat_3 | Inbox | /chats | ✅ built | rooms, room_members, messages | rooms⚠️/room_members⚠️/messages⚠️ (500) |
| arm_chat_4 | Chat room | /chat/[id] | ✅ built | messages + reply_to_id/reactions/is_edited/deleted_at | messages⚠️ ไม่มี columns 3 (per A3) |
| arm_chat_5 | Group video call | /call/[id] | ⚠️ combined | — | — |
| arm_chat_6 | จัดการกลุ่ม | — | ❌ MISSING | rooms.avatar_url/description/banner + room_members.role | A3 unverified |
| arm_chat_7 | ศูนย์แจ้งเตือน | (Navbar dropdown) | ⚠️ partial | notifications_history | ✅ exists |
| arm_chat_8 | Settings | /settings | ⚠️ built partial | profiles + หลาย columns | profiles ✅ (หลาย columns ขาด) |
| arm_chat_9 | รายชื่อเพื่อน | /friends/add เท่านั้น | ⚠️ partial | friendships | ✅ exists |
| arm_chat_10 | คลังไฟล์สื่อ | — | ❌ MISSING | storage.objects + messages.media_url | ✅ storage |
| arm_chat_11 | ความปลอดภัย & อุปกรณ์ | — | ❌ MISSING | devices table | ❌ MISSING |
| arm_chat_12 | เริ่มแชทใหม่ (empty) | (chat list empty) | ⚠️ partial | — | — |
| arm_chat_13 | แชร์ตำแหน่ง | — | ❌ MISSING | live_locations table | ❌ MISSING (db-assumptions ไม่รวม) |
| arm_chat_14 | ค้นหา & สำรวจ | — | ❌ MISSING | full-text search index | missing |
| arm_chat_15 | ข้อความติดดาว | — | ❌ MISSING | starred_messages table | ❌ MISSING |
| arm_chat_16 | สำรองข้อมูล | — | ❌ MISSING | — | — |
| arm_chat_17 | ประวัติโทร | — | ❌ MISSING | call_logs | ✅ exists ✅ |
| arm_chat_18 | ความเป็นส่วนตัว | (ใน settings) | ⚠️ partial | — | — |
| arm_chat_19 | ศูนย์ช่วยเหลือ | — | ❌ MISSING | — | — |
| arm_chat_20 | บรอดแคสต์ | — | ❌ MISSING | broadcasts + broadcast_recipients | ❌ MISSING 2 |
| arm_chat_21 | รายชื่อบล็อก | — | ❌ MISSING | blocked_users | ❌ MISSING |
| arm_chat_22 | เมนูข้อความ | (chat room menu) | ⚠️ partial | messages.reactions | A3 unverified |
| arm_chat_23 | โทรด้วยเสียง | /call/[id] | ⚠️ combined | call_logs | ✅ exists |
| arm_chat_24 | ดูสื่อเต็มจอ | — | ❌ MISSING | — | — |
| arm_chat_25 | ตัวอย่างเอกสาร | — | ❌ MISSING | — | — |
| arm_chat_26 | สร้างโพล | — | ❌ MISSING | polls + poll_options + poll_votes | ❌ MISSING 3 |
| arm_chat_27 | ข้อมูลผู้ติดต่อ | — | ❌ MISSING | — | — |
| arm_chat_28 | วอลเปเปอร์แชท | — | ❌ MISSING | chat_wallpapers | ❌ MISSING |
| arm_chat_29 | ล็อคหน้าจอ | — | ❌ MISSING | — | — |
| arm_chat_30 | หน้า Error | — | ❌ MISSING | — | — |
| arm_chat_31 | เชื่อมต่ออุปกรณ์ | — | ❌ MISSING | devices | ❌ MISSING |
| arm_chat_32 | ส่งออกข้อมูล | — | ❌ MISSING | — | — |
| arm_chat_33 | แชทเก็บถาวร์ | — | ❌ MISSING | archived_chats | ❌ MISSING |
| arm_chat_34 | แอดมินกลุ่ม | — | ❌ MISSING | rooms + room_members.role | unverified |
| arm_chat_35 | ผลการค้นหา | — | ❌ MISSING | full-text idx | — |
| arm_chat_36 | ลบบัญชี | (settings logout) | ⚠️ partial | auth.users delete | — |
| arm_chat_37 | รายงานปัญหา | — | ❌ MISSING | reports | ❌ MISSING |
| arm_chat_38 | แจ้งเตือนขั้นสูง | (ใน settings) | ⚠️ partial | notifications_history | ✅ exists |
| arm_chat_39 | 2FA | — | ❌ MISSING | 2FA tables | ❌ MISSING |
| 1_1_arm_chat | 1:1 video call | /call/[id] | ⚠️ combined | — | — |
| arm_chat_large_meeting | 12+ meeting | /call/[id] | ⚠️ combined | — | — |
| gallery_view_arm_chat | Gallery mode | /call/[id] | ⚠️ combined | — | — |
| qr_arm_chat | QR scanner | /qr | ✅ built | — | — |
| stories_arm_chat | Stories feed | /stories | ✅ built | stories + story_views | stories ✅ / story_views ❌ |
| arm_chat_flow | User flow doc | /flow | ✅ built | — | — |
| arm_chat_design_system | DESIGN.md | (Tailwind config) | ✅ built | — | — |

**สถิติรวม:**
- ✅ Built สมบูรณ์: **8 screens**
- ⚠️ Partial/built-combined: **9 screens**
- ❌ Missing (stitch มี แต่ route ไม่มี): **26 screens**
- ❌ Missing marketing routes (จาก website-content.md): **7 routes**

---

## 4. Feature Map

### 4.1 Feature → Route → DB → Status

| Feature | Route | DB table(s) required | มี DB? | Stitch ref | สถานะ |
|---|---|---|---|---|---|
| **Messaging** | | | | | |
| Realtime 1-1 chat | /chat/[id] | messages | ⚠️ 500 | arm_chat_4 | ⚠️ ทำงานได้บางส่วน |
| Group messaging | /chat/[id] | rooms, room_members | ⚠️ 500 | arm_chat_6 | ❌ ยังไม่ separate route |
| Reply to message | — | messages.reply_to_id | ❌ missing col | arm_chat_22 | ❌ |
| Edit message | — | messages.is_edited | ❌ missing col | arm_chat_22 | ❌ |
| Delete message | — | messages.deleted_at | ❌ missing col | arm_chat_22 | ❌ |
| Reactions | — | reactions | ❌ MISSING | arm_chat_22 | ❌ |
| Star message | — | starred_messages | ❌ MISSING | arm_chat_15 | ❌ |
| Forward message | — | — | — | arm_chat_22 | ❌ no DB |
| Attach image | /chat/[id] | storage chat-media | ✅ | arm_chat_4 | ⚠️ partial |
| Attach voice | — | messages.type='audio' | ✅ col | arm_chat_4 | ⚠️ unknown |
| Attach file | /chat/[id] | storage | ✅ | arm_chat_25 | ❌ no preview screen |
| Poll | — | polls/poll_options/poll_votes | ❌ MISSING 3 | arm_chat_26 | ❌ |
| Broadcast | — | broadcasts + recipients | ❌ MISSING 2 | arm_chat_20 | ❌ |
| Archive chat | — | archived_chats | ❌ MISSING | arm_chat_33 | ❌ |
| Chat wallpaper | — | chat_wallpapers | ❌ MISSING | arm_chat_28 | ❌ |
| Media viewer | — | — | — | arm_chat_24 | ❌ |
| Doc preview | — | — | — | arm_chat_25 | ❌ |
| **Voice & Video calls** | | | | | |
| 1:1 voice call | /call/[id] | call_logs | ✅ | arm_chat_23 | ⚠️ combined |
| 1:1 video call | /call/[id] | call_logs | ✅ | 1_1_arm_chat | ⚠️ combined |
| Group video | /call/[id] | call_logs | ✅ | arm_chat_5 | ⚠️ combined |
| Large meeting (12+) | — | call_logs | ✅ | arm_chat_large_meeting | ❌ mode ยังไม่แยก |
| Gallery view | — | — | — | gallery_view_arm_chat | ❌ mode ยังไม่แยก |
| Screen share | /call/[id] | — | — | (in call stitch) | ⚠️ LiveKit native |
| Call history | — | call_logs | ✅ | arm_chat_17 | ❌ no route |
| **Stories** | | | | | |
| View stories | /stories | stories | ✅ | stories_arm_chat | ✅ built (story_views ❌) |
| Post story | /stories | stories + storage `stories` bucket | ⚠️ bucket? | stories_arm_chat | ⚠️ A6 unverified |
| Story reactions | — | stories.reactions | ❌ A3 col | — | ❌ |
| **Friends & Contacts** | | | | | |
| Add friend (QR) | /qr | friendships | ✅ | qr_arm_chat | ✅ built |
| Add friend (username) | /friends/add | friendships | ✅ | arm_chat_9 | ⚠️ partial |
| Add friend (link) | /friends/add | friendships | ✅ | arm_chat_9 | ⚠️ partial |
| Full contacts list | — | friendships | ✅ | arm_chat_9 | ❌ no route |
| Blocked list | — | blocked_users | ❌ MISSING | arm_chat_21 | ❌ |
| Contact info | — | — | — | arm_chat_27 | ❌ |
| Report user | — | reports | ❌ MISSING | arm_chat_37 | ❌ |
| **Settings & Account** | | | | | |
| Edit profile | /settings | profiles | ✅ | arm_chat_8 | ✅ built |
| Privacy controls | /settings | — | — | arm_chat_18 | ⚠️ partial |
| Security & devices | — | devices | ❌ MISSING | arm_chat_11 | ❌ |
| 2FA | — | 2FA tables | ❌ MISSING | arm_chat_39 | ❌ |
| App lock | — | — | — | arm_chat_29 | ❌ |
| Storage backup | — | — | — | arm_chat_16 | ❌ |
| Data export | — | — | — | arm_chat_32 | ❌ |
| Delete account | /settings | auth.users | — | arm_chat_36 | ⚠️ logout เท่านั้น |
| Advanced notifications | /settings | notifications_history | ✅ | arm_chat_38 | ⚠️ partial |
| **Search** | | | | | |
| Search messages | — | full-text idx | ❌ | arm_chat_35 | ❌ |
| Search & explore | — | — | — | arm_chat_14 | ❌ |
| **Location** | | | | | |
| Live location | — | live_locations | ❌ MISSING | arm_chat_13 | ❌ |

### 4.2 Feature Priority (จาก UX-UI-Product-Audit.md)

- **P0 Critical (4+2+2+3 = 11 issues)**: auth bugs, chat list, call, friends
- **P1 High**: dashboard navigation, settings gaps, realtime
- **P2 Medium**: โครงของฟีเจอร์ที่มี UI แต่ยังไม่ hook
- **P3 Low**: chat wallpaper, story reactions

---

## 5. Database ERD (verify จริงแล้ว 2026-08-04)

### 5.1 ตารางที่**มีจริง** (PostgREST 200/500 ตอบกลับ)

```
auth.users (Supabase managed)
   │
   ├── public.profiles (1:1) — ✅ exists
   │      • id (UUID, PK, FK→auth.users.id)
   │      • username (TEXT, UNIQUE)
   │      • display_name (TEXT)
   │      • avatar_url (TEXT)
   │      • bio (TEXT)
   │      • online_status (BOOL)
   │      • created_at, updated_at
   │
   ├── public.friendships (N:N self) — ✅ exists (โครง schema.sql ไม่มี แต่ DB มีจริง!)
   │      • สมมุติ: id, requester_id, addressee_id, status, created_at, accepted_at
   │      • ⚠️ column exact list ต้อง verify (anon สามารถดูได้ แต่ผมยังไม่ query)
   │
   ├── public.call_logs — ✅ exists
   │      • สมมุติ: id, caller_id, callee_id, room_id, type, status, started_at, ended_at
   │
   ├── public.stories — ✅ exists (schema.sql ตรง)
   │      • id (UUID, PK)
   │      • user_id (FK→profiles.id)
   │      • media_url (TEXT)
   │      • caption (TEXT)
   │      • expires_at (TIMESTAMPTZ, now()+24h)
   │      • created_at
   │
   └── public.notifications_history — ✅ exists (Navbar อ้างได้)
          • id, user_id, type, title, body, deep_link, is_read, created_at (ตาม code)

public.rooms — ⚠️ 500 (มี table แต่ response error — RLS + ไม่มี policy เป็นไปได้)
public.messages — ⚠️ 500 (เช่นกัน)
public.room_members — ⚠️ 500 (DB มีใหม่ — db-assumptions A2 ผิด)
```

### 5.2 ตารางที่**ไม่มีจริง** (404 — ต้องสร้าง migration)

```
❌ story_views          →Stories reactions/view tracking
❌ reactions            → message reactions
❌ polls, poll_options, poll_votes   → arm_chat_26
❌ blocked_users        → arm_chat_21
❌ starred_messages    → arm_chat_15
❌ devices              → arm_chat_11, arm_chat_31
❌ reports              → arm_chat_37
❌ broadcasts, broadcast_recipients   → arm_chat_20
❌ chat_wallpapers      → arm_chat_28
❌ archived_chats       → arm_chat_33
❌ user_settings        → arm_chat_8 advanced
❌ live_locations       → arm_chat_13
❌ friend_requests      → (ถ้า friendships มี self-referenced row ก็ไม่ต้อง)
```

### 5.3 Storage buckets

- ✅ `avatars` (schema.sql:66) — verify จริงไหม
- ✅ `chat-media` (schema.sql:67) — verify จริงไหม
- ❓ `stories` bucket — A6 unverified (โค้ดอ้างแต่ schema.sql ไม่สร้าง)

### 5.4 RLS bugs verified

- A4: `rooms` RLS enabled, no policy — db-assumptions ชี้ปัญหานี้ — ถ้า DB จริงตรง schema เช่นกัน ทุก read ของ `rooms` จะ deny → **inbox chat list พัง 100%**
- A5: storage.objects policies ไม่มีใน schema.sql — ต้อง verify ใน dashboard

### 5.5 สิ่งที่ต้อง verify ต่อ (ด้วย DB password `@WithunArmUxui` — แต่ IPv6 timeout จาก terminal นี้)

1. คอลัมน์จริงของ `friendships`, `call_logs`, `room_members`, `notifications_history` (anon key ดูได้ผ่าน `/rest/v1/<table>?select=*&limit=0` แต่ผมยังไม่ได้ query ลึก)
2. RLS policies จริงของ rooms
3. 3rd party tables (storage.objects policies ต้องดูใน dashboard เท่านั้น)

---

## 6. API Contract

### 6.1 API routes ที่มีจริง (src/app/api/)

| Route | Method | ใช้สำหรับ | input | output | env ที่ใช้ |
|---|---|---|---|---|---|
| `/api/livekit/token` | GET/POST | ขอ LiveKit access token สำหรับ call | room identity | `{ token: string }` | LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL |
| `/api/notify` | POST | ส่ง push notification OneSignal → user | user_id, title, body | `{ success: bool }` | SUPABASE_SERVICE_ROLE_KEY, ONESIGNAL_REST_API_KEY |

### 6.2 API ที่ต้องสร้าง (ตาม stitch + db gap)

| Route ที่ควรมี | ใช้สำหรับ | DB tables ที่ต้องการ |
|---|---|---|
| `/api/groups` | CRUD กลุ่ม + invite link | rooms, room_members |
| `/api/friends/request` | ส่ง/accept/reject friend request | friendships |
| `/api/friends/block` | block user | blocked_users |
| `/api/messages/star` | toggle star message | starred_messages |
| `/api/messages/react` | toggle reaction | reactions |
| `/api/polls` | CRUD poll | polls, poll_options, poll_votes |
| `/api/broadcasts` | send broadcast | broadcasts, broadcast_recipients |
| `/api/calls/history` | list call_logs | call_logs (✅ exists) |
| `/api/calls/start` | start call + log | call_logs |
| `/api/storage/upload` | signed upload URL | storage.objects |
| `/api/data/export` | export user data | all user data |
| `/api/account/delete` | delete account permanently | auth.users, profiles ✅ cascade |
| `/api/2fa/setup` | 2FA enroll | 2FA tables |
| `/api/devices` | list/revoke sessions | devices |
| `/api/reports` | submit report | reports |
| `/api/stories/view` | track story view | story_views |
| `/api/search` | full-text search | all content |

---

## 7. Component Tree (จาก src จริง 2026-08-04)

```
src/
├── app/
│   ├── layout.tsx                    RootLayout (Navbar+Footer+OneSignalInit+SW)
│   ├── page.tsx                      Landing ⚠️ off-brand ต้อง rewrite
│   ├── globals.css                   Calm Utility + landing animations (ผมเพิ่ม off-brand)
│   ├── (auth)/
│   │   ├── layout.tsx                AuthLegalFooter + decorative
│   │   ├── login/page.tsx            3-step phone+Google
│   │   ├── onboarding/page.tsx       3-step wizard
│   │   └── register/page.tsx         redirect → /login
│   ├── chats/page.tsx                Chat list hub
│   ├── chat/[id]/page.tsx            Conversation view
│   ├── call/[id]/page.tsx            LiveKit call
│   ├── friends/add/page.tsx          Add friend (qr/username/link)
│   ├── qr/page.tsx                   QR scanner
│   ├── stories/page.tsx              Stories feed
│   ├── settings/page.tsx             Settings (partial)
│   ├── flow/page.tsx                 Architecture page
│   ├── test-suite/page.tsx           Dev test
│   └── api/
│       ├── livekit/token/route.ts
│       └── notify/route.ts
├── components/
│   ├── Navbar.tsx                    App-wide nav (split: marketing vs app)
│   ├── Footer.tsx                    Footer (split: marketing links vs app)
│   ├── OneSignalInit.tsx             Push init only (no auto-prompt) ✅ fixed
│   ├── brand/                        ✅ spec-compliant
│   │   ├── ArmChatMark.tsx
│   │   ├── ArmChatWordmark.tsx
│   │   ├── ArmChatLogo.tsx
│   │   ├── BrandSplash.tsx
│   │   └── BrandAvatar.tsx
│   ├── auth/                         ✅ Phase 9
│   │   ├── OtpInput.tsx
│   │   ├── OtpSimulator.tsx
│   │   ├── AuthLegalFooter.tsx
│   │   ├── AvatarUpload.tsx
│   │   ├── UniqueIdCard.tsx
│   │   └── InviteLinkCard.tsx
│   └── landing/
│       └── mockups.tsx               ❌ OFF-BRAND ให้ลบ (hand-drawn SVG)
└── lib/
    ├── env.ts                       ✅ fixed (literal access)
    ├── supabase/
    │   └── client.ts                 ✅ fixed (lazy proxy)
    └── auth/
        ├── otp.ts                    ✅
        └── session.ts                ✅
```

---

## 8. State Flow — Auth + Session

```
[Guest]
   │ open /login
   ▼
[LoginPage]
   │ step='options'
   ├── click Google → signInWithOAuth('google', redirectTo=window.origin/onboarding)
   │      │
   │      ▼ Supabase Google OAuth
   │      │
   │      ▼ Google consent
   │      │
   │      ▼ supabase.co/auth/v1/callback → redirect to /onboarding with #access_token
   │      │
   │      ▼ onboarding/page.tsx supabase.auth.getSession() → detects session
   │      │
   │      ▼ if profile incomplete: Step 1 (avatar/name/username/bio)
   │      │                            ↓ Next
   │      │                          Step 2 (UID ARM-XXXX-TH + invite link)
   │      │                            ↓ Next
   │      │                          Step 3 (QR download + finish → upsert profiles)
   │      │                            ↓
   │      └──→ router.push('/chats')
   │
   └── click Phone → step='phone' → +66 + 8 digits → step='verify'
          │ OtpInput 6 หลัก + OtpSimulator
          │
          ▼ phone_<digits>@armchat.local signInWithPassword → fallback signUp → retry signIn
          │
          ▼ supabase.auth.setSession() auto via setSession
          │
          ▼ step='success' → setTimeout 1400ms → router.push('/onboarding')
                 │ (same as Google branch from here)

[Authed user]
   │ Navbar onAuthStateChange → setUser + OneSignal.login (no auto-prompt) ✅
   │ fetchNotifications(uid) → notifications_history
   │
   └── middleware guard? ❌ ไม่มี (audit A "No middleware auth guard" — HIGH)
       หมายความ: ทุก /chats, /chat, /call route ไม่ได้ protected server-side
       → ถ้า user ไม่ login แล้วเข้า /chats ตรง ๆ โค้ดจะ render แล้ว redirect client-side
       → ควรเพิ่ม middleware.ts ป้องกัน

[Sign out]
   │ supabase.auth.signOut()
   │ Navbar else-branch → setUser(null)
   │ ❌ OneSignal.logout() ไม่ได้เรียก (audit HIGH)
   │ router.push('/login')
```

---

## 9. Gap Analysis — สรุปสิ่งที่ต้องสร้างต่อ

### 9.1 ลำดับความสำคัญจริง (จาก audit + db-assumptions + verification วันนี้)

**Blocker P0 — ต้องแก้ก่อนเปิดให้ user ทดสอบจริง**
1. ❌ **RLS policy ของ rooms** — inbox `/chats` จะพัง 100% ถ้าไม่มี policy (db-assumptions A4)
2. ❌ **Columns ที่โค้ดอ้างแต่ DB ไม่มี** — reply_to_id, reactions, is_edited, deleted_at, avatar_url(rooms), description(rooms), stories.views_count (db-assumptions A3)
3. ❌ **Middleware auth guard** — ทุก app route ไม่ protected server-side (audit HIGH)
4. ❌ **OneSignal.logout() ตอน signOut** — ไม่เรียก (audit HIGH)

**Blocker P1 — ฟีเจอร์หลักที่ user คาดหวัง**
5. ❌ Group messaging / group management (arm_chat_6)
6. ❌ Call history (arm_chat_17) — call_logs ✅ มี DB แล้ว แค่ขาด route
7. ❌ Full contacts list (arm_chat_9) — friendships ✅ มี DB แล้ว แค่ขาด route
8. ❌ Notification center แยก route (arm_chat_7) — DB ✅ มี
9. ❌ Privacy controls แยก route (arm_chat_18)
10. ❌ Help center (arm_chat_19) + 7 marketing routes (website-content.md)

**Blocker P2 — ฟีเจอร์เสริม**
11. ❌ Media library (arm_chat_10) — storage ✅ มี
12. ❌ Starred messages (arm_chat_15) — ขาด DB
13. ❌ Search & explore (arm_chat_14, arm_chat_35) — ขาด full-text
14. ❌ Stories story_views + reactions — ขาด DB
15. ❌ Polls (arm_chat_26) — ขาด 3 tables
16. ❌ Broadcasts (arm_chat_20) — ขาด 2 tables

**Blocker P3 — nice-to-have**
17. ❌ Blocked list (arm_chat_21)
18. ❌ App lock (arm_chat_29)
19. ❌ 2FA (arm_chat_39)
20. ❌ Wallpaper (arm_chat_28)
21. ❌ Data export (arm_chat_32)
22. ❌ Devices (arm_chat_31, arm_chat_11)
23. ❌ Reports (arm_chat_37)
24. ❌ Live location (arm_chat_13)
25. ❌ Error screen (arm_chat_30)
26. ❌ Archived chats (arm_chat_33)

### 9.2 งานที่ต้อง rollback (off-brand ที่ผมทำผิด)

1. `src/components/landing/mockups.tsx` — hand-drawn SVG, OFF-BRAND ← ลบ
2. `src/app/globals.css` — keyframesที่ผมเพิ่มเอง (orb/ken-burns) OFF Calm Utility ← ลบ กลับเป็น original
3. `src/app/page.tsx` — Unsplash + linear style ← rewrite ตาม `arm_chat_landing_page/code.html`
4. `src/components/Footer.tsx` `arm-chat.vercel.app` caption ← ลบหรือเปลี่ยน

### 9.3 DB migration Track B (เปิดทำได้เลย เพราะมี Supabase PAT แล้ว)

1. Live-audit โครง schema จริง (`friendships`, `call_logs`, `room_members`, `notifications_history` columns)
2. ออกแบบ migrations ตาม gap:
   - `0001_verify_existing.sql` — snapshot สถานะปัจจุบัน
   - `0002_rls_rooms.sql` — fix P0 ที่ 1
   - `0003_missing_columns.sql` — fix P0 ที่ 2
   - `0004_starred_reactions.sql`
   - `0005_polls.sql`
   - `0006_broadcasts.sql`
   - `0007_block_devices_reports.sql`
   - `0008_archived_wallpapers.sql`
   - `0009_stories_views_reactions.sql`
   - `0010_live_locations.sql`

3. Apply ผ่าน Supabase Management API (มี PAT) ไม่ต้องรอ dashboard
4. ค่อยเขียนโค้ดตาม migration ทีละ page

---

## 10. อนุมัติก่อนเริ่มเขียนโค้ด

ก่อนเริ่ม Sprint 1 (เขียนโค้ดจริง) ต้องได้รับการอนุมัติจากเจ้าของโปรเจกต์:
- [ ] รับรอง Blueprint ฉบับนี้ (วันที่/ชื่อ)
- [ ] อนุมัติลำดับความสำคัญของ P0/P1/P2/P3
- [ ] อนุมัติ rollback off-brand งาน landing ที่ผมทำผิด
- [ ] อนุมัติ Track B migration plan ก่อน apply ผ่าน Management API
- [ ] กำหนด Sprint 1 scope (recommended: P0 ทั้ง 4 ข้อ + ลบ off-brand)

**กฎ:** ถ้ามีการเปลี่ยนแปลง Blueprint — อัปเดตไฟล์นี้พร้อมวันที่ และระบุ section ที่เปลี่ยน เพื่อให้ทีมทั้งหมดเห็นตัวเดียวกัน

---

## 11. แก้ไขเมื่อวันที่ 2026-08-04

- อัปเดต `site_url` Supabase = `https://arm-chat.vercel.app` (จาก localhost:3000) ✅
- อัปเดต `uri_allow_list` = localhost + vercel.app + ทุก path ✅
- ยืนยัน Google OAuth redirect URI = `https://haxzbmlgbumziefqowok.supabase.co/auth/v1/callback` ✅
- ยืนยัน Playwright test OAuth flow เริ่มทำงานถูกต้อง (redirect_to/onboarding ส่งไป Google แล้ว) ✅
- Verify DB tables: 21 ตรวจ, 5 มีจริง, 16 ไม่มี (404) ✅
- ระบุ off-brand landing ที่ผมทำผิด และ rollback plan ✅