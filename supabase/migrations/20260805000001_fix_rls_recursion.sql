-- ============================================================================
-- Arm Chat — Fix RLS infinite recursion (42P17)
-- Status: VERIFIED — live error reproduced: querying rooms/messages/room_members
--         returned "infinite recursion detected in policy for relation room_members"
-- Root cause: policies on room_members / conversation_members reference their
--             own table in an EXISTS subquery.
-- Fix: SECURITY DEFINER helper functions bypass RLS inside the check.
-- Idempotent: CREATE OR REPLACE + DROP POLICY IF EXISTS.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_room_member(room uuid, uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.room_members WHERE room_id = room AND user_id = uid);
$$;

CREATE OR REPLACE FUNCTION public.is_room_admin(room uuid, uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.room_members WHERE room_id = room AND user_id = uid AND role IN ('admin', 'owner'));
$$;

CREATE OR REPLACE FUNCTION public.is_conversation_member(conv uuid, uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = conv AND user_id = uid);
$$;

-- room_members (self-referencing policies)
DROP POLICY IF EXISTS "Allow members to read members list" ON public.room_members;
CREATE POLICY "Allow members to read members list" ON public.room_members
  FOR SELECT USING (public.is_room_member(room_id, auth.uid()));

DROP POLICY IF EXISTS "Members can update own row or admins manage" ON public.room_members;
CREATE POLICY "Members can update own row or admins manage" ON public.room_members
  FOR UPDATE USING (auth.uid() = user_id OR public.is_room_admin(room_id, auth.uid()));

DROP POLICY IF EXISTS "Members can leave or admins can remove" ON public.room_members;
CREATE POLICY "Members can leave or admins can remove" ON public.room_members
  FOR DELETE USING (auth.uid() = user_id OR public.is_room_admin(room_id, auth.uid()));

-- rooms
DROP POLICY IF EXISTS "Allow users to read rooms they are members of" ON public.rooms;
CREATE POLICY "Allow users to read rooms they are members of" ON public.rooms
  FOR SELECT USING (public.is_room_member(id, auth.uid()));

DROP POLICY IF EXISTS "Room members can update their room" ON public.rooms;
CREATE POLICY "Room members can update their room" ON public.rooms
  FOR UPDATE USING (public.is_room_member(id, auth.uid()));

-- messages
DROP POLICY IF EXISTS "Allow members to read room messages" ON public.messages;
CREATE POLICY "Allow members to read room messages" ON public.messages
  FOR SELECT USING (public.is_room_member(room_id, auth.uid()));

DROP POLICY IF EXISTS "Members can update read receipts in their rooms" ON public.messages;
CREATE POLICY "Members can update read receipts in their rooms" ON public.messages
  FOR UPDATE USING (public.is_room_member(room_id, auth.uid()));

-- conversation_members (self-referencing policy created in 20260805000000)
DROP POLICY IF EXISTS "Members can read conversation members" ON public.conversation_members;
CREATE POLICY "Members can read conversation members" ON public.conversation_members
  FOR SELECT USING (public.is_conversation_member(conversation_id, auth.uid()));

-- conversations
DROP POLICY IF EXISTS "Members can read their conversations" ON public.conversations;
CREATE POLICY "Members can read their conversations" ON public.conversations
  FOR SELECT USING (public.is_conversation_member(id, auth.uid()));

DROP POLICY IF EXISTS "Members can update their conversations" ON public.conversations;
CREATE POLICY "Members can update their conversations" ON public.conversations
  FOR UPDATE USING (public.is_conversation_member(id, auth.uid()));

-- calls
DROP POLICY IF EXISTS "Members can read calls of their conversations" ON public.calls;
CREATE POLICY "Members can read calls of their conversations" ON public.calls
  FOR SELECT USING (public.is_conversation_member(conversation_id, auth.uid()));

DROP POLICY IF EXISTS "Members can start calls in their conversations" ON public.calls;
CREATE POLICY "Members can start calls in their conversations" ON public.calls
  FOR INSERT WITH CHECK (auth.uid() = created_by AND public.is_conversation_member(conversation_id, auth.uid()));

-- ============================================================================
-- DOWN (rollback): re-create previous EXISTS-based policies, then
-- DROP FUNCTION public.is_room_member, is_room_admin, is_conversation_member;
-- ============================================================================
