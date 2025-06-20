import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

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

// Simple, direct dashboard hook - no complex state management
export const useSimpleDashboard = (timeRange: '24hours' | '7days' | '12months' = '24hours') => {
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

  // Simple data fetching function
  const fetchDashboardData = useCallback(async () => {
    try {
      console.log('🔄 Fetching dashboard data (simplified approach)...')
      setLoading(true)
      setError(null)

      // Get basic user counts
      const { count: totalUsers } = await supabase
        .from('kd_users')
        .select('*', { count: 'exact', head: true })

      const { count: invitedUsers } = await supabase
        .from('kd_users')
        .select('*', { count: 'exact', head: true })
        .eq('join_by_invitation', true)

      // Get today's registrations
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { count: todayRegistrations } = await supabase
        .from('kd_users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())

      // Get users with identities
      const { data: identityData } = await supabase
        .from('kd_identity')
        .select('user_id')
      
      const activeUsers = new Set(identityData?.map(i => i.user_id) || []).size

      // Get recent users
      const { data: recentUsersData } = await supabase
        .from('kd_users')
        .select('id, name, email, created_at, registration_country, join_by_invitation, first_name, last_name')
        .order('created_at', { ascending: false })
        .limit(5)

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
        // Last 24 hours, hourly buckets
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
        // Last 7 days, daily buckets
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
        // Last 12 months, monthly buckets
        chartStartTime = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        
        for (let i = 0; i < 12; i++) {
          const date = new Date(chartStartTime.getFullYear(), chartStartTime.getMonth() + i, 1)
          labels.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }))
          chartPoints.push({
            label: labels[i],
            directRegistrations: 0,
            invitedRegistrations: 0,
            usersWithIdentity: 0
          })
        }
      }

      // Get user registrations for chart
      const { data: chartUsers } = await supabase
        .from('kd_users')
        .select('created_at, join_by_invitation')
        .gte('created_at', chartStartTime.toISOString())

      // Get identity data for chart
      const { data: chartIdentities } = await supabase
        .from('kd_identity')
        .select('user_id, created_at')
        .gte('created_at', chartStartTime.toISOString())

      // Fill chart data
      chartUsers?.forEach(user => {
        const userTime = new Date(user.created_at)
        let bucketIndex = 0

        if (timeRange === '24hours') {
          bucketIndex = Math.floor((userTime.getTime() - chartStartTime.getTime()) / (60 * 60 * 1000))
        } else if (timeRange === '7days') {
          bucketIndex = Math.floor((userTime.getTime() - chartStartTime.getTime()) / (24 * 60 * 60 * 1000))
        } else {
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
            const monthsDiff = (identityTime.getFullYear() - chartStartTime.getFullYear()) * 12 + 
                              identityTime.getMonth() - chartStartTime.getMonth()
            bucketIndex = monthsDiff
          }

          if (bucketIndex >= 0 && bucketIndex < chartPoints.length) {
            chartPoints[bucketIndex].usersWithIdentity++
          }
        }
      })

      // Update states
      setStats({
        totalUsers: totalUsers || 0,
        activeUsers,
        todayRegistrations: todayRegistrations || 0,
        invitedUsers: invitedUsers || 0,
        userGrowth: 0, // Simplified - no growth calculation
        activeGrowth: 0,
        todayGrowth: 0,
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

      console.log('✅ Dashboard data loaded successfully:', {
        totalUsers: totalUsers || 0,
        chartDataPoints: chartPoints.length,
        recentUsers: transformedRecentUsers.length
      })

    } catch (err: any) {
      console.error('❌ Error fetching dashboard data:', err)
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  // Load data on mount and timeRange change
  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 120000)
    return () => clearInterval(interval)
  }, [fetchDashboardData])

  return {
    stats,
    recentUsers,
    chartData,
    chartDataPoints,
    loading,
    error,
    refetch: fetchDashboardData
  }
} 