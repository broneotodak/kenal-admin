-- Create admin_dashboards table for saving custom dashboards
CREATE TABLE IF NOT EXISTS admin_dashboards (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    dashboard_config JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: one dashboard name per user
    UNIQUE(user_id, name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_dashboards_user_id ON admin_dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_dashboards_name ON admin_dashboards(name);
CREATE INDEX IF NOT EXISTS idx_admin_dashboards_updated_at ON admin_dashboards(updated_at);

-- Add Row Level Security (RLS) - only users can access their own dashboards
ALTER TABLE admin_dashboards ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own dashboards
CREATE POLICY "Users can view own dashboards" ON admin_dashboards
    FOR SELECT USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own dashboards
CREATE POLICY "Users can create own dashboards" ON admin_dashboards
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own dashboards
CREATE POLICY "Users can update own dashboards" ON admin_dashboards
    FOR UPDATE USING (auth.uid()::text = user_id);

-- Policy: Users can delete their own dashboards
CREATE POLICY "Users can delete own dashboards" ON admin_dashboards
    FOR DELETE USING (auth.uid()::text = user_id);

-- Insert some example dashboard names for testing
COMMENT ON TABLE admin_dashboards IS 'Stores custom dashboard configurations for admin users';
COMMENT ON COLUMN admin_dashboards.user_id IS 'Supabase user ID who owns this dashboard';
COMMENT ON COLUMN admin_dashboards.name IS 'Dashboard name (e.g., "My Analytics", "Daily Overview")';
COMMENT ON COLUMN admin_dashboards.dashboard_config IS 'JSON configuration of all dashboard cards and settings'; 