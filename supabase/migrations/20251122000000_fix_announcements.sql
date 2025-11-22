-- Fix announcements table type mismatch
-- Run this in your Supabase SQL Editor

-- Drop existing announcements table and recreate with correct types
DROP TABLE IF EXISTS public.announcements CASCADE;

CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'warning', 'success', 'error')) DEFAULT 'info',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active announcements viewable by everyone" ON public.announcements;
CREATE POLICY "Active announcements viewable by everyone"
  ON public.announcements FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can manage announcements" ON public.announcements;
CREATE POLICY "Anyone can manage announcements"
  ON public.announcements FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
