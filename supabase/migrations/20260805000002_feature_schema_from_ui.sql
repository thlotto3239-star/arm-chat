-- ============================================================================
-- Arm Chat — Feature schema derived from UI design screens (43 mockups)
-- Status: APPLIED TO LIVE DB 2026-08-05
-- ที่มา: สกัด data requirements จาก code.html ของแต่ละหน้าโดยตรง:
--   arm_chat_11 (โพล), 21 (ติดดาว), 18 (ถาวร+muted), 41 (บล็อก), 42 (บรอดแคสต์),
--   17 (อุปกรณ์/sessions), 15 (รายงาน), 16 (ส่งออก), 20 (สำรอง), 2 (2FA/PIN/recovery),
--   3 (ล็อคหน้าจอ PIN), 9 (วอลเปเปอร์), 25 (invite link/QR), 22 (Discovery/verified),
--   23 (share location), 13 (preview/tone/muted), 10 (privacy visibility + disappearing),
--   stories (นับคนดู)
-- Idempotent: IF NOT EXISTS / ADD COLUMN IF NOT EXISTS / DROP POLICY IF EXISTS
-- ============================================================================

-- ---- 1) arm_chat_11: Polls -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    allow_multiple BOOLEAN DEFAULT false,
    is_closed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE IF NOT EXISTS public.poll_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    position INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS public.poll_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE,
    option_id UUID REFERENCES public.poll_options(id) ON DELETE CASCADE,
    voter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (option_id, voter_id)
);

-- ---- 2) arm_chat_21: Starred messages --------------------------------------
CREATE TABLE IF NOT EXISTS public.starred_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, message_id)
);

-- ---- 3) arm_chat_41: Blocked contacts --------------------------------------
CREATE TABLE IF NOT EXISTS public.blocked_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (blocker_id, blocked_id)
);

-- ---- 4) arm_chat_42: Broadcast lists ----------------------------------------
CREATE TABLE IF NOT EXISTS public.broadcast_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE IF NOT EXISTS public.broadcast_list_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID REFERENCES public.broadcast_lists(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (list_id, user_id)
);

-- ---- 5) arm_chat_17: Devices / active sessions ------------------------------
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_name TEXT NOT NULL,
    platform TEXT,
    is_current BOOLEAN DEFAULT false,
    last_active_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---- 6) arm_chat_15: Reports (มี category + details + block checkbox) -------
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    category TEXT NOT NULL,
    details TEXT,
    block_user BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---- 7) arm_chat_16: Data export (date range + format + data types) ---------
CREATE TABLE IF NOT EXISTS public.export_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date_from TIMESTAMPTZ,
    date_to TIMESTAMPTZ,
    format TEXT DEFAULT 'json',
    data_types TEXT[],
    status TEXT DEFAULT 'pending',
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---- 8) arm_chat_20: Backups (backup status + settings) ---------------------
CREATE TABLE IF NOT EXISTS public.backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    size_bytes BIGINT DEFAULT 0,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ---- 9) stories: นับคนดู (story_views) --------------------------------------
CREATE TABLE IF NOT EXISTS public.story_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (story_id, viewer_id)
);

-- ---- 10) ALTERs จากหน้าจอที่ต้องการ field เพิ่มใน table เดิม -----------------
-- arm_chat_18 (ถาวร), pin chat, arm_chat_9 (วอลเปเปอร์), arm_chat_13 (tone/muted)
ALTER TABLE public.room_members
    ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS wallpaper TEXT,
    ADD COLUMN IF NOT EXISTS notification_tone TEXT;

-- arm_chat_25 (invite link/QR), arm_chat_22 (Discovery/verified)
ALTER TABLE public.rooms
    ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- arm_chat_23 (share location)
ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS location_name TEXT;

-- arm_chat_2 (2FA/PIN/recovery), arm_chat_3 (lock PIN), arm_chat_10 (privacy/disappearing), arm_chat_13 (preview)
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS security_pin_hash TEXT,
    ADD COLUMN IF NOT EXISTS recovery_email TEXT,
    ADD COLUMN IF NOT EXISTS privacy_last_seen TEXT DEFAULT 'everyone',
    ADD COLUMN IF NOT EXISTS privacy_avatar TEXT DEFAULT 'everyone',
    ADD COLUMN IF NOT EXISTS privacy_about TEXT DEFAULT 'everyone',
    ADD COLUMN IF NOT EXISTS pref_show_preview BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS default_disappear_seconds INTEGER DEFAULT 0;

-- ---- 11) RLS ----------------------------------------------------------------
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.starred_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- polls: สมาชิกห้องอ่านได้, สมาชิกสร้างได้, เจ้าของโพลปิด/แก้ได้
DROP POLICY IF EXISTS "Members can read polls" ON public.polls;
CREATE POLICY "Members can read polls" ON public.polls
  FOR SELECT USING (public.is_room_member(room_id, auth.uid()));
DROP POLICY IF EXISTS "Members can create polls" ON public.polls;
CREATE POLICY "Members can create polls" ON public.polls
  FOR INSERT WITH CHECK (auth.uid() = creator_id AND public.is_room_member(room_id, auth.uid()));
DROP POLICY IF EXISTS "Poll creator can update" ON public.polls;
CREATE POLICY "Poll creator can update" ON public.polls
  FOR UPDATE USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Members can read poll options" ON public.poll_options;
CREATE POLICY "Members can read poll options" ON public.poll_options
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_options.poll_id AND public.is_room_member(p.room_id, auth.uid())));
DROP POLICY IF EXISTS "Poll creator can add options" ON public.poll_options;
CREATE POLICY "Poll creator can add options" ON public.poll_options
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_options.poll_id AND p.creator_id = auth.uid()));

DROP POLICY IF EXISTS "Members can read poll votes" ON public.poll_votes;
CREATE POLICY "Members can read poll votes" ON public.poll_votes
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_votes.poll_id AND public.is_room_member(p.room_id, auth.uid())));
DROP POLICY IF EXISTS "Members can vote" ON public.poll_votes;
CREATE POLICY "Members can vote" ON public.poll_votes
  FOR INSERT WITH CHECK (auth.uid() = voter_id);
DROP POLICY IF EXISTS "Voters can retract vote" ON public.poll_votes;
CREATE POLICY "Voters can retract vote" ON public.poll_votes
  FOR DELETE USING (auth.uid() = voter_id);

-- starred_messages: เจ้าของดาวจัดการเองเท่านั้น
DROP POLICY IF EXISTS "Users manage own starred" ON public.starred_messages;
CREATE POLICY "Users manage own starred" ON public.starred_messages
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- blocked_users: ผู้บล็อกจัดการเอง
DROP POLICY IF EXISTS "Users manage own blocks" ON public.blocked_users;
CREATE POLICY "Users manage own blocks" ON public.blocked_users
  FOR ALL USING (auth.uid() = blocker_id) WITH CHECK (auth.uid() = blocker_id);

-- broadcast_lists: เจ้าของจัดการ, สมาชิกอ่านรายชื่อตัวเอง
DROP POLICY IF EXISTS "Owner manages broadcast lists" ON public.broadcast_lists;
CREATE POLICY "Owner manages broadcast lists" ON public.broadcast_lists
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owner manages broadcast members" ON public.broadcast_list_members;
CREATE POLICY "Owner manages broadcast members" ON public.broadcast_list_members
  FOR ALL USING (EXISTS (SELECT 1 FROM public.broadcast_lists bl WHERE bl.id = broadcast_list_members.list_id AND bl.owner_id = auth.uid()));
DROP POLICY IF EXISTS "Members can read own membership" ON public.broadcast_list_members;
CREATE POLICY "Members can read own membership" ON public.broadcast_list_members
  FOR SELECT USING (auth.uid() = user_id);

-- devices / reports / export_requests / backups: เจ้าของจัดการเอง
DROP POLICY IF EXISTS "Users manage own devices" ON public.devices;
CREATE POLICY "Users manage own devices" ON public.devices
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create own reports" ON public.reports;
CREATE POLICY "Users create own reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);
DROP POLICY IF EXISTS "Users read own reports" ON public.reports;
CREATE POLICY "Users read own reports" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users manage own exports" ON public.export_requests;
CREATE POLICY "Users manage own exports" ON public.export_requests
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own backups" ON public.backups;
CREATE POLICY "Users manage own backups" ON public.backups
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- story_views: เจ้าของสตอรี่ดูคนดูได้, คนดูบันทึกตัวเอง
DROP POLICY IF EXISTS "Story owner reads views" ON public.story_views;
CREATE POLICY "Story owner reads views" ON public.story_views
  FOR SELECT USING (
    auth.uid() = viewer_id
    OR EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_views.story_id AND s.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Viewers record own view" ON public.story_views;
CREATE POLICY "Viewers record own view" ON public.story_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- ---- 12) Indexes -------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_polls_room ON public.polls (room_id);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll ON public.poll_options (poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll ON public.poll_votes (poll_id);
CREATE INDEX IF NOT EXISTS idx_starred_user ON public.starred_messages (user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_blocker ON public.blocked_users (blocker_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_members_list ON public.broadcast_list_members (list_id);
CREATE INDEX IF NOT EXISTS idx_devices_user ON public.devices (user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports (reporter_id);
CREATE INDEX IF NOT EXISTS idx_story_views_story ON public.story_views (story_id);

-- ============================================================================
-- DOWN (rollback): DROP TABLE 12 ตารางข้างต้น + DROP COLUMN ที่ ADD ไว้
-- (manual review ก่อนรัน)
-- ============================================================================
