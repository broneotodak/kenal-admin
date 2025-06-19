-- KENAL Admin Dashboard - Optimized Database Views
-- Execute these in your Supabase SQL Editor to create high-performance views

-- =====================================================
-- 1. DASHBOARD STATS VIEW
-- Pre-calculated dashboard statistics updated in real-time
-- =====================================================

CREATE OR REPLACE VIEW admin_dashboard_stats AS
WITH user_stats AS (
    SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today_registrations,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as last_30_days_users,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '60 days' AND created_at < CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as previous_30_days_users
    FROM kd_users
),
identity_stats AS (
    SELECT 
        COUNT(DISTINCT user_id) as active_users
    FROM kd_identity
    WHERE user_id IS NOT NULL
),
growth_calculations AS (
    SELECT 
        user_stats.*,
        identity_stats.active_users,
        CASE 
            WHEN previous_30_days_users > 0 
            THEN ROUND(((last_30_days_users::DECIMAL - previous_30_days_users::DECIMAL) / previous_30_days_users::DECIMAL) * 100, 1)
            ELSE 0 
        END as user_growth_percentage
    FROM user_stats
    CROSS JOIN identity_stats
)
SELECT 
    total_users,
    active_users,
    today_registrations,
    user_growth_percentage,
    -- Static values for now (can be calculated later when revenue tracking is added)
    452808 as total_revenue,
    8.3 as active_growth_percentage,
    15.2 as revenue_growth_percentage,
    CASE WHEN today_registrations > 0 THEN 13.8 ELSE 0 END as today_growth_percentage,
    NOW() as last_updated
FROM growth_calculations;

-- =====================================================
-- 2. RECENT USERS VIEW  
-- Optimized recent users with all required dashboard fields
-- =====================================================

CREATE OR REPLACE VIEW admin_recent_users AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.created_at,
    u.country,
    u.join_by_invitation,
    -- Add formatted display values
    COALESCE(u.country, 'Unknown') as country_display,
    CASE WHEN u.join_by_invitation = true THEN 'Invited' ELSE 'Direct' END as registration_type,
    -- Add user identity status
    CASE WHEN i.user_id IS NOT NULL THEN true ELSE false END as has_identity,
    -- Add time formatting helpers
    DATE(u.created_at) as join_date,
    TO_CHAR(u.created_at, 'YYYY-MM-DD HH24:MI') as join_datetime_formatted
FROM kd_users u
LEFT JOIN (
    SELECT DISTINCT user_id 
    FROM kd_identity 
    WHERE user_id IS NOT NULL
) i ON u.id = i.user_id
ORDER BY u.created_at DESC
LIMIT 10;

-- =====================================================
-- 3. CHART DATA VIEWS
-- Pre-aggregated time-series data for different time periods
-- =====================================================

-- Hourly data for 24-hour chart
CREATE OR REPLACE VIEW admin_chart_hourly AS
WITH hourly_buckets AS (
    SELECT 
        generate_series(
            DATE_TRUNC('hour', NOW() - INTERVAL '23 hours'),
            DATE_TRUNC('hour', NOW()),
            INTERVAL '1 hour'
        ) as hour_bucket
),
user_registrations AS (
    SELECT 
        DATE_TRUNC('hour', created_at) as hour_bucket,
        COUNT(*) as new_users,
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'id', id,
                'name', name,
                'email', email,
                'country', country,
                'registration_type', CASE WHEN join_by_invitation THEN 'Invited' ELSE 'Direct' END,
                'time', TO_CHAR(created_at, 'HH24:MI')
            )
        ) as user_details
    FROM kd_users
    WHERE created_at >= NOW() - INTERVAL '24 hours'
    GROUP BY DATE_TRUNC('hour', created_at)
),
identity_registrations AS (
    SELECT 
        DATE_TRUNC('hour', created_at) as hour_bucket,
        COUNT(DISTINCT user_id) as users_with_identity
    FROM kd_identity
    WHERE created_at >= NOW() - INTERVAL '24 hours'
    GROUP BY DATE_TRUNC('hour', created_at)
)
SELECT 
    hb.hour_bucket,
    TO_CHAR(hb.hour_bucket, 'HH12 AM') as hour_label,
    COALESCE(ur.new_users, 0) as new_users,
    COALESCE(ir.users_with_identity, 0) as users_with_identity,
    COALESCE(ur.user_details, '[]'::json) as user_details
FROM hourly_buckets hb
LEFT JOIN user_registrations ur ON hb.hour_bucket = ur.hour_bucket
LEFT JOIN identity_registrations ir ON hb.hour_bucket = ir.hour_bucket
ORDER BY hb.hour_bucket;

-- Daily data for 7-day chart
CREATE OR REPLACE VIEW admin_chart_daily AS
WITH daily_buckets AS (
    SELECT 
        generate_series(
            DATE_TRUNC('day', NOW() - INTERVAL '6 days'),
            DATE_TRUNC('day', NOW()),
            INTERVAL '1 day'
        ) as day_bucket
),
user_registrations AS (
    SELECT 
        DATE_TRUNC('day', created_at) as day_bucket,
        COUNT(*) as new_users,
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'id', id,
                'name', name,
                'email', email,
                'country', country,
                'registration_type', CASE WHEN join_by_invitation THEN 'Invited' ELSE 'Direct' END,
                'date', TO_CHAR(created_at, 'MM-DD')
            )
        ) as user_details
    FROM kd_users
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY DATE_TRUNC('day', created_at)
),
identity_registrations AS (
    SELECT 
        DATE_TRUNC('day', created_at) as day_bucket,
        COUNT(DISTINCT user_id) as users_with_identity
    FROM kd_identity
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY DATE_TRUNC('day', created_at)
)
SELECT 
    db.day_bucket,
    TO_CHAR(db.day_bucket, 'Dy Mon DD') as day_label,
    COALESCE(ur.new_users, 0) as new_users,
    COALESCE(ir.users_with_identity, 0) as users_with_identity,
    COALESCE(ur.user_details, '[]'::json) as user_details
FROM daily_buckets db
LEFT JOIN user_registrations ur ON db.day_bucket = ur.day_bucket
LEFT JOIN identity_registrations ir ON db.day_bucket = ir.day_bucket
ORDER BY db.day_bucket;

-- Monthly data for 12-month chart
CREATE OR REPLACE VIEW admin_chart_monthly AS
WITH monthly_buckets AS (
    SELECT 
        generate_series(
            DATE_TRUNC('month', NOW() - INTERVAL '11 months'),
            DATE_TRUNC('month', NOW()),
            INTERVAL '1 month'
        ) as month_bucket
),
user_registrations AS (
    SELECT 
        DATE_TRUNC('month', created_at) as month_bucket,
        COUNT(*) as new_users,
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'id', id,
                'name', name,
                'email', email,
                'country', country,
                'registration_type', CASE WHEN join_by_invitation THEN 'Invited' ELSE 'Direct' END,
                'month', TO_CHAR(created_at, 'Mon YYYY')
            )
        ) as user_details
    FROM kd_users
    WHERE created_at >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', created_at)
),
identity_registrations AS (
    SELECT 
        DATE_TRUNC('month', created_at) as month_bucket,
        COUNT(DISTINCT user_id) as users_with_identity
    FROM kd_identity
    WHERE created_at >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', created_at)
)
SELECT 
    mb.month_bucket,
    TO_CHAR(mb.month_bucket, 'Mon YY') as month_label,
    COALESCE(ur.new_users, 0) as new_users,
    COALESCE(ir.users_with_identity, 0) as users_with_identity,
    COALESCE(ur.user_details, '[]'::json) as user_details
FROM monthly_buckets mb
LEFT JOIN user_registrations ur ON mb.month_bucket = ur.month_bucket
LEFT JOIN identity_registrations ir ON mb.month_bucket = ir.month_bucket
ORDER BY mb.month_bucket;

-- =====================================================
-- 4. USER ACTIVITY SUMMARY VIEW
-- Combined user and identity data for comprehensive analysis
-- =====================================================

CREATE OR REPLACE VIEW admin_user_summary AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.created_at,
    u.country,
    u.join_by_invitation,
    -- Identity information
    CASE WHEN i.user_id IS NOT NULL THEN true ELSE false END as has_identity,
    i.identity_count,
    i.first_identity_date,
    i.latest_identity_date,
    -- Calculated fields
    CASE WHEN u.join_by_invitation THEN 'Invited' ELSE 'Direct' END as registration_type,
    COALESCE(u.country, 'Unknown') as country_display,
    DATE(u.created_at) as join_date,
    EXTRACT(DAYS FROM NOW() - u.created_at) as days_since_joined,
    -- Activity scoring (can be enhanced later)
    CASE 
        WHEN i.identity_count > 0 THEN 'Active'
        WHEN EXTRACT(DAYS FROM NOW() - u.created_at) <= 7 THEN 'New'
        ELSE 'Inactive'
    END as activity_status
FROM kd_users u
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as identity_count,
        MIN(created_at) as first_identity_date,
        MAX(created_at) as latest_identity_date
    FROM kd_identity
    WHERE user_id IS NOT NULL
    GROUP BY user_id
) i ON u.id = i.user_id;

-- =====================================================
-- 5. INDEXES FOR OPTIMAL PERFORMANCE
-- Create indexes to support the views efficiently
-- =====================================================

-- Indexes for kd_users table (if not already exist)
CREATE INDEX IF NOT EXISTS idx_kd_users_created_at ON kd_users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kd_users_country ON kd_users(country);
CREATE INDEX IF NOT EXISTS idx_kd_users_join_by_invitation ON kd_users(join_by_invitation);
CREATE INDEX IF NOT EXISTS idx_kd_users_created_date ON kd_users(DATE(created_at));

-- Indexes for kd_identity table (if not already exist)
CREATE INDEX IF NOT EXISTS idx_kd_identity_user_id ON kd_identity(user_id);
CREATE INDEX IF NOT EXISTS idx_kd_identity_created_at ON kd_identity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kd_identity_user_created ON kd_identity(user_id, created_at);

-- =====================================================
-- 6. REFRESH FUNCTION (Optional)
-- Function to refresh materialized views if needed later
-- =====================================================

CREATE OR REPLACE FUNCTION refresh_admin_views()
RETURNS void AS $$
BEGIN
    -- Currently using regular views which auto-refresh
    -- If we convert to materialized views later, refresh them here
    -- REFRESH MATERIALIZED VIEW admin_dashboard_stats;
    -- etc.
    
    RAISE NOTICE 'Admin views refreshed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant permissions to authenticated users (adjust as needed)
GRANT SELECT ON admin_dashboard_stats TO authenticated;
GRANT SELECT ON admin_recent_users TO authenticated;
GRANT SELECT ON admin_chart_hourly TO authenticated;
GRANT SELECT ON admin_chart_daily TO authenticated;
GRANT SELECT ON admin_chart_monthly TO authenticated;
GRANT SELECT ON admin_user_summary TO authenticated; 