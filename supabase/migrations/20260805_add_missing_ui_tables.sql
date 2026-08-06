-- Migration: Add missing UI tables and columns (arm_chat_40, arm_chat_41, arm_chat_42, arm_chat_43, etc.)

-- 1. Update Profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status_message TEXT;

-- 2. Update Rooms table
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS is_broadcast BOOLEAN DEFAULT false;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. Update Messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb;

-- 4. Create Blocked Contacts table
CREATE TABLE IF NOT EXISTS public.blocked_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    blocked_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_blocked UNIQUE (user_id, blocked_user_id)
);
ALTER TABLE public.blocked_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage blocked contacts" ON public.blocked_contacts;
CREATE POLICY "Users can manage blocked contacts" ON public.blocked_contacts FOR ALL USING (auth.uid() = user_id);

-- 5. Create Friend Requests table
CREATE TABLE IF NOT EXISTS public.friend_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_sender_receiver UNIQUE (sender_id, receiver_id)
);
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view friend requests" ON public.friend_requests;
CREATE POLICY "Users can view friend requests" ON public.friend_requests FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 6. Create Help Articles table
CREATE TABLE IF NOT EXISTS public.help_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read for help_articles" ON public.help_articles;
CREATE POLICY "Allow public read for help_articles" ON public.help_articles FOR SELECT USING (true);
