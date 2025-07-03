-- Disable RLS on admin_custom_dashboards table
-- This allows all authenticated users with admin privileges to access the table
ALTER TABLE admin_custom_dashboards DISABLE ROW LEVEL SECURITY;

-- Optional: You can also drop the existing policies if they exist
-- DROP POLICY IF EXISTS "Admins can view their own dashboards" ON admin_custom_dashboards;
-- DROP POLICY IF EXISTS "Admins can create their own dashboards" ON admin_custom_dashboards;
-- DROP POLICY IF EXISTS "Admins can update their own dashboards" ON admin_custom_dashboards;
-- DROP POLICY IF EXISTS "Admins can delete their own dashboards" ON admin_custom_dashboards; 