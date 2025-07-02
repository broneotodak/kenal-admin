import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  todayRegistrations: number
  invitedUsers: number
  userGrowth: number
  activeGrowth: number
  todayGrowth: number
  totalRevenue: number
  revenueGrowth: number
  comparisonPeriod: string
  todayComparisonPeriod: string
  lifetimeActiveUsers: number
}

interface RecentUser {
  id: string
  name: string
  email: string
  created_at: string
  registration_country?: string
  registration_type: string
  display_name: string
  country_display: string
}

interface ChartDataPoint {
  label: string
  directRegistrations: number
  invitedRegistrations: number
  usersWithIdentity: number
}

// Real-time dashboard hook with Supabase subscriptions
export const useRealTimeDashboard = (timeRange: '24hours' | '7days' | '12months' = '24hours') => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    todayRegistrations: 0,
    invitedUsers: 0,
    userGrowth: 0,
    activeGrowth: 0,
    todayGrowth: 0,
    totalRevenue: 452808,
    revenueGrowth: 15.2,
    comparisonPeriod: 'last period',
    todayComparisonPeriod: 'yesterday',
    lifetimeActiveUsers: 0,
  })
  
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  
  const [chartData, setChartData] = useState({
    labels: [] as string[],
    datasets: [
      {
        label: 'Direct Registrations',
        data: [] as number[],
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: false,
        tension: 0.3,
      },
      {
        label: 'Invited Registrations',
        data: [] as number[],
        borderColor: '#9C27B0',
        backgroundColor: 'rgba(156, 39, 176, 0.1)',
        fill: false,
        tension: 0.3,
      },
      {
        label: 'Users with Identity',
        data: [] as number[],
        borderColor: '#FF9800',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        fill: false,
        tension: 0.3,
      }
    ]
  })
  
  const [chartDataPoints, setChartDataPoints] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Track subscriptions and mounting state
  const channelsRef = useRef<RealtimeChannel[]>([])
  const isMountedRef = useRef(true)
  const subscriptionsActiveRef = useRef(false)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Stable refetch function that doesn't change when timeRange changes
  const stableRefetch = useRef<() => void>()

  // Fetch dashboard data - no dependencies to prevent recreation
  const fetchDashboardData = useCallback(async () => {
    try {
      console.log('🔄 Fetching real-time dashboard data...')
      setLoading(true)
      setError(null)

      // Get basic user counts
      const [
        { count: totalUsers },
        { count: invitedUsers },
        { data: identityData },
        { data: recentUsersData }
      ] = await Promise.all([
        supabase.from('kd_users').select('*', { count: 'exact', head: true }),
        supabase.from('kd_users').select('*', { count: 'exact', head: true }).eq('join_by_invitation', true),
        supabase.from('kd_identity').select('user_id'),
        supabase.from('kd_users')
          .select('id, name, email, created_at, registration_country, join_by_invitation, first_name, last_name')
          .order('created_at', { ascending: false })
          .limit(5)
      ])

      // Get today's registrations
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { count: todayRegistrations } = await supabase
        .from('kd_users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())

      // Get yesterday's registrations for growth comparison
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const { count: yesterdayRegistrations } = await supabase
        .from('kd_users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', today.toISOString())

      // Calculate growth percentage
      const todayGrowth = yesterdayRegistrations && yesterdayRegistrations > 0 
        ? Math.round(((todayRegistrations || 0) - yesterdayRegistrations) / yesterdayRegistrations * 100)
        : (todayRegistrations || 0) > 0 ? 100 : 0

      const activeUsers = new Set(identityData?.map(i => i.user_id) || []).size

      // Transform recent users
      const transformedRecentUsers = (recentUsersData || []).map(user => ({
        ...user,
        display_name: user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}` 
          : user.name || 'N/A',
        country_display: user.registration_country || 'Unknown',
        registration_type: user.join_by_invitation ? 'Invited' : 'Direct'
      }))

      // Get chart data based on timeRange
      let chartStartTime: Date
      let labels: string[] = []
      const chartPoints: ChartDataPoint[] = []

      if (timeRange === '24hours') {
        chartStartTime = new Date(Date.now() - 24 * 60 * 60 * 1000)
        for (let i = 0; i < 24; i++) {
          const hour = new Date(chartStartTime.getTime() + i * 60 * 60 * 1000).getHours()
          labels.push(`${hour.toString().padStart(2, '0')}:00`)
          chartPoints.push({
            label: labels[i],
            directRegistrations: 0,
            invitedRegistrations: 0,
            usersWithIdentity: 0
          })
        }
      } else if (timeRange === '7days') {
        chartStartTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        for (let i = 0; i < 7; i++) {
          const date = new Date(chartStartTime.getTime() + i * 24 * 60 * 60 * 1000)
          labels.push(date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }))
          chartPoints.push({
            label: labels[i],
            directRegistrations: 0,
            invitedRegistrations: 0,
            usersWithIdentity: 0
          })
        }
              } else {
        // 12 months - start from 12 months ago, beginning of that month
        const now = new Date()
        const startMonth = new Date(now.getFullYear(), now.getMonth() - 11, 1) // 11 months back + current month = 12 months
        chartStartTime = startMonth
        
        for (let i = 0; i < 12; i++) {
          const date = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1)
          labels.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }))
          chartPoints.push({
            label: labels[i],
            directRegistrations: 0,
            invitedRegistrations: 0,
            usersWithIdentity: 0
          })
        }
      }

      // Get chart data
      const [
        { data: chartUsers },
        { data: chartIdentities }
      ] = await Promise.all([
        supabase.from('kd_users')
          .select('created_at, join_by_invitation')
          .gte('created_at', chartStartTime.toISOString()),
        supabase.from('kd_identity')
          .select('user_id, created_at')
          .gte('created_at', chartStartTime.toISOString())
      ])

      // Fill chart data
      
      chartUsers?.forEach(user => {
        const userTime = new Date(user.created_at)
        let bucketIndex = 0

        if (timeRange === '24hours') {
          bucketIndex = Math.floor((userTime.getTime() - chartStartTime.getTime()) / (60 * 60 * 1000))
        } else if (timeRange === '7days') {
          bucketIndex = Math.floor((userTime.getTime() - chartStartTime.getTime()) / (24 * 60 * 60 * 1000))
        } else {
          // 12 months - calculate which month bucket this user belongs to
          const monthsDiff = (userTime.getFullYear() - chartStartTime.getFullYear()) * 12 + 
                            userTime.getMonth() - chartStartTime.getMonth()
          bucketIndex = monthsDiff
        }

        if (bucketIndex >= 0 && bucketIndex < chartPoints.length) {
          if (user.join_by_invitation) {
            chartPoints[bucketIndex].invitedRegistrations++
          } else {
            chartPoints[bucketIndex].directRegistrations++
          }
        }
      })

      // Fill identity data
      const identityUserIds = new Set()
      chartIdentities?.forEach(identity => {
        if (!identityUserIds.has(identity.user_id)) {
          identityUserIds.add(identity.user_id)
          
          const identityTime = new Date(identity.created_at)
          let bucketIndex = 0

          if (timeRange === '24hours') {
            bucketIndex = Math.floor((identityTime.getTime() - chartStartTime.getTime()) / (60 * 60 * 1000))
          } else if (timeRange === '7days') {
            bucketIndex = Math.floor((identityTime.getTime() - chartStartTime.getTime()) / (24 * 60 * 60 * 1000))
          } else {
            // 12 months - calculate which month bucket this identity belongs to
            const monthsDiff = (identityTime.getFullYear() - chartStartTime.getFullYear()) * 12 + 
                              identityTime.getMonth() - chartStartTime.getMonth()
            bucketIndex = monthsDiff
          }

          if (bucketIndex >= 0 && bucketIndex < chartPoints.length) {
            chartPoints[bucketIndex].usersWithIdentity++
          }
        }
      })

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setStats({
          totalUsers: totalUsers || 0,
          activeUsers,
          todayRegistrations: todayRegistrations || 0,
          invitedUsers: invitedUsers || 0,
          userGrowth: 0,
          activeGrowth: 0,
          todayGrowth: todayGrowth,
          totalRevenue: 452808,
          revenueGrowth: 15.2,
          comparisonPeriod: 'last period',
          todayComparisonPeriod: 'yesterday',
          lifetimeActiveUsers: activeUsers,
        })

        setRecentUsers(transformedRecentUsers)

        setChartData({
          labels,
          datasets: [
            {
              label: 'Direct Registrations',
              data: chartPoints.map(p => p.directRegistrations),
              borderColor: '#4CAF50',
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              fill: false,
              tension: 0.3,
            },
            {
              label: 'Invited Registrations',
              data: chartPoints.map(p => p.invitedRegistrations),
              borderColor: '#9C27B0',
              backgroundColor: 'rgba(156, 39, 176, 0.1)',
              fill: false,
              tension: 0.3,
            },
            {
              label: 'Users with Identity',
              data: chartPoints.map(p => p.usersWithIdentity),
              borderColor: '#FF9800',
              backgroundColor: 'rgba(255, 152, 0, 0.1)',
              fill: false,
              tension: 0.3,
            }
          ]
        })

        setChartDataPoints(chartPoints)

        console.log('✅ Real-time dashboard data loaded successfully:', {
          totalUsers: totalUsers || 0,
          chartDataPoints: chartPoints.length,
          recentUsers: transformedRecentUsers.length,
          invitedUsersTotal: invitedUsers || 0,
          ...(timeRange === '12months' && {
            monthlyInvited: chartPoints.map(p => p.invitedRegistrations).reduce((a, b) => a + b, 0),
            monthlyDirect: chartPoints.map(p => p.directRegistrations).reduce((a, b) => a + b, 0)
          })
        })
      }

    } catch (err: any) {
      console.error('❌ Error fetching dashboard data:', err)
      if (isMountedRef.current) {
        setError(err.message || 'Failed to load dashboard data')
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [timeRange])

  // Update the stable refetch reference whenever fetchDashboardData changes
  useEffect(() => {
    stableRefetch.current = fetchDashboardData
  }, [fetchDashboardData])

  // Cleanup subscriptions function
  const cleanupSubscriptions = useCallback(() => {
    console.log('🧹 Cleaning up real-time subscriptions...')
    
    // Clear any pending retry timeouts
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
    
    // Remove all channels
    channelsRef.current.forEach(channel => {
      try {
        supabase.removeChannel(channel)
        console.log('✅ Removed channel:', channel.topic)
      } catch (error) {
        console.warn('⚠️ Error removing channel:', error)
      }
    })
    
    channelsRef.current = []
    subscriptionsActiveRef.current = false
  }, [])

  // Set up real-time subscriptions - completely stable function with NO dependencies on data fetching
  const setupRealtimeSubscriptions = useCallback(() => {
    // Prevent multiple simultaneous setups
    if (subscriptionsActiveRef.current) {
      console.log('🔄 Real-time subscriptions already active, skipping setup')
      return
    }

    // Clean up any existing subscriptions first
    cleanupSubscriptions()

    if (!isMountedRef.current) {
      console.log('🚫 Component unmounted, skipping subscription setup')
      return
    }

    try {
      console.log('🚀 Setting up real-time subscriptions...')
      subscriptionsActiveRef.current = true

      // Create channels with unique identifiers to prevent conflicts
      const timestamp = Date.now()
      
      // Subscribe to user changes
      const usersChannel = supabase
        .channel(`dashboard-users-${timestamp}`, {
          config: {
            presence: { key: `dashboard-users-${timestamp}` }
          }
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'kd_users'
        }, (payload) => {
          console.log('📢 Users table change detected:', payload.eventType)
          if (isMountedRef.current && stableRefetch.current) {
            // Use stable refetch to avoid dependency issues
            stableRefetch.current()
          }
        })
        .subscribe((status) => {
          console.log('👥 Users subscription status:', status)
          if (status === 'SUBSCRIBED') {
            console.log('✅ Users real-time subscription active')
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn(`⚠️ Users subscription ${status}, will retry on next setup`)
            subscriptionsActiveRef.current = false
          }
        })

      // Subscribe to identity changes
      const identityChannel = supabase
        .channel(`dashboard-identity-${timestamp}`, {
          config: {
            presence: { key: `dashboard-identity-${timestamp}` }
          }
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'kd_identity'
        }, (payload) => {
          console.log('📢 Identity table change detected:', payload.eventType)
          if (isMountedRef.current && stableRefetch.current) {
            // Use stable refetch to avoid dependency issues
            stableRefetch.current()
          }
        })
        .subscribe((status) => {
          console.log('🆔 Identity subscription status:', status)
          if (status === 'SUBSCRIBED') {
            console.log('✅ Identity real-time subscription active')
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn(`⚠️ Identity subscription ${status}, will retry on next setup`)
            subscriptionsActiveRef.current = false
          }
        })

      // Store channels for cleanup
      channelsRef.current = [usersChannel, identityChannel]

    } catch (error) {
      console.error('❌ Failed to set up real-time subscriptions:', error)
      subscriptionsActiveRef.current = false
      
      // Schedule a retry after delay if component is still mounted
      if (isMountedRef.current) {
        retryTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current && !subscriptionsActiveRef.current) {
            console.log('🔄 Retrying real-time subscription setup...')
            setupRealtimeSubscriptions()
          }
        }, 10000) // 10 second delay
      }
    }
  }, [cleanupSubscriptions]) // ONLY depend on cleanupSubscriptions

  // Load data and set up subscriptions on mount - ONE TIME ONLY
  useEffect(() => {
    isMountedRef.current = true
    
    // Load initial data
    fetchDashboardData()
    
    // Set up subscriptions after a short delay to ensure proper initialization
    const setupTimeout = setTimeout(() => {
      if (isMountedRef.current) {
        setupRealtimeSubscriptions()
      }
    }, 2000)

    // Cleanup function
    return () => {
      isMountedRef.current = false
      clearTimeout(setupTimeout)
      cleanupSubscriptions()
    }
  }, []) // EMPTY dependency array - run only once on mount

  // ONLY refetch data when timeRange changes - do NOT re-setup subscriptions
  useEffect(() => {
    if (isMountedRef.current) {
      console.log('📊 Time range changed, refetching data only (keeping existing subscriptions)')
      fetchDashboardData()
    }
  }, [timeRange, fetchDashboardData])

  return {
    stats,
    recentUsers,
    chartData,
    chartDataPoints,
    loading,
    error,
    refetch: fetchDashboardData,
    // Expose cleanup for manual control
    cleanup: cleanupSubscriptions
  }
} 