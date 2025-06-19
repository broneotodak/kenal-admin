import { useState, useEffect, useCallback } from 'react'
import { supabase, queryCache } from '@/lib/supabase'

// Timezone utility for Malaysia/Singapore (UTC+8)
const toMalaysiaTime = (utcDate: Date | string): Date => {
  const date = new Date(utcDate)
  // Malaysia/Singapore is UTC+8
  const malaysiaOffset = 8 * 60 * 60 * 1000 // 8 hours in milliseconds
  return new Date(date.getTime() + malaysiaOffset)
}

const formatMalaysiaTime = (utcDate: Date | string): string => {
  const malaysiaDate = toMalaysiaTime(utcDate)
  return malaysiaDate.toLocaleString('en-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

// ===== FALLBACK DASHBOARD HOOKS (direct table queries, no views needed) =====

// Dynamic stats hook that adjusts comparison period based on time range
export const useFallbackDashboardStats = (timeRange: '24hours' | '7days' | '12months' = '24hours', refreshInterval: number = 30000) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    lifetimeActiveUsers: 0,
    todayRegistrations: 0,
    totalRevenue: 452808,
    invitedUsers: 0,
    userGrowth: 0,
    activeGrowth: 0,
    todayGrowth: 0,
    revenueGrowth: 15.2,
    comparisonPeriod: 'last month', // Dynamic based on timeRange
    todayComparisonPeriod: 'yesterday' // Always compare today with yesterday
  })
  const [loading, setLoading] = useState(true)

  const loadStats = useCallback(async () => {
    try {
      console.log(`🔄 Loading dashboard stats with ${timeRange} comparison...`)
      setLoading(true)

      // Use Malaysia timezone for consistent calculations
      const now = new Date()
      const malaysiaTime = toMalaysiaTime(now)
      
      let currentPeriodStart: Date
      let previousPeriodStart: Date
      let previousPeriodEnd: Date
      let comparisonText: string

      // Calculate periods based on selected time range
      switch (timeRange) {
        case '24hours':
          currentPeriodStart = new Date(malaysiaTime.getTime() - 24 * 60 * 60 * 1000)
          previousPeriodStart = new Date(malaysiaTime.getTime() - 48 * 60 * 60 * 1000)
          previousPeriodEnd = currentPeriodStart
          comparisonText = 'previous 24h'
          break
        case '7days':
          currentPeriodStart = new Date(malaysiaTime.getTime() - 7 * 24 * 60 * 60 * 1000)
          previousPeriodStart = new Date(malaysiaTime.getTime() - 14 * 24 * 60 * 60 * 1000)
          previousPeriodEnd = currentPeriodStart
          comparisonText = 'previous week'
          break
        case '12months':
          currentPeriodStart = new Date(malaysiaTime.getTime() - 365 * 24 * 60 * 60 * 1000)
          previousPeriodStart = new Date(malaysiaTime.getTime() - 2 * 365 * 24 * 60 * 60 * 1000)
          previousPeriodEnd = currentPeriodStart
          comparisonText = 'previous year'
          break
        default:
          currentPeriodStart = new Date(malaysiaTime.getTime() - 24 * 60 * 60 * 1000)
          previousPeriodStart = new Date(malaysiaTime.getTime() - 48 * 60 * 60 * 1000)
          previousPeriodEnd = currentPeriodStart
          comparisonText = 'previous 24h'
      }

      // Check cache first (1-minute cache for dynamic stats)
      const cacheKey = `dashboard_stats_${timeRange}`
      const cached = queryCache.get(cacheKey)
      if (cached) {
        console.log('⚡ Dashboard stats loaded from cache')
        setStats(cached)
        setLoading(false)
        return
      }

      // Get current period stats
      const [
        { count: totalUsers },
        { count: currentPeriodUsers },
        { count: todayRegistrations }
      ] = await Promise.all([
        supabase.from('kd_users').select('*', { count: 'exact', head: true }),
        supabase.from('kd_users').select('*', { count: 'exact', head: true })
          .gte('created_at', currentPeriodStart.toISOString()),
        supabase.from('kd_users').select('*', { count: 'exact', head: true })
          .gte('created_at', (() => {
            // Get today's start in Malaysia timezone (00:00 Malaysia time)
            const todayStartMalaysia = new Date(malaysiaTime.getFullYear(), malaysiaTime.getMonth(), malaysiaTime.getDate(), 0, 0, 0, 0)
            // Convert to UTC for database query (Malaysia is UTC+8)
            return new Date(todayStartMalaysia.getTime() - 8 * 60 * 60 * 1000).toISOString()
          })())
          .lt('created_at', (() => {
            // Get tomorrow's start in Malaysia timezone (00:00 tomorrow Malaysia time)
            const tomorrowStartMalaysia = new Date(malaysiaTime.getFullYear(), malaysiaTime.getMonth(), malaysiaTime.getDate() + 1, 0, 0, 0, 0)
            // Convert to UTC for database query
            return new Date(tomorrowStartMalaysia.getTime() - 8 * 60 * 60 * 1000).toISOString()
          })())
      ])

      // Get previous period stats for comparison
      const { count: previousPeriodUsers } = await supabase
        .from('kd_users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', previousPeriodStart.toISOString())
        .lt('created_at', previousPeriodEnd.toISOString())

      // Get active users (users with identities) and invited users
      const [
        { data: currentActiveUsers },
        { data: previousActiveUsers },
        { count: invitedUsersCount },
        { data: lifetimeActiveUsers }
      ] = await Promise.all([
        supabase.from('kd_identity').select('user_id')
          .gte('created_at', currentPeriodStart.toISOString()),
        supabase.from('kd_identity').select('user_id')
          .gte('created_at', previousPeriodStart.toISOString())
          .lt('created_at', previousPeriodEnd.toISOString()),
        supabase.from('kd_users').select('*', { count: 'exact', head: true })
          .eq('join_by_invitation', true),
        supabase.from('kd_identity').select('user_id')
      ])

      const currentActiveCount = new Set(currentActiveUsers?.map(u => u.user_id) || []).size
      const previousActiveCount = new Set(previousActiveUsers?.map(u => u.user_id) || []).size
      const lifetimeActiveCount = new Set(lifetimeActiveUsers?.map(u => u.user_id) || []).size

      // Calculate growth percentages
      const userGrowth = previousPeriodUsers && previousPeriodUsers > 0
        ? Math.round(((currentPeriodUsers || 0) - previousPeriodUsers) / previousPeriodUsers * 100 * 10) / 10
        : 0

      const activeGrowth = previousActiveCount > 0
        ? Math.round((currentActiveCount - previousActiveCount) / previousActiveCount * 100 * 10) / 10
        : 0

      // For today growth, compare with yesterday for all timeRanges
      const yesterdayMalaysia = new Date(malaysiaTime.getTime() - 24 * 60 * 60 * 1000)
      const { count: yesterdayRegistrations } = await supabase
        .from('kd_users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', (() => {
          // Get yesterday's start in Malaysia timezone (00:00 yesterday Malaysia time)
          const yesterdayStartMalaysia = new Date(yesterdayMalaysia.getFullYear(), yesterdayMalaysia.getMonth(), yesterdayMalaysia.getDate(), 0, 0, 0, 0)
          // Convert to UTC for database query
          return new Date(yesterdayStartMalaysia.getTime() - 8 * 60 * 60 * 1000).toISOString()
        })())
        .lt('created_at', (() => {
          // Get today's start in Malaysia timezone (00:00 today Malaysia time)
          const todayStartMalaysia = new Date(malaysiaTime.getFullYear(), malaysiaTime.getMonth(), malaysiaTime.getDate(), 0, 0, 0, 0)
          // Convert to UTC for database query
          return new Date(todayStartMalaysia.getTime() - 8 * 60 * 60 * 1000).toISOString()
        })())

      const todayGrowth = yesterdayRegistrations && yesterdayRegistrations > 0
        ? Math.round(((todayRegistrations || 0) - yesterdayRegistrations) / yesterdayRegistrations * 100 * 10) / 10
        : 0

      const dashboardStats = {
        totalUsers: totalUsers || 0,
        activeUsers: currentActiveCount,
        lifetimeActiveUsers: lifetimeActiveCount,
        todayRegistrations: todayRegistrations || 0,
        totalRevenue: 452808,
        invitedUsers: invitedUsersCount || 0,
        userGrowth,
        activeGrowth,
        todayGrowth,
        revenueGrowth: 15.2,
        comparisonPeriod: comparisonText,
        todayComparisonPeriod: 'yesterday' // Always compare today with yesterday
      }

      setStats(dashboardStats)

      // Cache for 1 minute (shorter because it's dynamic)
      queryCache.set(cacheKey, dashboardStats, 60000)
      
      console.log(`✅ Dashboard stats loaded for ${timeRange}: ${totalUsers} total users, ${todayRegistrations} today, comparing vs ${comparisonText}`)
      
      // Debug timezone calculations
      const todayStartMalaysia = new Date(malaysiaTime.getFullYear(), malaysiaTime.getMonth(), malaysiaTime.getDate(), 0, 0, 0, 0)
      const todayStartUTC = new Date(todayStartMalaysia.getTime() - 8 * 60 * 60 * 1000)
      const tomorrowStartUTC = new Date(todayStartMalaysia.getTime() - 8 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000)
      console.log(`📅 Today in Malaysia: ${todayStartMalaysia.toISOString()} (Malaysia midnight)`)
      console.log(`📅 Today query range: ${todayStartUTC.toISOString()} to ${tomorrowStartUTC.toISOString()} (UTC)`)
      console.log(`👥 Today registrations: ${todayRegistrations}`)
    } catch (error: any) {
      console.error('❌ Error loading dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    loadStats()
    
    // Set up refresh interval
    const interval = setInterval(loadStats, refreshInterval)
    return () => clearInterval(interval)
  }, [loadStats, refreshInterval])

  return { stats, loading, refetch: loadStats }
}

// Enhanced recent users hook with Malaysia timezone
export const useFallbackRecentUsers = (limit: number = 5) => {
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadRecentUsers = useCallback(async () => {
    try {
      console.log('🔄 Loading recent users with Malaysia timezone...')

      // Check cache first (2-minute cache)
      const cacheKey = `recent_users_${limit}_my_tz`
      const cached = queryCache.get(cacheKey)
      if (cached) {
        console.log('⚡ Recent users loaded from cache')
        setRecentUsers(cached)
        setLoading(false)
        return
      }

      const { data: users, error } = await supabase
        .from('kd_users')
        .select('id, name, email, created_at, registration_country, join_by_invitation, first_name, last_name')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching recent users:', error)
        return
      }

      // Transform users with Malaysia timezone and display fields
      const transformedUsers = (users || []).map(user => ({
        ...user,
        // Convert UTC to Malaysia time for display
        created_at_malaysia: formatMalaysiaTime(user.created_at),
        display_name: user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}` 
          : user.name || 'N/A',
        country_display: user.registration_country || 'Unknown',
        registration_type: user.join_by_invitation ? 'Invited' : 'Direct'
      }))

      setRecentUsers(transformedUsers)

      // Cache for 2 minutes
      queryCache.set(cacheKey, transformedUsers, 120000)
      
      console.log(`✅ Recent users loaded: ${transformedUsers.length} users with Malaysia timezone`)
    } catch (error: any) {
      console.error('❌ Error loading recent users:', error)
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    loadRecentUsers()
  }, [loadRecentUsers])

  return { recentUsers, loading, refetch: loadRecentUsers }
}

// Enhanced chart data hook with Malaysia timezone
export const useFallbackChartData = (timeRange: '24hours' | '7days' | '12months') => {
  const [chartData, setChartData] = useState<{
    labels: string[]
    datasets: {
      label: string
      data: number[]
      borderColor: string
      backgroundColor: string
      fill: boolean
      tension: number
    }[]
  }>({ labels: [], datasets: [] })
  const [chartDataPoints, setChartDataPoints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadChartData = useCallback(async () => {
    try {
      console.log(`🔄 Loading chart data for ${timeRange} with Malaysia timezone...`)
      setLoading(true)

      // Check cache first (5-minute cache for chart data)
      const cacheKey = `chart_data_${timeRange}_my_tz`
      const cached = queryCache.get(cacheKey)
      if (cached) {
        console.log('⚡ Chart data loaded from cache')
        setChartData(cached.chartData)
        setChartDataPoints(cached.chartDataPoints)
        setLoading(false)
        return
      }

      const now = new Date()
      const malaysiaTime = toMalaysiaTime(now)
      let startTime: Date
      let queryEndTime: Date
      let bucketSize: string
      let labelFormat: string

      switch (timeRange) {
        case '24hours':
          // Start at 00:00 today in Malaysia timezone, end at current time
          const todayStart = new Date(malaysiaTime.getFullYear(), malaysiaTime.getMonth(), malaysiaTime.getDate(), 0, 0, 0, 0)
          startTime = new Date(todayStart.getTime() - 8 * 60 * 60 * 1000) // Convert to UTC for query
          queryEndTime = malaysiaTime
          bucketSize = '1 hour'
          labelFormat = 'HH:mm'
          break
        case '7days':
          startTime = new Date(malaysiaTime.getTime() - 7 * 24 * 60 * 60 * 1000)
          queryEndTime = malaysiaTime
          bucketSize = '1 day'
          labelFormat = 'MMM DD'
          break
        case '12months':
          startTime = new Date(malaysiaTime.getTime() - 365 * 24 * 60 * 60 * 1000)
          queryEndTime = malaysiaTime
          bucketSize = '1 month'
          labelFormat = 'MMM YY'
          break
        default:
          const defaultTodayStart = new Date(malaysiaTime.getFullYear(), malaysiaTime.getMonth(), malaysiaTime.getDate(), 0, 0, 0, 0)
          startTime = new Date(defaultTodayStart.getTime() - 8 * 60 * 60 * 1000)
          queryEndTime = malaysiaTime
          bucketSize = '1 hour'
          labelFormat = 'HH:mm'
      }

      console.log(`📊 Chart query range: ${startTime.toISOString()} to ${queryEndTime.toISOString()}`)

      // Get user registrations with proper time range
      const { data: userData, error: userError } = await supabase
        .from('kd_users')
        .select('id, name, email, created_at, registration_country, join_by_invitation, first_name, last_name')
        .gte('created_at', startTime.toISOString())
        .lte('created_at', queryEndTime.toISOString())
        .order('created_at')

      if (userError) {
        console.error('❌ Error fetching user data for chart:', userError)
        throw new Error(`User data fetch failed: ${userError.message}`)
      }

      // Get identity data for the same period
      const { data: identityData, error: identityError } = await supabase
        .from('kd_identity')
        .select('user_id, created_at')
        .gte('created_at', startTime.toISOString())
        .lte('created_at', queryEndTime.toISOString())

      if (identityError) {
        console.error('⚠️ Error fetching identity data for chart:', identityError)
        // Don't throw, just log warning and continue with empty identity data
      }

      console.log(`📊 Data fetched: ${userData?.length || 0} users, ${identityData?.length || 0} identities from ${startTime.toISOString()} to ${queryEndTime.toISOString()}`)

      // Process data into time buckets with Malaysia timezone
      const buckets = new Map()
      const labels = []

      // Create time buckets based on Malaysia timezone
      if (timeRange === '24hours') {
        // Create 24 hourly buckets (00:00 to 23:00) + current hour if needed
        const today = new Date(malaysiaTime.getFullYear(), malaysiaTime.getMonth(), malaysiaTime.getDate())
        const currentHour = malaysiaTime.getHours()
        
        for (let hour = 0; hour <= Math.max(23, currentHour); hour++) {
          const bucketTime = new Date(today.getTime() + hour * 60 * 60 * 1000)
          const label = hour.toString().padStart(2, '0') + ':00'
          
          labels.push(label)
          buckets.set(hour, {
            newUsers: 0,
            usersWithIdentity: 0,
            details: [],
            hour
          })
        }
      } else {
        // Original logic for 7days and 12months
        let currentTime = new Date(startTime)
        const endTime = queryEndTime
        
        while (currentTime <= endTime) {
          const malaysiaCurrentTime = toMalaysiaTime(currentTime)
          const label = malaysiaCurrentTime.toLocaleString('en-MY', {
            timeZone: 'Asia/Kuala_Lumpur',
            ...(timeRange === '7days' ? { month: 'short', day: '2-digit' } :
               { month: 'short', year: '2-digit' })
          })
          
          labels.push(label)
          buckets.set(currentTime.getTime(), {
            newUsers: 0,
            usersWithIdentity: 0,
            details: [],
            time: currentTime
          })

          // Increment based on bucket size
          if (timeRange === '7days') {
            currentTime = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000) // 1 day
          } else {
            currentTime = new Date(currentTime.getFullYear(), currentTime.getMonth() + 1, 1) // 1 month
          }
        }
      }

      console.log(`📊 Created ${buckets.size} time buckets for ${timeRange}`)

      // Fill buckets with user data
      (userData || []).forEach((user: any) => {
        const userTime = new Date(user.created_at)
        const malaysiaUserTime = toMalaysiaTime(userTime)
        
        let bucket
        if (timeRange === '24hours') {
          // Simple hour-based bucketing for 24-hour view
          const hour = malaysiaUserTime.getHours()
          bucket = buckets.get(hour)
        } else {
          // Original logic for other time ranges
          let bucketTime: Date
          if (timeRange === '7days') {
            bucketTime = new Date(malaysiaUserTime.getFullYear(), malaysiaUserTime.getMonth(), malaysiaUserTime.getDate())
          } else {
            bucketTime = new Date(malaysiaUserTime.getFullYear(), malaysiaUserTime.getMonth(), 1)
          }
          const utcBucketTime = new Date(bucketTime.getTime() - 8 * 60 * 60 * 1000)
          bucket = buckets.get(utcBucketTime.getTime())
        }
        
        if (bucket) {
          bucket.newUsers++
          bucket.details.push({
            id: user.id,
            name: user.first_name && user.last_name 
              ? `${user.first_name} ${user.last_name}` 
              : user.name || 'N/A',
            email: user.email,
            country: user.registration_country,
            registrationType: user.join_by_invitation ? 'Invited' : 'Direct',
            time: malaysiaUserTime.toLocaleTimeString('en-MY', { 
              timeZone: 'Asia/Kuala_Lumpur',
              hour: '2-digit', 
              minute: '2-digit' 
            })
          })
        } else {
          console.log(`⚠️ No bucket found for user at ${malaysiaUserTime.toISOString()} (hour: ${malaysiaUserTime.getHours()})`)
        }
      })

      // Fill buckets with identity data
      const identityUserIds = new Set()
      ;(identityData || []).forEach(identity => {
        const identityTime = new Date(identity.created_at)
        const malaysiaIdentityTime = toMalaysiaTime(identityTime)
        
        let bucket
        if (timeRange === '24hours') {
          // Simple hour-based bucketing for 24-hour view
          const hour = malaysiaIdentityTime.getHours()
          bucket = buckets.get(hour)
        } else {
          // Original logic for other time ranges
          let bucketTime: Date
          if (timeRange === '7days') {
            bucketTime = new Date(malaysiaIdentityTime.getFullYear(), malaysiaIdentityTime.getMonth(), malaysiaIdentityTime.getDate())
          } else {
            bucketTime = new Date(malaysiaIdentityTime.getFullYear(), malaysiaIdentityTime.getMonth(), 1)
          }
          const utcBucketTime = new Date(bucketTime.getTime() - 8 * 60 * 60 * 1000)
          bucket = buckets.get(utcBucketTime.getTime())
        }
        
        if (bucket && !identityUserIds.has(identity.user_id)) {
          bucket.usersWithIdentity++
          identityUserIds.add(identity.user_id)
        }
      })

      // Convert to chart format
      const dataPoints = Array.from(buckets.values())
      const newUsersData = dataPoints.map(point => point.newUsers)
      const identityUsersData = dataPoints.map(point => point.usersWithIdentity)

      console.log(`📊 Chart data processed: ${dataPoints.length} points, ${newUsersData.reduce((a: number, b: number) => a + b, 0)} total users, ${identityUsersData.reduce((a: number, b: number) => a + b, 0)} total identities`)

      const chart = {
        labels,
        datasets: [
          {
            label: 'New Users',
            data: newUsersData,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: false,
            tension: 0.3,
          },
          {
            label: 'Users with Identity',
            data: identityUsersData,
            borderColor: '#f97316',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            fill: false,
            tension: 0.3,
          }
        ]
      }

      setChartData(chart)
      setChartDataPoints(dataPoints)

      // Cache for 5 minutes
      queryCache.set(cacheKey, { chartData: chart, chartDataPoints: dataPoints }, 300000)
      
      console.log(`✅ Chart data loaded for ${timeRange} with Malaysia timezone: ${labels.length} data points`)
    } catch (error: any) {
      console.error('❌ Error loading chart data:', error)
      
      // Set empty chart data on error to prevent infinite loading
      const emptyChart = {
        labels: ['No Data'],
        datasets: [
          {
            label: 'New Users',
            data: [0],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: false,
            tension: 0.3,
          },
          {
            label: 'Users with Identity',
            data: [0],
            borderColor: '#f97316',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            fill: false,
            tension: 0.3,
          }
        ]
      }
      
      setChartData(emptyChart)
      setChartDataPoints([])
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    loadChartData()
  }, [loadChartData])

  return { chartData, chartDataPoints, loading, refetch: loadChartData }
} 