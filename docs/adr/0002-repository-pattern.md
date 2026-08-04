# ADR 0002: Repository Pattern

- Status: ACCEPTED
- Date: Sprint 0B (initial)
- Deciders: Tech Lead + AI Architect

## Context

จาก Full Audit (Sprint 0 pre-work) พบว่าโค้ดเดิมเรียก Supabase SDK ตรงจาก 6+ ไฟล์ รวมถึง page.tsx, components/Navbar.tsx, api/notify/route.ts — ทำให้:

1. ทุก page coupling กับ Supabase SDK → เปลี่ยน backend ยาก
2. ทดสอบ page ใน isolation ไม่ได้
3. RLS / error handling / retry logic กระจายอยู่ทุกไฟล์
4. Business logic ของ feature ปนกับ SDK call

## Decision

ใช้ **Repository Pattern** โดยมี Interface + Concrete:

```
modules/chat/repository/
├── IMessageRepository.ts          (interface)
└── SupabaseMessageRepository.ts   (concrete)

modules/chat/services/
├── IChatService.ts                (interface)
├── SupabaseChatService.ts         (concrete, uses Repository)
```

กฎ:
- `@supabase/supabase-js` ถูก import เฉพาะในไฟล์ `Supabase*Repository.ts`
- Service ไม่รู้จัก SDK; รู้จักแค่ Interface ของ Repository
- UI / page import Service interface เท่านั้น (ผ่าน Context)
- DI ผ่าน Context (`AuthContext` ให้ `IAuthService` instance)

## Consequences

### ข้อดี
- เปลี่ยน backend ได้โดยสร้าง concrete ใหม่ (e.g. `PostgresMessageRepository`)
- ทดสอบ Service ใน isolation ด้วย mock repository
- RLS / error / retry logic รวมที่เดียว
- Business logic แยกจาก infra

### ข้อเสีย
- Interface + Concrete เพิ่มปริมาณไฟล์
- Overhead เล็กน้อยตอน coding
- ทีมใหม่ต้องเข้าใจก่อน

## Alternatives ที่ปฏิเสธ

### A. Direct Supabase ใน page ต่อไป
- Coupling สูง, ทดสอบยาก — ตามที่ audit เตือน

### B. Service เรียก Supabase ตรง (ไม่ผ่าน Repository)
- Service ยัง coupling กับ SDK → เปลี่ยน backend ยากอยู่ดี

## References

- Repository Pattern (Martin Fowler)
- ARCHITECTURE_GUARD.md §2 (Service & Repository Pattern)
- พบใน Django ORM, Prisma, TypeORM abstract layers