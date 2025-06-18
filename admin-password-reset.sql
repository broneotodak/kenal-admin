-- Admin Password Reset Script for KENAL
-- Run this in Supabase SQL Editor to reset an admin user's password

-- OPTION 1: Reset password for a specific admin user
-- Replace 'your-new-password' with your desired password
UPDATE auth.users 
SET encrypted_password = crypt('your-new-password', gen_salt('bf'))
WHERE email = 'neo@todak.com';

-- OPTION 2: List all admin users (user_type = 5) with their auth status
SELECT 
    ku.id,
    ku.email,
    ku.name,
    ku.user_type,
    CASE 
        WHEN au.id IS NOT NULL THEN 'Has Auth Account'
        ELSE 'No Auth Account'
    END as auth_status,
    au.created_at as auth_created_at
FROM kd_users ku
LEFT JOIN auth.users au ON ku.id = au.id
WHERE ku.user_type = 5
ORDER BY ku.name;

-- OPTION 3: Create auth account for admin users who don't have one
-- This is useful if an admin exists in kd_users but not in auth.users
-- Uncomment and modify as needed:
/*
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
)
SELECT 
    ku.id,
    ku.email,
    crypt('temporary-password', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object('name', ku.name)
FROM kd_users ku
LEFT JOIN auth.users au ON ku.id = au.id
WHERE ku.user_type = 5
AND au.id IS NULL;
*/