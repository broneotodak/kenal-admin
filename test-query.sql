-- Simple test query to verify table structure
-- Run this first to make sure basic queries work

-- Test basic kd_users query
SELECT id, created_at, country, join_by_invitation 
FROM kd_users 
LIMIT 2;

-- Test basic kd_identity query  
SELECT user_id, created_at
FROM kd_identity 
LIMIT 2;

-- Test join between tables
SELECT u.id, u.created_at, u.country, i.user_id
FROM kd_users u
LEFT JOIN kd_identity i ON u.id = i.user_id
LIMIT 2; 