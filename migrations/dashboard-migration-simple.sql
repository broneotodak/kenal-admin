-- =====================================================
-- KENAL ADMIN - DASHBOARD SAVE FUNCTIONALITY (SIMPLE)
-- =====================================================
-- 
-- Quick migration to enable dashboard save/load functionality
-- Run this in Supabase SQL Editor
-- 
-- =====================================================

-- 1. ADMIN CUSTOM DASHBOARDS TABLE (ESSENTIAL)
CREATE TABLE IF NOT EXISTS admin_custom_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  dashboard_name VARCHAR(255) NOT NULL DEFAULT 'My Dashboard',
  is_active BOOLEAN DEFAULT true,
  dashboard_config JSONB NOT NULL DEFAULT '{"cards": [], "layout": {"columns": 12}}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  
  -- Constraints
  CONSTRAINT fk_admin_user FOREIGN KEY (admin_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT unique_admin_dashboard_name UNIQUE(admin_user_id, dashboard_name),
  CONSTRAINT dashboard_name_length CHECK (char_length(dashboard_name) >= 1)
);

-- 2. ENABLE ROW LEVEL SECURITY
ALTER TABLE admin_custom_dashboards ENABLE ROW LEVEL SECURITY;

-- 3. CREATE RLS POLICIES (Admin-only access)
CREATE POLICY "Admins can view their own dashboards" ON admin_custom_dashboards
  FOR SELECT USING (auth.uid() = admin_user_id);

CREATE POLICY "Admins can create their own dashboards" ON admin_custom_dashboards
  FOR INSERT WITH CHECK (auth.uid() = admin_user_id);

CREATE POLICY "Admins can update their own dashboards" ON admin_custom_dashboards
  FOR UPDATE USING (auth.uid() = admin_user_id);

CREATE POLICY "Admins can delete their own dashboards" ON admin_custom_dashboards
  FOR DELETE USING (auth.uid() = admin_user_id);

-- 4. CREATE PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_admin_dashboards_user_id ON admin_custom_dashboards(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_dashboards_active ON admin_custom_dashboards(admin_user_id, is_active);

-- 5. ADD TRIGGER FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_custom_dashboards_updated_at 
  BEFORE UPDATE ON admin_custom_dashboards 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

-- Check if table was created successfully
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'admin_custom_dashboards'
ORDER BY ordinal_position;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

-- If no errors above, your dashboard save functionality is ready!
-- You can now use Save/Load/Rename features in the custom dashboard.

COMMENT ON TABLE admin_custom_dashboards IS 'Dashboard save functionality - READY FOR USE!'; 