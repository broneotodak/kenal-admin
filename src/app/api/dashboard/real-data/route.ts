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
        .select('created_at, birth_date, age, user_details')
        .order('created_at', { ascending: true })
      
      if (error) throw error
      
      console.log(`👥 Retrieved ${users?.length || 0} users for age analysis`)
      
      // Smart age distribution - try multiple approaches
      const ageDistribution = users?.reduce((acc: any, user: any) => {
        let userAge = null
        
        // Method 1: Direct age field
        if (user.age && typeof user.age === 'number' && user.age > 0 && user.age < 120) {
          userAge = user.age
        }
        
        // Method 2: Birth date calculation
        else if (user.birth_date) {
          const birthDate = new Date(user.birth_date)
          const today = new Date()
          userAge = today.getFullYear() - birthDate.getFullYear()
          const monthDiff = today.getMonth() - birthDate.getMonth()
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            userAge--
          }
        }
        
        // Method 3: Check user_details for age info
        else if (user.user_details && typeof user.user_details === 'object') {
          if (user.user_details.age) userAge = user.user_details.age
          else if (user.user_details.birth_date) {
            const birthDate = new Date(user.user_details.birth_date)
            const today = new Date()
            userAge = today.getFullYear() - birthDate.getFullYear()
          }
        }
        
        // Categorize by age groups
        if (userAge !== null && userAge >= 0 && userAge <= 120) {
          const ageGroup = userAge < 18 ? 'Under 18' :
                          userAge < 25 ? '18-24' :
                          userAge < 35 ? '25-34' :
                          userAge < 45 ? '35-44' :
                          userAge < 55 ? '45-54' :
                          userAge < 65 ? '55-64' :
                          '65+'
          acc[ageGroup] = (acc[ageGroup] || 0) + 1
        } else {
          // Fallback: Account tenure (how long they've been users)
          if (user.created_at) {
            const accountMonths = Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30))
            const tenureGroup = accountMonths < 1 ? 'New Users (< 1 month)' :
                               accountMonths < 6 ? 'Recent (1-6 months)' :
                               accountMonths < 12 ? 'Regular (6-12 months)' :
                               'Veteran (1+ years)'
            acc[tenureGroup] = (acc[tenureGroup] || 0) + 1
          }
        }
        return acc
      }, {})
      
      console.log('👥 Smart age distribution:', ageDistribution)
      
      result = Object.entries(ageDistribution || {})
        .map(([ageGroup, count]) => ({ category: ageGroup, value: count }))
        .sort((a, b) => {
          // Sort age groups in logical order
          const ageOrder = ['Under 18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+', 
                           'New Users (< 1 month)', 'Recent (1-6 months)', 'Regular (6-12 months)', 'Veteran (1+ years)']
          return ageOrder.indexOf(a.category) - ageOrder.indexOf(b.category)
        })
      
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