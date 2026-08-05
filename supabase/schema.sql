-- Supabase Database Schema for Arm Chat
-- Project ref comes from SUPABASE_PROJECT_REF env var; not hardcoded here.
--
-- ⚠️ SNAPSHOT WARNING (2026-08-05): live DB มี 13 tables (มากกว่าไฟล์นี้)
-- และมี columns/policies/functions เพิ่มเติม — ดู deltas ที่ verify กับ live DB แล้วใน
--   supabase/migrations/20260805000000_production_alignment.sql
--   supabase/migrations/20260805000001_fix_rls_recursion.sql
-- ผล live audit ล่าสุดอยู่ใน docs/db-assumptions.md (ทุก assumption VERIFIED แล้ว)

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    online_status BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Rooms Table
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    is_group BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text', -- 'text', 'image', 'audio'
    media_url TEXT,
    read_by JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Stories Table (24h vanishing status)
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    caption TEXT,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '24 hours') NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Test Results Table (Production Readiness Log)
CREATE TABLE IF NOT EXISTS public.test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_data JSONB NOT NULL,
    passed_count INTEGER DEFAULT 0,
    total_count INTEGER DEFAULT 24,
    status TEXT DEFAULT 'PASSED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read for profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow public read for messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Users can insert messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Allow public read for active stories" ON public.stories FOR SELECT USING (expires_at > now());
CREATE POLICY "Users can insert stories" ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow public read for test_results" ON public.test_results FOR SELECT USING (true);
CREATE POLICY "Allow insert for test_results" ON public.test_results FOR INSERT WITH CHECK (true);

-- Storage Buckets Configuration
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-media', 'chat-media', true) ON CONFLICT (id) DO NOTHING;
