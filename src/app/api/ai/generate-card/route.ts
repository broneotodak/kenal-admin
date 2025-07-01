import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/services/ai/aiService'

export async function POST(request: NextRequest) {
  try {
    const { userPrompt, availableData, currentDashboard } = await request.json()
    
    console.log('🤖 AI Card Generation Request:', {
      prompt: userPrompt,
      availableDataCount: availableData?.length,
      existingCards: currentDashboard?.length
    })

    if (!userPrompt || userPrompt.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'User prompt is required' },
        { status: 400 }
      )
    }

    // Call AI service with enhanced prompt handling
    const aiResponse = await aiService.generateDashboardCard({
      userPrompt: userPrompt.trim(),
      availableData: availableData || [
        'kd_users', 'kd_identity', 'kd_conversations', 
        'kd_messages', 'kd_problem_updates'
      ],
      currentDashboard: currentDashboard || []
    })

    console.log('🤖 AI Response received:', {
      provider: aiResponse.provider,
      model: aiResponse.model,
      processingTime: aiResponse.processingTimeMs,
      tokenUsage: aiResponse.tokenUsage,
      contentLength: aiResponse.content.length
    })

    // Parse AI response as JSON
    let cardConfig
    try {
      // Clean the response content to ensure it's valid JSON
      const cleanContent = aiResponse.content
        .replace(/```json\s*|\s*```/g, '') // Remove markdown code blocks
        .replace(/^[^{]*(\{[\s\S]*\})[^}]*$/, '$1') // Extract JSON object
        .trim()
        
      cardConfig = JSON.parse(cleanContent)
      console.log('✅ AI card configuration parsed:', {
        type: cardConfig.basic?.type,
        title: cardConfig.basic?.title,
        chartType: cardConfig.chart?.type,
        hasProcessing: !!cardConfig.data?.processing,
        visualization: cardConfig.ai?.visualization_reasoning
      })
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError)
      console.log('Raw AI Content:', aiResponse.content)
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to parse AI response as JSON',
          details: parseError instanceof Error ? parseError.message : 'Invalid JSON format',
          rawContent: aiResponse.content.substring(0, 500) + '...'
        },
        { status: 500 }
      )
    }

    // Validate card configuration structure
    if (!cardConfig.basic || !cardConfig.basic.type || !cardConfig.basic.title) {
      console.error('❌ Invalid card configuration:', cardConfig)
      return NextResponse.json(
        { 
          success: false, 
          error: 'AI generated invalid card configuration',
          details: 'Missing required fields: basic.type or basic.title'
        },
        { status: 500 }
      )
    }

    // Enhance card configuration with metadata
    const enhancedCard = {
      ...cardConfig,
      metadata: {
        generatedAt: new Date().toISOString(),
        provider: aiResponse.provider,
        model: aiResponse.model,
        processingTimeMs: aiResponse.processingTimeMs,
        tokenUsage: aiResponse.tokenUsage,
        userPrompt: userPrompt.trim()
      }
    }

    console.log('🎯 Card generation successful:', {
      title: enhancedCard.basic.title,
      type: enhancedCard.basic.type,
      chartType: enhancedCard.chart?.type,
      hasSmartProcessing: !!enhancedCard.data?.processing
    })

    return NextResponse.json({
      success: true,
      card: enhancedCard,
      metadata: {
        provider: aiResponse.provider,
        model: aiResponse.model,
        processingTimeMs: aiResponse.processingTimeMs,
        tokenUsage: aiResponse.tokenUsage
      }
    })

  } catch (error) {
    console.error('❌ AI Card Generation Error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate dashboard card',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Test AI service connectivity
    const connectionStatus = await aiService.testConnection()
    
    return NextResponse.json({
      success: true,
      status: 'AI service is ready',
      providers: connectionStatus
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'AI service test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 