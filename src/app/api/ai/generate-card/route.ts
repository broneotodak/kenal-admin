import { NextRequest, NextResponse } from 'next/server'
import { aiService } from '@/services/ai/aiService'

export async function POST(request: NextRequest) {
  try {
    const { userPrompt, availableData, currentDashboard } = await request.json()

    if (!userPrompt) {
      return NextResponse.json(
        { error: 'User prompt is required' },
        { status: 400 }
      )
    }

    // Generate dashboard card using AI
    const aiResponse = await aiService.generateDashboardCard({
      userPrompt,
      availableData: availableData || [
        'kd_users', 'kd_identity', 'kd_user_details', 
        'kd_conversations', 'kd_messages', 'kd_analytics'
      ],
      currentDashboard
    })

    let parsedCard
    try {
      // Clean the AI response to remove potential control characters
      const cleanedContent = aiResponse.content
        .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
        .replace(/\\n/g, '\\\\n') // Escape newlines properly
        .replace(/\\t/g, '\\\\t') // Escape tabs properly
      
      parsedCard = JSON.parse(cleanedContent)
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      console.error('AI Response Content:', aiResponse.content)
      
      // Fallback: Create a basic card structure
      parsedCard = {
        basic: {
          type: 'stat',
          title: userPrompt.length > 50 ? userPrompt.substring(0, 50) + '...' : userPrompt,
          description: 'AI-generated dashboard card'
        },
        position: { x: 0, y: 0, width: 4, height: 3 },
        data: {
          source: 'kd_users',
          query: 'SELECT COUNT(*) as total_users FROM kd_users WHERE deleted_at IS NULL',
          refresh_interval: 300
        },
        chart: { type: 'line', options: {}, colors: ['#1976d2'] },
        ai: {
          prompt: userPrompt,
          insights: 'This card shows basic statistics from your KENAL system.'
        }
      }
    }

    return NextResponse.json({
      success: true,
      card: parsedCard,
      metadata: {
        provider: aiResponse.provider,
        model: aiResponse.model,
        tokenUsage: aiResponse.tokenUsage,
        processingTimeMs: aiResponse.processingTimeMs
      }
    })

  } catch (error) {
    console.error('AI Card Generation Error:', error)
    
    return NextResponse.json(
      { 
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