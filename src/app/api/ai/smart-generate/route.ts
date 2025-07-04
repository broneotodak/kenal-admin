import { NextRequest, NextResponse } from 'next/server'
import { smartAIService } from '@/services/ai/smartAiService'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase admin client for tracking
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const { userPrompt, userId } = await request.json()
    
    console.log('🚀 Smart AI API request:', { userPrompt, userId })
    
    if (!userPrompt || !userPrompt.trim()) {
      return NextResponse.json(
        { error: 'User prompt is required' },
        { status: 400 }
      )
    }

    // Process the smart AI request
    const result = await smartAIService.processSmartRequest({
      userPrompt: userPrompt.trim(),
      userId
    })

    if (result.success) {
      console.log('✅ Smart AI request successful')
      
      // Track successful prompt usage
      if (userId) {
        try {
          const chartType = result.cardConfig?.content?.chartType || 
                          (result.cardConfig?.type === 'chart' ? 'bar' : null)
          
          await supabaseAdmin
            .from('admin_prompt_usage')
            .insert({
              user_id: userId,
              prompt: userPrompt.trim(),
              prompt_type: result.cardConfig?.type || 'unknown',
              chart_type: chartType,
              success: true,
              metadata: {
                processing_time_ms: result.processingTimeMs,
                token_usage: result.tokenUsage,
                has_real_time: result.realTimeStatus?.isRealTime || false
              }
            })
          
          console.log('📊 Tracked prompt usage')
        } catch (trackError) {
          // Don't fail the request if tracking fails
          console.warn('Failed to track prompt usage:', trackError)
        }
      }
      
      return NextResponse.json({
        success: true,
        cardConfig: result.cardConfig,
        sqlQuery: result.sqlQuery,
        explanation: result.explanation,
        processingTimeMs: result.processingTimeMs,
        tokenUsage: result.tokenUsage,
        realTimeStatus: result.realTimeStatus,
        provider: 'smart_ai',
        model: 'dynamic_sql_generator'
      })
    } else {
      console.error('❌ Smart AI request failed:', result.error)
      
      // Track failed prompts too (for learning)
      if (userId) {
        try {
          await supabaseAdmin
            .from('admin_prompt_usage')
            .insert({
              user_id: userId,
              prompt: userPrompt.trim(),
              prompt_type: 'error',
              success: false,
              metadata: {
                error: result.error,
                processing_time_ms: result.processingTimeMs
              }
            })
        } catch (trackError) {
          console.warn('Failed to track failed prompt:', trackError)
        }
      }
      
      return NextResponse.json(
        { 
          error: result.error || 'Smart AI processing failed',
          processingTimeMs: result.processingTimeMs
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Smart AI API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 