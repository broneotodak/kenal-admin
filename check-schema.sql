-- Run this in Supabase SQL Editor to check the actual table schemas

-- Check kd_users table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'kd_users' 
ORDER BY ordinal_position;

-- Check kd_identity table structure  
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'kd_identity' 
ORDER BY ordinal_position;

-- Sample data from kd_users (first 2 rows)
SELECT * FROM kd_users LIMIT 2;

-- Sample data from kd_identity (first 2 rows)  
SELECT * FROM kd_identity LIMIT 2; 