-- =====================================================
-- KENAL ADMIN - AI CUSTOM DASHBOARD DATABASE MIGRATION
-- =====================================================
-- 
-- ⚠️  IMPORTANT: DO NOT EXECUTE THIS SCRIPT YET!
-- This is for planning and review only.
-- 
-- These tables will NOT disturb existing KENAL tables:
-- - kd_users (unchanged)
-- - kd_identity (unchanged) 
-- - All other existing tables remain untouched
-- 
-- New tables are completely separate and only reference 
-- existing tables via foreign keys (no modifications to existing schema)
-- =====================================================

-- 1. ADMIN CUSTOM DASHBOARDS TABLE
-- Stores each admin's dashboard configurations
CREATE TABLE admin_custom_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL, -- References auth.users(id) 
  dashboard_name VARCHAR(255) NOT NULL DEFAULT 'My Dashboard',
  is_active BOOLEAN DEFAULT true,
  layout_config JSONB NOT NULL DEFAULT '{
    "columns": 12,
    "gap": 16,
    "auto_size": true,
    "theme": "auto"
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  
  -- Constraints
  CONSTRAINT fk_admin_user FOREIGN KEY (admin_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT unique_admin_dashboard_name UNIQUE(admin_user_id, dashboard_name),
  CONSTRAINT dashboard_name_length CHECK (char_length(dashboard_name) >= 1)
);

-- 2. DASHBOARD CARDS/WIDGETS TABLE  
-- Stores individual cards/widgets for each dashboard
CREATE TABLE admin_dashboard_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL,
  card_type VARCHAR(50) NOT NULL, -- 'stat', 'chart', 'table', 'ai_insight'
  card_title VARCHAR(255) NOT NULL,
  ai_prompt TEXT, -- The AI prompt used to generate this card
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  width INTEGER NOT NULL DEFAULT 4, -- Grid width (1-12)
  height INTEGER NOT NULL DEFAULT 3, -- Grid height units
  is_collapsed BOOLEAN DEFAULT false,
  card_config JSONB NOT NULL DEFAULT '{}', -- Chart config, data queries, styling
  ai_generated_content JSONB, -- Store AI-generated insights/data
  data_source VARCHAR(100), -- Which table/view to query (kd_users, kd_identity, etc.)
  refresh_interval INTEGER DEFAULT 300, -- Auto-refresh in seconds (5 min default)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  
  -- Constraints
  CONSTRAINT fk_dashboard FOREIGN KEY (dashboard_id) REFERENCES admin_custom_dashboards(id) ON DELETE CASCADE,
  CONSTRAINT valid_card_type CHECK (card_type IN ('stat', 'chart', 'table', 'ai_insight')),
  CONSTRAINT valid_position CHECK (position_x >= 0 AND position_y >= 0),
  CONSTRAINT valid_dimensions CHECK (width >= 1 AND width <= 12 AND height >= 1 AND height <= 12),
  CONSTRAINT card_title_length CHECK (char_length(card_title) >= 1),
  CONSTRAINT valid_refresh_interval CHECK (refresh_interval >= 30) -- Minimum 30 seconds
);

-- 3. AI CHAT HISTORY TABLE
-- Store AI chat conversations for each admin
CREATE TABLE admin_ai_chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
  admin_user_id UUID NOT NULL,
  dashboard_id UUID, -- Optional: link to specific dashboard
  message_type VARCHAR(20) NOT NULL, -- 'user', 'assistant'
  message_content TEXT NOT NULL,
  ai_provider VARCHAR(20), -- 'openai', 'anthropic', 'local'
  ai_model VARCHAR(50), -- 'gpt-4', 'claude-3', etc.
  generated_card_id UUID, -- Link to card if this message generated one
  processing_time_ms INTEGER, -- Track AI response time
  token_usage JSONB, -- Track token consumption for cost analysis
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  
  -- Constraints
  CONSTRAINT fk_chat_admin_user FOREIGN KEY (admin_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_chat_dashboard FOREIGN KEY (dashboard_id) REFERENCES admin_custom_dashboards(id) ON DELETE CASCADE,
  CONSTRAINT fk_generated_card FOREIGN KEY (generated_card_id) REFERENCES admin_dashboard_cards(id) ON DELETE SET NULL,
  CONSTRAINT valid_message_type CHECK (message_type IN ('user', 'assistant')),
  CONSTRAINT valid_ai_provider CHECK (ai_provider IN ('openai', 'anthropic', 'local')),
  CONSTRAINT message_content_length CHECK (char_length(message_content) >= 1)
);

-- 4. DASHBOARD ANALYTICS TABLE (Optional - for tracking usage)
-- Track how admins use their custom dashboards
CREATE TABLE admin_dashboard_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  dashboard_id UUID NOT NULL,
  card_id UUID, -- Optional: specific card interaction
  event_type VARCHAR(50) NOT NULL, -- 'view', 'create', 'edit', 'delete', 'ai_query'
  event_data JSONB, -- Additional event details
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  
  -- Constraints
  CONSTRAINT fk_analytics_admin_user FOREIGN KEY (admin_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_analytics_dashboard FOREIGN KEY (dashboard_id) REFERENCES admin_custom_dashboards(id) ON DELETE CASCADE,
  CONSTRAINT fk_analytics_card FOREIGN KEY (card_id) REFERENCES admin_dashboard_cards(id) ON DELETE CASCADE,
  CONSTRAINT valid_event_type CHECK (event_type IN ('view', 'create', 'edit', 'delete', 'ai_query', 'refresh'))
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Dashboard queries
CREATE INDEX idx_admin_dashboards_user_id ON admin_custom_dashboards(admin_user_id);
CREATE INDEX idx_admin_dashboards_active ON admin_custom_dashboards(admin_user_id, is_active);

-- Card queries  
CREATE INDEX idx_dashboard_cards_dashboard_id ON admin_dashboard_cards(dashboard_id);
CREATE INDEX idx_dashboard_cards_position ON admin_dashboard_cards(dashboard_id, position_x, position_y);

-- Chat history queries
CREATE INDEX idx_chat_history_user_id ON admin_ai_chat_history(admin_user_id);
CREATE INDEX idx_chat_history_dashboard_id ON admin_ai_chat_history(dashboard_id);
CREATE INDEX idx_chat_history_created_at ON admin_ai_chat_history(created_at DESC);

-- Analytics queries
CREATE INDEX idx_dashboard_analytics_user_id ON admin_dashboard_analytics(admin_user_id);
CREATE INDEX idx_dashboard_analytics_dashboard_id ON admin_dashboard_analytics(dashboard_id);
CREATE INDEX idx_dashboard_analytics_created_at ON admin_dashboard_analytics(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE admin_custom_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_dashboard_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_ai_chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_dashboard_analytics ENABLE ROW LEVEL SECURITY;

-- Policies for admin_custom_dashboards
CREATE POLICY "Admins can view their own dashboards" ON admin_custom_dashboards
  FOR SELECT USING (
    auth.uid() = admin_user_id AND 
    EXISTS (SELECT 1 FROM kd_users WHERE id = auth.uid() AND user_type = 5)
  );

CREATE POLICY "Admins can create their own dashboards" ON admin_custom_dashboards
  FOR INSERT WITH CHECK (
    auth.uid() = admin_user_id AND 
    EXISTS (SELECT 1 FROM kd_users WHERE id = auth.uid() AND user_type = 5)
  );

CREATE POLICY "Admins can update their own dashboards" ON admin_custom_dashboards
  FOR UPDATE USING (
    auth.uid() = admin_user_id AND 
    EXISTS (SELECT 1 FROM kd_users WHERE id = auth.uid() AND user_type = 5)
  );

CREATE POLICY "Admins can delete their own dashboards" ON admin_custom_dashboards
  FOR DELETE USING (
    auth.uid() = admin_user_id AND 
    EXISTS (SELECT 1 FROM kd_users WHERE id = auth.uid() AND user_type = 5)
  );

-- Policies for admin_dashboard_cards (via dashboard ownership)
CREATE POLICY "Admins can view cards in their dashboards" ON admin_dashboard_cards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_custom_dashboards 
      WHERE id = dashboard_id 
      AND admin_user_id = auth.uid()
    ) AND 
    EXISTS (SELECT 1 FROM kd_users WHERE id = auth.uid() AND user_type = 5)
  );

CREATE POLICY "Admins can create cards in their dashboards" ON admin_dashboard_cards
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_custom_dashboards 
      WHERE id = dashboard_id 
      AND admin_user_id = auth.uid()
    ) AND 
    EXISTS (SELECT 1 FROM kd_users WHERE id = auth.uid() AND user_type = 5)
  );

CREATE POLICY "Admins can update cards in their dashboards" ON admin_dashboard_cards
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_custom_dashboards 
      WHERE id = dashboard_id 
      AND admin_user_id = auth.uid()
    ) AND 
    EXISTS (SELECT 1 FROM kd_users WHERE id = auth.uid() AND user_type = 5)
  );

CREATE POLICY "Admins can delete cards in their dashboards" ON admin_dashboard_cards
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admin_custom_dashboards 
      WHERE id = dashboard_id 
      AND admin_user_id = auth.uid()
    ) AND 
    EXISTS (SELECT 1 FROM kd_users WHERE id = auth.uid() AND user_type = 5)
  );

-- Similar policies for admin_ai_chat_history and admin_dashboard_analytics
-- (Following same pattern - admin can only access their own data)

-- =====================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_admin_custom_dashboards_updated_at 
  BEFORE UPDATE ON admin_custom_dashboards 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_dashboard_cards_updated_at 
  BEFORE UPDATE ON admin_dashboard_cards 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL DATA (Optional)
-- =====================================================

-- Create a default dashboard for existing admin users
-- (This would be run after the tables are created)
/*
INSERT INTO admin_custom_dashboards (admin_user_id, dashboard_name, is_active)
SELECT 
  id as admin_user_id,
  'Default Dashboard' as dashboard_name,
  true as is_active
FROM kd_users 
WHERE user_type = 5;
*/

-- =====================================================
-- SAFETY CHECKS
-- =====================================================

-- Verify no existing tables are affected
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name LIKE 'admin_%';

-- Check foreign key references
-- SELECT * FROM information_schema.table_constraints 
-- WHERE constraint_type = 'FOREIGN KEY' 
-- AND table_name LIKE 'admin_%';

-- =====================================================
-- ROLLBACK PLAN (If needed)
-- =====================================================

-- To rollback this migration:
-- DROP TABLE IF EXISTS admin_dashboard_analytics CASCADE;
-- DROP TABLE IF EXISTS admin_ai_chat_history CASCADE;  
-- DROP TABLE IF EXISTS admin_dashboard_cards CASCADE;
-- DROP TABLE IF EXISTS admin_custom_dashboards CASCADE;
-- DROP FUNCTION IF EXISTS update_updated_at_column();

-- =====================================================
-- NOTES
-- =====================================================

-- 1. These tables are completely separate from existing KENAL tables
-- 2. Only foreign key references to auth.users (standard Supabase table)
-- 3. No modifications to kd_users, kd_identity, or any existing tables
-- 4. RLS policies ensure admins only see their own data
-- 5. All tables include proper constraints and indexes for performance
-- 6. Triggers maintain updated_at timestamps automatically
-- 7. Can be safely rolled back if needed

-- =====================================================
-- EXECUTION PLAN
-- =====================================================

-- Phase 1: Create tables (this script)
-- Phase 2: Test with sample data on development
-- Phase 3: Deploy to production during maintenance window
-- Phase 4: Create default dashboards for existing admins
-- Phase 5: Monitor performance and adjust indexes if needed 