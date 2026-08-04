# Phase 9 — Auth Rewrite: Migration Plan + Component Mapping Report

> **Status:** DRAFT (awaiting approval — NO code changes until this is approved)
> **Goal:** Unified Phone + Google login, internal 6-digit OTP (no SMS provider), remove email/password, forced 3-step onboarding.
> **Source of truth:** `stitch_arm_chat_whatsapp_design_system/arm_chat_1` (login) + `arm_chat_2` (onboarding) + `docs/brand/ux-writing-guide.md` §Auth.

---

## 1. Current State (verified from source)

| Route | Current implementation | Issues (from audit A1-A11) |
|---|---|---|
| `/login` | 3-tab (email/phone/google) in one page | A1 3-tab IA (design = 2-CTA options screen); A2 fake OTP `Math.random` shown on same device (`login:82-83`); A4 OAuth failure silently routes to `/onboarding` (`login:68-72`); A5 auto-signup on any email (`login:41-47`); A6 Navbar+Footer on auth page |
| `/register` | Fake form — `setTimeout(800ms)` only, never calls `signUp` (`register:15-22`) | C1/C2 security theater; route is dead code |
| `/onboarding` | Single screen: avatar + display_name + username + bio (`onboarding:125-219`) | A8 no 3-step wizard; A9 no auto-UID `ARM-XXXX-TH`; A10 no invite-link/QR; A11 hardcoded "username available" (`onboarding:195-198`); A6 chrome shown; uses `.update()` not `upsert()` (`onboarding:99-108`) |
| Auth layout | **None** (`src/app/(auth)/layout.tsx` missing) | A6 chrome violation on all 3 pages |
| Auth provider | Supabase client-side only (`src/lib/supabase/client.ts`) | No server middleware; per-page `getSession()` guards (`chats:47-52`) |

Design tokens used today (must keep): `bg-canvas`, `text-ink`, `ink-muted`, `surface-white`, `surface-container`, `primary-container`, `rounded-tile`, `rounded-pill`, `font-prompt`. Design system primitives exist and are REQUIRED (`@/shared/design-system`): `Button`, `Input`, `Avatar`, `Icon`, `AppLogo` (+ brand `ArmChatLogo`).

---

## 2. Target Behavior (Phase 9 spec)

### 2.1 Login (`/login`) — unified 2-method options screen
1. **Step A (options):** "ยินดีต้อนรับกลับมา" header + 2 CTAs:
   - Google button (`ดำเนินการต่อด้วย Google`) — white pill, Google logo, ink text
   - Divider "หรือ" then Phone button (`เข้าสู่ระบบด้วยเบอร์โทรศัพท์`) — `primary-container` pill, `call` icon
   - Minimal legal footer (ข้อกำหนดการใช้งาน / ความเป็นส่วนตัว / ช่วยเหลือ) — no Navbar/Footer
2. **Step B (phone):** back arrow + "เบอร์โทรศัพท์ของคุณ"; input with **`+66` startAddon** prefix (`Input` primitive); helper italic text "รหัสจะแสดงในแอปเพื่อความปลอดภัยสูงสุด"; CTA `รับรหัสยืนยัน`.
3. **Step C (verify):** "ยืนยันตัวตนในแอป" + 6-digit OTP boxes; **internal simulator** panel labeled "การจำลองการยืนยันภายใน" (Phase 9 keeps in-app OTP since no SMS provider); "ส่งรหัสอีกครั้ง" link; wrong-OTP copy per ux-guide: "รหัสยืนยันไม่ถูกต้อง — ลองอีกครั้ง".
4. **Step D (success):** check-circle animation → `router.push('/onboarding')`.

### 2.2 OTP semantics (Phase 9 rule)
- Generate **6-digit** internal code (design shows 4 but Phase 9 mandates 6).
- Store the generated code in a component-level state (or sessionStorage) — NOT visible to backend; this is an internal in-app verification, not a real SMS flow.
- Verify against phone number: phone → synthetic email `phone_<digits>@armchat.local` (existing pattern `login:91-92`) → `signInWithPassword`; on "not found" error → `signUp` once, then sign in. **Exact duplicate-handling copy:** "หมายเลขนี้มีอยู่แล้ว — เข้าสู่ระบบด้วยหมายเลขนี้โดยตรง".

### 2.3 Google OAuth (A4 fix)
- Remove both silent `router.push('/onboarding')` error branches (`login:68-74`).
- Subscribe `supabase.auth.onAuthStateChange`; navigate to `/onboarding` ONLY on confirmed `SIGNED_IN`.
- On OAuth error show copy: "เข้าสู่ระบบด้วย Google ไม่สำเร็จ — ลองอีกครั้ง หรือใช้หมายเลขโทรศัพท์แทน".

### 2.4 Email/password REMOVED
- Delete email/password tab entirely (design `arm_chat_1` has no such tab).
- Delete `/register` route; direct hits → `<Redirect href="/login">` (Next.js 14 `redirect()` in a server page or a client page returning Link).
- Password recovery UI: n/a — becomes moot (documented in audit §A3).

### 2.5 Onboarding (`/onboarding`) — forced 3-step wizard per `arm_chat_2`
- **Chrome:** suppress Navbar/Footer via `(auth)/layout.tsx`; use `ArmChatLogo` stacked + "Arm Chat" wordmark left column + 3-step progress rail (ข้อมูลพื้นฐาน → รหัสประจำตัวของคุณ → พร้อมใช้งาน).
- **Step 1 ข้อมูลพื้นฐาน:** circular avatar upload (128px, `Avatar`/custom upload), display name (required), username with real **uniqueness check** against `profiles.username` (debounced; "Username นี้สามารถใช้งานได้" only after verified-available).
- **Step 2 รหัสประจำตัวของคุณ:** auto-generated `ARM-XXXX-TH` user ID (from `user.id` hash, displayed read-only + copy button), invite link `arm.chat/u/<username>` with share button.
- **Step 3 พร้อมใช้งาน:** QR add-friend card (`qrcode.react` already installed) + `เสร็จสิ้นและเริ่มแชท` → `/chats`.
- **Persistence:** change `.update()` → `upsert()` (design doc requirement) so onboarding guarantees a profile row even if `handle_new_user` trigger missing (db-assumptions A7).

### 2.6 Route guards (unchanged pattern, applied to auth pages)
- Protected pages (`/chats`, `/chat/[id]`, `/call/[id]`, `/stories`, `/settings`, `/friends/add`, `/qr`) keep per-page `getSession()` guard (no middleware exists; not in Phase 9 scope).
- Auth pages guard: if already signed in with completed profile → redirect to `/chats`.

---

## 3. Component Mapping (stitch → primitive)

| Stitch element | Stitch source | Replace with | File |
|---|---|---|---|
| Google CTA pill (54px white, border) | `arm_chat_1:151-154` | `Button variant="secondary" size="md"` + Google logo `<img>` | login page |
| Phone CTA pill (`primary-container`) | `arm_chat_1:160-163` | `Button variant="primary" size="md"` + `Icon name="call"` | login page |
| "หรือ" divider | `arm_chat_1:155-159` | custom `<div>` hairline + label | login page |
| Phone input + `+66` prefix | `arm_chat_1:175-177` | `Input inputSize="md" startAddon={<span>+66</span>}` | login page |
| Back arrow | `arm_chat_1:167-170` | `Button variant="ghost" iconOnly iconName="arrow_back"` | login page |
| OTP 6-digit boxes | `arm_chat_1:193-197` (4 shown) | custom `OtpInput` (6 boxes, auto-advance, numeric-only) | login page |
| Internal verify simulator | `arm_chat_1:199-206` | custom `OtpSimulator` panel (fills OTP on click) | login page |
| "ส่งรหัสอีกครั้ง" | `arm_chat_1:209` | `Button variant="ghost"` text link | login page |
| Success check circle | `arm_chat_1:213-219` | `Icon name="check"` in `primary-container` circle | login page |
| Auth card (25px radius) | `arm_chat_1:147` | `rounded-tile` wrapper (existing token) | login + onboarding |
| Onboarding left rail + progress | `arm_chat_2:140-169` | `ArmChatLogo stacked` + step indicator (custom) | onboarding page |
| Avatar upload circle (128px) | `arm_chat_2:179-192` | custom `AvatarUpload` (uses `Avatar` primitive) | onboarding page |
| Display name input | `arm_chat_2:196` | `Input` | onboarding page |
| Username input + `@` | `arm_chat_2:198-208` | `Input startAddon={<span>@</span>}` + live check | onboarding page |
| Auto UID `ARM-8829-TH` + copy | `arm_chat_2:222-227` | custom `UniqueIdCard` (copy to clipboard) | onboarding page |
| Invite link + share | `arm_chat_2:229-234` | custom `InviteLinkCard` (`navigator.share` fallback copy) | onboarding page |
| QR card | `arm_chat_2:253-270` | `qrcode.react` `QRCodeSVG` + brand mark center | onboarding page |
| Final CTA `เสร็จสิ้นและเริ่มแชท` | `arm_chat_2:273-276` | `Button variant="primary" size="lg"` | onboarding page |
| Minimal legal footer | `arm_chat_1:222-229` | new `AuthLegalFooter` (in `(auth)/layout.tsx`) | layout |

---

## 4. File Plan

| Action | Path |
|---|---|
| CREATE | `src/app/(auth)/layout.tsx` — strips Navbar/Footer, adds `AuthLegalFooter` |
| CREATE | `src/app/(auth)/login/page.tsx` — REWRITE (unified 2-CTA + phone OTP steps) |
| CREATE | `src/app/(auth)/register/page.tsx` — DELETE + redirect to `/login` |
| CREATE | `src/app/onboarding/page.tsx` — REWRITE (3-step wizard) |
| CREATE | `src/components/auth/OtpInput.tsx` — 6-digit auto-advance boxes |
| CREATE | `src/components/auth/OtpSimulator.tsx` — in-app verify simulator |
| CREATE | `src/components/auth/AuthLegalFooter.tsx` — Terms/Privacy/Help links |
| CREATE | `src/components/auth/UniqueIdCard.tsx` + `InviteLinkCard.tsx` — Step 2 |
| CREATE | `src/components/auth/AvatarUpload.tsx` — Step 1 avatar |
| CREATE | `src/lib/auth/otp.ts` — internal 6-digit OTP helpers (generate/verify) |
| CREATE | `src/lib/auth/session.ts` — `getSession()`, `onSignedIn(cb)`, profile-complete check |
| EDIT | `src/components/Navbar.tsx` — non-auth "เริ่มต้นใช้งาน" link `/onboarding` → `/login` |
| EDIT | `src/app/page.tsx` — hero CTA `/chats` → `/login` (audit F14) |

---

## 5. Verification Plan
1. `npx tsc --noEmit` → 0 errors
2. `npm run lint` → 0 errors (legacy warnings acceptable)
3. `npm run build` → PASS (all 16 pages prerender; env vars now set in Vercel)
4. Manual: `/login` options → phone step → OTP → success → onboarding Step1→2→3 → `/chats`
5. Manual: Google button triggers `SIGNED_IN` before redirect; failure shows error copy
6. `/register` direct URL → redirect to `/login`

---

## 6. Out of Scope (Phase 9)
- Server middleware / true route guard (needs session cookie strategy — later phase)
- Real SMS OTP provider (internal simulator only)
- Password recovery / email-password auth
- Track B DB migrations (design-only until DB access)

---

**Approval gate:** do not implement until the user approves this plan.
