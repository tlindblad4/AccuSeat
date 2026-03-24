-- AccuSeat Database Setup
-- Run this in Supabase SQL Editor

-- 1. Create tables
\i schema.sql

-- 2. Create storage bucket for photos
-- Go to Storage → New Bucket → Name: "seat-photos" → Public: false

-- 3. Set up storage policies
-- Go to Storage → seat-photos → Policies

-- Policy: Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'seat-photos');

-- Policy: Allow public read (for share links)
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'seat-photos');

-- 4. Create first admin user (run after creating user in Auth)
-- Replace with actual user ID after signup
-- INSERT INTO user_venues (user_id, venue_id, role) 
-- VALUES ('user-uuid-here', NULL, 'admin');
