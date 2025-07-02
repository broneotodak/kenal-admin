import { NextResponse } from 'next/server'
import { sendReleaseAnnouncement } from '@/services/ntfyService'

export async function POST(request: Request) {
  try {
    // 🔒 Note: Access controlled at component level (NotificationTester is neo@todak.com only)
    console.log('🚀 Sending Smart AI Dashboard release announcement...')
    
    const features = [
      'Smart AI Dashboard with Real SQL Generation',
      'Live KENAL Database Integration (1,422+ users)',
      'Auto-Save & Auto-Load Dashboard System', 
      'Enhanced UX with Loading States & Progress Indicators',
      'GROUP BY Query Processing (Gender, Country, Elements)',
      'Real-Time Data Visualization with Chart.js',
      'Token Usage Tracking with Anthropic Costs',
      'Preset Commands with Smart AI (vs Template AI)',
      'Database Schema Discovery & Caching',
      'Multi-Dimensional Chart Analysis',
      'Complex Query Support (CTE, Aggregations)',
      'Professional Dashboard Persistence',
      'Performance Optimization (3-5s response time)',
      'Error Handling with Template AI Fallback'
    ]

    const success = await sendReleaseAnnouncement(
      'Smart AI Dashboard v2.0', 
      features,
      'neo@todak.com'
    )

    if (success) {
      console.log('✅ Release announcement sent successfully')
      return NextResponse.json({ 
        success: true, 
        message: 'Release announcement sent to development team' 
      })
    } else {
      throw new Error('Failed to send notification')
    }

  } catch (error) {
    console.error('❌ Failed to send release announcement:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send release announcement' 
    }, { status: 500 })
  }
} 