# ARCHITECTURE_GUARD

> "รัฐธรรมนูญ" ของโปรเจกต์ Arm Chat — บังคับใช้โดยทีมพัฒนา, CI, และ AI ทุกตัวที่เข้ามาทำงาน
> Version 4 · Last updated: Sprint 0B

---

## 1. Layer Dependency

```
app/                  → modules/, shared/
modules/X/            → shared/, modules/X/* (within same module only)
modules/X/            → ❌ modules/Y/ (cross-module direct import forbidden)
shared/design-system/ → shared/core/ เท่านั้น
shared/core/           → (leaf — nothing)
```

Cross-module communication ต้องผ่าน **Service** หรือ **EventBus** เท่านั้น
บังคับด้วย `dependency-cruiser` ใน Sprint 3 + ESLint `no-restricted-imports` (Sprint 1)

---

## 2. Service & Repository Pattern

- ทุก Feature ต้องผ่าน Service (ห้ามเรียก SDK จาก UI โดยตรง)
- ทุก Service ผ่าน Interface (`IAuthService`, `IChatService`, ...)
- ทุก Repository ผ่าน Interface (`IUserRepository`, ...)
- UI ห้าม import `@supabase/supabase-js`, `livekit-client`, `@livekit/*`, OneSignal SDK โดยตรง
- Service เรียก Repository, Repository เป็นที่เดียวที่ import SDK

---

## 3. Design System

- ทุก Component ที่ใช้ในหน้า page ต้องมาจาก `src/shared/design-system/` เท่านั้น
- ห้ามสร้าง Button, Card, Modal, Dialog, Input, List, Menu, Typography ภายใน page เอง
- Design System โตแบบ Just-in-Time เริ่ม 8 primitives แล้วเพิ่มตาม module ที่ migrate

---

## 4. Code Hygiene

- ห้าม Duplicate Logic — ทุกซ้ำต้อง extract
- ห้าม Hardcode — ค่าคงที่ใช้ constant file; URL/env ใช้ `src/lib/env.ts`
- หลีเลี่ยง `any` — ใช้ได้ถ้ามีเหตุผลใน comment และผ่าน review
- ทุก Event ผ่าน EventBus (`@/shared/core/eventBus`)
- ทุก Database ผ่าน Repository
- ทุก Realtime channel ต้อง cleanup on unmount
- ทุก Async route segment ที่มี fetch ต้องมี `loading.tsx` + `error.tsx` (not-found ตามจำเป็น)

---

## 5. Environment Variables Policy (NEW — Sprint 0A/0B)

- **ห้ามเรียก `process.env` จาก modules, pages, components** โดยตรง
- อ่าน environment variables ผ่าน `src/lib/env.ts` เท่านั้น
- `env.ts` เป็นผู้ตรวจสอบ required variables และ throw พร้อมข้อความชัดเจน
- ห้าม fallback secrets ใน source code (throw if missing ไม่ใช่ `|| 'real_value'`)
- Secrets ต้องไม่ถูก log หรือแสดงใน user-visible output
- `.env.example` เป็น template เท่านั้น (placeholders, ไม่ใช่ค่าจริง)
- `.env*.local` ถูก `.gitignore` กัน — ห้าม commit
- CI ใช้ GitHub Secrets หรือ mock env; Production ใช้ Vercel env vars
- บังคับด้วย ESLint `no-restricted-syntax` (ห้าม `process.env` นอก `src/lib/env.ts`)

---

## 6. Architecture Validation

- ทุก `app/*/page.tsx` ต้องเป็น thin re-export ≤3 บรรทัด: `export { X } from "@/modules/..."`
- ห้ามมี `fetch`, `supabase`, `useState`, `useEffect`, business logic ใน `src/app/`
- บังคับด้วย CI grep ใน Sprint 1+

---

## 7. Page Migration

- ทุก page migration ต้องใช้ Feature Flag (ดู ADR 0005)
- Flag ต้องมี `expires` (วันหมดอายุ), `owner`, `reason`
- ห้ามมี flag ที่เลย expiry — ต้องลบก่อน
- ขั้นตอน: Legacy → Module + flag → Switch → Verify → Delete Legacy + Delete Flag

---

## 8. User-visible UI Policy

- ห้ามมีชื่อ vendor technology ใน user-visible JSX literals: `Supabase`, `LiveKit`, `WebRTC`, `PostgreSQL`, `OneSignal`, `Next.js`, `Vercel`
- Internal class name, file name, comment, variable, type โอเค (ไม่ผิด)
- บังคับด้วย ESLint custom rule ใน Sprint 3

---

## 9. Security Baseline

- ห้าม commit secrets/keys/anon-key fallback ใน source
- ทุก RLS-enabled table ต้องมี policy อย่างน้อย 1 อัน (ห้าม enable RLS โดยไม่มี policy)
- ทุก storage upload ต้อง validate MIME + size
- ทุก webhook ต้อง verify signature + มี idempotency key
- Security headers ใน `next.config.mjs` (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) — Sprint 3
- `npm audit` high/critical → Quality Gate (warn), ไม่บล็อก (Sprint 3)
- ทุก production build ต้องปิด debug logs (`console.log`, `console.debug` ห้าม; `console.error` โอเคใน server หรือ Logger)

---

## 10. Git & Commits

- ใช้ Conventional Commits ใน Sprint 3+ (commitlint): `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `build`, `ci`, `perf`
- Branch: `main` = production, `develop` = integration, `feature/<scope>-<desc>` = feature branch (Sprint 1+)
- Semantic Versioning `v<major>.<minor>.<patch>` (ดู ADR 0004)
- ทุก milestone ต้องผ่าน Gate ก่อน commit

---

## 11. Definition of Done (Phase Level)

ทุก Phase ต้องผ่าน sequential gates ก่อน commit:

```
1. tsc --noEmit           → 0 errors (Required)
2. next lint             → 0 errors (Required, ใน Sprint 0B เป็น setup)
3. next build            → exit 0 (Required)
4. no secrets scan src/  → 0 hardcoded (Required)
5. architecture validation → app/ thin (Required ใน Sprint 1+)
6. smoke test            → manual (Pre-Phase) / Playwright (Phase 2+)
7. bundle size           → Quality (warn if >250KB) (Sprint 3+)
8. lighthouse            → Quality (Sprint 3+)
9. conventional commit   → Required (Sprint 3+)
```

**Build ผ่าน ไม่ใช่ Production Ready** — ทุก Phase ต้องผ่าน Smoke Test + Manual inspect + ESLint custom rules

---

## 12. Database Migration (Track B)

- Track B = **DESIGN ONLY** จนกว่าจะได้ DB access จริง (ดู `docs/db-assumptions.md`)
- ทุก migration SQL มี header: `Status: DESIGN ONLY`, `Verified: NOT YET`
- ทุก assumption ต้องระบุ `NOT VERIFIED` จนกว่าจะ verify กับ DB จริง
- Apply migration ได้หลังผ่าน Track B-Live-Audit เท่านั้น
- ทุก migration มี `up` และ `down` (rollback)

---

## Versioning of this Document

- เปลี่ยนแปลงต้องผ่าน PR + review (Sprint 1+)
- แต่ละ version ระบุ Sprint ที่ปรับ
- Version ปัจจุบัน: **v4 (Sprint 0B)** — เพิ่ม Env Variables Policy, Architecture Validation, Page Migration policy