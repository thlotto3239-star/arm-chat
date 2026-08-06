# ADR 0003: Design System First

- Status: ACCEPTED
- Date: Sprint 0B (initial)
- Deciders: Tech Lead + UI/UX + AI Architect

## Context

จาก Full Audit พบว่า:
- โค้ดเดิมมี components แค่ 3 ไฟล์ (Navbar, Footer, OneSignalInit) — ทุกหน้าสร้าง UI เอง inline
- Design vs code drift หนัก (login 3 แท็บ vs design 2-CTA flow; onboarding 1-step vs 3-step; settings เพิ่ม DND/presence/language ที่ design ไม่มี)
- Accessibility ไม่สอดคล้องกัน (บางหน้ามี aria, บางหน้าไม่มี; label ไม่ผูก htmlFor)
- Tailwind tokens ขาด 23 tokens ที่ DESIGN.md กำหนด
- Design system folder `stitch_arm_chat_whatsapp_design_system/` มี 40+ mockups แต่ไม่ได้ถูกแปลงเป็น React components

## Decision

สร้าง **Design System ก่อน Page Migration**:

1. `src/shared/design-system/` เป็นที่เก็บ primitive components ทั้งหมด
2. **Just-in-Time**: เริ่ม 8 primitives (Typography, Button, Input, Avatar, Badge, Modal, Spinner, Skeleton) ใน Sprint 0B/1
3. เพิ่ม composite (MessageBubble, ChatInput, CallControls, ...) เมื่อ migrate module นั้น
4. ทุกหน้าใช้ component จาก Design System เท่านั้น — ห้ามสร้าง inline
5. เพิ่ม route `/design-system` ภายในแอปเพื่อ visual review (แทน Storybook ในช่วง MVP — จะติดตั้ง Storybook จริงใน Phase 5)
6. เพิ่ม 23 missing DESIGN.md tokens ใน `tailwind.config.ts`

## Consequences

### ข้อดี
- UI consistent ทุกหน้า
- Accessibility รวมศูนย์เดียว (ทุก primitive มี aria + keyboard)
- ลด design drift ลง
- Designer เปิดดู component state ได้ที่ `/design-system`
- Migration ของแต่ละ page ใช้ component สำเร็จรูป → เร็วกว่าสร้าง inline

### ข้อเสีย
- ต้องสร้าง Design System ก่อน page migration → เสียเวลา front-load
- โอกาสที่ออกแบบ primitive ผิด → ถูกใช้ทุกหน้า → rewrite ทั้ง Design System
- Mitigate ด้วยการออกแบบ minimal ตอนแรก + extend later

## Alternatives ที่ปฏิเสธ

### A. สร้าง 45 components ทีเดียวก่อน page migration
- Over-engineering, เสียเวลาไปกับ component ที่อาจไม่ได้ใช้
- เสี่ยงออกแบบผิดเพราะยังไม่เห็น requirement จริง

### B. สร้าง component inline ในแต่ละ page (ตามโค้ดเดิม)
- สร้าง duplicate, accessibility inconsistent, design drift เหมือนเดิม

### C. ติดตั้ง Storybook วันแรก
- เพิ่ม ~400MB dependency + config ที่ยังไม่จำเป็นตอน MVP
- ใช้ route `/design-system` ภายในแอปแทน → install Storybook ใน Phase 5

## References

- Material Design 3 (DESIGN.md)
- ARCHITECTURE_GUARD.md §3 (Design System)
- Token systems: Tailwind, Radix Colors
- Storybook just-in-time decision ในแผน v7