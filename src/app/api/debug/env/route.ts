import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check environment variables (without exposing sensitive values)
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV || 'undefined',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing',
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? '✅ Set' : '❌ Missing',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing',
      AI_PRIMARY_PROVIDER: process.env.AI_PRIMARY_PROVIDER || 'undefined',
      // Show first few characters of keys for verification (not full keys)
      SUPABASE_URL_PREVIEW: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...' || 'undefined',
      SERVICE_KEY_PREVIEW: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...' || 'undefined',
      timestamp: new Date().toISOString(),
      buildEnvironment: 'production'
    }

    return NextResponse.json({
      success: true,
      environment: envCheck,
      message: 'Environment variable check complete'
    })

  } catch (error) {
    console.error('❌ Environment debug error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Environment debug failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 