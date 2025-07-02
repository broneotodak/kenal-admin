import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'

interface DataRequest {
  query: string
  processing?: string
  source: string
}

export async function POST(request: NextRequest) {
  try {
    const { query, processing, source }: DataRequest = await request.json()
    
    console.log('📊 Real Data Request:', { query, processing, source })
    
    const supabase = createSupabaseAdmin()
    
    // Execute the query based on source and processing type
    let data: any[] = []
    
    // CROSS-ANALYSIS HANDLERS (Multi-dimensional)
    if (processing === 'age_gender_cross_analysis') {
      console.log('🎯 Processing age + gender cross-analysis')
      
      const { data: users, error } = await supabase
        .from('kd_users')
        .select('birth_date, gender, created_at')
        .not('birth_date', 'is', null)
        .not('gender', 'is', null)
      
      if (error) throw error
      
      // Build cross-analysis data
      const crossAnalysis: any = {}
      const genderColors: any = { Male: '#1976d2', Female: '#dc004e', Other: '#ff9800' }
      
      users?.forEach((user: any) => {
        if (user.birth_date && user.gender) {
          const age = new Date().getFullYear() - new Date(user.birth_date).getFullYear()
          
          if (age >= 18 && age <= 65) {
            const ageGroup = age < 25 ? '18-24' :
                            age < 35 ? '25-34' :
                            age < 45 ? '35-44' :
                            age < 55 ? '45-54' : '55-65'
            
            const gender = user.gender
            
            if (!crossAnalysis[gender]) {
              crossAnalysis[gender] = {}
            }
            crossAnalysis[gender][ageGroup] = (crossAnalysis[gender][ageGroup] || 0) + 1
          }
        }
      })
      
      // Convert to chart-ready format - flatten for cross-analysis
      const ageGroups = ['18-24', '25-34', '35-44', '45-54', '55-65']
      const flatData: any[] = []
      
      // Add cross-analysis metadata
      flatData.push({ 
        _chartType: 'cross-analysis',
        _labels: ageGroups,
        _datasets: Object.entries(crossAnalysis).map(([gender, ageData]: [string, any]) => ({
          label: gender,
          data: ageGroups.map(group => ageData[group] || 0),
          backgroundColor: genderColors[gender] || '#607d8b'
        }))
      })
      
      // Add regular data points for fallback
      Object.entries(crossAnalysis).forEach(([gender, ageData]: [string, any]) => {
        ageGroups.forEach(ageGroup => {
          flatData.push({
            category: `${gender} (${ageGroup})`,
            value: ageData[ageGroup] || 0,
            gender,
            ageGroup
          })
        })
      })
      
      data = flatData
      
    } else if (processing === 'country_age_cross_analysis') {
      console.log('🎯 Processing country + age cross-analysis')
      
      const { data: users, error } = await supabase
        .from('kd_users')
        .select('birth_date, registration_country, created_at')
        .not('birth_date', 'is', null)
        .not('registration_country', 'is', null)
        .limit(1000) // Limit for performance
      
      if (error) throw error
      
      // Build country-age cross analysis (top 5 countries)
      const crossAnalysis: any = {}
      
      users?.forEach((user: any) => {
        if (user.birth_date && user.registration_country) {
          const age = new Date().getFullYear() - new Date(user.birth_date).getFullYear()
          
          if (age >= 18 && age <= 65) {
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
      const flatData: any[] = []
      
      // Add cross-analysis metadata
      flatData.push({
        _chartType: 'country-age-cross',
        _labels: countryTotals.map(({country}) => country),
        _datasets: ageGroups.map((ageGroup, index) => ({
          label: ageGroup,
          data: countryTotals.map(({country}) => crossAnalysis[country][ageGroup] || 0),
          backgroundColor: ['#1976d2', '#dc004e', '#ff9800', '#4caf50', '#9c27b0'][index]
        }))
      })
      
      // Add fallback data points
      countryTotals.forEach(({country}) => {
        ageGroups.forEach(ageGroup => {
          flatData.push({
            category: `${country} (${ageGroup})`,
            value: crossAnalysis[country][ageGroup] || 0,
            country,
            ageGroup
          })
        })
      })
      
      data = flatData
      
    } else if (processing === 'element_gender_cross_analysis') {
      console.log('🎯 Processing element + gender cross-analysis')
      
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
      const flatData: any[] = []
      
      // Add cross-analysis metadata
      flatData.push({
        _chartType: 'element-gender-cross',
        _labels: elements,
        _datasets: Object.entries(crossAnalysis).map(([gender, elementData]: [string, any]) => ({
          label: gender,
          data: elements.map(element => elementData[element] || 0),
          backgroundColor: genderColors[gender] || '#607d8b'
        }))
      })
      
      // Add fallback data points
      Object.entries(crossAnalysis).forEach(([gender, elementData]: [string, any]) => {
        elements.forEach(element => {
          flatData.push({
            category: `${gender} (${element})`,
            value: elementData[element] || 0,
            gender,
            element
          })
        })
      })
      
      data = flatData
      
    } else if (processing === 'smart_age_analysis') {
      // Real age analysis
      const { data: users, error } = await supabase
        .from('kd_users')
        .select('birth_date, created_at')
        .not('birth_date', 'is', null)
      
      if (error) throw error
      
      // Process age groups
      const ageGroups = { '18-25': 0, '26-35': 0, '36-45': 0, '46-55': 0, '56+': 0 }
      
      users?.forEach(user => {
        if (user.birth_date) {
          const age = new Date().getFullYear() - new Date(user.birth_date).getFullYear()
          if (age >= 18 && age <= 25) ageGroups['18-25']++
          else if (age >= 26 && age <= 35) ageGroups['26-35']++
          else if (age >= 36 && age <= 45) ageGroups['36-45']++
          else if (age >= 46 && age <= 55) ageGroups['46-55']++
          else if (age >= 56) ageGroups['56+']++
        }
      })
      
      data = Object.entries(ageGroups).map(([category, value]) => ({ category, value }))
      
    } else if (source === 'kd_users' && query.includes('gender')) {
      // Real gender distribution
      const { data: genderData, error } = await supabase
        .from('kd_users')
        .select('gender')
        .not('gender', 'is', null)
      
      if (error) throw error
      
      const genderCount = { Male: 0, Female: 0, Other: 0 }
      genderData?.forEach(user => {
        if (user.gender && genderCount.hasOwnProperty(user.gender)) {
          genderCount[user.gender as keyof typeof genderCount]++
        }
      })
      
      data = Object.entries(genderCount)
        .filter(([_, count]) => count > 0)
        .map(([category, value]) => ({ category, value }))
        
    } else if (source === 'kd_users' && query.includes('country')) {
      // Real country distribution
      const { data: countryData, error } = await supabase
        .from('kd_users')
        .select('registration_country')
        .not('registration_country', 'is', null)
        .limit(500) // Limit for performance
      
      if (error) throw error
      
      const countryCount: Record<string, number> = {}
      countryData?.forEach(user => {
        if (user.registration_country) {
          countryCount[user.registration_country] = (countryCount[user.registration_country] || 0) + 1
        }
      })
      
      // Get top 10 countries
      data = Object.entries(countryCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([category, value]) => ({ category, value }))
        
    } else if (source === 'kd_users' && query.includes('element')) {
      // Real element distribution
      const { data: elementData, error } = await supabase
        .from('kd_users')
        .select('element_number')
        .not('element_number', 'is', null)
      
      if (error) throw error
      
      const elementCount: Record<string, number> = {}
      elementData?.forEach(user => {
        if (user.element_number) {
          const elementKey = `Element ${user.element_number}`
          elementCount[elementKey] = (elementCount[elementKey] || 0) + 1
        }
      })
      
      data = Object.entries(elementCount)
        .sort(([a], [b]) => parseInt(a.split(' ')[1]) - parseInt(b.split(' ')[1]))
        .map(([category, value]) => ({ category, value }))
        
    } else if (source === 'kd_users' && query.includes('COUNT(*)')) {
      // Simple count queries
      let countQuery = supabase.from('kd_users').select('id', { count: 'exact', head: true })
      
      if (query.includes('is_active = true')) {
        countQuery = countQuery.eq('is_active', true)
      }
      
      if (query.includes('CURRENT_DATE - INTERVAL')) {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        countQuery = countQuery.gte('created_at', thirtyDaysAgo.toISOString())
      }
      
      const { count, error } = await countQuery
      if (error) throw error
      
      data = [{ count: count || 0 }]
      
    } else if (source === 'kd_users' && query.includes('DATE_TRUNC')) {
      // Growth trend over time
      const { data: growthData, error } = await supabase
        .from('kd_users')
        .select('created_at')
        .order('created_at', { ascending: true })
      
      if (error) throw error
      
      // Group by month
      const monthlyGrowth: Record<string, number> = {}
      growthData?.forEach(user => {
        const month = new Date(user.created_at).toISOString().slice(0, 7) // YYYY-MM
        monthlyGrowth[month] = (monthlyGrowth[month] || 0) + 1
      })
      
      data = Object.entries(monthlyGrowth)
        .slice(-12) // Last 12 months
        .map(([month, value]) => ({ 
          category: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), 
          value 
        }))
        
    } else if (source === 'kd_conversations') {
      // Conversation data
      const { count, error } = await supabase
        .from('kd_conversations')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      
      if (error) throw error
      data = [{ count: count || 0 }]
      
    } else {
      // Default: Total user count
      const { count, error } = await supabase
        .from('kd_users')
        .select('id', { count: 'exact', head: true })
      
      if (error) throw error
      data = [{ count: count || 0 }]
    }
    
    console.log('✅ Real data fetched:', { 
      source, 
      processing, 
      resultCount: data.length,
      sampleData: data.slice(0, 3)
    })
    
    return NextResponse.json({
      success: true,
      data,
      metadata: {
        source,
        processing,
        executedAt: new Date().toISOString(),
        recordCount: data.length
      }
    })
    
  } catch (error) {
    console.error('❌ Real data fetch error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch real data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 