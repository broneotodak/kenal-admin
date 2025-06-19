-- Check what auth tables and session data we have available
-- This will help us understand if we can track real user activity

-- 1. Check if auth.users table exists and what data it contains
SELECT 
    table_name, 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'auth' 
  AND table_name IN ('users', 'sessions', 'audit_log_entries')
ORDER BY table_name, ordinal_position;

-- 2. Check what columns auth.users has (if it exists)
-- Look for last_sign_in_at, updated_at, etc.
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'auth' AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. Sample auth.users data to see what activity tracking fields exist
-- (This might fail if we don't have permission)
-- SELECT 
--     id, 
--     email, 
--     created_at, 
--     updated_at, 
--     last_sign_in_at, 
--     email_confirmed_at,
--     phone_confirmed_at
-- FROM auth.users 
-- LIMIT 5;

-- 4. Check if there are any activity or session tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema IN ('auth', 'public')
  AND table_name LIKE '%session%' 
   OR table_name LIKE '%activity%' 
   OR table_name LIKE '%log%'
   OR table_name LIKE '%audit%';

-- 5. Check our kd_users table for any activity tracking fields
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'kd_users'
  AND (column_name LIKE '%last%' 
    OR column_name LIKE '%active%' 
    OR column_name LIKE '%session%'
    OR column_name LIKE '%login%'
    OR column_name LIKE '%updated%')
ORDER BY ordinal_position; 