-- Super simple view test - this should work since analytics page uses these exact columns

CREATE OR REPLACE VIEW test_recent_users AS
SELECT 
    id,
    created_at,
    country,
    join_by_invitation
FROM kd_users
ORDER BY created_at DESC
LIMIT 5;

-- Test the view
SELECT * FROM test_recent_users; 