# ADR 0004: Versioning Policy

- Status: ACCEPTED
- Date: Sprint 0B (initial)
- Deciders: Tech Lead + DevOps

## Context

โปรเจกต์ Arm Chat ไม่มี versioning story ที่ชัดเจน:
- ไม่มี branch strategy (`main`, `develop`, feature branch)
- ไม่มี git tag
- `package.json` version เป็น `0.1.0` แบบคงที่
- Deploy ขึ้น Vercel อัตโนมัติทุก commit → ไม่รู้ production เทียบกับ commit ใด

## Decision

ใช้ **Semantic Versioning + Branch Strategy**:

### Branch strategy
- `main` = production (deploy ไป Vercel auto)
- `develop` = integration branch (Sprint 1+)
- `feature/<scope>-<desc>` = feature branch (e.g. `feature/chat-sidebar`)
- `fix/<scope>-<desc>` = bugfix branch
- `release/<vX.Y.Z>` = release prep (optional)

### Semantic Versioning
- `v<major>.<minor>.<patch>` (e.g. `v1.0.0`)
- **Major**: breaking change (schema breaking, API breaking, UI overhaul)
- **Minor**: backward-compatible feature
- **Patch**: bugfix

### Tag
- `git tag v<X.Y.Z>` ทุก release บน `main`
- ก่อน deploy production: tag + push tag
- Baseline tag `baseline-pre-refactor` อยู่ที่ commit `efcbb64`

### Release flow
1. PR merge `feature/*` → `develop`
2. PR merge `develop` → `main`
3. Tag `v<X.Y.Z>` บน commit ที่ deploy
4. Vercel auto-deploy จาก `main`

## Consequences

### ข้อดี
- Rollback "go back to v1.2.0" ชัดเจน
- Production กับ commit mapping ชัด
- ทีมเข้าใจว่า breaking vs backward-compatible แยกยังไง
- PR / issue อ้าง tag ได้

### ข้อเสีย
- ต้อง discipline ทุก release
- Squash merge ทำให้ history สั้น — อาจต้องดู PR diff แทน commit log

## Alternatives ที่ปฏิเสธ

### A. Commit SHA อย่างเดียว (ไม่ tag)
- มนุษย์จำ SHA ไม่ได้ → rollback ยาก

### B. Date-based versioning (`v2026.08.04`)
- บอก release date ไม่บอก semantic → ไม่รู้ว่า breaking หรือไม่

## References

- Semantic Versioning 2.0.0 (semver.org)
- Git Flow (Vincent Driessen)
- ARCHITECTURE_GUARD.md §10 (Git & Commits)