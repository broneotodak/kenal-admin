import { useState, useEffect, useCallback } from 'react'
import { supabase, queryCache, batchQueries, withTimeout } from '@/lib/supabase'

// ===== DASHBOARD HOOKS USING OPTIMIZED DATABASE VIEWS =====

// Hook for dashboard statistics (single view query instead of 5+ separate queries)
export const useOptimizedDashboardStats = (refreshInterval: number = 30000) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    todayRegistrations: 0,
    totalRevenue: 452808,
    userGrowth: '+0.0',
    activeGrowth: '+8.3',
    revenueGrowth: '+15.2',
    todayGrowth: '+0.0',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(async () => {
    try {
      console.log('🚀 Loading dashboard stats from optimized view...')
      
      // Check cache first (5-minute cache)
      const cacheKey = 'dashboard_stats'
      const cached = queryCache.get(cacheKey)
      if (cached) {
        console.log('⚡ Dashboard stats loaded from cache')
        setStats(cached)
        setLoading(false)
        return
      }

      // Single query to optimized view instead of 5+ separate queries
      const { data, error: viewError } = await supabase
        .from('admin_dashboard_stats')
        .select('*')
        .single()

      if (viewError) {
        console.error('❌ Dashboard stats view error:', viewError)
        setError('Failed to load dashboard statistics')
        return
      }

      if (data) {
        const formattedStats = {
          totalUsers: data.total_users || 0,
          activeUsers: data.active_users || 0,
          todayRegistrations: data.today_registrations || 0,
          totalRevenue: data.total_revenue || 452808,
          userGrowth: data.user_growth_percentage >= 0 ? `+${data.user_growth_percentage}` : `${data.user_growth_percentage}`,
          activeGrowth: data.active_growth_percentage >= 0 ? `+${data.active_growth_percentage}` : `${data.active_growth_percentage}`,
          revenueGrowth: data.revenue_growth_percentage >= 0 ? `+${data.revenue_growth_percentage}` : `${data.revenue_growth_percentage}`,
          todayGrowth: data.today_growth_percentage >= 0 ? `+${data.today_growth_percentage}` : `${data.today_growth_percentage}`,
        }

        setStats(formattedStats)
        
        // Cache for 5 minutes
        queryCache.set(cacheKey, formattedStats, 300000)
        console.log('✅ Dashboard stats loaded and cached')
      }
    } catch (error: any) {
      console.error('❌ Error loading dashboard stats:', error)
      setError(error.message || 'Failed to load dashboard statistics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
    const interval = setInterval(loadStats, refreshInterval)
    return () => clearInterval(interval)
  }, [loadStats, refreshInterval])

  return { stats, loading, error, refetch: loadStats }
}

// Hook for recent users (single view query instead of complex joins)
export const useOptimizedRecentUsers = (limit: number = 5) => {
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadRecentUsers = useCallback(async () => {
    try {
      console.log('🚀 Loading recent users from optimized view...')
      
      // Check cache first (2-minute cache for recent users)
      const cacheKey = `recent_users_${limit}`
      const cached = queryCache.get(cacheKey)
      if (cached) {
        console.log('⚡ Recent users loaded from cache')
        setRecentUsers(cached)
        setLoading(false)
        return
      }

      // Single query to optimized view
      const { data, error: viewError } = await supabase
        .from('admin_recent_users')
        .select('*')
        .limit(limit)

      if (viewError) {
        console.error('❌ Recent users view error:', viewError)
        setError('Failed to load recent users')
        return
      }

      const users = data || []
      setRecentUsers(users)
      
      // Cache for 2 minutes
      queryCache.set(cacheKey, users, 120000)
      console.log(`✅ Recent users loaded: ${users.length} users`)
    } catch (error: any) {
      console.error('❌ Error loading recent users:', error)
      setError(error.message || 'Failed to load recent users')
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    loadRecentUsers()
  }, [loadRecentUsers])

  return { recentUsers, loading, error, refetch: loadRecentUsers }
}

// Hook for chart data (single view query per time range)
export const useOptimizedChartData = (timeRange: '24hours' | '7days' | '12months') => {
  const [chartData, setChartData] = useState({
    labels: [] as string[],
    datasets: [
      {
        label: 'New Users',
        data: [] as number[],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: '#3b82f6',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3,
      },
      {
        label: 'Users with Identity',
        data: [] as number[],
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: '#f97316',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: '#f97316',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3,
      },
    ],
  })
  const [chartDataPoints, setChartDataPoints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadChartData = useCallback(async () => {
    try {
      console.log(`🚀 Loading chart data for ${timeRange} from optimized view...`)
      setLoading(true)
      
      // Check cache first (10-minute cache for chart data)
      const cacheKey = `chart_data_${timeRange}`
      const cached = queryCache.get(cacheKey)
      if (cached) {
        console.log('⚡ Chart data loaded from cache')
        setChartData(cached.chartData)
        setChartDataPoints(cached.chartDataPoints)
        setLoading(false)
        return
      }

      // Determine which view to use based on time range
      let viewName: string
      let labelField: string
      switch (timeRange) {
        case '24hours':
          viewName = 'admin_chart_hourly'
          labelField = 'hour_label'
          break
        case '7days':
          viewName = 'admin_chart_daily'
          labelField = 'day_label'
          break
        case '12months':
          viewName = 'admin_chart_monthly'
          labelField = 'month_label'
          break
        default:
          throw new Error(`Invalid time range: ${timeRange}`)
      }

      // Single query to appropriate optimized view
      const { data, error: viewError } = await supabase
        .from(viewName)
        .select('*')
        .order(timeRange === '24hours' ? 'hour_bucket' : timeRange === '7days' ? 'day_bucket' : 'month_bucket')

      if (viewError) {
        console.error(`❌ Chart data view error for ${timeRange}:`, viewError)
        setError('Failed to load chart data')
        return
      }

      const chartPoints = data || []
      const labels = chartPoints.map((point: any) => point[labelField])
      const newUsers = chartPoints.map((point: any) => point.new_users || 0)
      const usersWithIdentity = chartPoints.map((point: any) => point.users_with_identity || 0)

      // Format chart data points for details
      const formattedDataPoints = chartPoints.map((point: any) => ({
        date: point.hour_bucket || point.day_bucket || point.month_bucket,
        hour: point.hour_label,
        newUsers: point.new_users || 0,
        usersWithIdentity: point.users_with_identity || 0,
        details: Array.isArray(point.user_details) ? point.user_details : []
      }))

      const formattedChartData = {
        labels,
        datasets: [
          {
            label: 'New Users',
            data: newUsers,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 8,
            pointBackgroundColor: '#3b82f6',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverBackgroundColor: '#3b82f6',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 3,
          },
          {
            label: 'Users with Identity',
            data: usersWithIdentity,
            borderColor: '#f97316',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 8,
            pointBackgroundColor: '#f97316',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverBackgroundColor: '#f97316',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 3,
          },
        ],
      }

      setChartData(formattedChartData)
      setChartDataPoints(formattedDataPoints)
      
      // Cache for 10 minutes
      queryCache.set(cacheKey, {
        chartData: formattedChartData,
        chartDataPoints: formattedDataPoints
      }, 600000)
      
      console.log(`✅ Chart data loaded for ${timeRange}: ${chartPoints.length} data points`)
    } catch (error: any) {
      console.error(`❌ Error loading chart data for ${timeRange}:`, error)
      setError(error.message || 'Failed to load chart data')
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    loadChartData()
  }, [loadChartData])

  return { chartData, chartDataPoints, loading, error, refetch: loadChartData }
}

// Combined dashboard hook for convenience
export const useOptimizedDashboard = (refreshInterval: number = 30000) => {
  const dashboardStats = useOptimizedDashboardStats(refreshInterval)
  const recentUsers = useOptimizedRecentUsers(5)
  
  return {
    stats: dashboardStats,
    recentUsers,
    // Clear all caches
    clearCache: () => {
      queryCache.clear()
      console.log('🧹 Dashboard cache cleared')
    }
  }
} 