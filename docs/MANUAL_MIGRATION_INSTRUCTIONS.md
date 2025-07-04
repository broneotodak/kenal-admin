# 🚀 **MANUAL MIGRATION INSTRUCTIONS**

## **How to Run the AI Custom Dashboard Migration in Supabase**

Since the MCP tools have permission restrictions, you'll need to run the migration manually in your Supabase dashboard. Here's the step-by-step process:

---

## 📋 **STEP 1: Access Supabase SQL Editor**

1. **Go to**: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **Select your project**: `etkuxatycjqwvfjjwxqm` (KENAL database)
3. **Navigate to**: SQL Editor (left sidebar)
4. **Click**: "New Query"

---

## 📊 **STEP 2: Run Migration in 4 Parts**

### **Part 1: Create Main Dashboard Table**
```sql
-- 1. ADMIN CUSTOM DASHBOARDS TABLE (OPTIMIZED)
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
```

**Click "Run" and verify**: ✅ Should show "Success. No rows returned"

---

### **Part 2: Create Dashboard Cards Table**
```sql
-- 2. DASHBOARD CARDS TABLE (HEAVILY OPTIMIZED WITH JSONB)
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
```

**Click "Run" and verify**: ✅ Should show "Success. No rows returned"

---

### **Part 3: Create AI Chat History Table**
```sql
-- 3. AI CHAT HISTORY TABLE (OPTIMIZED WITH JSONB)
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
```

**Click "Run" and verify**: ✅ Should show "Success. No rows returned"

---

### **Part 4: Create Analytics Table**
```sql
-- 4. DASHBOARD ANALYTICS TABLE (SIMPLIFIED WITH JSONB)
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
```

**Click "Run" and verify**: ✅ Should show "Success. No rows returned"

---

## 🔒 **STEP 3: Add Row Level Security (RLS)**

### **Part 5: Enable RLS and Create Policies**
```sql
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
```

**Click "Run" and verify**: ✅ Should show "Success. No rows returned"

---

### **Part 6: Add More RLS Policies**
```sql
-- Policies for admin_dashboard_cards
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
```

**Click "Run" and verify**: ✅ Should show "Success. No rows returned"

---

### **Part 7: Final RLS Policies**
```sql
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
```

**Click "Run" and verify**: ✅ Should show "Success. No rows returned"

---

## ⚡ **STEP 4: Add Performance Indexes**

### **Part 8: Create Indexes**
```sql
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
```

**Click "Run" and verify**: ✅ Should show "Success. No rows returned"

---

## 🔄 **STEP 5: Add Helper Functions & Triggers**

### **Part 9: Create Helper Functions**
```sql
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

-- Helper functions for JSONB operations
CREATE OR REPLACE FUNCTION get_card_title(card_config JSONB)
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(card_config->'basic'->>'title', 'Untitled Card');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_card_type(card_config JSONB)
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(card_config->'basic'->>'type', 'stat');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION is_card_collapsed(card_config JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE((card_config->'display'->>'collapsed')::boolean, false);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

**Click "Run" and verify**: ✅ Should show "Success. No rows returned"

---

## ✅ **STEP 6: Verify Migration Success**

### **Part 10: Test the Tables**
```sql
-- Check that all tables were created successfully
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'admin_%'
ORDER BY table_name;
```

**Expected Result**: Should show 4 tables:
- `admin_ai_chat_history`
- `admin_custom_dashboards`
- `admin_dashboard_analytics`
- `admin_dashboard_cards`

### **Part 11: Test JSONB Functionality**
```sql
-- Test inserting a sample dashboard (replace 'your-admin-user-id' with actual UUID)
-- You can get your user ID from: SELECT auth.uid();

-- First, let's see your user ID:
SELECT auth.uid() as my_user_id;
```

---

## 🎉 **MIGRATION COMPLETE!**

Once all parts run successfully:

1. ✅ **4 new tables created** with JSONB optimization
2. ✅ **RLS policies enabled** for admin isolation
3. ✅ **Performance indexes created** for fast queries
4. ✅ **Helper functions added** for JSONB operations
5. ✅ **Triggers enabled** for automatic timestamps

## 🔍 **Verify in Supabase Dashboard**

1. **Go to**: Database → Tables
2. **Check**: You should see 4 new tables starting with `admin_`
3. **Inspect**: Click on any table to see the JSONB columns and structure

## 🚀 **Ready for Phase 2!**

Your database is now ready for AI Custom Dashboard functionality! The frontend will be able to:
- Create/save custom dashboards
- Store AI chat history
- Save dashboard cards with JSONB configuration
- Track usage analytics

---

## ⚠️ **Rollback (If Needed)**

If you need to undo the migration, run this:
```sql
DROP TABLE IF EXISTS admin_dashboard_analytics CASCADE;
DROP TABLE IF EXISTS admin_ai_chat_history CASCADE;  
DROP TABLE IF EXISTS admin_dashboard_cards CASCADE;
DROP TABLE IF EXISTS admin_custom_dashboards CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS get_card_title(JSONB);
DROP FUNCTION IF EXISTS get_card_type(JSONB);
DROP FUNCTION IF EXISTS is_card_collapsed(JSONB);
``` 