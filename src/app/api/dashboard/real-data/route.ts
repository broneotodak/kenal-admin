import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { type, cardType } = await request.json()
    
    console.log('🔍 Real data request:', { type, cardType })
    
    // Create admin client with service role key
    const supabase = createSupabaseAdmin()
    
    let result = null
    
    if (type === 'user_count' || cardType === 'stat') {
      // Get real user count
      console.log('📊 Fetching real user count from server...')
      
      const { count, error } = await supabase
        .from('kd_users')
        .select('*', { count: 'exact', head: true })
      
      console.log('📊 Server result:', { count, error })
      
      if (error) {
        console.error('❌ Server error:', error)
        throw error
      }
      
      result = { count: count || 0 }
      
    } else if (type === 'user_growth' || cardType === 'chart') {
      // Get real user growth - ALL USERS, no limit
      console.log('📈 Fetching ALL user growth data from server...')
      
      const { data: users, error } = await supabase
        .from('kd_users')
        .select('created_at')
        .order('created_at', { ascending: true })
      
      if (error) throw error
      
      console.log(`📊 Retrieved ${users?.length || 0} users for growth analysis`)
      
      // Group by month with better date handling
      const monthlyData = users?.reduce((acc: any, user: any) => {
        if (user.created_at) {
          const date = new Date(user.created_at)
          const month = date.toISOString().substring(0, 7) // YYYY-MM format
          acc[month] = (acc[month] || 0) + 1
        }
        return acc
      }, {})
      
      console.log('📅 Monthly distribution:', monthlyData)
      
      result = Object.entries(monthlyData || {})
        .map(([month, count]) => ({ month, value: count }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-24) // Last 24 months instead of 12
      
    } else if (type === 'user_table' || cardType === 'table') {
      // Get real user table
      console.log('📋 Fetching real user table from server...')
      
      const { data: users, error } = await supabase
        .from('kd_users')
        .select('id, username, email, created_at, is_active, user_type')
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (error) throw error
      result = users
      
    } else if (type === 'user_age' || (cardType === 'chart' && type.includes('age'))) {
      // Get real user age distribution
      console.log('👥 Fetching user age distribution from server...')
      
      const { data: users, error } = await supabase
        .from('kd_users')
        .select('created_at, birth_date, age')
        .order('created_at', { ascending: true })
      
      if (error) throw error
      
      console.log(`👥 Retrieved ${users?.length || 0} users for age analysis`)
      
      // Calculate age distribution based on account age (since we may not have birth_date)
      const ageDistribution = users?.reduce((acc: any, user: any) => {
        if (user.created_at) {
          const accountAge = Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
          const ageGroup = accountAge < 1 ? 'New (< 1 year)' :
                          accountAge < 2 ? '1-2 years' :
                          accountAge < 3 ? '2-3 years' :
                          accountAge < 5 ? '3-5 years' :
                          '5+ years'
          acc[ageGroup] = (acc[ageGroup] || 0) + 1
        }
        return acc
      }, {})
      
      console.log('👥 Age distribution:', ageDistribution)
      
      result = Object.entries(ageDistribution || {})
        .map(([ageGroup, count]) => ({ category: ageGroup, value: count }))
        .sort((a, b) => a.category.localeCompare(b.category))
      
    } else {
      // Default to user count
      const { count, error } = await supabase
        .from('kd_users')
        .select('*', { count: 'exact', head: true })
      
      if (error) throw error
      result = { count: count || 0 }
    }
    
    console.log('✅ Server returning real data:', result)
    
    return NextResponse.json({
      success: true,
      data: result,
      source: 'real_database',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Server API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch real data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 