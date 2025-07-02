import { NextRequest, NextResponse } from 'next/server'
import { smartAIService } from '@/services/ai/smartAiService'

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