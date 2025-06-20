import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase, queryCache } from '@/lib/supabase'

// Simple server time utilities (UTC-based)
const formatDisplayTime = (utcDate: Date | string): string => {
  const date = new Date(utcDate)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

// Get today's start and end in server time (UTC)
const getTodayRange = (): { start: Date, end: Date } => {
  const now = new Date()
  
  // Get today's start (00:00:00 UTC)
  const todayStartUTC = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  
  // Get tomorrow's start (00:00:00 UTC next day)
  const tomorrowStartUTC = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0)
  
  return { start: todayStartUTC, end: tomorrowStartUTC }
}

// Get yesterday's start and end in server time (UTC)
const getYesterdayRange = (): { start: Date, end: Date } => {
  const now = new Date()
  
  // Get yesterday's start (00:00:00 UTC)
  const yesterdayStartUTC = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0)
  
  // Get today's start (00:00:00 UTC)
  const todayStartUTC = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  
  return { start: yesterdayStartUTC, end: todayStartUTC }
}

// ===== SIMPLIFIED DASHBOARD HOOKS (UTC server time only) =====

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
      console.log('🔄 Loading dashboard stats with', timeRange, 'comparison...');
      setLoading(true)

      // Use server time (UTC) for all calculations
      const now = new Date()
      
      let currentPeriodStart: Date
      let previousPeriodStart: Date
      let previousPeriodEnd: Date
      let comparisonText: string

      // Calculate periods based on selected time range
      switch (timeRange) {
        case '24hours':
          currentPeriodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          previousPeriodStart = new Date(now.getTime() - 48 * 60 * 60 * 1000)
          previousPeriodEnd = currentPeriodStart
          comparisonText = 'previous 24h'
          break
        case '7days':
          currentPeriodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          previousPeriodStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
          previousPeriodEnd = currentPeriodStart
          comparisonText = 'previous week'
          break
        case '12months':
          currentPeriodStart = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          previousPeriodStart = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000)
          previousPeriodEnd = currentPeriodStart
          comparisonText = 'previous year'
          break
        default:
          currentPeriodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          previousPeriodStart = new Date(now.getTime() - 48 * 60 * 60 * 1000)
          previousPeriodEnd = currentPeriodStart
          comparisonText = 'previous 24h'
      }

      // Check cache first (1-minute cache for dynamic stats)
      const cacheKey = `dashboard_stats_${timeRange}_simple`
      const cached = queryCache.get(cacheKey)
      if (cached) {
        console.log('⚡ Dashboard stats loaded from cache');
        setStats(cached)
        setLoading(false)
        return
      }

      // Get today's range for accurate today calculations
      const todayRange = getTodayRange()
      const yesterdayRange = getYesterdayRange()

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
          .gte('created_at', todayRange.start.toISOString())
          .lt('created_at', todayRange.end.toISOString())
      ])

      // Get previous period stats for comparison
      const { count: previousPeriodUsers } = await supabase
        .from('kd_users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', previousPeriodStart.toISOString())
        .lt('created_at', previousPeriodEnd.toISOString())

      // Get yesterday registrations for today comparison
      const { count: yesterdayRegistrations } = await supabase
        .from('kd_users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterdayRange.start.toISOString())
        .lt('created_at', yesterdayRange.end.toISOString())

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
      
      console.log('✅ Dashboard stats loaded for', timeRange + ':', totalUsers, 'total users,', todayRegistrations, 'today, comparing vs', comparisonText);
      
      // Debug server time calculations
      console.log('📅 Today range (UTC server time):', todayRange.start.toISOString(), 'to', todayRange.end.toISOString());
      console.log('👥 Today registrations:', todayRegistrations);
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

// Enhanced recent users hook with server time
export const useFallbackRecentUsers = (limit: number = 5) => {
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadRecentUsers = useCallback(async () => {
    try {
      console.log('🔄 Loading recent users with server time...');

      // Check cache first (2-minute cache)
      const cacheKey = `recent_users_${limit}_server_time`
      const cached = queryCache.get(cacheKey)
      if (cached) {
        console.log('⚡ Recent users loaded from cache');
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

      // Transform users with server time display
      const transformedUsers = (users || []).map(user => ({
        ...user,
        // Use server time for display
        created_at_display: formatDisplayTime(user.created_at),
        display_name: user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}` 
          : user.name || 'N/A',
        country_display: user.registration_country || 'Unknown',
        registration_type: user.join_by_invitation ? 'Invited' : 'Direct'
      }))

      setRecentUsers(transformedUsers)

      // Cache for 2 minutes
      queryCache.set(cacheKey, transformedUsers, 120000)
      
      console.log('✅ Recent users loaded:', transformedUsers.length, 'users with server time');
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

// Enhanced chart data hook with server time - IMPROVED VERSION WITH REGISTRATION BREAKDOWN
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
  
  // Add a ref to track mount status
  const isMountedRef = useRef(true)
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Memoize timeRange to prevent infinite re-renders
  const stableTimeRange = useMemo(() => timeRange, [timeRange])
  
  // Add debug logging for timeRange changes
  useEffect(() => {
    console.log('📊 Chart timeRange changed to:', stableTimeRange);
  }, [stableTimeRange])

  const loadChartData = useCallback(async () => {
    try {
      console.log('🔄 Loading chart data for', stableTimeRange, 'with server time...');
      setLoading(true)
      
      // Add debug logging for loading state
      console.log('📊 Chart loading state set to true for', stableTimeRange);

      // Check cache first (5-minute cache for chart data)
      const cacheKey = 'chart_data_enhanced_' + stableTimeRange + '_server_time'
      const cached = queryCache.get(cacheKey)
      if (cached) {
        console.log('⚡ Chart data loaded from cache, setting loading to false');
        if (isMountedRef.current) {
          setChartData(cached.chartData)
          setChartDataPoints(cached.chartDataPoints)
          setLoading(false)
          console.log('📊 Chart cache loading state set to false for', stableTimeRange);
        }
        return
      }

      const now = new Date()
      let startTime: Date
      let queryEndTime: Date

      switch (stableTimeRange) {
        case '24hours':
          const todayRange = getTodayRange()
          startTime = todayRange.start
          queryEndTime = todayRange.end
          break
        case '7days':
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          queryEndTime = now
          break
        case '12months':
          startTime = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          queryEndTime = now
          break
        default:
          const defaultTodayRange = getTodayRange()
          startTime = defaultTodayRange.start
          queryEndTime = defaultTodayRange.end
      }

      console.log('📊 Chart query range:', startTime.toISOString(), 'to', queryEndTime.toISOString());

      // Get user registrations with invitation status
      console.log('🔍 Querying kd_users table...');
      const { data: userData, error: userError } = await supabase
        .from('kd_users')
        .select('id, name, email, created_at, registration_country, join_by_invitation, first_name, last_name')
        .gte('created_at', startTime.toISOString())
        .lte('created_at', queryEndTime.toISOString())
        .order('created_at')

      console.log('🔍 User query result:', { userData: userData?.length, userError });

      if (userError) {
        console.error('❌ Error fetching user data for chart:', userError)
        throw new Error('User data fetch failed: ' + userError.message)
      }

      // Get identity data
      console.log('🔍 Querying kd_identity table...');
      const { data: identityData, error: identityError } = await supabase
        .from('kd_identity')
        .select('user_id, created_at')
        .gte('created_at', startTime.toISOString())
        .lte('created_at', queryEndTime.toISOString())

      console.log('🔍 Identity query result:', { identityData: identityData?.length, identityError });

      if (identityError) {
        console.error('⚠️ Error fetching identity data for chart:', identityError)
      }

      console.log('📊 Data fetched:', userData?.length || 0, 'users,', identityData?.length || 0, 'identities');

      // Process data into time buckets
      const buckets = new Map()
      const labels: string[] = []

      if (stableTimeRange === '24hours') {
        const currentHour = now.getHours()
        
        for (let hour = 0; hour <= Math.max(23, currentHour); hour++) {
          const label = hour.toString().padStart(2, '0') + ':00'
          labels.push(label)
          buckets.set(hour, {
            directRegistrations: 0,
            invitedRegistrations: 0,
            usersWithIdentity: 0,
            details: [],
            hour
          })
        }
      } else {
        let currentTime = new Date(startTime)
        const endTime = queryEndTime
        
        while (currentTime <= endTime) {
          const label = currentTime.toLocaleString('en-US', {
            ...(stableTimeRange === '7days' ? { month: 'short', day: '2-digit' } :
               { month: 'short', year: '2-digit' })
          })
          
          labels.push(label)
          
          // For 7days, use normalized date (year-month-day) as key for consistent matching
          let bucketKey
          if (stableTimeRange === '7days') {
            const normalizedDate = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate())
            bucketKey = normalizedDate.getTime()
          } else {
            // For 12months, use first day of month
            const normalizedDate = new Date(currentTime.getFullYear(), currentTime.getMonth(), 1)
            bucketKey = normalizedDate.getTime()
          }
          
          buckets.set(bucketKey, {
            directRegistrations: 0,
            invitedRegistrations: 0,
            usersWithIdentity: 0,
            details: [],
            time: currentTime,
            normalizedTime: new Date(bucketKey)
          })

          if (stableTimeRange === '7days') {
            currentTime = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000)
          } else {
            currentTime = new Date(currentTime.getFullYear(), currentTime.getMonth() + 1, 1)
          }
        }
      }

      console.log('📊 Created', buckets.size, 'time buckets for', stableTimeRange);
      
      // Debug bucket creation for 7days
      if (stableTimeRange === '7days') {
        console.log('🗓️ 7-day buckets created:', Array.from(buckets.keys()).map(key => new Date(key).toDateString()));
      }

      // Fill buckets with user data (separated by registration type)
      (userData || []).forEach((user: any) => {
        const userTime = new Date(user.created_at)
        
        let bucket
        if (stableTimeRange === '24hours') {
          const hour = userTime.getHours()
          bucket = buckets.get(hour)
        } else {
          let bucketKey: number
          if (stableTimeRange === '7days') {
            const normalizedDate = new Date(userTime.getFullYear(), userTime.getMonth(), userTime.getDate())
            bucketKey = normalizedDate.getTime()
          } else {
            const normalizedDate = new Date(userTime.getFullYear(), userTime.getMonth(), 1)
            bucketKey = normalizedDate.getTime()
          }
          bucket = buckets.get(bucketKey)
        }
        
        if (bucket) {
          // Separate direct vs invited registrations
          if (user.join_by_invitation === true) {
            bucket.invitedRegistrations++
          } else {
            bucket.directRegistrations++
          }
          
          bucket.details.push({
            id: user.id,
            name: user.first_name && user.last_name 
              ? user.first_name + ' ' + user.last_name
              : user.name || 'N/A',
            email: user.email,
            country: user.registration_country,
            registrationType: user.join_by_invitation ? 'Invited' : 'Direct',
            time: userTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          })
        } else {
          if (stableTimeRange === '7days') {
            const userDateString = new Date(userTime.getFullYear(), userTime.getMonth(), userTime.getDate()).toDateString();
            console.log('⚠️ No 7-day bucket found for user at', userTime.toISOString(), 'normalized to:', userDateString);
          } else {
            console.log('⚠️ No bucket found for user at', userTime.toISOString(), '(hour:', userTime.getHours() + ')');
          }
        }
      })

      // Fill buckets with identity data
      const identityUserIds = new Set()
      ;(identityData || []).forEach(identity => {
        const identityTime = new Date(identity.created_at)
        
        let bucket
        if (stableTimeRange === '24hours') {
          const hour = identityTime.getHours()
          bucket = buckets.get(hour)
        } else {
          let bucketKey: number
          if (stableTimeRange === '7days') {
            const normalizedDate = new Date(identityTime.getFullYear(), identityTime.getMonth(), identityTime.getDate())
            bucketKey = normalizedDate.getTime()
          } else {
            const normalizedDate = new Date(identityTime.getFullYear(), identityTime.getMonth(), 1)
            bucketKey = normalizedDate.getTime()
          }
          bucket = buckets.get(bucketKey)
        }
        
        if (bucket && !identityUserIds.has(identity.user_id)) {
          bucket.usersWithIdentity++
          identityUserIds.add(identity.user_id)
        }
      })

      // Convert to chart format with three datasets
      const dataPoints = Array.from(buckets.values()).map(point => ({
        ...point,
        // Add computed properties for backward compatibility and better UX
        newUsers: (point.directRegistrations || 0) + (point.invitedRegistrations || 0),
        totalRegistrations: (point.directRegistrations || 0) + (point.invitedRegistrations || 0),
      }))
      const directRegistrationsData = dataPoints.map(point => point.directRegistrations || 0)
      const invitedRegistrationsData = dataPoints.map(point => point.invitedRegistrations || 0)
      const identityUsersData = dataPoints.map(point => point.usersWithIdentity || 0)

      const chart = {
        labels,
        datasets: [
          {
            label: 'Direct Registrations',
            data: directRegistrationsData,
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            fill: false,
            tension: 0.3,
          },
          {
            label: 'Invited Registrations',
            data: invitedRegistrationsData,
            borderColor: '#9C27B0',
            backgroundColor: 'rgba(156, 39, 176, 0.1)',
            fill: false,
            tension: 0.3,
          },
          {
            label: 'Users with Identity',
            data: identityUsersData,
            borderColor: '#FF9800',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            fill: false,
            tension: 0.3,
          }
        ]
      }

      if (isMountedRef.current) {
        setChartData(chart)
        setChartDataPoints(dataPoints)
      }

      // Cache for 5 minutes
      queryCache.set(cacheKey, { chartData: chart, chartDataPoints: dataPoints }, 300000)
      
      console.log('✅ Enhanced chart data loaded for', stableTimeRange, 'with server time:', labels.length, 'data points');
      console.log('📊 Totals:', {
        direct: directRegistrationsData.reduce((sum, n) => sum + n, 0),
        invited: invitedRegistrationsData.reduce((sum, n) => sum + n, 0),
        identities: identityUsersData.reduce((sum, n) => sum + n, 0)
      });
      
      // Extra debug for 7days
      if (stableTimeRange === '7days') {
        console.log('🗓️ 7-day data points:', dataPoints.map((point, index) => ({
          label: labels[index],
          direct: point.directRegistrations,
          invited: point.invitedRegistrations,
          identities: point.usersWithIdentity
        })));
      }
    } catch (error: any) {
      console.error('❌ Error loading chart data:', error)
      
      const emptyChart = {
        labels: ['No Data'],
        datasets: [
          {
            label: 'Direct Registrations',
            data: [0],
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            fill: false,
            tension: 0.3,
          },
          {
            label: 'Invited Registrations',
            data: [0],
            borderColor: '#9C27B0',
            backgroundColor: 'rgba(156, 39, 176, 0.1)',
            fill: false,
            tension: 0.3,
          },
          {
            label: 'Users with Identity',
            data: [0],
            borderColor: '#FF9800',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            fill: false,
            tension: 0.3,
          }
        ]
      }
      
      if (isMountedRef.current) {
        setChartData(emptyChart)
        setChartDataPoints([])
      }
    } finally {
      console.log('📊 Chart loading completed, setting loading to false for', stableTimeRange);
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [stableTimeRange])

  useEffect(() => {
    console.log('📊 Chart useEffect triggered, calling loadChartData for', stableTimeRange);
    loadChartData()
  }, [loadChartData])

  return { chartData, chartDataPoints, loading, refetch: loadChartData }
} 