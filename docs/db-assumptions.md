# Database Assumption Register

> ทุก assumption ระบุ status `NOT VERIFIED` จนกว่าจะตรวจสอบกับ DB จริง
> Source of truth สำหรับ Track B จนกว่าจะมี DB access

## Context

ไม่มีสิทธิ์เข้าถึง Supabase project จริง ณ ตอนนี้ — ออกแบบ migration จาก `supabase/schema.sql` ใน repository เท่านั้น (67 บรรทัด, 4 tables: `profiles`, `rooms`, `messages`, `stories`)

Full Audit พบว่าโค้ดอ้าง tables และ columns ที่ไม่มีใน `schema.sql` — แสดงว่าอย่างน้อย schema ใน repo ล้าหลังโค้ด หรือ DB จริงมีการเปลี่ยนแปลงที่ไม่ได้ capture ใน repo

## Assumptions

### A1: Schema ใน repo ตรงกับ DB จริง
- **Claim:** schema ใน `supabase/schema.sql` เป็น snapshot ของ DB จริง ณ วันที่ commit
- **Evidence:** ไฟล์เดียวใน repo, 67 บรรทัด, 4 tables เท่านั้น
- **Status:** NOT VERIFIED — ต้อง verify เมื่อได้ DB access
- **Impact ถ้าผิด:** migration อาจ fail หรือซ้ำซ้อนกับที่มีใน DB จริง
- **Mitigation:** migration ใช้ `IF NOT EXISTS` ทุก statement ที่เป็นไปได้

### A2: ไม่มี tables `room_members`, `friendships`, `call_logs`, `notifications_history` ใน DB จริง
- **Claim:** 4 tables นี้ไม่อยู่ใน schema.sql → ไม่มีใน DB จริง
- **Evidence:** โค้ดอ้าง (e.g. `chats/page.tsx:58-60` อ้าง `room_members`, `notify/route.ts:22` อ้าง `room_members`, `call/[id]/page.tsx:48` อ้าง `call_logs`) แต่ไม่มี `CREATE TABLE` ใน schema.sql
- **Status:** NOT VERIFIED — อาจมีใน DB จริงแต่ไม่ถูก snapshot, หรือไม่มีจริง ๆ
- **Impact ถ้าผิด:** migration `0002_add_missing_tables.sql` จะ fail ถ้ามีอยู่แล้ว → ใช้ `CREATE TABLE IF NOT EXISTS`
- **Audit source:** Full Audit พบใน 4 ไฟล์ page + 1 route

### A3: ไม่มี columns ที่โค้ดอ้าง
- **Claim:** โค้ดอ้าง columns ที่ไม่มีใน schema:
  - `messages.reply_to_id`, `messages.reactions`, `messages.is_edited`, `messages.deleted_at`
  - `rooms.avatar_url`, `rooms.description`, `rooms.banner`
  - `stories.views_count`, `stories.reactions`
- **Evidence:** `chat/[id]/page.tsx:140-143, 251, 383, 391`, `chats/page.tsx:70, 197`, `stories/page.tsx:50, 51, 84, 85`
- **Status:** NOT VERIFIED — อาจมีใน DB จริงผ่าน manual SQL ที่ไม่ capture ใน repo
- **Impact ถ้าผิด:** migration `0003_add_missing_columns.sql` จะ fail → ใช้ `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- **Audit source:** Full Audit พบ → runtime PostgREST error จริงหากไม่มี column จริง

### A4: `rooms` มี RLS enabled แต่ไม่มี policy
- **Claim:** schema.sql:51 `ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY` แต่ไม่มี `CREATE POLICY` สำหรับ `rooms`
- **Evidence:** schema.sql บรรทัด 55-63 มี policy สำหรับ profiles, messages, stories เท่านั้น
- **Status:** NOT VERIFIED — DB จริงอาจมี policy แต่ไม่ได้ commit กลับเข้า repo
- **Impact ถ้าผิด:** client-side reads/writes บน `rooms` จะถูก block ทั้งหมดเพราะ RLS ปิดกั้น -- จริง ๆ แล้ว Supabase default behavior ของ RLS ที่ไม่มี policy คือ "deny by default" → app พัง 100%
- **Mitigation:** migration `0004_rls_policies.sql` ต้องสร้าง policy ก่อน apply อะไรอื่น

### A5: ไม่มี storage.objects policies สำหรับ buckets `avatars`, `chat-media`
- **Claim:** schema.sql:66-67 bucket definitions แต่ไม่มี `storage.objects` RLS policies → world-writable
- **Evidence:** schema.sql ไม่มี `CREATE POLICY ... ON storage.objects`
- **Status:** NOT VERIFIED — อาจถูกตั้ง manual ใน dashboard แล้ว
- **Impact:** ถ้าไม่มีจริง → bucket world-writable (user ใดก็ upload เป็น user อื่นได้)
- **Mitigation:** migration `0004_rls_policies.sql` เพิ่ม storage.objects policies

### A6: ไม่มี bucket `stories` (ที่ Stories page อ้าง)
- **Claim:** `app/stories/page.tsx` upload ไป bucket `stories` แต่ schema.sql:66-67 สร้างเพียง `avatars`, `chat-media`
- **Evidence:** stories/page.tsx `supabase.storage.from('stories').upload(...)` 
- **Status:** NOT VERIFIED — อาจสร้าง manual ใน dashboard
- **Impact ถ้าผิด:** upload จะ fail runtime ทุกครั้ง
- **Mitigation:** migration `0008_add_stories_bucket.sql`

### A7: ไม่มี triggers และ functions ใด ๆ
- **Claim:** schema.sql ไม่มี `CREATE TRIGGER`, ไม่มี `CREATE FUNCTION`
- **Evidence:** 0 match ใน schema.sql
- **Status:** NOT VERIFIED
- **Impact:** ไม่มี auto-create profile ตอน user sign up → onboarding อาจ fail
- **Mitigation:** migration `0006_triggers.sql` เพิ่ม `handle_new_user`, `update_updated_at`, `cleanup_expired_stories`

### A8: ไม่มี indexes นอกจาก implicit PK/UNIQUE
- **Claim:** schema.sql ไม่มี `CREATE INDEX` ใดนอกจาก implicit (PK of profiles.id, UNIQUE of profiles.username)
- **Evidence:** 0 explicit `CREATE INDEX` ใน schema.sql
- **Status:** NOT VERIFIED
- **Impact:** query ขนาดใหญ่ (messages on room, friendships on sender) จะช้า
- **Mitigation:** migration `0005_indexes.sql`

---

## Track B Status Summary

| Track | Status | Gate |
|---|---|---|
| B-1 Audit (this file) | ✅ DONE | — |
| B-2 Design migrations (SQL files) | ⏳ Sprint 1+ | รอ DB access |
| B-Live-Audit | ❌ Blocked | ต้องมี DB access |
| B-3 Apply migrations | ❌ Blocked | รอ Live-Audit ผ่าน |
| B-4 Code use new schema | ❌ Blocked | รอ B-3 ผ่าน |

---

## Verification Steps (เมื่อได้ DB access ในอนาคต)

รันคำสั่ง SQL ต่อไปนี้กับ DB จริงเพื่อ verify ทุก assumption:

```sql
SELECT table_name FROM information_schema.tables WHERE table_schema='public';
SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name = 'messages';
SELECT tablename, policyname, cmd, qual FROM pg_policies WHERE schemaname = 'public';
SELECT id, name, public FROM storage.buckets;
SELECT tgname, tgrelid::regclass, tgenabled FROM pg_trigger WHERE NOT tgisinternal;
SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public';
```

อัปเดต status แต่ละ assumption หลัง verify ในไฟล์นี้.