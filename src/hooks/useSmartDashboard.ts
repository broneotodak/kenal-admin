import { useState, useEffect, useCallback, useRef } from 'react'
import { usePageVisibility } from './usePageVisibility'
import { 
  useFallbackDashboardStats, 
  useFallbackRecentUsers, 
  useFallbackChartData 
} from './useOptimizedDashboardFallback-simple'

// Smart dashboard hook that handles tab suspension gracefully
export const useSmartDashboard = (timeRange: '24hours' | '7days' | '12months' = '24hours') => {
  const { isVisible, wasHidden, resetHiddenFlag } = usePageVisibility()
  const [globalLoading, setGlobalLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const refreshTimeoutRef = useRef<NodeJS.Timeout>()

  // Use individual hooks with longer refresh intervals to reduce background activity
  const stats = useFallbackDashboardStats(timeRange, 60000) // 1 minute instead of 30 seconds
  const recentUsers = useFallbackRecentUsers(5)
  const chartData = useFallbackChartData(timeRange)

  // Debounced refresh function to prevent multiple simultaneous requests
  const debouncedRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }

    refreshTimeoutRef.current = setTimeout(() => {
      console.log('🔄 Performing coordinated dashboard refresh...')
      
      // Refresh all data sources
      Promise.all([
        stats.refetch(),
        recentUsers.refetch(),
        chartData.refetch()
      ]).then(() => {
        setLastRefresh(new Date())
        console.log('✅ Dashboard refresh completed')
      }).catch((error) => {
        console.error('❌ Dashboard refresh failed:', error)
      })
    }, 500) // 500ms debounce
  }, [stats.refetch, recentUsers.refetch, chartData.refetch])

  // Handle tab becoming visible again after being hidden
  useEffect(() => {
    if (isVisible && wasHidden) {
      console.log('👀 Tab became visible after being hidden - checking if refresh needed...')
      
      const timeSinceLastRefresh = Date.now() - lastRefresh.getTime()
      const shouldRefresh = timeSinceLastRefresh > 60000 // Refresh if more than 1 minute since last refresh

      if (shouldRefresh) {
        console.log(`⏰ Last refresh was ${Math.round(timeSinceLastRefresh / 1000)}s ago - refreshing data...`)
        debouncedRefresh()
      } else {
        console.log(`⏰ Last refresh was only ${Math.round(timeSinceLastRefresh / 1000)}s ago - no refresh needed`)
      }
      
      resetHiddenFlag()
    }
  }, [isVisible, wasHidden, lastRefresh, debouncedRefresh, resetHiddenFlag])

  // Calculate global loading state - only show loading if ALL data is loading
  useEffect(() => {
    const anyLoading = stats.loading || recentUsers.loading || chartData.loading
    const allLoading = stats.loading && recentUsers.loading && chartData.loading

    // Show loading only if:
    // 1. All sources are loading (initial load)
    // 2. OR if we're on a fresh page load (lastRefresh is very recent)
    const timeSinceInit = Date.now() - lastRefresh.getTime()
    const isInitialLoad = timeSinceInit < 5000 // Within 5 seconds of initialization

    setGlobalLoading(allLoading || (anyLoading && isInitialLoad))
  }, [stats.loading, recentUsers.loading, chartData.loading, lastRefresh])

  // Manual refresh function
  const refreshDashboard = useCallback(() => {
    console.log('🔄 Manual dashboard refresh triggered...')
    debouncedRefresh()
  }, [debouncedRefresh])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [])

  return {
    // Data
    stats: stats.stats,
    recentUsers: recentUsers.recentUsers,
    chartData: chartData.chartData,
    chartDataPoints: chartData.chartDataPoints,
    
    // Loading states
    loading: globalLoading,
    statsLoading: stats.loading,
    usersLoading: recentUsers.loading,
    chartLoading: chartData.loading,
    
    // Visibility state
    isTabVisible: isVisible,
    
    // Actions
    refreshDashboard,
    lastRefresh,
    
    // Individual refresh functions (if needed)
    refreshStats: stats.refetch,
    refreshUsers: recentUsers.refetch,
    refreshChart: chartData.refetch,
  }
} 