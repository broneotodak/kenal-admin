import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Test basic connectivity and get table info
    const results = {
      tables: [] as any[],
      views: [] as any[],
      connectivity: false,
      sampleData: {} as any
    }

    // Test basic connectivity with kd_users
    try {
      const { count, error } = await supabase
        .from('kd_users')
        .select('*', { count: 'exact', head: true })
      
      if (!error) {
        results.connectivity = true
        results.sampleData.total_users = count || 0
      }
    } catch (err) {
      console.log('kd_users table test failed:', err)
    }

    // Test other common tables
    const tablesToTest = [
      'kd_users', 'kd_identity', 'kd_user_details', 
      'kd_conversations', 'kd_messages', 'kd_analytics',
      'kd_problem_updates'
    ]

    for (const table of tablesToTest) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (!error) {
          results.tables.push({
            name: table,
            count: count || 0,
            accessible: true
          })
        } else {
          results.tables.push({
            name: table,
            count: 0,
            accessible: false,
            error: error.message
          })
        }
      } catch (err) {
        results.tables.push({
          name: table,
          count: 0,
          accessible: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    // Try to get a sample of recent users for real data
    try {
      const { data: recentUsers, error } = await supabase
        .from('kd_users')
        .select('id, name, email, created_at, user_type')
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (!error && recentUsers) {
        results.sampleData.recent_users = recentUsers
      }
    } catch (err) {
      console.log('Recent users query failed:', err)
    }

    // Try to get user growth data
    try {
      const { data: users, error } = await supabase
        .from('kd_users')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1000)
      
      if (!error && users) {
        // Group by month
        const monthlyData = users.reduce((acc: any, user: any) => {
          const month = new Date(user.created_at).toISOString().substring(0, 7)
          acc[month] = (acc[month] || 0) + 1
          return acc
        }, {})
        
        results.sampleData.monthly_growth = Object.entries(monthlyData)
          .map(([month, count]) => ({ month, value: count }))
          .slice(0, 12)
      }
    } catch (err) {
      console.log('User growth query failed:', err)
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Database check error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to check database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 