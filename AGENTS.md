# Workspace Rules & Instructions (AGENTS.md)

## 📌 Working Rules & Methodology

1. **Thorough Context & Document Reading**
   - Before proposing changes or executing code, thoroughly read all existing documentation, design files, and explore the full project codebase.
   - Fully understand the overall project architecture, structure, design system, and user flows.

2. **Analysis, Planning & Formal Presentation**
   - After reviewing documentation and requirements, ALWAYS perform a detailed analysis and create an explicit implementation plan before proceeding to execution.
   - Present proposed plans clearly with structured steps and user flows.

3. **Grounding in Real Code & Project Facts**
   - All references, file paths, code symbols, dependencies, and assertions must be strictly derived from actual files in the current workspace.
   - Never assume or hallucinate non-existent files, routes, schemas, or dependencies.
   - Fact-based verification rule: When checking items/ingredients, verify the exact count against factual data. If ingredients or items exceed 2 or 3, record and log them explicitly in the workspace rules/notebook.

## 📓 Workspace Fact Log (บันทึกข้อมูลจริงที่ตรวจสอบจากโค้ด)
- **Database Tables Count**: 13 tables บน live DB (verified 2026-08-05 ผ่าน direct connection): `call_logs`, `calls`, `conversation_members`, `conversations`, `friendships`, `group_activity_logs`, `messages`, `notifications_history`, `profiles`, `room_members`, `rooms`, `stories`, `test_results` [Exceeds 3, explicitly logged]
- **Storage Buckets Count**: 3 buckets (`avatars`, `chat-media`, `stories`) — มี storage.objects policies ครบ (verified 2026-08-05)
- **RLS**: ทุก table มี policy อย่างน้อย 1 อัน (verified 2026-08-05) — แก้ bug `42P17 infinite recursion` ด้วย SECURITY DEFINER functions (`is_room_member`, `is_room_admin`, `is_conversation_member`) ใน `supabase/migrations/20260805000001_fix_rls_recursion.sql`
- **Checklist Sections Count**: 24 categories [Exceeds 3, explicitly logged]
- **Core Route Folders Count**: 11 route directories (`(auth)`, `api`, `call`, `chat`, `chats`, `flow`, `friends`, `qr`, `settings`, `stories`, `test-suite`) [Exceeds 3, explicitly logged]

