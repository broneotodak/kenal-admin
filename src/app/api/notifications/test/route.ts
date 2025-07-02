import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { type, category } = await request.json()
    
    // Generate appropriate test notification based on type
    let notificationData
    
    switch (category) {
      case 'feedback':
        notificationData = {
          type: type || 'info',
          title: 'Test Feedback Notification',
          message: 'New feedback "Test Issue" has been submitted successfully.',
          category: 'feedback',
          timestamp: new Date().toISOString()
        }
        break
        
      case 'github':
        notificationData = {
          type: 'info',
          title: 'Test GitHub Push',
          message: 'Latest: "feat: Add notification system enhancements" - KENAL Admin',
          category: 'github',
          timestamp: new Date().toISOString()
        }
        break
        
      case 'system':
        notificationData = {
          type: type || 'info',
          title: 'Test System Notification',
          message: 'System status update: All services running normally.',
          category: 'system',
          timestamp: new Date().toISOString()
        }
        break
        
      case 'development':
        notificationData = {
          type: type || 'info',
          title: 'Test Development Update',
          message: 'New feature deployment completed successfully.',
          category: 'development',
          timestamp: new Date().toISOString()
        }
        break
        
      default:
        notificationData = {
          type: 'info',
          title: 'Test Notification',
          message: 'This is a test notification to verify the system is working.',
          category: 'system',
          timestamp: new Date().toISOString()
        }
    }
    
    return NextResponse.json({ 
      success: true, 
      notification: notificationData,
      message: 'Test notification data generated. Emit this via client-side event to trigger notification.'
    })
  } catch (error) {
    console.error('Test notification error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate test notification' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Notification test endpoint',
    availableCategories: ['feedback', 'github', 'system', 'development'],
    availableTypes: ['info', 'success', 'warning', 'error'],
    usage: 'POST with { type: "info", category: "feedback" }'
  })
} 