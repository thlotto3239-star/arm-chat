# Arm Chat — Project Status Dashboard

> อัปเดตทุก Sprint เสร็จ
> Last updated: Sprint 0B complete

## Progress

```
Architecture       █████████░ 90%  (Sprint 0A + 0B เสร็จ)
Git Baseline       ██████████ 100% (efcbb64, tag baseline-pre-refactor)
Security Hardening ██████████ 100% (Sprint 0A — secrets ลดตก, env.ts)
ADR (5 JIT)        ██████████ 100% (0001-0005 Sprint 0B)
ARCHITECTURE_GUARD ██████████ 100% (v4 Sprint 0B)
Dependency Rules   ██████████ 100% (docs/architecture/dependency-rules.md)
DB Track B-1 Audit ██████████ 100% (assumptions A1-A8 NOT VERIFIED)
DB Track B-2 Migs  ░░░░░░░░░░ 0%   (Sprint 1+)
DB Track B-Live    ░░░░░░░░░░ 0%   (blocked — รอ DB access)
DB Track B-3 Apply ░░░░░░░░░░ 0%   (blocked)
DB Track B-4 Wire  ░░░░░░░░░░ 0%   (blocked)
Skeleton modules   ░░░░░░░░░░ 0%   (Sprint 0C)
Design System      █░░░░░░░░░ 10%  (ADR only — primitives ใน Sprint 1)
Repository Layer   ░░░░░░░░░░ 0%   (Sprint 1)
Services           ░░░░░░░░░░ 0%   (Sprint 1)
Contexts           ░░░░░░░░░░ 0%   (Sprint 1)
Pages (legacy)     ██░░░░░░░░ 25%  (23 ไฟล์ยังทำงานอยู่ — UX Audit pending)
Pages (migrated)   ░░░░░░░░░░ 0%   (Sprint 2+)
ESLint + CI        ███░░░░░░░ 30%  (Sprint 0B: flat config + custom rule + CI minimal)
Testing Foundation ░░░░░░░░░░ 0%   (Sprint 1 — Vitest + Playwright config)
Production Hard    ░░░░░░░░░░ 0%   (Sprint 3+ — Lighthouse, dep-cruiser, commitlint, security plugin, bundle budget)
UX/UI Audit        ██████████ 100% (Done — see docs/audit/UX-UI-Product-Audit.md)
```

## Sprint Completion Log

| Sprint | Status | Finished | Notes |
|---|---|---|---|
| 0A Security + Baseline | ✅ DONE | 2026-08-04 | baseline efcbb64 + secret scrub + env.ts |
| 0B Governance | ✅ DONE | 2026-08-04 | guard v4, ADR 5, db-assumptions, release-checklist, project-status, dependency-rules, CI workflow, ESLint flat config with `no-restricted-syntax` (process.env) |
| Production DB & Test Suite | ✅ DONE | 2026-08-05 | Supabase tables created (8 tables: profiles, rooms, room_members, messages, stories, user_devices, notifications_history, test_results) + RLS + pg_net trigger + test_results logging |
| UX/UI Audit | ✅ DONE | 2026-08-04 | 13 pages + 2 components scored, 14 Critical + 38 High + 36 Med + 16 Low issues cataloged with stitch design references per issue → `docs/audit/UX-UI-Product-Audit.md` |
| 0C Skeleton | ⏳ Pending | — | modules/, shared/, tsconfig paths |
| 1 Foundation | ⏳ Pending | — | Design System 8 + Repos + Services + Contexts |
| 2 Page Migration | ⏳ Pending | — | migrate ทีละ page ตามลำดับใน audit report + feature flag |
| 3 Governance Hardening | ⏳ Pending | — | Lighthouse + commitlint + dep-cruiser + security plugin + bundle budget |

## Critical Open Items

- [ ] **Rotate secrets** (LiveKit, Supabase publishable + DB password, OneSignal, Google OAuth) — ที่ vendor dashboards หลัง session
- [ ] ขอ DB access เพื่อ Track B-Live-Audit
- [ ] สร้าง `develop` branch เมื่อเริ่ม Sprint 1
- [ ] ติดตั้ง ESLint และ custom rules (Sprint 0B + Sprint 3)

## Tech Debt Known

| Item | Severity | Source | Mitigation |
|---|---|---|---|
| 4 tables ไม่มีใน schema | Critical | Full Audit A2 | Track B-2 migration DESIGN ONLY |
| `rooms` RLS enabled no policy | Critical | Full Audit A4 | Track B-2 migration 0004 |
| No middleware auth guard | High | Full Audit | Sprint 1 (skeleton + middleware) |
| Legacy pages still use raw supabase | High | Full Audit | Sprint 2 (page migration) |
| Call page uses raw getUserMedia (no LiveKit) | High | Full Audit | Sprint 1 (LiveKitCallService) |
| QR scanner does not decode | High | Full Audit | Sprint 2 (page migration) |
| No tests | Medium | Full Audit | Sprint 1 (testing foundation) |
| Dead `stitch_*` paths grep not used | Low | Full Audit | n/a |
| Hardcoded `unsplash.com` default avatar | Low | `settings/page.tsx:15` | Sprint 2 |

## Source of Truth

- ไฟล์จริงบน disk = Source of Truth (ไม่ใช่ session log AI)
- แผน = docs ในนี้ + `ARCHITECTURE_GUARD.md` + ADR
- Status = output ของ `tsc`, `next lint`, `next build`, smoke test manual