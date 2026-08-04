# Dependency Rules

> Layer-by-layer import policy ของ Arm Chat
> Version: 1 (Sprint 0B)
> Enforcement: ESLint `no-restricted-imports` (Sprint 1) + `dependency-cruiser` (Sprint 3)

## Layer Diagram

```
Next.js App Router (src/app/)
       │ imports
       ▼
Modules (src/modules/<domain>/)
   ├── pages/         → หน้า page-level composition
   ├── components/    → domain-specific UI
   ├── hooks/         → domain hooks (consume Service via Context)
   ├── services/      → business logic (interface + concrete)
   ├── repository/    → data access (interface + concrete)
   ├── events/        → module-specific event types
   └── types/         → module types
       │ imports
       ▼
Shared (src/shared/)
   ├── design-system/ → UI primitives (Button, Modal, ...)
   ├── core/          → EventBus, FeatureFlags, Logger, env helpers
   └── lib/           → utilities (no business logic, no SDK)
       │ imports
       ▼
External SDKs (only repository + libs may import these directly)
   @supabase/supabase-js, livekit-client, @livekit/*, qrcode.react,
   clsx, tailwind-merge, lucide-react
```

---

## Allowed Imports Matrix

| From ↓ / To →        | app | modules/<X> | modules/<Y> | shared/design-system | shared/core | shared/lib | SDKs |
|----------------------|-----|-------------|-------------|----------------------|-------------|-----------|------|
| **app/**             | ✅  | ✅          | ✅ (via re-export) | ✅          | ✅          | ✅        | ❌   |
| **modules/X**        | ❌  | ✅ (self)   | ❌          | ✅                   | ✅          | ✅        | ❌   |
| **modules/Y**        | ❌  | ❌          | ✅ (self)   | ✅                   | ✅          | ✅        | ❌   |
| **shared/design-system** | ❌ | ❌     | ❌          | (self)               | ✅          | ✅        | ❌   |
| **shared/core**      | ❌  | ❌          | ❌          | ❌                   | (self)      | ✅        | ❌   |
| **shared/lib**       | ❌  | ❌          | ❌          | ❌                   | ❌          | (self)    | ❌   |
| **modules/X/repository** | ❌ | self     | ❌          | ❌                   | ✅          | ❌        | ✅   |

## Rules

### R1. App Router shells only
- `src/app/**/page.tsx` = thin re-export: `export { X } from "@/modules/..."`
- ห้าม `useState`, `useEffect`, `fetch`, business logic ใน `src/app/`
- ยกเว้น route handlers (`route.ts`) ที่ wrap small adapter to services

### R2. Cross-module direct import forbidden
- `modules/auth/` ห้าม `import` from `modules/chat/`
- การสื่อสารข้าม module ผ่านทาง:
  - **Service interface** (inject ผ่าน Context)
  - **EventBus** (`@/shared/core/eventBus`)

### R3. SDK imports only in repository/ + shared/lib/
- `@supabase/supabase-js` → ไฟล์ `Supabase*Repository.ts` เท่านั้น
- `livekit-client`, `@livekit/*` → ไฟล์ `LiveKitCallService.ts` (concrete)
- `qrcode.react` → ใน QR-specific component (เพราะเป็น UI lib)
- `clsx`, `tailwind-merge`, `lucide-react` → ใน `shared/design-system/` + `shared/lib/`

### R4. process.env only in `src/lib/env.ts`
- กฎข้อใหม่ (ARCHITECTURE_GUARD §5)
-บังคับด้วย ESLint `no-restricted-syntax` ใน Sprint 0B:
  - อนุญาต `process.env` เฉพาะใน `src/lib/env.ts`
  - ไฟล์อื่น import `env` จาก `@/lib/env`

### R5. design-system ไม่ import modules
- `shared/design-system/` เป็น leaf ที่ไม่รู้เรื่อง feature
- ใช้ composition: page เป็นคน pass data/service เข้า component

### R6. shared/lib = pure utility
- ไม่มี business logic, ไม่มี SDK, ไม่มี Supabase
- TypeScript types only, helpers pure

---

## Circular Dependency

ห้าม A → B → C → A ในทุก layer
บังคับด้วย `dependency-cruiser` ใน Sprint 3

---

## Enforcement Timeline

| Tool | Sprint | Action |
|---|---|---|
| ESLint `no-restricted-imports` | 0B (initial) | Restrict `process.env` outside env.ts |
| ESLint `no-restricted-imports` (extended) | 1 | Restrict `@supabase`, `livekit-client` to repository dirs |
| ESLint custom rule "no-jargon-in-jsx" | 3 | ห้าม vendor names ใน JSX literal |
| `dependency-cruiser` | 3 | Detect circular deps + layer violations |
| commitlint | 3 | Enforce conventional commits |
| `@lhci/cli` | 3 | Lighthouse budget |

---

## Why these rules (R1-R6 summary)

- **R1** → Separation of routing shell vs business logic (auditable, swappable)
- **R2** → Decoupled modules = independent testing, independent team
- **R3** → Single point of SDK coupling = easy backend swap, mock for tests
- **R4** → Central env validation = fail-fast at startup, no scattered `process.env` reads
- **R5** → Design system is feature-agnostic = reusable, no accidental coupling
- **R6** → Pure utilities = testable, no side effects

Full reasoning in ADR 0001 (modules), 0002 (repository), 0003 (design system), 0005 (feature flags).