-- Complete RLS Fix for Kenal Admin
-- This script fixes all common Supabase data loading issues

-- 1. First, check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename IN ('kd_users', 'kd_identity');

-- 2. Enable RLS on tables (if not already enabled)
ALTER TABLE kd_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kd_identity ENABLE ROW LEVEL SECURITY;

-- 3. Drop ALL existing policies to start fresh
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('kd_users', 'kd_identity')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 4. Create comprehensive policies for authenticated users
-- These policies allow authenticated users to read data

-- Policy for kd_users table
CREATE POLICY "Enable read access for authenticated users" ON kd_users
    FOR SELECT 
    TO authenticated
    USING (true);

-- Policy for kd_identity table
CREATE POLICY "Enable read access for authenticated users" ON kd_identity
    FOR SELECT 
    TO authenticated
    USING (true);

-- 5. Create specific admin policies (more restrictive option)
-- Uncomment these and comment out the above if you want admin-only access
/*
CREATE POLICY "Admin users can view all users" ON kd_users
    FOR SELECT 
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT id FROM kd_users 
            WHERE user_type = 5
        )
    );

CREATE POLICY "Admin users can view all identities" ON kd_identity
    FOR SELECT 
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT id FROM kd_users 
            WHERE user_type = 5
        )
    );
*/

-- 6. Verify the policies were created
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('kd_users', 'kd_identity')
ORDER BY tablename, policyname;

-- 7. Grant necessary permissions (usually already set, but just in case)
GRANT SELECT ON kd_users TO authenticated;
GRANT SELECT ON kd_identity TO authenticated;

-- 8. Test query to verify access
-- This should return data if policies are working
SELECT COUNT(*) as user_count FROM kd_users;
SELECT COUNT(*) as identity_count FROM kd_identity;

-- 9. ALTERNATIVE: Temporary disable RLS for testing
-- WARNING: Only use this for debugging! Re-enable after testing!
-- ALTER TABLE kd_users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE kd_identity DISABLE ROW LEVEL SECURITY;
