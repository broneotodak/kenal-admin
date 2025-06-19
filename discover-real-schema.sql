-- Find the REAL table structure in your KENAL Supabase

-- 1. Check what columns exist in kd_users
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'kd_users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check what columns exist in kd_identity  
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'kd_identity' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. List all tables to see if there are other relevant ones
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 4. Sample data from kd_users (just first 2 rows to see structure)
SELECT * FROM kd_users LIMIT 2; 