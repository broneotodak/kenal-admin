// AI Service for Custom Dashboard
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
  private anthropicApiKey: string | null
  private openaiApiKey: string | null
  private primaryProvider: 'anthropic' | 'openai'

  constructor() {
    // Get API keys from environment variables
    this.anthropicApiKey = process.env.ANTHROPIC_API_KEY || null
    this.openaiApiKey = process.env.OPENAI_API_KEY || null
    this.primaryProvider = (process.env.AI_PRIMARY_PROVIDER as 'anthropic' | 'openai') || 'anthropic'
  }

  /**
   * Generate dashboard card from user prompt
   */
  async generateDashboardCard(request: DashboardCardRequest): Promise<AIResponse> {
    const startTime = Date.now()
    
    try {
      // Try primary provider first
      if (this.primaryProvider === 'anthropic' && this.anthropicApiKey) {
        return await this.callAnthropic(request, startTime)
      } else if (this.primaryProvider === 'openai' && this.openaiApiKey) {
        return await this.callOpenAI(request, startTime)
      }
      
      // Fallback to secondary provider
      if (this.anthropicApiKey) {
        return await this.callAnthropic(request, startTime)
      } else if (this.openaiApiKey) {
        return await this.callOpenAI(request, startTime)
      }
      
      throw new Error('No AI API keys configured')
    } catch (error) {
      console.error('AI Service Error:', error)
      throw error
    }
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
        max_tokens: parseInt(process.env.AI_MAX_TOKENS || '4000'),
        temperature: parseFloat(process.env.AI_TEMPERATURE || '0.1'),
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
        max_tokens: parseInt(process.env.AI_MAX_TOKENS || '4000'),
        temperature: parseFloat(process.env.AI_TEMPERATURE || '0.1')
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

  /**
   * Build AI prompt for dashboard card generation
   */
  private buildPrompt(request: DashboardCardRequest): string {
    return `You are helping create a dashboard card for a KENAL admin system. The user wants: "${request.userPrompt}"

Available data sources in the KENAL database:
- kd_users (1,350 total users with created_at, username, email, is_active, user_type)
- kd_conversations (chat conversations)
- kd_messages (individual messages)
- Real-time data access with no limits

Data type detection:
- "user count", "total users", "how many users" → type: "user_count"
- "user growth", "growth chart", "registration trend" → type: "user_growth" 
- "users by age", "age distribution", "user age" → type: "user_age"
- "user table", "recent users", "user list" → type: "user_table"

IMPORTANT: Respond with ONLY a valid JSON object. No explanations, no markdown formatting, no additional text.

Generate a JSON configuration for a dashboard card:

For user counts/statistics, use:
{
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
  "chart": {"type": "line", "options": {}, "colors": ["#1976d2"]},
  "ai": {
    "prompt": "${request.userPrompt}",
    "insights": "Shows the total number of active users in the system"
  }
}

For charts/trends, use:
{
  "basic": {
    "type": "chart",
    "title": "User Growth",
    "description": "Monthly user registration trend"
  },
  "position": {"x": 0, "y": 0, "width": 6, "height": 4},
  "data": {
    "source": "kd_users",
    "query": "SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as value FROM kd_users GROUP BY month ORDER BY month",
    "refresh_interval": 300
  },
  "chart": {"type": "line", "options": {}, "colors": ["#1976d2", "#dc004e"]},
  "ai": {
    "prompt": "${request.userPrompt}",
    "insights": "Displays monthly user registration trends over time"
  }
}

For tables, use:
{
  "basic": {
    "type": "table",
    "title": "Recent Users",
    "description": "List of recently registered users"
  },
  "position": {"x": 0, "y": 0, "width": 8, "height": 4},
  "data": {
    "source": "kd_users",
    "query": "SELECT id, username, email, created_at, is_active FROM kd_users ORDER BY created_at DESC LIMIT 10",
    "refresh_interval": 300
  },
  "chart": {"type": "table", "options": {}, "colors": ["#1976d2"]},
  "ai": {
    "prompt": "${request.userPrompt}",
    "insights": "Shows the most recently registered users in the system"
  }
}

Choose the appropriate template based on the user request and respond with clean JSON only.`
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
}

// Export singleton instance
export const aiService = new AIService() 