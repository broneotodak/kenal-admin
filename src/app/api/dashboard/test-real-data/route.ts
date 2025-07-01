import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
  try {
    console.log('🧪 Testing real data access...')
    
    // Create admin client with service role key
    const supabase = createSupabaseAdmin()
    
    // Test 1: Get total users
    const { count: userCount, error: userError } = await supabase
      .from('kd_users')
      .select('*', { count: 'exact', head: true })
    
    console.log('👥 User count result:', { count: userCount, error: userError })
    
    // Test 2: Get recent users
    const { data: recentUsers, error: usersError } = await supabase
      .from('kd_users')
      .select('id, name, email, created_at, user_type')
      .order('created_at', { ascending: false })
      .limit(5)
    
    console.log('📋 Recent users:', { count: recentUsers?.length, error: usersError })
    
    // Test 3: Get user growth
    const { data: allUsers, error: growthError } = await supabase
      .from('kd_users')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1000)
    
    let monthlyGrowth = null
    if (!growthError && allUsers) {
      const monthlyData = allUsers.reduce((acc: any, user: any) => {
        const month = new Date(user.created_at).toISOString().substring(0, 7)
        acc[month] = (acc[month] || 0) + 1
        return acc
      }, {})
      
      monthlyGrowth = Object.entries(monthlyData)
        .map(([month, count]) => ({ month, value: count }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12)
    }
    
    console.log('📈 Growth data:', { months: monthlyGrowth?.length, error: growthError })

    return NextResponse.json({
      success: true,
      tests: {
        userCount: {
          result: userCount,
          error: userError?.message,
          success: !userError
        },
        recentUsers: {
          result: recentUsers?.length,
          sampleUser: recentUsers?.[0],
          error: usersError?.message,
          success: !usersError
        },
        userGrowth: {
          result: monthlyGrowth?.length,
          sampleMonth: monthlyGrowth?.[0],
          error: growthError?.message,
          success: !growthError
        }
      },
      realData: {
        totalUsers: userCount || 0,
        recentUsers: recentUsers || [],
        monthlyGrowth: monthlyGrowth || []
      }
    })

  } catch (error) {
    console.error('❌ Test failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 