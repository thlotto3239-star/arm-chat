-- Supabase SQL Migration Script: Create test_results table
-- Target: Arm Chat Test Suite Execution History Logging

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create test_results table
CREATE TABLE IF NOT EXISTS public.test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_data JSONB NOT NULL,
    passed_count INTEGER DEFAULT 0,
    total_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'PASSED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

-- Drop policies if exist to enable idempotent execution
DROP POLICY IF EXISTS "Allow public read for test_results" ON public.test_results;
DROP POLICY IF EXISTS "Allow insert for test_results" ON public.test_results;

-- Create RLS Policies
CREATE POLICY "Allow public read for test_results" ON public.test_results FOR SELECT USING (true);
CREATE POLICY "Allow insert for test_results" ON public.test_results FOR INSERT WITH CHECK (true);

-- Index for fast ordering by created_at
CREATE INDEX IF NOT EXISTS idx_test_results_created_at ON public.test_results (created_at DESC);
