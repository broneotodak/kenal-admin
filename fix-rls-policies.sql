-- RLS (Row Level Security) Fix for Kenal Admin
-- Run this in Supabase SQL Editor to fix data loading issues

-- Check current RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('kd_users', 'kd_identity');

-- Option 1: Disable RLS temporarily (for testing only)
-- WARNING: This makes data publicly accessible!
-- ALTER TABLE kd_users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE kd_identity DISABLE ROW LEVEL SECURITY;

-- Option 2: Create proper RLS policies for admin users
-- First, enable RLS if not already enabled
ALTER TABLE kd_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kd_identity ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin users can view all users" ON kd_users;
DROP POLICY IF EXISTS "Admin users can view all identities" ON kd_identity;
DROP POLICY IF EXISTS "Authenticated users can view users" ON kd_users;
DROP POLICY IF EXISTS "Authenticated users can view identities" ON kd_identity;

-- Create new policies for admin access
-- This allows authenticated users who are admins (user_type = 5) to view all data
CREATE POLICY "Admin users can view all users" ON kd_users
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM kd_users 
            WHERE id = auth.uid() 
            AND user_type = 5
        )
    );

CREATE POLICY "Admin users can view all identities" ON kd_identity
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM kd_users 
            WHERE id = auth.uid() 
            AND user_type = 5
        )
    );

-- Alternative: If you want all authenticated users to see the data
-- CREATE POLICY "Authenticated users can view users" ON kd_users
--     FOR SELECT 
--     TO authenticated
--     USING (true);

-- CREATE POLICY "Authenticated users can view identities" ON kd_identity
--     FOR SELECT 
--     TO authenticated
--     USING (true);

-- Check if policies were created successfully
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('kd_users', 'kd_identity')
ORDER BY tablename, policyname;
