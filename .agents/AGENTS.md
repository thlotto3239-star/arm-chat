# Workspace Rules & Instructions (AGENTS.md)

## 📌 Working Rules & Methodology (กฎในการทำงาน)

1. **Thorough Context & Document Reading (อ่านเอกสารและเข้าใจโปรเจกต์ก่อนเสมอ)**
   - Before proposing changes or executing code, thoroughly read all existing documentation, design files (`design.md`), and explore the full project codebase.
   - Fully understand the overall project architecture, structure, design system, and user flows.

2. **Analysis, Planning & Formal Presentation (วิเคราะห์ วางแผน และนำเสนอทุกครั้ง)**
   - After reviewing documentation and requirements, ALWAYS perform a detailed analysis and create an explicit implementation plan before proceeding to execution.
   - Present proposed plans clearly with structured steps and user flows.

3. **Grounding in Real Code & Project Facts (อ้างอิงจากโค้ดและข้อเท็จจริงในโปรเจกต์จริง)**
   - All references, file paths, code symbols, dependencies, and assertions must be strictly derived from actual files in the current workspace.
   - Never assume or hallucinate non-existent files, routes, schemas, or dependencies.
   - Fact-based verification rule: When checking items/ingredients, verify the exact count against factual data. If ingredients or items exceed 2 or 3, record and log them explicitly in the workspace rules/notebook.

## 📓 Workspace Fact Log (บันทึกข้อมูลจริงที่ตรวจสอบจากโค้ด)
- **Database Tables Count**: 5 tables (`public.profiles`, `public.rooms`, `public.messages`, `public.stories`, `public.test_results`) [Exceeds 3, explicitly logged]
- **Storage Buckets Count**: 2 buckets (`avatars`, `chat-media`)
- **Checklist Sections Count**: 24 categories [Exceeds 3, explicitly logged]
- **Core Route Folders Count**: 11 route directories (`(auth)`, `api`, `call`, `chat`, `chats`, `flow`, `friends`, `qr`, `settings`, `stories`, `test-suite`) [Exceeds 3, explicitly logged]

