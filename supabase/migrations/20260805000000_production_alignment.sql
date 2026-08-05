-- ============================================================================
-- Arm Chat — Production Alignment Migration
-- Status: VERIFIED AGAINST LIVE DB (2026-08-05 audit via direct connection)
-- Derived from: live DB audit + UI mockup requirements (edit/delete/pin
-- messages, group admin roles, friend accept/reject, story delete, etc.)
-- Idempotent: safe to run multiple times (IF NOT EXISTS / DROP IF EXISTS)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) test_results — MISSING in live DB (referenced by src/app/test-suite/page.tsx)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_data JSONB NOT NULL,
    passed_count INTEGER DEFAULT 0,
    total_count INTEGER DEFAULT 24,
    status TEXT DEFAULT 'PASSED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read for test_results" ON public.test_results;
CREATE POLICY "Allow public read for test_results" ON public.test_results FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for test_results" ON public.test_results;
CREATE POLICY "Allow insert for test_results" ON public.test_results FOR INSERT WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 2) messages — missing UPDATE/DELETE (edit, reactions, pin, read receipt, soft delete)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE USING (auth.uid() = sender_id) WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;
CREATE POLICY "Users can delete their own messages" ON public.messages
  FOR DELETE USING (auth.uid() = sender_id);

-- Members can mark messages as read (update read_by on others' messages in their rooms)
DROP POLICY IF EXISTS "Members can update read receipts in their rooms" ON public.messages;
CREATE POLICY "Members can update read receipts in their rooms" ON public.messages
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.room_members rm WHERE rm.room_id = messages.room_id AND rm.user_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- 3) rooms — missing UPDATE (rename group, change avatar/banner/description)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Room members can update their room" ON public.rooms;
CREATE POLICY "Room members can update their room" ON public.rooms
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.room_members rm WHERE rm.room_id = rooms.id AND rm.user_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- 4) stories — missing UPDATE/DELETE (delete own story, views/reactions update)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update their own stories" ON public.stories;
CREATE POLICY "Users can update their own stories" ON public.stories
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own stories" ON public.stories;
CREATE POLICY "Users can delete their own stories" ON public.stories
  FOR DELETE USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 5) friendships — missing UPDATE (accept/reject) and DELETE (unfriend)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update their friendships" ON public.friendships;
CREATE POLICY "Users can update their friendships" ON public.friendships
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can delete their friendships" ON public.friendships;
CREATE POLICY "Users can delete their friendships" ON public.friendships
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- ----------------------------------------------------------------------------
-- 6) room_members — missing UPDATE (mute, role change) and DELETE (leave/kick)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Members can update own row or admins manage" ON public.room_members;
CREATE POLICY "Members can update own row or admins manage" ON public.room_members
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.room_members rm
      WHERE rm.room_id = room_members.room_id AND rm.user_id = auth.uid() AND rm.role IN ('admin', 'owner')
    )
  );

DROP POLICY IF EXISTS "Members can leave or admins can remove" ON public.room_members;
CREATE POLICY "Members can leave or admins can remove" ON public.room_members
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.room_members rm
      WHERE rm.room_id = room_members.room_id AND rm.user_id = auth.uid() AND rm.role IN ('admin', 'owner')
    )
  );

-- ----------------------------------------------------------------------------
-- 7) conversations / conversation_members / calls — RLS enabled but ZERO policies
--    (deny-by-default => every query fails). Add member-scoped policies.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Members can read their conversations" ON public.conversations;
CREATE POLICY "Members can read their conversations" ON public.conversations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.conversation_members cm WHERE cm.conversation_id = conversations.id AND cm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Members can update their conversations" ON public.conversations;
CREATE POLICY "Members can update their conversations" ON public.conversations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.conversation_members cm WHERE cm.conversation_id = conversations.id AND cm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Members can read conversation members" ON public.conversation_members;
CREATE POLICY "Members can read conversation members" ON public.conversation_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.conversation_members cm WHERE cm.conversation_id = conversation_members.conversation_id AND cm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Authenticated users can add conversation members" ON public.conversation_members;
CREATE POLICY "Authenticated users can add conversation members" ON public.conversation_members
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can leave conversations" ON public.conversation_members;
CREATE POLICY "Users can leave conversations" ON public.conversation_members
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Members can read calls of their conversations" ON public.calls;
CREATE POLICY "Members can read calls of their conversations" ON public.calls
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.conversation_members cm WHERE cm.conversation_id = calls.conversation_id AND cm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Members can start calls in their conversations" ON public.calls;
CREATE POLICY "Members can start calls in their conversations" ON public.calls
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (SELECT 1 FROM public.conversation_members cm WHERE cm.conversation_id = calls.conversation_id AND cm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Call creator can update call status" ON public.calls;
CREATE POLICY "Call creator can update call status" ON public.calls
  FOR UPDATE USING (auth.uid() = created_by);

-- ----------------------------------------------------------------------------
-- 8) group_activity_logs — missing INSERT (members logging group events)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Members can insert group_activity_logs" ON public.group_activity_logs;
CREATE POLICY "Members can insert group_activity_logs" ON public.group_activity_logs
  FOR INSERT WITH CHECK (
    auth.uid() = actor_id
    AND EXISTS (SELECT 1 FROM public.room_members rm WHERE rm.room_id = group_activity_logs.room_id AND rm.user_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- 9) Indexes for common query paths (A8 mitigation)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_messages_room_created ON public.messages (room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications_history (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_friendships_user ON public.friendships (user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON public.friendships (friend_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user ON public.room_members (user_id);
CREATE INDEX IF NOT EXISTS idx_stories_user ON public.stories (user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires ON public.stories (expires_at);
CREATE INDEX IF NOT EXISTS idx_conversation_members_user ON public.conversation_members (user_id);
CREATE INDEX IF NOT EXISTS idx_calls_conversation ON public.calls (conversation_id);

-- ============================================================================
-- DOWN (rollback)
-- DROP POLICY + DROP INDEX for every object created above, and
-- DROP TABLE IF EXISTS public.test_results;
-- (kept manual — rollback must be reviewed before execution)
-- ============================================================================
