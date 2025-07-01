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

    // Smart card selection based on prompt - ORDER MATTERS!
    if (prompt.includes('identity') || prompt.includes('identities')) {
      cardConfig = this.getIdentityCard(request.userPrompt)
    } else if (prompt.includes('age') || prompt.includes('demographic')) {
      cardConfig = this.getAgeDistributionCard(request.userPrompt)
    } else if (prompt.includes('country') || prompt.includes('geographic') || prompt.includes('location')) {
      cardConfig = this.getGeographicCard(request.userPrompt)
    } else if (prompt.includes('gender')) {
      cardConfig = this.getGenderCard(request.userPrompt)
    } else if (prompt.includes('growth') || prompt.includes('trend') || prompt.includes('registration')) {
      cardConfig = this.getGrowthCard(request.userPrompt)
    } else if (prompt.includes('element')) {
      cardConfig = this.getElementCard(request.userPrompt)
    } else if (prompt.includes('total') || prompt.includes('count')) {
      cardConfig = this.getUserCountCard(request.userPrompt)
    } else {
      // Default to user count for unclear prompts
      cardConfig = this.getUserCountCard(request.userPrompt)
    }

    const processingTimeMs = Date.now() - startTime

    return {
      content: JSON.stringify(cardConfig),
      provider: 'anthropic',
      model: 'mock-claude-3.5-sonnet',
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
  private getIdentityCard(prompt: string) {
    return {
      "basic": {
        "type": "stat",
        "title": "Users with Identity",
        "description": "Total number of users who have completed their identity assessment"
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
        "insights": "Shows the number of users who have completed their personality identity assessment",
        "visualization_reasoning": "Stat card chosen for single identity count value display"
      }
    }
  }

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
              "callbacks": {
                "label": "function(context) { return context.dataset.label + ': ' + context.parsed.y.toLocaleString() + ' users'; }"
              }
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
              "callbacks": {
                "label": "function(context) { return context.label + ': ' + context.parsed + ' users (' + Math.round(context.parsed / context.dataset.data.reduce((a,b) => a+b, 0) * 100) + '%)'; }"
              }
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
              "callbacks": {
                "label": "function(context) { return context.label + ': ' + context.parsed + ' users (' + Math.round(context.parsed / context.dataset.data.reduce((a,b) => a+b, 0) * 100) + '%)'; }"
              }
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
              "callbacks": {
                "title": "function(context) { return 'Element ' + context[0].label; }",
                "label": "function(context) { return context.parsed.y + ' users'; }"
              }
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

Available data sources in the KENAL database:

🔍 PRIMARY TABLES:
- kd_users (1,350+ users) with fields:
  * id, username, email, created_at, is_active, user_type
  * birth_date (for age calculations), age (direct age field)
  * element_number, gender, registration_country
  * user_details (JSONB with additional age info)
  * join_by_invitation (boolean)

- kd_identity (user personality patterns)
- kd_conversations (chat conversations)  
- kd_messages (individual messages)
- kd_problem_updates (feedback/reports)

🎯 SMART DATA ANALYSIS & VISUALIZATION:
The system has intelligent age detection with multiple fallback methods and smart chart type selection.

AGE GROUP CATEGORIES:
- 'Under 18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'
- Fallback: 'New Users (< 1 month)', 'Recent (1-6 months)', 'Regular (6-12 months)', 'Veteran (1+ years)'

🔍 DATA TYPE DETECTION & OPTIMAL VISUALIZATION:
- "user count", "total users", "how many users" → type: "user_count" → STAT card
- "user growth", "growth chart", "registration trend" → type: "user_growth" → LINE chart 
- "users by age", "age distribution", "user age", "age groups" → type: "user_age" → BAR chart (categorical)
- "user table", "recent users", "user list" → type: "user_table" → TABLE
- "by country", "geography", "location" → type: "user_geography" → DOUGHNUT chart
- "by gender", "gender split" → type: "user_gender" → PIE chart
- "by element", "element distribution" → type: "user_elements" → BAR chart

🎨 INTELLIGENT CHART TYPE SELECTION:
- **Categorical Data** (age groups, countries, elements): Use BAR or DOUGHNUT charts
- **Time Series Data** (growth, trends): Use LINE charts
- **Comparisons** (gender, yes/no): Use PIE or DOUGHNUT charts
- **Large Categories** (>8 items): Use BAR charts for readability
- **Small Categories** (≤5 items): Use DOUGHNUT for visual appeal

IMPORTANT: Respond with ONLY a valid JSON object. No explanations, no markdown formatting, no additional text.

📊 ENHANCED DASHBOARD CARD TEMPLATES:

For AGE DISTRIBUTION (SMART ANALYSIS), use:
{
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
          "callbacks": {
            "label": "function(context) { return context.dataset.label + ': ' + context.parsed.y.toLocaleString() + ' users'; }"
          }
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
    "prompt": "${request.userPrompt}",
    "insights": "Intelligent age analysis with multiple detection methods, fallback to account tenure when age data unavailable",
    "visualization_reasoning": "Bar chart chosen for categorical age group data with clear comparisons"
  }
}

For GEOGRAPHIC DISTRIBUTION, use:
{
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
          "callbacks": {
            "label": "function(context) { return context.label + ': ' + context.parsed + ' users (' + Math.round(context.parsed / context.dataset.data.reduce((a,b) => a+b, 0) * 100) + '%)'; }"
          }
        }
      }
    }, 
    "colors": ["#1976d2", "#dc004e", "#ff9800", "#4caf50", "#9c27b0", "#f44336", "#607d8b", "#795548", "#009688", "#e91e63"]
  },
  "ai": {
    "prompt": "${request.userPrompt}",
    "insights": "Shows user distribution across different countries with percentage breakdown",
    "visualization_reasoning": "Doughnut chart chosen for geographic data to show proportional relationships"
  }
}

For GENDER DISTRIBUTION, use:
{
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
          "callbacks": {
            "label": "function(context) { return context.label + ': ' + context.parsed + ' users (' + Math.round(context.parsed / context.dataset.data.reduce((a,b) => a+b, 0) * 100) + '%)'; }"
          }
        }
      }
    }, 
    "colors": ["#1976d2", "#dc004e", "#ff9800"]
  },
  "ai": {
    "prompt": "${request.userPrompt}",
    "insights": "Shows gender distribution with percentage breakdown",
    "visualization_reasoning": "Pie chart chosen for binary/tertiary gender data comparison"
  }
}

For USER GROWTH TRENDS, use:
{
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
    "prompt": "${request.userPrompt}",
    "insights": "Displays monthly user registration trends with smooth curve visualization",
    "visualization_reasoning": "Line chart chosen for time series data to show growth trends"
  }
}

For ELEMENT DISTRIBUTION, use:
{
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
          "callbacks": {
            "title": "function(context) { return 'Element ' + context[0].label; }",
            "label": "function(context) { return context.parsed.y + ' users'; }"
          }
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
    "prompt": "${request.userPrompt}",
    "insights": "Shows user distribution across 9 element types with distinct color coding",
    "visualization_reasoning": "Bar chart chosen for element categories to compare quantities across types"
  }
}

For USER COUNT (STATISTICS), use:
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
  "chart": {"type": "stat", "options": {}, "colors": ["#1976d2"]},
  "ai": {
    "prompt": "${request.userPrompt}",
    "insights": "Shows the total number of active users in the system",
    "visualization_reasoning": "Stat card chosen for single numeric value display"
  }
}

For USER TABLES/LISTS, use:
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
    "insights": "Shows the most recently registered users in the system",
    "visualization_reasoning": "Table chosen for detailed user data display"
  }
}

🎯 SMART SELECTION RULES:
1. **Analyze the user's request** for data type and visualization intent
2. **Choose optimal chart type** based on data characteristics
3. **Configure appropriate colors** and styling for the chart type
4. **Add meaningful tooltips** and labels for better UX
5. **Include visualization reasoning** in AI insights

Choose the most appropriate template and customize it based on the specific user request. Pay special attention to chart type selection for optimal data presentation.`
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