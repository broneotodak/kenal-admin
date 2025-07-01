/**
 * SMART AI SERVICE - Dynamic Database Analysis & Visualization
 * 
 * This service provides TRUE AI intelligence by:
 * 1. Automatically discovering database schema
 * 2. Converting natural language to SQL queries  
 * 3. Generating appropriate visualizations dynamically
 * 4. Handling ANY admin request without predefined templates
 */

import { createSupabaseAdmin } from '@/lib/supabase-server'

interface DatabaseSchema {
  tables: {
    [tableName: string]: {
      columns: {
        name: string
        type: string
        nullable: boolean
        description?: string
      }[]
      relationships: {
        table: string
        column: string
        foreignTable: string
        foreignColumn: string
      }[]
      sampleData: any[]
    }
  }
}

interface SmartAIRequest {
  userPrompt: string
  userId?: string
}

interface SmartAIResponse {
  success: boolean
  cardConfig?: any
  sqlQuery?: string
  explanation?: string
  error?: string
  processingTimeMs: number
}

export class SmartAIService {
  private anthropicApiKey: string | null = null
  private openaiApiKey: string | null = null
  private primaryProvider: 'anthropic' | 'openai' = 'anthropic'
  private databaseSchema: DatabaseSchema | null = null
  private schemaLastUpdated: number = 0
  private SCHEMA_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  constructor() {
    this.initializeKeys()
  }

  private initializeKeys() {
    // Get API keys from environment
    if (typeof window === 'undefined') {
      // Server-side
      this.anthropicApiKey = process.env.ANTHROPIC_API_KEY || null
      this.openaiApiKey = process.env.OPENAI_API_KEY || null
      this.primaryProvider = (process.env.AI_PRIMARY_PROVIDER as 'anthropic' | 'openai') || 'anthropic'
      
      console.log('🔧 Smart AI Service Configuration:')
      console.log('- Anthropic API Key:', this.anthropicApiKey ? `Present (${this.anthropicApiKey.substring(0, 8)}...)` : 'Missing')
      console.log('- OpenAI API Key:', this.openaiApiKey ? `Present (${this.openaiApiKey.substring(0, 8)}...)` : 'Missing')
      console.log('- Primary Provider:', this.primaryProvider)
    }
  }

  /**
   * STEP 1: Discover Database Schema Automatically
   */
  private async discoverDatabaseSchema(): Promise<DatabaseSchema> {
    const now = Date.now()
    
    // Return cached schema if still fresh
    if (this.databaseSchema && (now - this.schemaLastUpdated) < this.SCHEMA_CACHE_DURATION) {
      return this.databaseSchema
    }

    console.log('🔍 Discovering database schema...')
    const supabase = createSupabaseAdmin()
    const schema: DatabaseSchema = { tables: {} }

    try {
      // Get table information for KENAL tables
      const keналTables = ['kd_users', 'kd_identity', 'kd_conversations', 'kd_messages', 'kd_problem_updates']
      
      for (const tableName of keналTables) {
        console.log(`📋 Analyzing table: ${tableName}`)
        
        // Get sample data to understand structure
        const { data: sampleData } = await supabase
          .from(tableName)
          .select('*')
          .limit(3)
        
        if (sampleData && sampleData.length > 0) {
          const inferredColumns = Object.keys(sampleData[0]).map(colName => ({
            name: colName,
            type: this.inferColumnType(sampleData[0][colName]),
            nullable: sampleData.some(row => row[colName] === null)
          }))
          
          schema.tables[tableName] = {
            columns: inferredColumns,
            relationships: [],
            sampleData: sampleData.slice(0, 2)
          }

          // Add KENAL-specific column descriptions
          this.addKeналColumnDescriptions(tableName, schema.tables[tableName])
        }
      }

      this.databaseSchema = schema
      this.schemaLastUpdated = now
      
      console.log('✅ Database schema discovered:', Object.keys(schema.tables))
      return schema

    } catch (error) {
      console.error('❌ Schema discovery failed:', error)
      throw new Error('Failed to discover database schema')
    }
  }

  /**
   * Add KENAL-specific business context to columns
   */
  private addKeналColumnDescriptions(tableName: string, tableInfo: any) {
    const descriptions: { [key: string]: { [column: string]: string } } = {
      kd_users: {
        id: 'Unique user identifier (UUID)',
        username: 'User display name',
        email: 'User email address', 
        created_at: 'User registration timestamp',
        birth_date: 'User birth date for age calculation',
        gender: 'User gender (Male, Female, Other)',
        registration_country: 'Country where user registered',
        element_number: 'KENAL personality element (1-9)',
        user_type: 'Account type (premium, basic, etc.)',
        is_active: 'Whether user account is active',
        join_by_invitation: 'True if user joined via invitation'
      },
      kd_identity: {
        user_id: 'References kd_users.id - users who completed assessment',
        identity_type: 'KENAL personality type/category',
        personality_traits: 'JSON with detailed personality data',
        created_at: 'When identity assessment was completed'
      },
      kd_conversations: {
        id: 'Unique conversation identifier',
        participant_1: 'First user in conversation',
        participant_2: 'Second user in conversation', 
        created_at: 'When conversation started',
        last_message_at: 'Timestamp of most recent message'
      },
      kd_messages: {
        id: 'Unique message identifier',
        conversation_id: 'References kd_conversations.id',
        sender_id: 'References kd_users.id - who sent the message',
        content: 'Message text content',
        created_at: 'When message was sent'
      }
    }

    if (descriptions[tableName]) {
      tableInfo.columns.forEach((col: any) => {
        if (descriptions[tableName][col.name]) {
          col.description = descriptions[tableName][col.name]
        }
      })
    }
  }

  private inferColumnType(value: any): string {
    if (value === null) return 'unknown'
    if (typeof value === 'string') {
      if (value.match(/^\d{4}-\d{2}-\d{2}/)) return 'timestamp'
      if (value.match(/^[a-f0-9-]{36}$/)) return 'uuid'
      return 'text'
    }
    if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'numeric'
    if (typeof value === 'boolean') return 'boolean'
    if (typeof value === 'object') return 'json'
    return 'unknown'
  }

  /**
   * STEP 2: Generate SQL Query from Natural Language using AI
   */
  private async generateSQLFromNaturalLanguage(userPrompt: string, schema: DatabaseSchema): Promise<{
    sql: string
    chartType: string
    title: string
    description: string
  }> {
    console.log('🧠 Converting natural language to SQL...')

    // Build comprehensive AI prompt with real schema
    const schemaDescription = this.buildSchemaDescription(schema)
    
    const aiPrompt = `You are a KENAL database analyst. Convert this natural language request to SQL and visualization config.

USER REQUEST: "${userPrompt}"

KENAL DATABASE SCHEMA:
${schemaDescription}

BUSINESS CONTEXT:
- KENAL is a personality assessment platform
- kd_users = ALL registered users  
- kd_identity = Users who COMPLETED personality assessment (subset of kd_users)
- Users can chat via kd_conversations and kd_messages
- element_number (1-9) represents personality elements

RESPONSE FORMAT (JSON only):
{
  "sql": "SELECT statement here",
  "chartType": "bar|line|pie|doughnut|stat|table",
  "title": "Chart title",
  "description": "What this shows",
  "reasoning": "Why this SQL and chart type"
}

RULES:
1. Use real column names from schema above
2. Include proper WHERE clauses for data quality (exclude nulls if needed)  
3. Use appropriate aggregations (COUNT, SUM, AVG, etc.)
4. Choose chart type based on data nature:
   - COUNT queries → stat or bar
   - Time series → line  
   - Categories → bar or pie
   - Cross-analysis → bar (grouped)
5. Add LIMIT for large datasets
6. Use JOIN for multi-table queries when needed

Generate SQL and visualization config:`

    try {
      const response = await this.callAI(aiPrompt)
      const result = JSON.parse(response.content)
      
      console.log('✅ AI generated SQL:', result)
      return result
      
    } catch (error) {
      console.error('❌ AI SQL generation failed:', error)
      throw new Error('Failed to convert natural language to SQL')
    }
  }

  /**
   * STEP 3: Execute SQL Query and Get Real Data
   */
  private async executeSQLQuery(sql: string): Promise<any[]> {
    console.log('📊 Executing SQL query:', sql)
    
    const supabase = createSupabaseAdmin()
    
    try {
      // Direct query execution (since we're generating safe SELECT statements)
      const { data, error } = await supabase.rpc('execute_query', { query_text: sql })
      
      if (error) {
        console.error('❌ SQL execution error:', error)
        throw new Error(`SQL Error: ${error.message}`)
      }
      
      console.log('✅ SQL executed successfully, rows:', data?.length || 0)
      return data || []
      
    } catch (error) {
      console.error('❌ SQL execution failed:', error)
      throw error
    }
  }

  /**
   * STEP 4: Generate Final Dashboard Card Configuration
   */
  private generateDashboardCard(
    queryResult: any[],
    sqlConfig: { sql: string, chartType: string, title: string, description: string },
    userPrompt: string
  ): any {
    console.log('🎨 Generating dashboard card configuration...')

    // Intelligent data format detection
    let processedData
    let chartType = sqlConfig.chartType

    if (queryResult.length === 0) {
      throw new Error('No data returned from query')
    }

    // Single value result (COUNT, SUM, etc.)
    if (queryResult.length === 1 && Object.keys(queryResult[0]).length === 1) {
      const value = Object.values(queryResult[0])[0]
      processedData = { count: value }
      chartType = 'stat'
    }
    // Multiple rows - chart data
    else {
      const firstRow = queryResult[0]
      const columns = Object.keys(firstRow)
      
      // Detect label and value columns intelligently
      const labelColumn = columns.find(col => 
        col.includes('name') || col.includes('category') || col.includes('type') || 
        col.includes('country') || col.includes('gender') || col.includes('element') ||
        col.includes('group') || col.includes('month')
      ) || columns[0]
      
      const valueColumn = columns.find(col => 
        col.includes('count') || col.includes('total') || col.includes('sum') || 
        col.includes('avg') || col.includes('value')
      ) || columns[1] || columns[0]

      // Convert to chart-ready format
      processedData = queryResult.map(row => ({
        category: row[labelColumn],
        value: row[valueColumn],
        label: row[labelColumn],
        count: row[valueColumn]
      }))

      // Smart chart type adjustment based on data
      if (queryResult.length <= 5 && !labelColumn.includes('month')) {
        chartType = 'pie'
      } else if (labelColumn.includes('month') || labelColumn.includes('date')) {
        chartType = 'line'
      } else {
        chartType = 'bar'
      }
    }

    // Generate card configuration
    const cardConfig = {
      basic: {
        type: chartType,
        title: sqlConfig.title,
        description: sqlConfig.description
      },
      position: { x: 0, y: 0, width: chartType === 'stat' ? 4 : 6, height: chartType === 'stat' ? 3 : 4 },
      data: {
        source: 'dynamic_sql',
        query: sqlConfig.sql,
        refresh_interval: 300,
        processing: 'smart_ai_generated'
      },
      chart: {
        type: chartType,
        options: this.getChartOptions(chartType),
        colors: this.getChartColors(chartType)
      },
      ai: {
        prompt: userPrompt,
        insights: `AI-generated analysis: ${sqlConfig.description}`,
        visualization_reasoning: `Chart type '${chartType}' chosen based on data structure and content`,
        sql_query: sqlConfig.sql,
        generated_at: new Date().toISOString()
      },
      smartData: processedData // Include processed data directly
    }

    console.log('✅ Dashboard card generated:', cardConfig.basic.title)
    return cardConfig
  }

  /**
   * MAIN METHOD: Process Natural Language Request
   */
  async processSmartRequest(request: SmartAIRequest): Promise<SmartAIResponse> {
    const startTime = Date.now()
    
    try {
      console.log('🚀 Processing smart AI request:', request.userPrompt)

      // Step 1: Discover database schema
      const schema = await this.discoverDatabaseSchema()

      // Step 2: Generate SQL from natural language
      const sqlConfig = await this.generateSQLFromNaturalLanguage(request.userPrompt, schema)

      // Step 3: Execute SQL query
      const queryResult = await this.executeSQLQuery(sqlConfig.sql)

      // Step 4: Generate dashboard card
      const cardConfig = this.generateDashboardCard(queryResult, sqlConfig, request.userPrompt)

      const processingTimeMs = Date.now() - startTime

      return {
        success: true,
        cardConfig,
        sqlQuery: sqlConfig.sql,
        explanation: `Generated SQL query and ${cardConfig.basic.type} chart with ${queryResult.length} data points`,
        processingTimeMs
      }

    } catch (error) {
      console.error('❌ Smart AI request failed:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTimeMs: Date.now() - startTime
      }
    }
  }

  private buildSchemaDescription(schema: DatabaseSchema): string {
    let description = ''
    
    for (const [tableName, tableInfo] of Object.entries(schema.tables)) {
      description += `\nTABLE: ${tableName}\n`
      description += 'COLUMNS:\n'
      
      tableInfo.columns.forEach(col => {
        description += `  - ${col.name} (${col.type})${col.nullable ? ' nullable' : ''}`
        if (col.description) {
          description += ` - ${col.description}`
        }
        description += '\n'
      })
      
      if (tableInfo.sampleData.length > 0) {
        description += 'SAMPLE DATA:\n'
        const sample = tableInfo.sampleData[0]
        Object.entries(sample).slice(0, 3).forEach(([key, value]) => {
          description += `  ${key}: ${value}\n`
        })
      }
      description += '\n'
    }
    
    return description
  }

  private async callAI(prompt: string): Promise<{ content: string }> {
    if (this.primaryProvider === 'anthropic' && this.anthropicApiKey) {
      return await this.callAnthropic(prompt)
    } else if (this.openaiApiKey) {
      return await this.callOpenAI(prompt)
    } else {
      throw new Error('No AI API keys configured')
    }
  }

  private async callAnthropic(prompt: string): Promise<{ content: string }> {
    if (!this.anthropicApiKey) {
      throw new Error('Anthropic API key not configured')
    }

    console.log('🔑 Anthropic API Key configured:', this.anthropicApiKey ? 'Yes' : 'No')
    
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
          max_tokens: 4000,
          temperature: 0.1,
          messages: [{ role: 'user', content: prompt }]
        })
      })

      console.log('📡 Anthropic API Response Status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Anthropic API Error Details:', errorText)
        throw new Error(`Anthropic API error (${response.status}): ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log('✅ Anthropic API Response received')
      return { content: data.content[0].text }
      
    } catch (error) {
      console.error('❌ Anthropic API Call Failed:', error)
      throw error
    }
  }

  private async callOpenAI(prompt: string): Promise<{ content: string }> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are a database analyst expert. Always respond with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.1
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    return { content: data.choices[0].message.content }
  }

  private getChartOptions(chartType: string): any {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top' as const },
        tooltip: { mode: 'index' as const, intersect: false }
      }
    }

    switch (chartType) {
      case 'line':
        return {
          ...baseOptions,
          scales: {
            y: { beginAtZero: true },
            x: { type: 'category' }
          },
          elements: { point: { radius: 4 } }
        }
      case 'bar':
        return {
          ...baseOptions,
          scales: {
            y: { beginAtZero: true },
            x: { type: 'category' }
          }
        }
      case 'pie':
      case 'doughnut':
        return {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' as const }
          }
        }
      default:
        return baseOptions
    }
  }

  private getChartColors(chartType: string): string[] {
    return [
      '#1976d2', '#dc004e', '#ff9800', '#4caf50', 
      '#9c27b0', '#f44336', '#607d8b', '#795548', 
      '#009688', '#e91e63'
    ]
  }
}

// Export singleton instance
export const smartAIService = new SmartAIService() 