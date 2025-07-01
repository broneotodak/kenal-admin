import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { type, cardType, processing } = await request.json()
    
    console.log('🔍 Real data request:', { type, cardType, processing })
    
    // Create admin client with service role key
    const supabase = createSupabaseAdmin()
    
    let result = null
    
    // Handle multi-dimensional cross-analysis processing first (highest priority)
    if (processing === 'age_gender_cross_analysis') {
      console.log('🎯 [CROSS-ANALYSIS] Age vs Gender Distribution...')
      
      const { data: users, error } = await supabase
        .from('kd_users')
        .select('birth_date, gender, created_at')
        .not('birth_date', 'is', null)
        .not('gender', 'is', null)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      
      console.log(`👥 Retrieved ${users?.length || 0} users for age-gender cross-analysis`)
      
      // Build age groups by gender
      const crossAnalysis: any = {}
      const genderColors: any = { Male: '#1976d2', Female: '#dc004e', Other: '#ff9800', 'Not Specified': '#4caf50' }
      
      users?.forEach((user: any) => {
        if (user.birth_date && user.gender) {
          const birthDate = new Date(user.birth_date)
          const age = new Date().getFullYear() - birthDate.getFullYear()
          
          if (age >= 0 && age <= 120) {
            const ageGroup = age < 18 ? 'Under 18' :
                            age < 25 ? '18-24' :
                            age < 35 ? '25-34' :
                            age < 45 ? '35-44' :
                            age < 55 ? '45-54' :
                            age < 65 ? '55-64' : '65+'
            
            const gender = user.gender || 'Not Specified'
            
            if (!crossAnalysis[gender]) {
              crossAnalysis[gender] = {}
            }
            crossAnalysis[gender][ageGroup] = (crossAnalysis[gender][ageGroup] || 0) + 1
          }
        }
      })
      
      // Convert to chart-ready format with datasets per gender
      const ageGroups = ['Under 18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+']
      const datasets = Object.entries(crossAnalysis).map(([gender, ageData]: [string, any]) => ({
        label: gender,
        data: ageGroups.map(group => ageData[group] || 0),
        backgroundColor: genderColors[gender] || '#607d8b',
        borderColor: genderColors[gender] || '#607d8b',
        borderWidth: 1
      }))
      
      result = { labels: ageGroups, datasets }
      
    } else if (processing === 'country_age_cross_analysis') {
      console.log('🎯 [CROSS-ANALYSIS] Country vs Age Distribution...')
      
      const { data: users, error } = await supabase
        .from('kd_users')
        .select('birth_date, registration_country, created_at')
        .not('birth_date', 'is', null)
        .not('registration_country', 'is', null)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      
      // Build country-age cross analysis (top 5 countries only)
      const crossAnalysis: any = {}
      
      users?.forEach((user: any) => {
        if (user.birth_date && user.registration_country) {
          const birthDate = new Date(user.birth_date)
          const age = new Date().getFullYear() - birthDate.getFullYear()
          
          if (age >= 0 && age <= 120) {
            const ageGroup = age < 25 ? 'Under 25' :
                            age < 35 ? '25-34' :
                            age < 45 ? '35-44' :
                            age < 55 ? '45-54' : '55+'
            
            const country = user.registration_country
            
            if (!crossAnalysis[country]) {
              crossAnalysis[country] = {}
            }
            crossAnalysis[country][ageGroup] = (crossAnalysis[country][ageGroup] || 0) + 1
          }
        }
      })
      
      // Get top 5 countries by total users
      const countryTotals = Object.entries(crossAnalysis).map(([country, ageData]: [string, any]) => ({
        country,
        total: Object.values(ageData).reduce((sum: number, count: any) => sum + count, 0)
      })).sort((a, b) => b.total - a.total).slice(0, 5)
      
      const ageGroups = ['Under 25', '25-34', '35-44', '45-54', '55+']
      const datasets = ageGroups.map((ageGroup, index) => ({
        label: ageGroup,
        data: countryTotals.map(({country}) => crossAnalysis[country][ageGroup] || 0),
        backgroundColor: ['#1976d2', '#dc004e', '#ff9800', '#4caf50', '#9c27b0'][index]
      }))
      
      result = { 
        labels: countryTotals.map(({country}) => country),
        datasets
      }
      
    } else if (processing === 'element_gender_cross_analysis') {
      console.log('🎯 [CROSS-ANALYSIS] Element vs Gender Distribution...')
      
      const { data: users, error } = await supabase
        .from('kd_users')
        .select('element_number, gender')
        .not('element_number', 'is', null)
        .not('gender', 'is', null)
      
      if (error) throw error
      
      // Build element-gender cross analysis
      const crossAnalysis: any = {}
      const genderColors: any = { Male: '#1976d2', Female: '#dc004e', Other: '#ff9800' }
      
      users?.forEach((user: any) => {
        if (user.element_number && user.gender) {
          const element = `Element ${user.element_number}`
          const gender = user.gender
          
          if (!crossAnalysis[gender]) {
            crossAnalysis[gender] = {}
          }
          crossAnalysis[gender][element] = (crossAnalysis[gender][element] || 0) + 1
        }
      })
      
      const elements = Array.from({length: 9}, (_, i) => `Element ${i + 1}`)
      const datasets = Object.entries(crossAnalysis).map(([gender, elementData]: [string, any]) => ({
        label: gender,
        data: elements.map(element => elementData[element] || 0),
        backgroundColor: genderColors[gender] || '#607d8b'
      }))
      
      result = { labels: elements, datasets }
      
    } else if (processing === 'age_element_cross_analysis') {
      console.log('🎯 [CROSS-ANALYSIS] Age vs Element Distribution...')
      
      const { data: users, error } = await supabase
        .from('kd_users')
        .select('birth_date, element_number, created_at')
        .not('birth_date', 'is', null)
        .not('element_number', 'is', null)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      
      // Build age-element cross analysis
      const crossAnalysis: any = {}
      const elementColors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688']
      
      users?.forEach((user: any) => {
        if (user.birth_date && user.element_number) {
          const birthDate = new Date(user.birth_date)
          const age = new Date().getFullYear() - birthDate.getFullYear()
          
          if (age >= 0 && age <= 120) {
            const ageGroup = age < 25 ? 'Under 25' :
                            age < 35 ? '25-34' :
                            age < 45 ? '35-44' :
                            age < 55 ? '45-54' : '55+'
            
            const element = `Element ${user.element_number}`
            
            if (!crossAnalysis[element]) {
              crossAnalysis[element] = {}
            }
            crossAnalysis[element][ageGroup] = (crossAnalysis[element][ageGroup] || 0) + 1
          }
        }
      })
      
      const ageGroups = ['Under 25', '25-34', '35-44', '45-54', '55+']
      const datasets = Object.entries(crossAnalysis).map(([element, ageData]: [string, any], index) => ({
        label: element,
        data: ageGroups.map(group => ageData[group] || 0),
        borderColor: elementColors[index] || '#607d8b',
        backgroundColor: elementColors[index] || '#607d8b',
        fill: false,
        tension: 0.1
      }))
      
      result = { labels: ageGroups, datasets }
      
    } 
    // Handle smart age analysis processing (from AI-generated cards) 
    else if (processing === 'smart_age_analysis' || type === 'user_age' || (cardType === 'chart' && type.includes('age'))) {
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
    
    } else if (type === 'identity_count' || type.includes('identity')) {
      // Get real identity count from kd_identity table (simple and clean)
      console.log('🧠 Fetching real identity count from server...')
      
      // Get total count - just what we need!
      const { count: totalCount, error: totalError } = await supabase
        .from('kd_identity')
        .select('*', { count: 'exact', head: true })
      
      console.log('🧠 Identity count result:', { totalCount, totalError })
      
      if (totalError) {
        console.error('❌ Identity server error:', totalError)
        throw totalError
      }
      
      result = { count: totalCount || 0 }
      
    } else if (type === 'identity_distribution' || type.includes('identity_type')) {
      // Get identity type distribution
      console.log('🧠 Fetching identity type distribution...')
      
      const { data: identities, error } = await supabase
        .from('kd_identity')
        .select('identity_type')
      
      if (error) throw error
      
      const typeDistribution = identities?.reduce((acc: any, identity: any) => {
        const type = identity.identity_type || 'Unknown'
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {})
      
      result = Object.entries(typeDistribution || {})
        .map(([type, count]) => ({ category: type, value: count }))
        .sort((a, b) => (b.value as number) - (a.value as number))
        
    } else if (type === 'active_users' || type.includes('active')) {
      // Get users who have both registration AND identity (truly active)
      console.log('🎯 Fetching active users (with identity)...')
      
      const { count, error } = await supabase
        .from('kd_identity')
        .select('user_id', { count: 'exact', head: true })
      
      if (error) throw error
      
      result = { count: count || 0 }
      
    } else if (type === 'user_count' || cardType === 'stat') {
      // Get real user count (fallback for generic stat cards)
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
      
    } else if (type === 'conversation_count' || type.includes('conversation')) {
      // Get conversation count
      console.log('💬 Fetching conversation count...')
      
      const { count, error } = await supabase
        .from('kd_conversations')
        .select('*', { count: 'exact', head: true })
      
      if (error) throw error
      
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