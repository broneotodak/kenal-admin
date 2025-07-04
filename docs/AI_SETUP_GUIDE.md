# 🤖 **AI Integration Setup Guide**

## **Recommended AI Provider: Anthropic Claude** ✅

### **Why Anthropic Claude is Best for Your Dashboard:**

1. **📊 Superior Data Analysis**
   - Excellent at SQL query generation
   - Better data interpretation and insights
   - Perfect for dashboard card creation

2. **💰 More Cost-Effective**
   - Claude 3.5 Sonnet: $3/million input, $15/million output
   - ~3x cheaper than GPT-4 for dashboard use cases

3. **🧠 Better Context Understanding**
   - 200K token context window
   - Understands your KENAL database structure better
   - More reliable JSONB configuration generation

4. **🔧 JSONB Optimized**
   - Perfect for your optimized database schema
   - Excellent at generating complex JSON configurations

---

## 🔑 **Getting API Keys**

### **1. Anthropic Claude (Primary - Recommended)**
1. **Visit**: [https://console.anthropic.com](https://console.anthropic.com)
2. **Sign up** for an account
3. **Go to**: API Keys section
4. **Create** a new API key
5. **Copy** the key (starts with `sk-ant-`)

### **2. OpenAI (Secondary - Optional)**
1. **Visit**: [https://platform.openai.com](https://platform.openai.com)
2. **Sign up** for an account
3. **Go to**: API Keys section
4. **Create** a new API key
5. **Copy** the key (starts with `sk-`)

---

## 🏠 **Local Development Setup**

### **Add to your `.env.local` file:**

```env
# KENAL Admin Dashboard Environment Variables

# Supabase Configuration (existing)
NEXT_PUBLIC_SUPABASE_URL=https://etkuxatycjqwvfjjwxqm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-existing-anon-key

# AI Provider Configuration
# Primary AI Provider (Recommended: Anthropic Claude)
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Secondary AI Provider (Optional: OpenAI)
OPENAI_API_KEY=sk-your-openai-key-here

# AI Configuration
AI_PRIMARY_PROVIDER=anthropic
AI_SECONDARY_PROVIDER=openai
AI_MAX_TOKENS=4000
AI_TEMPERATURE=0.1

# Dashboard Configuration
DASHBOARD_MAX_CARDS_PER_USER=20
DASHBOARD_CHAT_HISTORY_LIMIT=100
```

### **Steps:**
1. **Open**: Your `.env.local` file
2. **Add**: The AI configuration variables above
3. **Replace**: `sk-ant-your-anthropic-key-here` with your actual Anthropic API key
4. **Replace**: `sk-your-openai-key-here` with your actual OpenAI API key (optional)
5. **Save** the file
6. **Restart** your development server: `npm run dev`

---

## 🌐 **Production Setup (Netlify)**

### **Add Environment Variables to Netlify:**

1. **Go to**: [Netlify Dashboard](https://app.netlify.com)
2. **Select**: Your KENAL admin site
3. **Navigate**: Site settings → Environment variables
4. **Add** these variables:

| **Variable Name** | **Value** | **Required** |
|-------------------|-----------|--------------|
| `ANTHROPIC_API_KEY` | `sk-ant-your-key-here` | ✅ Yes |
| `OPENAI_API_KEY` | `sk-your-key-here` | ❌ Optional |
| `AI_PRIMARY_PROVIDER` | `anthropic` | ✅ Yes |
| `AI_SECONDARY_PROVIDER` | `openai` | ❌ Optional |
| `AI_MAX_TOKENS` | `4000` | ✅ Yes |
| `AI_TEMPERATURE` | `0.1` | ✅ Yes |
| `DASHBOARD_MAX_CARDS_PER_USER` | `20` | ✅ Yes |
| `DASHBOARD_CHAT_HISTORY_LIMIT` | `100` | ✅ Yes |

### **Steps:**
1. **Click**: "Add variable" for each one
2. **Enter**: Variable name and value
3. **Save**: Each variable
4. **Deploy**: Your site (Netlify will rebuild with new variables)

---

## 🧪 **Testing AI Integration**

### **Test API Connectivity:**

Add this to your Custom Dashboard page to test:

```typescript
import { aiService } from '@/services/ai/aiService'

// Test AI connectivity
const testAI = async () => {
  try {
    const results = await aiService.testConnection()
    console.log('AI Connection Test:', results)
    // results: { anthropic: true, openai: true }
  } catch (error) {
    console.error('AI Test Failed:', error)
  }
}
```

### **Test Dashboard Card Generation:**

```typescript
const testCardGeneration = async () => {
  try {
    const response = await aiService.generateDashboardCard({
      userPrompt: 'Show me total users',
      availableData: ['kd_users', 'kd_identity']
    })
    console.log('Generated Card:', response)
  } catch (error) {
    console.error('Card Generation Failed:', error)
  }
}
```

---

## 💰 **Cost Estimation**

### **Anthropic Claude 3.5 Sonnet:**
- **Input**: $3 per million tokens
- **Output**: $15 per million tokens
- **Typical dashboard request**: ~500 input + 200 output tokens
- **Cost per request**: ~$0.004 (less than half a cent!)

### **OpenAI GPT-4 Turbo:**
- **Input**: $10 per million tokens
- **Output**: $30 per million tokens
- **Typical dashboard request**: ~500 input + 200 output tokens
- **Cost per request**: ~$0.011 (about 1 cent)

### **Monthly Estimate:**
- **100 AI requests/day**: ~$12/month (Anthropic) vs ~$33/month (OpenAI)
- **Very affordable** for admin dashboard use!

---

## 🔧 **Integration with Custom Dashboard**

Once you add the API keys, your Custom Dashboard will:

1. **✅ Real AI Responses**: Replace simulated responses
2. **✅ Generate Dashboard Cards**: AI creates actual cards from prompts
3. **✅ Save to Database**: Cards stored in your new JSONB tables
4. **✅ Cost Tracking**: Monitor API usage and costs
5. **✅ Fallback Support**: Switch between providers automatically

---

## 🚨 **Security Best Practices**

### **Local Development:**
- ✅ Never commit `.env.local` to git (already in `.gitignore`)
- ✅ Use different API keys for development vs production
- ✅ Rotate keys regularly

### **Production:**
- ✅ Use Netlify environment variables (encrypted)
- ✅ Monitor API usage in provider dashboards
- ✅ Set up billing alerts
- ✅ Restrict API key permissions if possible

---

## 🎯 **Next Steps**

1. **Get Anthropic API key** (primary)
2. **Add to `.env.local`** for local development
3. **Add to Netlify** for production
4. **Test the integration** in your Custom Dashboard
5. **Start creating AI-powered dashboard cards!**

---

## 🆘 **Troubleshooting**

### **Common Issues:**

**❌ "No AI API keys configured"**
- Check `.env.local` file exists and has correct keys
- Restart development server after adding keys

**❌ "Anthropic API error: 401"**
- Verify API key is correct (starts with `sk-ant-`)
- Check API key has sufficient credits

**❌ "OpenAI API error: 401"**
- Verify API key is correct (starts with `sk-`)
- Check API key has sufficient credits

**❌ "AI Service Error"**
- Check network connectivity
- Verify API endpoints are accessible
- Check browser console for detailed errors

### **Debug Mode:**
Set `NODE_ENV=development` to see detailed AI service logs.

---

Your AI Custom Dashboard is ready for Phase 2! 🚀 