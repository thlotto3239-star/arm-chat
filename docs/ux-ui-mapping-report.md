# Arm Chat — UI Mapping Report (Phase 1.5)

> Purpose: map every current page to its design-system target BEFORE code migration.
> Source of truth: `stitch_arm_chat_whatsapp_design_system/` + `src/shared/design-system/` + `docs/ux-ui-audit-report.md`
> Rule: do not redesign from scratch — reuse existing Arm Chat design system assets.
> Rule: do not remove reaction emojis from chat data (user data). Only decorative UI emojis.

## Available primitives (`src/shared/design-system/`)

| Primitive | API | Replaces |
|---|---|---|
| `Button` | variant `primary/secondary/danger/ghost`, size `sm/md/lg`, `iconName`, `loading`, `fullWidth` | hand-rolled `<button>` everywhere |
| `Input` | — | raw `<input>` on auth/settings/onboarding |
| `Avatar` | — | raw `<img>` avatar chips, circular per DESIGN.md |
| `Icon` | name (Material Symbols), `fill`, `weight`, `aria-label` | emoji/decoration + raw `<span class=material-symbols-outlined>` |
| `AppLogo` | — | hand-rolled logo mark in Navbar/Footer |
| `cn` | class merge | `clsx`/template-string utilities |

## Page mapping

| Page | Current component | Current issue (audit) | Expected from stitch | Replacement component | Priority |
|---|---|---|---|---|---|
| `/login` | 3-tab raw buttons + raw input (login/page.tsx:130-221) | A1 3-tab IA, A2 fake OTP 6-digit no +66, A4 silent OAuth redirect, A5 auto-signup | `arm_chat_1` step-options: Google CTA → "หรือ" → Phone CTA, 4-step (options→phone→verify→success) | `Button`, `Input`, `AppLogo`, `Icon`; delete `/register` after Phase 9 | P0 |
| `/register` | raw form, never calls `signUp` (register/page.tsx:15-22) | C1/C2 security theater | deleted — register is implicit via phone/Google login | route deletion + redirect to `/login` | P0 |
| `/onboarding` | single-screen username/bio/avatar | A8-A11: no step machine, no auto-UID, no share-link/QR, Navbar/Footer shown | `arm_chat_2:138-170` 3-step wizard + progress rail + branding column | `Button`, `Input`, `Avatar`, `Icon`, `AppLogo`; suppress Navbar/Footer | P0 |
| `/chats` (inbox) | raw list + raw buttons | B1-B6, B18-B19: no realtime, no unread badge, no presence, no FAB, no pin/archive | `arm_chat_landing_page`/`arm_chat_21` bento inbox; WhatsApp-style rows | `Avatar`, `Icon`, `Button`, presence dots | P1 |
| `/chat/[id]` (room) | raw message rows + emoji toolbar (chat/page.tsx:484-497) | B7-B22: no reply quote, no long-press menu, no read receipts UI, composer plain input | `arm_chat_22:224-250` context menu + 6-emoji reaction bar; `arm_chat_3` composer | `Icon`, `Avatar`, `Button`; keep reaction emoji as data | P1 |
| `/call/[id]` | demo placeholder, no LiveKit state machine | C1-C7: no real call, no voice/video toggle, no grid | `arm_chat_large_meeting`, `arm_chat_26` grid/control bar | `Button` (danger hangup, icon controls) | P1 |
| `/friends/add` | search + raw invite cards | D1-D7: no debounce, no block mgmt, no atomic accept | `arm_chat_4`/`arm_chat_35` friend cards | `Button`, `Avatar`, `Icon` | P1 |
| `/qr` | no real decoder (jsqr not installed) | D8-D13: QR scanner does not decode, no permission UX | `qr_arm_chat` scanner frame + deep link | `Icon`, `Button`; install `jsqr` | P0 |
| `/stories` | list + viewer modal, raw reactions | E1-E6: no bento, no FAB, no viewed-section | `stories_arm_chat` bento + viewer + reactions | `Icon`, `Avatar`, `Button`; keep reaction emoji data | P1 |
| `/settings` | raw sections list | F1-F8: no sidebar, no bento, missing sections, no Danger Zone | `arm_chat_23`/`arm_chat_38` settings bento | `Button` (danger zone), `Icon`, `Input` | P1 |
| Navbar | fixed top, links hidden below `lg` (Navbar.tsx:118), no OneSignal logout | F9-F12: no bottom-nav mobile, no logout, no ARIA | `arm_chat_flow` bottom nav bar + notification center | `Icon`, `Avatar`, `AppLogo`, `Button` | P1 |
| Landing `/` | hero + feature cards (page.tsx) | F13-F15: no OG tags, CTA routes to `/login`, hex in copy | `arm_chat_landing_page` | metadata/OG + `Button` CTA | P2 |
| Footer | dead Policy/Terms links | F16-F17 | real `/privacy`, `/terms` routes | route creation | P3 |

## Emoji policy (Phase 3 — already applied)

- **Removed (decorative):** nav tabs, feature cards, status selector, chat action buttons, onboarding check, stories 📱/👁️, test-suite logs → `Icon` (Material Symbols) or colored dots.
- **Kept (user data):** `❤️👍` chat reactions, `❤️🔥😮👏` story reactions, `reactions` map values. Stored in DB, not UI decoration.

## Migration sequence (from `docs/ux-ui-audit-report.md` Migration Order)

1. Skeletal chrome: `(auth)/layout.tsx` strips Navbar/Footer (A6)
2. Design system foundation — DONE (`src/shared/design-system/`, tokens in tailwind.config.ts)
3. Auth rewrite (Phase 9): unified Phone+Google, internal 6-digit OTP, "Welcome to Arm Chat" card (A1-A5, A7)
4. Onboarding 3-step + auto-UID + invite link + QR card (A8-A11)
5. Navbar: bottom-nav + OneSignal logout + ARIA + startsWith (F9-F12)
6. Stories bento + FAB + viewer (E1-E6)
7. Settings sidebar + bento + Danger Zone (F1-F8)
8. Chat Room: reply quote + long-press + read receipts + composer (B7-B22)
9. Inbox: realtime + unread + presence + FAB (B1-B6)
10. Call: real LiveKit + state machine (C1-C7)
11. QR: jsqr + decode loop + permission UX (D8-D13)
12. Friends: realtime + debounce + block (D1-D7)
13. Landing: OG tags + CTA routing (F13-F15)
14. Footer: real Policy/Terms links (F16-F17)
15. Emoji removal — DONE (committed)

Each step: gates (tsc + lint + build) + atomic commit per ADR 0005 feature-flag-with-expiry.

## Status

- [x] Phase 1 audit (`docs/audit/UX-UI-Product-Audit.md`, 78 issues)
- [x] Phase 2 foundation (`src/shared/design-system/`)
- [x] Phase 3 emoji removal (decorative → Material Symbols; reactions kept)
- [x] Phase 1.5 UI mapping (this report)
- [ ] Phase 2+ page migration (in sequence above, pending approval)
