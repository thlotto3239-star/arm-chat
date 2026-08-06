# Release Checklist

> รายการตรวจสอบก่อนปล่อยขึ้น Production ทุกครั้ง
> Version: 1 (Sprint 0B)

## ก่อน Deploy

### Environment Variables
- [ ] ทุก required env var ตั้งใน Vercel env vars (ไม่ใช่ fallback)
- [ ] `.env.example` เป็น placeholders เท่านั้น
- [ ] ไม่มี secret ใน `.env.example`, `package.json`, หรือ source code
- [ ] `npm run build` ผ่านด้วย production env (ไม่ใช่ dev env)
- [ ] ทุก `NEXT_PUBLIC_*` ที่โค้ดอ้าง = มีใน Vercel env
- [ ] ทุก server-only secret (`SUPABASE_SERVICE_ROLE_KEY`, `LIVEKIT_API_SECRET`, `GOOGLE_CLIENT_SECRET`, `ONESIGNAL_REST_API_KEY`) ไม่ถูก expose ผ่าน `NEXT_PUBLIC_*`

### Database (Track B)
- [ ] Database backup snapshot สร้างก่อน migration
- [ ] Migration รันผ่านใน staging ก่อน production
- [ ] Rollback script (`down` migration) ทดสอบแล้ว
- [ ] ทุก assumption ใน `docs/db-assumptions.md` verify แล้ว
- [ ] RLS policies ครบทุก table
- [ ] storage.objects policies ครบทุก bucket
- [ ] Triggers ทดสอบ (`handle_new_user`, `update_updated_at`)
- [ ] Indexes ครบตาม query pattern

### Code Quality
- [ ] `tsc --noEmit` 0 errors
- [ ] `next lint` 0 errors
- [ ] `next build` exit 0
- [ ] `npm test` pass (Vitest — เมื่อมี)
- [ ] `npm run test:e2e` pass (Playwright — Phase 2+)
- [ ] `depcruise` no circular (Sprint 3+)
- [ ] `npm audit` ไม่มี critical/high (Quality — warn only)

### Performance
- [ ] Initial JS < 250 KB
- [ ] Route chunk < 150 KB
- [ ] Lighthouse Performance ≥ 95
- [ ] Lighthouse Accessibility ≥ 95
- [ ] LCP < 2.5 s
- [ ] CLS < 0.1
- [ ] INP < 200 ms

### Accessibility
- [ ] Keyboard navigation ผ่านทุก page
- [ ] Tab order logical ทุก page
- [ ] Focus visible ทุก interactive element
- [ ] Color contrast WCAG AA
- [ ] Screen reader test ผ่าน (NVDA / VoiceOver)
- [ ] `prefers-reduced-motion` ทำงาน

### Security
- [ ] `npm audit --audit-level=high` ผ่าน
- [ ] ไม่มี hardcoded secrets (grep in `src/`)
- [ ] CSP header ตั้งใน `next.config.mjs`
- [ ] X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy ตั้งครบ
- [ ] ไม่มี `dangerouslySetInnerHTML` โดยไม่มี reason
- [ ] Webhook endpoints verify signature และ idempotent
- [ ] Rate limit บน auth endpoints

### Realtime
- [ ] Realtime channel cleanup on unmount (grep useEffect cleanup)
- [ ] Reconnect on offline/online works
- [ ] Typing indicator debounce ถูกต้อง
- [ ] Presence multi-device sync works
- [ ] Realtime status badge live

### Notification
- [ ] OneSignal permission prompt บน user gesture เท่านั้น
- [ ] Push delivery background + terminated works (mobile)
- [ ] Deep link opens correct chat room
- [ ] Badge counter accurate
- [ ] Mute / DND honored

### Call (LiveKit)
- [ ] Token endpoint verify auth + room membership
- [ ] Hangup 释放 media tracks หมด
- [ ] Camera switch works
- [ ] Mic toggle works
- [ ] Screen share works
- [ ] Reconnect on network loss

## ในระหว่าง Deploy

- [ ] ก่อน tag `vX.Y.Z`: build ผ่าน, test ผ่าน, smoke ผ่าน
- [ ] `git tag vX.Y.Z` บน commit ที่ deploy
- [ ] Vercel deploy เสร็จ (watch progress)
- [ ] Production smoke test pass (all critical routes)

## หลัง Deploy

- [ ] Error tracking (Sentry) ไม่มี error spike
- [ ] Performance monitoring (Vercel Analytics) ภายในเป้า
- [ ] User reports no regression
- [ ] Log monitoring 1 ชั่วโมงแรก (ไม่มี unexpected errors)
- [ ] Update `docs/project-status.md` progress bars

## Rollback Plan

หากเกิด critical issue:

1. `git revert <commit>` หรือ `git reset --hard <previous-tag>` บน `main`
2. รัน migration `down` (Track B) ถ้าเกี่ยวกับ DB
3. Vercel auto-redeploy จาก commit ใหม่
4. Verify rollback ผ่าน smoke test
5. บันทึก postmortem ใน `docs/incidents/`

---

## ตัวอย่าง Release Flow

```
1. PR merge feature/* → develop
2. CI gate pass on develop
3. PR develop → main
4. Final smoke test
5. git checkout main && git pull && npm run build
6. git tag -a v1.2.0 -m "Release v1.2.0"
7. git push origin main --tags
8. Vercel auto-deploy
9. Production smoke test
10. Update project-status.md
```