# ADR 0005: Feature Flag with Expiry

- Status: ACCEPTED
- Date: Sprint 0B (initial)
- Deciders: Tech Lead + AI Architect

## Context

จากแผนการ refactor จะ migrate ทุก page จากแบบเดิม → module structure:
- หาก migrate ครั้งเดียวแล้วพัง → ไม่รู้ว่าเป็นที่ page ใด (ทุกหน้าใช้งานไม่ได้พร้อมกัน)
- หากไม่มี rollback granular → ต้อง `git reset --hard <baseline>` ทั้งโปรเจกต์
- ถ้า flag ไม่มี expiry → ค้างอยู่หลายปี เกิด technical debt "flag ที่ลืมลบ"

## Decision

ใช้ **Feature Flag with Expiry**:

### Flag schema
```ts
{
  key: 'use_new_chats',          // unique
  default: false,                // production-safe
  expires: '2026-10-01',         // YYYY-MM-DD — วันที่คาดว่า migration เสร็จ
  owner: 'chat',                 // module ที่รับผิดชอบ
  reason: 'migration',           // 'experiment' | 'rollback' | 'migration'
}
```

### Migration flow (แต่ละ page)
```
1. app/chats/page.tsx (legacy — ยังเปิดได้)
   ↓
2. useFeatureFlag('use_new_chats') ? <NewChatsPage /> : <LegacyChatsPage />
   ↓ commit: feat(flags): add use_new_chats flag
   ↓
3. NewChatsPage ถูก migrate + smoke test ผ่าน
   ↓
4. flag default เป็น true
   ↓ commit: feat(chat): enable new chats page
   ↓
5. smoke test ผ่านอีกครั้งบน production traffic
   ↓
6. ลบ legacy + ลบ flag
   ↓ commit: refactor(chat): remove chats legacy + flag
```

### Enforcement
- ESLint rule (Sprint 3): flag ที่เลย `expires` date → error
- Flag config อยู่ใน `src/shared/core/flags.config.ts`
- CI run เช็ค flag expiries (Sprint 3)

## Consequences

### ข้อดี
- Rollback granular — ปิด flag 1 ตัว = กลับไป legacy ตัวนั้น
- ไม่กระทบ page อื่น
- แต่ละ migration มี lifecycle ชัดเจน
- บังคับว่า flag จะถูกลบ → ไม่สะสม debt

### ข้อเสีย
- Overhead: config per flag + lint rule + lint CI
- ต้อง discipline ลบ flag ตอนครบเวลา

## Alternatives ที่ปฏิเสธ

### A. Migrate ทีเดียว (no flag)
- ถ้าพัง = rollback ทั้งโปรเจกต์ → เสี่ยงมาก

### B. Flag ไม่มี expiry
- Flag ค้างหลายปี → technical debt "flag ที่ลืมลบ" (เห็นในหลายทีม)

### C. ใช้ LaunchDarkly / external service
- เพิ่ม dependency ในช่วง MVP ทำให้ overkill

## References

- Martin Fowler "Feature Toggles"
- ARCHITECTURE_GUARD.md §7 (Page Migration)
- Trunk-based development ใช้ flag แทน branch ยาว