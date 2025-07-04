-- =====================================================
-- KENAL ADMIN - AI CUSTOM DASHBOARD DATABASE MIGRATION (OPTIMIZED)
-- =====================================================
-- 
-- OPTIMIZED VERSION: Uses JSONB extensively for flexibility
-- Reduces column count and improves maintainability
-- 
-- =====================================================

-- 1. ADMIN CUSTOM DASHBOARDS TABLE (OPTIMIZED)
-- Stores each admin's dashboard configurations with JSONB
CREATE TABLE admin_custom_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  dashboard_name VARCHAR(255) NOT NULL DEFAULT 'My Dashboard',
  is_active BOOLEAN DEFAULT true,
  dashboard_config JSONB NOT NULL DEFAULT '{
    "layout": {
      "columns": 12,
      "gap": 16,
      "auto_size": true,
      "theme": "auto"
    },
    "settings": {
      "auto_refresh": true,
      "refresh_interval": 300,
      "show_timestamps": true,
      "compact_mode": false
    },
    "metadata": {
      "version": "1.0",
      "last_modified_by": null,
      "card_count": 0
    }
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  
  -- Constraints
  CONSTRAINT fk_admin_user FOREIGN KEY (admin_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT unique_admin_dashboard_name UNIQUE(admin_user_id, dashboard_name),
  CONSTRAINT dashboard_name_length CHECK (char_length(dashboard_name) >= 1)
);

-- 2. DASHBOARD CARDS TABLE (HEAVILY OPTIMIZED WITH JSONB)
-- Stores individual cards/widgets with all configuration in JSONB
CREATE TABLE admin_dashboard_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL,
  card_config JSONB NOT NULL DEFAULT '{
    "basic": {
      "type": "stat",
      "title": "New Card",
      "description": null
    },
    "position": {
      "x": 0,
      "y": 0,
      "width": 4,
      "height": 3
    },
    "display": {
      "collapsed": false,
      "theme": "auto",
      "show_header": true,
      "show_footer": false
    },
    "data": {
      "source": null,
      "query": null,
      "refresh_interval": 300,
      "last_updated": null
    },
    "ai": {
      "prompt": null,
      "provider": null,
      "model": null,
      "generated_content": null,
      "generation_timestamp": null,
      "token_usage": null
    },
    "chart": {
      "type": null,
      "options": {},
      "colors": [],
      "animations": true
    },
    "interactions": {
      "clickable": false,
      "drilldown": false,
      "export_enabled": true
    }
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  
  -- Constraints
  CONSTRAINT fk_dashboard FOREIGN KEY (dashboard_id) REFERENCES admin_custom_dashboards(id) ON DELETE CASCADE
);

-- 3. AI CHAT HISTORY TABLE (OPTIMIZED WITH JSONB)
-- Store AI chat conversations with metadata in JSONB
CREATE TABLE admin_ai_chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
  admin_user_id UUID NOT NULL,
  dashboard_id UUID, -- Optional: link to specific dashboard
  message_data JSONB NOT NULL DEFAULT '{
    "type": "user",
    "content": "",
    "timestamp": null,
    "ai": {
      "provider": null,
      "model": null,
      "processing_time_ms": null,
      "token_usage": {
        "prompt_tokens": 0,
        "completion_tokens": 0,
        "total_tokens": 0,
        "estimated_cost": 0
      }
    },
    "context": {
      "generated_card_id": null,
      "user_intent": null,
      "data_sources_mentioned": [],
      "follow_up_suggestions": []
    },
    "metadata": {
      "session_id": null,
      "ip_address": null,
      "user_agent": null
    }
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  
  -- Constraints
  CONSTRAINT fk_chat_admin_user FOREIGN KEY (admin_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_chat_dashboard FOREIGN KEY (dashboard_id) REFERENCES admin_custom_dashboards(id) ON DELETE CASCADE
);

-- 4. DASHBOARD ANALYTICS TABLE (SIMPLIFIED WITH JSONB)
-- Track dashboard usage with flexible event data
CREATE TABLE admin_dashboard_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{
    "type": "view",
    "dashboard_id": null,
    "card_id": null,
    "details": {},
    "performance": {
      "load_time_ms": null,
      "data_fetch_time_ms": null,
      "render_time_ms": null
    },
    "user_context": {
      "session_duration": null,
      "previous_action": null,
      "device_type": null
    }
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  
  -- Constraints
  CONSTRAINT fk_analytics_admin_user FOREIGN KEY (admin_user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- =====================================================
-- INDEXES FOR PERFORMANCE (JSONB OPTIMIZED)
-- =====================================================

-- Dashboard queries
CREATE INDEX idx_admin_dashboards_user_id ON admin_custom_dashboards(admin_user_id);
CREATE INDEX idx_admin_dashboards_active ON admin_custom_dashboards(admin_user_id, is_active);

-- JSONB indexes for dashboard config
CREATE INDEX idx_dashboard_config_layout ON admin_custom_dashboards USING GIN ((dashboard_config->'layout'));
CREATE INDEX idx_dashboard_config_settings ON admin_custom_dashboards USING GIN ((dashboard_config->'settings'));

-- Card queries with JSONB indexes
CREATE INDEX idx_dashboard_cards_dashboard_id ON admin_dashboard_cards(dashboard_id);
CREATE INDEX idx_card_config_basic ON admin_dashboard_cards USING GIN ((card_config->'basic'));
CREATE INDEX idx_card_config_position ON admin_dashboard_cards USING GIN ((card_config->'position'));
CREATE INDEX idx_card_config_data_source ON admin_dashboard_cards USING GIN ((card_config->'data'->'source'));

-- Chat history with JSONB indexes
CREATE INDEX idx_chat_history_user_id ON admin_ai_chat_history(admin_user_id);
CREATE INDEX idx_chat_history_dashboard_id ON admin_ai_chat_history(dashboard_id);
CREATE INDEX idx_chat_history_created_at ON admin_ai_chat_history(created_at DESC);
CREATE INDEX idx_chat_message_type ON admin_ai_chat_history USING GIN ((message_data->'type'));
CREATE INDEX idx_chat_ai_provider ON admin_ai_chat_history USING GIN ((message_data->'ai'->'provider'));

-- Analytics with JSONB indexes
CREATE INDEX idx_dashboard_analytics_user_id ON admin_dashboard_analytics(admin_user_id);
CREATE INDEX idx_dashboard_analytics_created_at ON admin_dashboard_analytics(created_at DESC);
CREATE INDEX idx_analytics_event_type ON admin_dashboard_analytics USING GIN ((event_data->'type'));
CREATE INDEX idx_analytics_dashboard_id ON admin_dashboard_analytics USING GIN ((event_data->'dashboard_id'));

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

-- Policies for admin_ai_chat_history
CREATE POLICY "Admins can view their own chat history" ON admin_ai_chat_history
  FOR SELECT USING (
    auth.uid() = admin_user_id AND 
    EXISTS (SELECT 1 FROM kd_users WHERE id = auth.uid() AND user_type = 5)
  );

CREATE POLICY "Admins can create their own chat history" ON admin_ai_chat_history
  FOR INSERT WITH CHECK (
    auth.uid() = admin_user_id AND 
    EXISTS (SELECT 1 FROM kd_users WHERE id = auth.uid() AND user_type = 5)
  );

-- Policies for admin_dashboard_analytics
CREATE POLICY "Admins can view their own analytics" ON admin_dashboard_analytics
  FOR SELECT USING (
    auth.uid() = admin_user_id AND 
    EXISTS (SELECT 1 FROM kd_users WHERE id = auth.uid() AND user_type = 5)
  );

CREATE POLICY "Admins can create their own analytics" ON admin_dashboard_analytics
  FOR INSERT WITH CHECK (
    auth.uid() = admin_user_id AND 
    EXISTS (SELECT 1 FROM kd_users WHERE id = auth.uid() AND user_type = 5)
  );

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
-- HELPER FUNCTIONS FOR JSONB OPERATIONS
-- =====================================================

-- Function to safely get card title from JSONB
CREATE OR REPLACE FUNCTION get_card_title(card_config JSONB)
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(card_config->'basic'->>'title', 'Untitled Card');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to safely get card type from JSONB
CREATE OR REPLACE FUNCTION get_card_type(card_config JSONB)
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(card_config->'basic'->>'type', 'stat');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if card is collapsed
CREATE OR REPLACE FUNCTION is_card_collapsed(card_config JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE((card_config->'display'->>'collapsed')::boolean, false);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- SAMPLE QUERIES FOR TESTING
-- =====================================================

-- Example: Get all dashboards for an admin with card counts
/*
SELECT 
  d.id,
  d.dashboard_name,
  d.is_active,
  d.dashboard_config->'layout'->>'columns' as grid_columns,
  COUNT(c.id) as card_count,
  d.created_at
FROM admin_custom_dashboards d
LEFT JOIN admin_dashboard_cards c ON d.id = c.dashboard_id
WHERE d.admin_user_id = auth.uid()
GROUP BY d.id, d.dashboard_name, d.is_active, d.dashboard_config, d.created_at
ORDER BY d.created_at DESC;
*/

-- Example: Get cards with their AI-generated content
/*
SELECT 
  c.id,
  get_card_title(c.card_config) as title,
  get_card_type(c.card_config) as type,
  c.card_config->'position'->>'x' as pos_x,
  c.card_config->'position'->>'y' as pos_y,
  c.card_config->'ai'->>'prompt' as ai_prompt,
  c.card_config->'ai'->'generated_content' as ai_content
FROM admin_dashboard_cards c
JOIN admin_custom_dashboards d ON c.dashboard_id = d.id
WHERE d.admin_user_id = auth.uid()
  AND NOT is_card_collapsed(c.card_config)
ORDER BY (c.card_config->'position'->>'y')::int, (c.card_config->'position'->>'x')::int;
*/

-- =====================================================
-- ROLLBACK PLAN (If needed)
-- =====================================================

-- To rollback this migration:
/*
DROP TABLE IF EXISTS admin_dashboard_analytics CASCADE;
DROP TABLE IF EXISTS admin_ai_chat_history CASCADE;  
DROP TABLE IF EXISTS admin_dashboard_cards CASCADE;
DROP TABLE IF EXISTS admin_custom_dashboards CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS get_card_title(JSONB);
DROP FUNCTION IF EXISTS get_card_type(JSONB);
DROP FUNCTION IF EXISTS is_card_collapsed(JSONB);
*/ 