import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { type, cardType, processing } = await request.json()
    
    console.log('🔍 Real data request:', { type, cardType, processing })
    
    // Create admin client with service role key
    const supabase = createSupabaseAdmin()
    
    let result = null
    
    // Handle smart age analysis processing (from AI-generated cards)
    if (processing === 'smart_age_analysis' || type === 'user_age' || (cardType === 'chart' && type.includes('age'))) {
      // Get real user age distribution
      console.log('👥 [SMART AGE ANALYSIS] Fetching user age distribution...')
      
      const { data: users, error } = await supabase
        .from('kd_users')
        .select('created_at, birth_date')
        .order('created_at', { ascending: true })
      
      if (error) throw error
      
      console.log(`👥 Retrieved ${users?.length || 0} users for smart age analysis`)
      
      // Enhanced smart age distribution with better categorization
      const ageDistribution = users?.reduce((acc: any, user: any) => {
        let userAge = null
        let ageSource = 'unknown'
        
        // Method 1: Birth date calculation (most reliable since age column doesn't exist)
        if (user.birth_date) {
          try {
            const birthDate = new Date(user.birth_date)
            const today = new Date()
            if (birthDate instanceof Date && !isNaN(birthDate.getTime())) {
              userAge = today.getFullYear() - birthDate.getFullYear()
              const monthDiff = today.getMonth() - birthDate.getMonth()
              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                userAge--
              }
              ageSource = 'birth_date_calculated'
            }
          } catch (e) {
            console.log('Birth date parsing error:', e)
          }
        }
        
        // Categorize by age groups (standard demographic categories)
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
          // Fallback: Account tenure analysis (when age data is unavailable)
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
      
      console.log('👥 Smart age distribution result:', ageDistribution)
      
      result = Object.entries(ageDistribution || {})
        .map(([ageGroup, count]) => ({ category: ageGroup, value: count }))
        .sort((a, b) => {
          // Sort age groups in logical order
          const ageOrder = ['Under 18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+', 
                           'New Users (< 1 month)', 'Recent (1-6 months)', 'Regular (6-12 months)', 'Veteran (1+ years)']
          return ageOrder.indexOf(a.category) - ageOrder.indexOf(b.category)
        })
    
    } else if (type === 'user_geography' || type.includes('country') || type.includes('location')) {
      // Geographic distribution analysis
      console.log('🌍 Fetching geographic distribution...')
      
      const { data: users, error } = await supabase
        .from('kd_users')
        .select('registration_country')
        .not('registration_country', 'is', null)
      
      if (error) throw error
      
      const countryDistribution = users?.reduce((acc: any, user: any) => {
        const country = user.registration_country || 'Unknown'
        acc[country] = (acc[country] || 0) + 1
        return acc
      }, {})
      
      result = Object.entries(countryDistribution || {})
        .map(([country, count]) => ({ category: country, value: count }))
        .sort((a, b) => (b.value as number) - (a.value as number))
        .slice(0, 10) // Top 10 countries
    
    } else if (type === 'user_gender' || type.includes('gender')) {
      // Gender distribution analysis
      console.log('👫 Fetching gender distribution...')
      
      const { data: users, error } = await supabase
        .from('kd_users')
        .select('gender')
      
      if (error) throw error
      
      const genderDistribution = users?.reduce((acc: any, user: any) => {
        const gender = user.gender || 'Not Specified'
        acc[gender] = (acc[gender] || 0) + 1
        return acc
      }, {})
      
      result = Object.entries(genderDistribution || {})
        .map(([gender, count]) => ({ category: gender, value: count }))
        .sort((a, b) => (b.value as number) - (a.value as number))
    
    } else if (type === 'user_elements' || type.includes('element')) {
      // Element distribution analysis
      console.log('🔥 Fetching element distribution...')
      
      const { data: users, error } = await supabase
        .from('kd_users')
        .select('element_number')
        .not('element_number', 'is', null)
      
      if (error) throw error
      
      const elementDistribution = users?.reduce((acc: any, user: any) => {
        const element = `Element ${user.element_number || 'Unknown'}`
        acc[element] = (acc[element] || 0) + 1
        return acc
      }, {})
      
      result = Object.entries(elementDistribution || {})
        .map(([element, count]) => ({ category: element, value: count }))
        .sort((a, b) => a.category.localeCompare(b.category))
    
    } else if (type === 'user_count' || cardType === 'stat') {
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