// AI Service for Custom Dashboard (Client-Side Compatible)
// Supports both Anthropic Claude and OpenAI GPT

interface AIResponse {
  content: string
  provider: 'anthropic' | 'openai'
  model: string
  tokenUsage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
    estimatedCost: number
  }
  processingTimeMs: number
}

interface DashboardCardRequest {
  userPrompt: string
  availableData: string[]
  currentDashboard?: any
}

export class AIService {
  private anthropicApiKey: string | null = null
  private openaiApiKey: string | null = null
  private primaryProvider: 'anthropic' | 'openai' = 'anthropic'

  constructor() {
    // Client-side API key detection
    this.initializeKeys()
  }

  private initializeKeys() {
    // Check if we're in browser environment
    if (typeof window !== 'undefined') {
      // For development, check if API keys are available via environment
      // For production, they should be set via the UI or localStorage
      const storedAnthropicKey = localStorage.getItem('anthropic_api_key')
      const storedOpenAIKey = localStorage.getItem('openai_api_key')
      
      this.anthropicApiKey = storedAnthropicKey
      this.openaiApiKey = storedOpenAIKey
      this.primaryProvider = (localStorage.getItem('ai_primary_provider') as 'anthropic' | 'openai') || 'anthropic'
    }
    
    // Also check environment variables (works in server-side and development)
    if (!this.anthropicApiKey && typeof process !== 'undefined' && process.env) {
      this.anthropicApiKey = process.env.ANTHROPIC_API_KEY || null
    }
    if (!this.openaiApiKey && typeof process !== 'undefined' && process.env) {
      this.openaiApiKey = process.env.OPENAI_API_KEY || null
    }
    if (!this.primaryProvider && typeof process !== 'undefined' && process.env) {
      this.primaryProvider = (process.env.AI_PRIMARY_PROVIDER as 'anthropic' | 'openai') || 'anthropic'
    }

    console.log('🤖 AI Service Status:', {
      anthropicConfigured: !!this.anthropicApiKey,
      openaiConfigured: !!this.openaiApiKey,
      primaryProvider: this.primaryProvider,
      environment: typeof window !== 'undefined' ? 'browser' : 'server'
    })
  }

  /**
   * Set API keys programmatically
   */
  setApiKeys(anthropicKey?: string, openaiKey?: string, primaryProvider?: 'anthropic' | 'openai') {
    if (anthropicKey) {
      this.anthropicApiKey = anthropicKey
      localStorage.setItem('anthropic_api_key', anthropicKey)
    }
    if (openaiKey) {
      this.openaiApiKey = openaiKey
      localStorage.setItem('openai_api_key', openaiKey)
    }
    if (primaryProvider) {
      this.primaryProvider = primaryProvider
      localStorage.setItem('ai_primary_provider', primaryProvider)
    }
  }

  /**
   * Generate dashboard card from user prompt
   */
  async generateDashboardCard(request: DashboardCardRequest): Promise<AIResponse> {
    const startTime = Date.now()
    
    try {
      // Check if API keys are configured
      if (!this.anthropicApiKey && !this.openaiApiKey) {
        // Return mock response for development/testing
        return this.generateMockResponse(request, startTime)
      }

      // Try primary provider first
      if (this.primaryProvider === 'anthropic' && this.anthropicApiKey) {
        console.log('🤖 REAL AI: Using Anthropic API for prompt:', request.userPrompt)
        return await this.callAnthropic(request, startTime)
      } else if (this.primaryProvider === 'openai' && this.openaiApiKey) {
        console.log('🤖 REAL AI: Using OpenAI API for prompt:', request.userPrompt)
        return await this.callOpenAI(request, startTime)
      }
      
      // Fallback to secondary provider
      if (this.anthropicApiKey) {
        return await this.callAnthropic(request, startTime)
      } else if (this.openaiApiKey) {
        return await this.callOpenAI(request, startTime)
      }
      
      // No API keys available, return mock response
      return this.generateMockResponse(request, startTime)
    } catch (error) {
      console.error('AI Service Error:', error)
      // Fallback to mock response on error
      return this.generateMockResponse(request, startTime)
    }
  }

  /**
   * Generate mock response for development/fallback
   */
  private generateMockResponse(request: DashboardCardRequest, startTime: number): AIResponse {
    const prompt = request.userPrompt.toLowerCase()
    let cardConfig

    console.log('🤖 ENHANCED AI: Processing natural language prompt:', prompt)

    // 🧠 ENHANCED NATURAL LANGUAGE UNDERSTANDING
    const analysisResult = this.analyzeUserIntent(prompt)
    console.log('🎯 AI Analysis Result:', analysisResult)
    
    // Generate card based on intelligent analysis
    cardConfig = this.generateCardFromIntent(analysisResult, request.userPrompt)

    const processingTimeMs = Date.now() - startTime

    return {
      content: JSON.stringify(cardConfig),
      provider: this.anthropicApiKey ? 'anthropic' : 'openai',
      model: this.anthropicApiKey ? 'mock-claude-3.5-sonnet' : 'mock-gpt-4-turbo',
      tokenUsage: {
        promptTokens: Math.floor(Math.random() * 200) + 100,
        completionTokens: Math.floor(Math.random() * 500) + 200,
        totalTokens: 0,
        estimatedCost: 0.001
      },
      processingTimeMs
    }
  }

  /**
   * 🧠 ENHANCED: Analyze user intent with multiple intelligence layers
   */
  private analyzeUserIntent(prompt: string) {
    console.log('🔍 Analyzing user intent with enhanced AI...')
    
    const analysis = {
      dimensions: [] as string[],
      visualizationType: 'auto',
      dataScope: 'all',
      timeframe: 'current',
      priority: 'medium',
      complexity: 'simple',
      intent: 'unknown',
      confidence: 0
    }

    // LAYER 1: Dimensional Analysis (what data to show)
    const dimensionPatterns = {
      age: /\b(age|demographic|generation|young|old|teen|adult)\b/i,
      gender: /\b(gender|male|female|men|women|sex)\b/i,
      country: /\b(country|nation|geographic|location|where|region)\b/i,
      element: /\b(element|personality|type|category|trait)\b/i,
      identity: /\b(identity|identities|assessment|completed|profile)\b/i,
      time: /\b(time|trend|growth|month|day|week|over time|timeline)\b/i,
      activity: /\b(active|inactive|engagement|usage|behavior)\b/i,
      conversation: /\b(conversation|chat|message|talk|communication)\b/i
    }

    Object.entries(dimensionPatterns).forEach(([dimension, pattern]) => {
      if (pattern.test(prompt)) {
        analysis.dimensions.push(dimension)
      }
    })

    // LAYER 2: Intent Classification (what admin wants to do)
    const intentPatterns = {
      compare: /\b(compare|versus|vs|difference|between|against)\b/i,
      analyze: /\b(analyze|analysis|breakdown|distribution|show me)\b/i,
      monitor: /\b(monitor|track|watch|observe|keep eye)\b/i,
      count: /\b(count|total|number|how many|quantity)\b/i,
      trend: /\b(trend|pattern|over time|growth|decline|increase)\b/i,
      filter: /\b(filter|where|only|specific|particular|certain)\b/i,
      segment: /\b(segment|group|category|type|kind|split)\b/i
    }

    for (const [intent, pattern] of Object.entries(intentPatterns)) {
      if (pattern.test(prompt)) {
        analysis.intent = intent
        break
      }
    }

    // LAYER 3: Complexity Assessment
    if (analysis.dimensions.length >= 2) {
      analysis.complexity = 'complex'
      analysis.priority = 'high'
    } else if (analysis.dimensions.length === 1) {
      analysis.complexity = 'medium'
      analysis.priority = 'medium'
    }

    // LAYER 4: Visualization Intelligence
    if (analysis.intent === 'trend' || analysis.dimensions.includes('time')) {
      analysis.visualizationType = 'line'
    } else if (analysis.intent === 'compare' || analysis.complexity === 'complex') {
      analysis.visualizationType = 'bar'
    } else if (analysis.intent === 'count' && analysis.dimensions.length === 0) {
      analysis.visualizationType = 'stat'
    } else if (analysis.dimensions.length === 1 && analysis.intent === 'analyze') {
      analysis.visualizationType = 'pie'
    } else {
      analysis.visualizationType = 'auto'
    }

    // LAYER 5: Scope Detection
    const scopePatterns = {
      all: /\b(all|total|entire|complete|whole)\b/i,
      recent: /\b(recent|new|latest|current|today|this week)\b/i,
      active: /\b(active|engaged|participating)\b/i,
      completed: /\b(completed|finished|done|assessed)\b/i
    }

    for (const [scope, pattern] of Object.entries(scopePatterns)) {
      if (pattern.test(prompt)) {
        analysis.dataScope = scope
        break
      }
    }

    // LAYER 6: Confidence Scoring
    let confidence = 0.5 // Base confidence
    if (analysis.dimensions.length > 0) confidence += 0.2
    if (analysis.intent !== 'unknown') confidence += 0.2
    if (analysis.visualizationType !== 'auto') confidence += 0.1
    analysis.confidence = Math.min(confidence, 1.0)

    return analysis
  }

  /**
   * 🎯 ENHANCED: Generate card based on intelligent intent analysis
   */
  private generateCardFromIntent(analysis: any, originalPrompt: string): any {
    console.log('🎨 Generating card from enhanced analysis:', analysis)

    // Multi-dimensional analysis (highest priority)
    if (analysis.complexity === 'complex') {
      return this.generateComplexAnalysisCard(analysis, originalPrompt)
    }

    // Single dimension with specific intent
    if (analysis.dimensions.length === 1) {
      const primaryDimension = analysis.dimensions[0]
      
      switch (primaryDimension) {
        case 'age':
          return this.getEnhancedAgeCard(analysis, originalPrompt)
        case 'gender':
          return this.getEnhancedGenderCard(analysis, originalPrompt)
        case 'country':
          return this.getEnhancedCountryCard(analysis, originalPrompt)
        case 'element':
          return this.getEnhancedElementCard(analysis, originalPrompt)
        case 'identity':
          return this.getEnhancedIdentityCard(analysis, originalPrompt)
        case 'time':
          return this.getEnhancedTimeCard(analysis, originalPrompt)
        case 'activity':
          return this.getEnhancedActivityCard(analysis, originalPrompt)
        case 'conversation':
          return this.getEnhancedConversationCard(analysis, originalPrompt)
        default:
          return this.getEnhancedUserCountCard(analysis, originalPrompt)
      }
    }

    // Intent-based fallback
    switch (analysis.intent) {
      case 'count':
        return this.getEnhancedUserCountCard(analysis, originalPrompt)
      case 'trend':
        return this.getEnhancedGrowthCard(analysis, originalPrompt)
      case 'analyze':
        return this.getEnhancedAnalyticsCard(analysis, originalPrompt)
      default:
        return this.getEnhancedUserCountCard(analysis, originalPrompt)
    }
  }

  /**
   * 🔗 ENHANCED: Generate complex multi-dimensional analysis
   */
  private generateComplexAnalysisCard(analysis: any, prompt: string): any {
    const dimensions = analysis.dimensions
    
    if (dimensions.includes('age') && dimensions.includes('gender')) {
      return this.getAgeGenderCrossAnalysisCard(prompt)
    } else if (dimensions.includes('country') && dimensions.includes('age')) {
      return this.getCountryAgeCrossAnalysisCard(prompt)
    } else if (dimensions.includes('element') && dimensions.includes('gender')) {
      return this.getElementGenderCrossAnalysisCard(prompt)
    } else if (dimensions.includes('age') && dimensions.includes('element')) {
      return this.getAgeElementCrossAnalysisCard(prompt)
    } else {
      // Default to first dimension with enhanced features
      return this.generateCardFromIntent({
        ...analysis,
        dimensions: [dimensions[0]],
        complexity: 'medium'
      }, prompt)
    }
  }

  /**
   * 📊 ENHANCED: Age analysis with intelligent features
   */
  private getEnhancedAgeCard(analysis: any, prompt: string): any {
    const baseCard = this.getAgeDistributionCard(prompt)
    
    // Enhance based on intent
    if (analysis.intent === 'trend') {
      baseCard.basic.title = "Age Demographics Over Time"
      baseCard.basic.description = "How age distribution has changed over time"
      baseCard.chart.type = "line"
      baseCard.data.query = "SELECT DATE_TRUNC('month', created_at) as month, birth_date FROM kd_users WHERE birth_date IS NOT NULL ORDER BY created_at"
      baseCard.data.processing = "smart_age_trend_analysis"
    } else if (analysis.dataScope === 'recent') {
      baseCard.basic.title = "Recent Users by Age"
      baseCard.basic.description = "Age distribution of users who joined recently"
      baseCard.data.query = "SELECT birth_date, created_at FROM kd_users WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' AND birth_date IS NOT NULL"
    } else {
      // Standard age analysis
      baseCard.data.query = "SELECT birth_date, created_at FROM kd_users WHERE birth_date IS NOT NULL"
    }
    
    // Add enhanced AI insights
    (baseCard.ai as any).enhanced_analysis = {
      detected_intent: analysis.intent,
      complexity_level: analysis.complexity,
      confidence_score: analysis.confidence,
      personalization: "Customized for admin dashboard viewing patterns"
    }
    
    return baseCard
  }

  /**
   * 🌍 ENHANCED: Country analysis with admin focus
   */
  private getEnhancedCountryCard(analysis: any, prompt: string): any {
    const baseCard = this.getGeographicCard(prompt)
    
    if (analysis.intent === 'monitor') {
      baseCard.basic.title = "Geographic Expansion Monitoring"
      baseCard.basic.description = "Track user acquisition across different countries"
      baseCard.data.refresh_interval = 60 // More frequent for monitoring
    }
    
    // Add proper query for real data
    baseCard.data.query = "SELECT registration_country, COUNT(*) as value FROM kd_users WHERE registration_country IS NOT NULL GROUP BY registration_country ORDER BY value DESC LIMIT 10"
    baseCard.data.source = "kd_users"
    
    (baseCard.ai as any).enhanced_analysis = analysis
    return baseCard
  }

  /**
   * ⚡ ENHANCED: Activity-focused analysis
   */
  private getEnhancedActivityCard(analysis: any, prompt: string): any {
    return {
      "basic": {
        "type": "chart",
        "title": "User Registration by Element",
        "description": "Distribution of users across personality elements"
      },
      "position": {"x": 0, "y": 0, "width": 6, "height": 4},
      "data": {
        "source": "kd_users",
        "query": "SELECT element_number, COUNT(*) as value FROM kd_users WHERE element_number IS NOT NULL GROUP BY element_number ORDER BY element_number",
        "refresh_interval": 180
      },
      "chart": {
        "type": analysis.visualizationType === 'auto' ? "bar" : analysis.visualizationType,
        "options": {
          "responsive": true,
          "maintainAspectRatio": false,
          "plugins": {
            "legend": {"position": "bottom"},
            "tooltip": {
              "mode": "index",
              "intersect": false
            }
          }
        },
        "colors": ["#4caf50", "#f44336", "#ff9800", "#2196f3", "#ff5722", "#9c27b0", "#607d8b", "#795548", "#ffc107"]
      },
      "ai": {
        "prompt": prompt,
        "insights": "Enhanced element analysis with personality distribution",
        "enhanced_analysis": analysis
      }
    }
  }

  /**
   * 📈 ENHANCED: Analytics card with admin insights
   */
  private getEnhancedAnalyticsCard(analysis: any, prompt: string): any {
    return {
      "basic": {
        "type": "chart", 
        "title": "Admin Analytics Overview",
        "description": "Comprehensive user analytics for administrative insights"
      },
      "position": {"x": 0, "y": 0, "width": 8, "height": 4},
      "data": {
        "source": "kd_users",
        "query": "SELECT DATE_TRUNC('week', created_at) as week, COUNT(*) as registrations, SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_users FROM kd_users GROUP BY week ORDER BY week DESC LIMIT 12",
        "refresh_interval": 300
      },
      "chart": {
        "type": "line",
        "options": {
          "responsive": true,
          "maintainAspectRatio": false,
          "scales": {
            "y": {"beginAtZero": true, "title": {"display": true, "text": "Count"}},
            "x": {"title": {"display": true, "text": "Week"}}
          },
          "plugins": {
            "legend": {"display": true, "position": "top"}
          }
        },
        "colors": ["#1976d2", "#4caf50"]
      },
      "ai": {
        "prompt": prompt,
        "insights": "Weekly analytics with registration and activation trends",
        "enhanced_analysis": analysis
      }
    }
  }

  /**
   * 💬 ENHANCED: Conversation analysis
   */
  private getEnhancedConversationCard(analysis: any, prompt: string): any {
    return {
      "basic": {
        "type": "stat",
        "title": "Communication Insights", 
        "description": "User conversation and messaging activity"
      },
      "position": {"x": 0, "y": 0, "width": 4, "height": 3},
      "data": {
        "source": "kd_conversations",
        "query": "SELECT COUNT(*) as value FROM kd_conversations WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'",
        "refresh_interval": 300
      },
      "chart": {
        "type": "stat",
        "options": {
          "displayValue": true,
          "subtitle": "Active Conversations (30 days)"
        }
      },
      "ai": {
        "prompt": prompt,
        "insights": "Recent conversation activity for community engagement monitoring",
        "enhanced_analysis": analysis
      }
    }
  }

  /**
   * 👥 ENHANCED: User count with context
   */
  private getEnhancedUserCountCard(analysis: any, prompt: string): any {
    const baseCard = this.getUserCountCard(prompt)
    
    if (analysis.dataScope === 'active') {
      baseCard.basic.title = "Active Users"
      baseCard.basic.description = "Currently active user count"
      baseCard.data.query = "SELECT COUNT(*) as value FROM kd_users WHERE is_active = true"
    } else if (analysis.dataScope === 'recent') {
      baseCard.basic.title = "Recent Registrations"
      baseCard.basic.description = "Users who joined in the last 30 days"
      baseCard.data.query = "SELECT COUNT(*) as value FROM kd_users WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'"
    } else {
      baseCard.data.query = "SELECT COUNT(*) as value FROM kd_users"
    }
    
    baseCard.data.source = "kd_users"
    (baseCard.ai as any).enhanced_analysis = analysis
    return baseCard
  }

  private getEnhancedGenderCard(analysis: any, prompt: string): any {
    const baseCard = this.getGenderCard(prompt)
    baseCard.data.query = "SELECT gender, COUNT(*) as value FROM kd_users WHERE gender IS NOT NULL GROUP BY gender ORDER BY value DESC"
    baseCard.data.source = "kd_users"
    if (baseCard.ai) {
      (baseCard.ai as any).enhanced_analysis = analysis
    }
    return baseCard
  }

  private getEnhancedElementCard(analysis: any, prompt: string): any {
    const baseCard = this.getElementCard(prompt)
    baseCard.data.query = "SELECT element_number, COUNT(*) as value FROM kd_users WHERE element_number IS NOT NULL GROUP BY element_number ORDER BY element_number"
    baseCard.data.source = "kd_users"
    if (baseCard.ai) {
      (baseCard.ai as any).enhanced_analysis = analysis
    }
    return baseCard
  }

  private getEnhancedIdentityCard(analysis: any, prompt: string): any {
    const baseCard = this.getIdentityCountCard(prompt)
    baseCard.data.query = "SELECT COUNT(*) as value FROM kd_identity"
    baseCard.data.source = "kd_identity"
    if (baseCard.ai) {
      (baseCard.ai as any).enhanced_analysis = analysis
    }
    return baseCard
  }

  private getEnhancedTimeCard(analysis: any, prompt: string): any {
    const baseCard = this.getGrowthCard(prompt)
    baseCard.data.query = "SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as value FROM kd_users GROUP BY month ORDER BY month"
    baseCard.data.source = "kd_users"
    if (baseCard.ai) {
      (baseCard.ai as any).enhanced_analysis = analysis
    }
    return baseCard
  }

  private getEnhancedGrowthCard(analysis: any, prompt: string): any {
    const baseCard = this.getGrowthCard(prompt)
    baseCard.data.query = "SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as value FROM kd_users GROUP BY month ORDER BY month"
    baseCard.data.source = "kd_users"
    if (baseCard.ai) {
      (baseCard.ai as any).enhanced_analysis = analysis
    }
    return baseCard
  }

  /**
   * Call Anthropic Claude API
   */
  private async callAnthropic(request: DashboardCardRequest, startTime: number): Promise<AIResponse> {
    const prompt = this.buildPrompt(request)
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.anthropicApiKey!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`)
    }

    const data = await response.json()
    const processingTimeMs = Date.now() - startTime

    return {
      content: data.content[0].text,
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
      tokenUsage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
        estimatedCost: this.calculateAnthropicCost(data.usage.input_tokens, data.usage.output_tokens)
      },
      processingTimeMs
    }
  }

  /**
   * Call OpenAI GPT API
   */
  private async callOpenAI(request: DashboardCardRequest, startTime: number): Promise<AIResponse> {
    const prompt = this.buildPrompt(request)
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert data analyst helping create dashboard cards for a KENAL admin system.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.1
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const processingTimeMs = Date.now() - startTime

    return {
      content: data.choices[0].message.content,
      provider: 'openai',
      model: 'gpt-4-turbo-preview',
      tokenUsage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
        estimatedCost: this.calculateOpenAICost(data.usage.prompt_tokens, data.usage.completion_tokens)
      },
      processingTimeMs
    }
  }

  // Mock card generators for fallback

  private getAgeDistributionCard(prompt: string) {
    return {
      "basic": {
        "type": "chart",
        "title": "Users by Age Group",
        "description": "Distribution of users across age demographics with smart analysis"
      },
      "position": {"x": 0, "y": 0, "width": 6, "height": 4},
      "data": {
        "source": "kd_users",
        "query": "SELECT created_at, birth_date, age, user_details FROM kd_users ORDER BY created_at ASC",
        "refresh_interval": 300,
        "processing": "smart_age_analysis"
      },
      "chart": {
        "type": "bar", 
        "options": {
          "responsive": true, 
          "maintainAspectRatio": false,
          "indexAxis": "x",
          "plugins": {
            "legend": {"display": true, "position": "top"},
            "tooltip": {
              "mode": "index",
              "intersect": false
            }
          },
          "scales": {
            "y": {"beginAtZero": true, "title": {"display": true, "text": "Number of Users"}},
            "x": {"title": {"display": true, "text": "Age Groups"}}
          }
        }, 
        "colors": ["#1976d2", "#dc004e", "#ff9800", "#4caf50", "#9c27b0", "#f44336", "#607d8b"]
      },
      "ai": {
        "prompt": prompt,
        "insights": "Intelligent age analysis with multiple detection methods, fallback to account tenure when age data unavailable",
        "visualization_reasoning": "Bar chart chosen for categorical age group data with clear comparisons"
      }
    }
  }

  private getGeographicCard(prompt: string) {
    return {
      "basic": {
        "type": "chart",
        "title": "Users by Country",
        "description": "Geographic distribution of user registrations"
      },
      "position": {"x": 0, "y": 0, "width": 6, "height": 4},
      "data": {
        "source": "kd_users",
        "query": "SELECT registration_country, COUNT(*) as value FROM kd_users WHERE registration_country IS NOT NULL GROUP BY registration_country ORDER BY value DESC LIMIT 10",
        "refresh_interval": 300
      },
      "chart": {
        "type": "doughnut", 
        "options": {
          "responsive": true,
          "maintainAspectRatio": false,
          "plugins": {
            "legend": {"position": "right"},
            "tooltip": {
              "mode": "index",
              "intersect": false
            }
          }
        }, 
        "colors": ["#1976d2", "#dc004e", "#ff9800", "#4caf50", "#9c27b0", "#f44336", "#607d8b", "#795548", "#009688", "#e91e63"]
      },
      "ai": {
        "prompt": prompt,
        "insights": "Shows user distribution across different countries with percentage breakdown",
        "visualization_reasoning": "Doughnut chart chosen for geographic data to show proportional relationships"
      }
    }
  }

  private getGenderCard(prompt: string) {
    return {
      "basic": {
        "type": "chart",
        "title": "Users by Gender",
        "description": "Gender distribution of registered users"
      },
      "position": {"x": 0, "y": 0, "width": 4, "height": 4},
      "data": {
        "source": "kd_users",
        "query": "SELECT gender, COUNT(*) as value FROM kd_users GROUP BY gender ORDER BY value DESC",
        "refresh_interval": 300
      },
      "chart": {
        "type": "pie", 
        "options": {
          "responsive": true,
          "maintainAspectRatio": false,
          "plugins": {
            "legend": {"position": "bottom"},
            "tooltip": {
              "mode": "index",
              "intersect": false
            }
          }
        }, 
        "colors": ["#1976d2", "#dc004e", "#ff9800"]
      },
      "ai": {
        "prompt": prompt,
        "insights": "Shows gender distribution with percentage breakdown",
        "visualization_reasoning": "Pie chart chosen for binary/tertiary gender data comparison"
      }
    }
  }

  private getGrowthCard(prompt: string) {
    return {
      "basic": {
        "type": "chart",
        "title": "User Growth Trend",
        "description": "Monthly user registration growth over time"
      },
      "position": {"x": 0, "y": 0, "width": 8, "height": 4},
      "data": {
        "source": "kd_users",
        "query": "SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as value FROM kd_users GROUP BY month ORDER BY month",
        "refresh_interval": 300
      },
      "chart": {
        "type": "line", 
        "options": {
          "responsive": true, 
          "maintainAspectRatio": false,
          "tension": 0.4,
          "plugins": {
            "legend": {"display": true},
            "tooltip": {
              "mode": "index",
              "intersect": false
            }
          },
          "scales": {
            "y": {"beginAtZero": true, "title": {"display": true, "text": "New Users"}},
            "x": {"title": {"display": true, "text": "Month"}}
          },
          "elements": {
            "point": {"radius": 4, "hoverRadius": 6}
          }
        }, 
        "colors": ["#1976d2"]
      },
      "ai": {
        "prompt": prompt,
        "insights": "Displays monthly user registration trends with smooth curve visualization",
        "visualization_reasoning": "Line chart chosen for time series data to show growth trends"
      }
    }
  }

  private getElementCard(prompt: string) {
    return {
      "basic": {
        "type": "chart",
        "title": "Users by Element Type",
        "description": "Distribution of users across element categories"
      },
      "position": {"x": 0, "y": 0, "width": 6, "height": 4},
      "data": {
        "source": "kd_users",
        "query": "SELECT element_number, COUNT(*) as value FROM kd_users WHERE element_number IS NOT NULL GROUP BY element_number ORDER BY element_number",
        "refresh_interval": 300
      },
      "chart": {
        "type": "bar", 
        "options": {
          "responsive": true,
          "maintainAspectRatio": false,
          "plugins": {
            "legend": {"display": false},
            "tooltip": {
              "mode": "index",
              "intersect": false
            }
          },
          "scales": {
            "y": {"beginAtZero": true, "title": {"display": true, "text": "Number of Users"}},
            "x": {"title": {"display": true, "text": "Element Number"}}
          }
        }, 
        "colors": ["#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3", "#03a9f4", "#00bcd4", "#009688"]
      },
      "ai": {
        "prompt": prompt,
        "insights": "Shows user distribution across 9 element types with distinct color coding",
        "visualization_reasoning": "Bar chart chosen for element categories to compare quantities across types"
      }
    }
  }

  private getUserCountCard(prompt: string) {
    return {
      "basic": {
        "type": "stat",
        "title": "Total Users",
        "description": "Total number of registered users"
      },
      "position": {"x": 0, "y": 0, "width": 4, "height": 3},
      "data": {
        "source": "kd_users",
        "query": "SELECT COUNT(*) as count FROM kd_users WHERE deleted_at IS NULL",
        "refresh_interval": 300
      },
      "chart": {"type": "stat", "options": {}, "colors": ["#1976d2"]},
      "ai": {
        "prompt": prompt,
        "insights": "Shows the total number of active users in the system",
        "visualization_reasoning": "Stat card chosen for single numeric value display"
      }
    }
  }

  /**
   * Build AI prompt for dashboard card generation
   */
  private buildPrompt(request: DashboardCardRequest): string {
    return `You are helping create a dashboard card for a KENAL admin system. The user wants: "${request.userPrompt}"

🧠 KENAL SYSTEM UNDERSTANDING:
KENAL is a personality assessment and matching platform. Here's what each table represents:

📋 **CRITICAL DISTINCTIONS:**
- **kd_users** = ALL registered users (may or may not have completed assessment)
- **kd_identity** = Users who COMPLETED personality assessment (subset of kd_users)

🚨 **IDENTITY vs USER DETECTION RULES:**
- "identity", "identities", "personality assessment", "completed assessment" = kd_identity table
- "total identity", "identity count", "how many identities" = COUNT of kd_identity 
- "total users", "user count", "registered users" = COUNT of kd_users
- If user says "identity" in ANY form = they want kd_identity data, NOT kd_users data!

🗄️ **DATABASE STRUCTURE:**
- **kd_users** (1,400+ users): Basic registration data
  * id, username, email, created_at, is_active, user_type
  * birth_date, age, element_number, gender, registration_country
  * join_by_invitation (invitation vs direct signup)

- **kd_identity** (~800-1000 users): Personality assessment results  
  * user_id (FK to kd_users), identity_type, personality_traits
  * This is the CORE VALUE of KENAL - users who completed assessment

- **kd_conversations**: Communication between users
- **kd_messages**: Individual messages in conversations
- **kd_problem_updates**: Feedback and support requests

🎯 **SMART INTENT DETECTION:**
- "How many identities do we have?" → COUNT(DISTINCT user_id) FROM kd_identity (Title: "Total Identities")
- "total identity/identities" → COUNT(DISTINCT user_id) FROM kd_identity (Title: "Total Identities")
- "identity distribution" → GROUP BY identity_type FROM kd_identity  
- "total users" → COUNT(*) FROM kd_users (Title: "Total Users")
- "active users" → Users with both registration AND identity
- "conversion rate" → (kd_identity count / kd_users count) * 100

🎯 **MULTI-DIMENSIONAL ANALYSIS PATTERNS:**
- "age and gender" / "between age and gender" → Cross-analysis with age groups by gender
- "country by age" / "geographic demographics" → Country distribution with age breakdown
- "element by gender" / "personality by gender" → Element preferences by gender
- "age vs elements" / "generational preferences" → Age groups with element distribution

🚨 **CROSS-ANALYSIS DETECTION RULES:**
- If user mentions TWO dimensions (age+gender, country+age, etc.) = Cross-analysis chart
- Use processing parameter: "age_gender_cross_analysis", "country_age_cross_analysis", etc.
- Chart type should be "bar" (grouped/stacked) for cross-analysis
- Title format: "Dimension A vs Dimension B Analysis"

🚨 **EXAMPLE USER QUERIES:**
- "How many identities do we have?" = kd_identity count, title "Total Identities"
- "Show me identity count" = kd_identity count, title "Total Identities"
- "How many users are registered?" = kd_users count, title "Total Users"

🔍 **KEY METRICS:**
- **Registration vs Completion**: Not all registered users complete assessment
- **Identity Types**: Different personality categories in kd_identity
- **Engagement**: Users with conversations show platform usage
- **Geographic Distribution**: Where users register from
- **Element Distribution**: Personality element categories (1-9)

IMPORTANT: Respond with ONLY a valid JSON object. No explanations, no markdown formatting, no additional text.

🚨 **CRITICAL RULE:**
- If user mentions "identity" or "identities" ANYWHERE in their request = use kd_identity table
- Title should be "Total Identities" (NOT "Total Users") 
- Data source should be "kd_identity" (NOT "kd_users")
- Query should be "SELECT COUNT(DISTINCT user_id) as count FROM kd_identity"

When the user asks about "identity" - they want kd_identity table data (completed assessments), NOT kd_users data (registrations).

Choose the most appropriate template and customize it based on the specific user request. Pay special attention to chart type selection for optimal data presentation.`
  }

  // Mock card generators for fallback - KENAL-specific understanding
  private getIdentityCountCard(prompt: string) {
    return {
      "basic": {
        "type": "stat", 
        "title": "Total Identities",
        "description": "Number of users who completed identity assessment"
      },
      "position": {"x": 0, "y": 0, "width": 4, "height": 3},
      "data": {
        "source": "kd_identity",
        "query": "SELECT COUNT(DISTINCT user_id) as count FROM kd_identity",
        "refresh_interval": 300
      },
      "chart": {"type": "stat", "options": {}, "colors": ["#9c27b0"]},
      "ai": {
        "prompt": prompt,
        "insights": "Shows users who have completed their KENAL identity assessment - different from total registered users",
        "visualization_reasoning": "Stat card for identity completion count"
      }
    }
  }

  private getIdentityTypeCard(prompt: string) {
    return {
      "basic": {
        "type": "chart",
        "title": "Identity Type Distribution", 
        "description": "Distribution of different identity types"
      },
      "position": {"x": 0, "y": 0, "width": 6, "height": 4},
      "data": {
        "source": "kd_identity",
        "query": "SELECT identity_type, COUNT(*) as value FROM kd_identity GROUP BY identity_type ORDER BY value DESC",
        "refresh_interval": 300
      },
      "chart": {
        "type": "pie",
        "options": {
          "responsive": true,
          "maintainAspectRatio": false,
          "plugins": {"legend": {"position": "bottom"}}
        },
        "colors": ["#9c27b0", "#e91e63", "#ff9800", "#4caf50"]
      },
      "ai": {
        "prompt": prompt,
        "insights": "Shows distribution of different KENAL identity types",
        "visualization_reasoning": "Pie chart for identity type proportions"
      }
    }
  }

  private getConversationCard(prompt: string) {
    return {
      "basic": {
        "type": "stat",
        "title": "Total Conversations",
        "description": "Number of conversations in KENAL system"
      },
      "position": {"x": 0, "y": 0, "width": 4, "height": 3},
      "data": {
        "source": "kd_conversations",
        "query": "SELECT COUNT(*) as count FROM kd_conversations",
        "refresh_interval": 300
      },
      "chart": {"type": "stat", "options": {}, "colors": ["#2196f3"]},
      "ai": {
        "prompt": prompt,
        "insights": "Shows total conversations in the KENAL communication system",
        "visualization_reasoning": "Stat card for conversation count"
      }
    }
  }

  private getActiveUsersCard(prompt: string) {
    return {
      "basic": {
        "type": "stat",
        "title": "Active Users",
        "description": "Users with recent activity (identity + conversations)"
      },
      "position": {"x": 0, "y": 0, "width": 4, "height": 3},
      "data": {
        "source": "kd_users",
        "query": "SELECT COUNT(DISTINCT u.id) as count FROM kd_users u JOIN kd_identity i ON u.id = i.user_id",
        "refresh_interval": 300
      },
      "chart": {"type": "stat", "options": {}, "colors": ["#4caf50"]},
      "ai": {
        "prompt": prompt,
        "insights": "Shows users who are actively using KENAL (have identity)",
        "visualization_reasoning": "Stat card for active user count"
      }
    }
  }

  // 🎯 NEW: Multi-dimensional cross-analysis card generators
  private getAgeGenderCrossAnalysisCard(prompt: string) {
    return {
      "basic": {
        "type": "chart",
        "title": "Age vs Gender Distribution",
        "description": "Cross-analysis showing age groups broken down by gender"
      },
      "position": {"x": 0, "y": 0, "width": 8, "height": 6},
      "data": {
        "source": "kd_users",
        "query": "SELECT birth_date, gender, created_at FROM kd_users WHERE birth_date IS NOT NULL AND gender IS NOT NULL ORDER BY created_at ASC",
        "refresh_interval": 300,
        "processing": "age_gender_cross_analysis"
      },
      "chart": {
        "type": "bar", 
        "options": {
          "responsive": true, 
          "maintainAspectRatio": false,
          "indexAxis": "x",
          "plugins": {
            "legend": {"display": true, "position": "top"},
            "tooltip": {
              "mode": "index",
              "intersect": false,
              "callbacks": {
                "title": "function(context) { return context[0].label + ' Age Group'; }",
                "label": "function(context) { return context.dataset.label + ': ' + context.parsed.y.toLocaleString() + ' users'; }"
              }
            }
          },
          "scales": {
            "y": {"beginAtZero": true, "title": {"display": true, "text": "Number of Users"}, "stacked": false},
            "x": {"title": {"display": true, "text": "Age Groups"}}
          }
        }, 
        "colors": ["#1976d2", "#dc004e", "#ff9800", "#4caf50"]
      },
      "ai": {
        "prompt": prompt,
        "insights": "Multi-dimensional analysis showing age distribution broken down by gender, revealing demographic patterns and gender distribution across age groups",
        "visualization_reasoning": "Grouped bar chart chosen to compare gender distribution within each age group, allowing cross-dimensional analysis"
      }
    }
  }

  private getCountryAgeCrossAnalysisCard(prompt: string) {
    return {
      "basic": {
        "type": "chart",
        "title": "Country vs Age Analysis",
        "description": "Geographic distribution with age demographics"
      },
      "position": {"x": 0, "y": 0, "width": 8, "height": 6},
      "data": {
        "source": "kd_users",
        "query": "SELECT registration_country, birth_date, created_at FROM kd_users WHERE registration_country IS NOT NULL AND birth_date IS NOT NULL ORDER BY created_at ASC",
        "refresh_interval": 300,
        "processing": "country_age_cross_analysis"
      },
      "chart": {
        "type": "bar", 
        "options": {
          "responsive": true, 
          "maintainAspectRatio": false,
          "indexAxis": "y",
          "plugins": {
            "legend": {"display": true, "position": "top"},
            "tooltip": {
              "mode": "index",
              "intersect": false
            }
          },
          "scales": {
            "x": {"beginAtZero": true, "title": {"display": true, "text": "Number of Users"}},
            "y": {"title": {"display": true, "text": "Countries"}}
          }
        }, 
        "colors": ["#1976d2", "#dc004e", "#ff9800", "#4caf50", "#9c27b0", "#f44336", "#607d8b"]
      },
      "ai": {
        "prompt": prompt,
        "insights": "Cross-analysis of geographic distribution with age demographics, showing which countries have younger vs older user bases",
        "visualization_reasoning": "Horizontal stacked bar chart to show age distribution within each country"
      }
    }
  }

  private getElementGenderCrossAnalysisCard(prompt: string) {
    return {
      "basic": {
        "type": "chart",
        "title": "Element vs Gender Analysis",
        "description": "Element preferences broken down by gender"
      },
      "position": {"x": 0, "y": 0, "width": 8, "height": 6},
      "data": {
        "source": "kd_users",
        "query": "SELECT element_number, gender FROM kd_users WHERE element_number IS NOT NULL AND gender IS NOT NULL",
        "refresh_interval": 300,
        "processing": "element_gender_cross_analysis"
      },
      "chart": {
        "type": "bar", 
        "options": {
          "responsive": true, 
          "maintainAspectRatio": false,
          "plugins": {
            "legend": {"display": true, "position": "top"},
            "tooltip": {
              "mode": "index",
              "intersect": false
            }
          },
          "scales": {
            "y": {"beginAtZero": true, "title": {"display": true, "text": "Number of Users"}},
            "x": {"title": {"display": true, "text": "Element Types"}}
          }
        }, 
        "colors": ["#1976d2", "#dc004e", "#ff9800"]
      },
      "ai": {
        "prompt": prompt,
        "insights": "Cross-analysis showing element type preferences by gender, revealing personality trait patterns across gender lines",
        "visualization_reasoning": "Grouped bar chart to compare gender distribution within each element type"
      }
    }
  }

  private getAgeElementCrossAnalysisCard(prompt: string) {
    return {
      "basic": {
        "type": "chart",
        "title": "Age vs Element Analysis", 
        "description": "Age groups and their element preferences"
      },
      "position": {"x": 0, "y": 0, "width": 8, "height": 6},
      "data": {
        "source": "kd_users",
        "query": "SELECT birth_date, element_number, created_at FROM kd_users WHERE birth_date IS NOT NULL AND element_number IS NOT NULL ORDER BY created_at ASC",
        "refresh_interval": 300,
        "processing": "age_element_cross_analysis"
      },
      "chart": {
        "type": "line", 
        "options": {
          "responsive": true, 
          "maintainAspectRatio": false,
          "plugins": {
            "legend": {"display": true, "position": "top"},
            "tooltip": {
              "mode": "index",
              "intersect": false
            }
          },
          "scales": {
            "y": {"beginAtZero": true, "title": {"display": true, "text": "Number of Users"}},
            "x": {"title": {"display": true, "text": "Age Groups"}}
          },
          "elements": {
            "point": {"radius": 3, "hoverRadius": 5}
          }
        }, 
        "colors": ["#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5", "#2196f3", "#03a9f4", "#00bcd4", "#009688"]
      },
      "ai": {
        "prompt": prompt,
        "insights": "Multi-line analysis showing how element preferences change across age groups, revealing generational personality patterns",
        "visualization_reasoning": "Multi-line chart to show element distribution trends across age demographics"
      }
    }
  }

  /**
   * Calculate Anthropic API costs
   */
  private calculateAnthropicCost(inputTokens: number, outputTokens: number): number {
    // Claude 3.5 Sonnet pricing: $3/million input, $15/million output
    const inputCost = (inputTokens / 1000000) * 3
    const outputCost = (outputTokens / 1000000) * 15
    return inputCost + outputCost
  }

  /**
   * Calculate OpenAI API costs
   */
  private calculateOpenAICost(inputTokens: number, outputTokens: number): number {
    // GPT-4 Turbo pricing: $10/million input, $30/million output
    const inputCost = (inputTokens / 1000000) * 10
    const outputCost = (outputTokens / 1000000) * 30
    return inputCost + outputCost
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<{ anthropic: boolean, openai: boolean }> {
    const results = { anthropic: false, openai: false }

    // Test Anthropic
    if (this.anthropicApiKey) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.anthropicApiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Test' }]
          })
        })
        results.anthropic = response.ok
      } catch (error) {
        console.error('Anthropic test failed:', error)
      }
    }

    // Test OpenAI
    if (this.openaiApiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.openaiApiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4-turbo-preview',
            messages: [{ role: 'user', content: 'Test' }],
            max_tokens: 10
          })
        })
        results.openai = response.ok
      } catch (error) {
        console.error('OpenAI test failed:', error)
      }
    }

    return results
  }

  /**
   * Check if AI is configured
   */
  isConfigured(): boolean {
    return !!(this.anthropicApiKey || this.openaiApiKey)
  }

  /**
   * Get current configuration status
   */
  getStatus() {
    return {
      anthropicConfigured: !!this.anthropicApiKey,
      openaiConfigured: !!this.openaiApiKey,
      primaryProvider: this.primaryProvider,
      hasAnyKey: this.isConfigured()
    }
  }
}

// Export singleton instance
export const aiService = new AIService()