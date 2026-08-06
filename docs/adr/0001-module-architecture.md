# ADR 0001: Module Architecture (Domain-Driven Modules)

- Status: ACCEPTED
- Date: Sprint 0B (initial)
- Deciders: Tech Lead + AI Architect

## Context

โปรเจกต์ Arm Chat เริ่มจาก flat structure:
- `src/app/**` — ทั้ง page, hooks, business logic ปนกัน
- `src/lib/**` — utilities + realtime + supabase client แบบ horizontal
- `src/components/**` — shared components 3 ไฟล์

เมื่อ feature โต (Auth, Chat, Call, Friends, Groups, Notifications, Stories, Profile, Settings) การค้นหาไฟล์ของหนึ่ง feature ต้องกระโดดข้ามโฟลเดอร์ 6+ ตัว (services, repositories, hooks, contexts, components, types) ทำให้ maintainability ต่ำ

## Decision

ใช้ **Domain-Driven Module Architecture**:

```
src/
├── app/                          (Next.js App Router shells เท่านั้น)
├── modules/
│   ├── auth/        { components, hooks, services, repository, types, events, pages }
│   ├── chat/
│   ├── call/
│   ├── friends/
│   ├── groups/
│   ├── notification/
│   ├── story/
│   ├── profile/
│   └── settings/
└── shared/
    ├── core/
    ├── design-system/
    └── lib/
```

## Consequences

### ข้อดี
- หาไฟล์ของ feature หนึ่งได้ในที่เดียว
- ลด coupling ระหว่าง feature (cross-module import ห้าม — ต้องผ่าน Service/EventBus)
- ทดสอบได้เป็น module unit
- ทีม work แยกกันได้

### ข้อเสีย
- Boilerplate เพิ่ม (7 subfolders per module)
- Tend to over-modularize ถ้า module เล็กเกินไป
- Dependency rule ต้องบังคับด้วย dependency-cruiser (Sprint 3) และ ESLint

## Alternatives ที่ปฏิเสธ

### A. Flat structure ("services/, hooks/, contexts/" รวม ๆ) 
- หายากเมื่อ feature > 5
- Cross-feature import ง่ายเกินไป → coupling สูง
- 6 เดือนข้างหน้า "หาไฟล์ไม่เจอ"

## References

- Domain-Driven Design (Eric Evans)
- โครงสร้างที่เห็นใน production Next.js apps ขนาดใหญ่ (Vercel, Linear)
- ARCHITECTURE_GUARD.md §1 (Layer Dependency)