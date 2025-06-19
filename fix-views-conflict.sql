-- QUICK FIX: Drop existing views to resolve column naming conflicts
-- Run this first, then run the main views SQL

-- Drop all potentially conflicting views
DROP VIEW IF EXISTS admin_dashboard_stats CASCADE;
DROP VIEW IF EXISTS admin_recent_users CASCADE;
DROP VIEW IF EXISTS admin_chart_hourly CASCADE;
DROP VIEW IF EXISTS admin_chart_daily CASCADE;
DROP VIEW IF EXISTS admin_chart_monthly CASCADE;
DROP VIEW IF EXISTS admin_user_analytics CASCADE;

-- Also drop any old versions that might exist
DROP VIEW IF EXISTS dashboard_stats CASCADE;
DROP VIEW IF EXISTS recent_users CASCADE;
DROP VIEW IF EXISTS chart_hourly CASCADE;
DROP VIEW IF EXISTS chart_daily CASCADE;
DROP VIEW IF EXISTS chart_monthly CASCADE;
DROP VIEW IF EXISTS user_analytics CASCADE;

SELECT 'Views dropped successfully! Now run final-optimized-views.sql' as status; 