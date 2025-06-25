import { useState, useEffect, useCallback } from 'react'
import { 
  useOptimizedUsersViews, 
  useUserFilterOptionsViews, 
  useUserStatisticsViews 
} from './useOptimizedUsersViews'
import { 
  useOptimizedUsers, 
  useUserFilterOptions, 
  useUserStatistics 
} from './useOptimizedUsers'

// ===== SMART HOOKS WITH AUTOMATIC FALLBACK =====
// Try database views first, fallback to direct queries if views don't exist

interface UserFilters {
  user_type: string
  invitation_status: string
  country: string
}

interface UseSmartOptimizedUsersParams {
  page: number
  rowsPerPage: number
  searchQuery: string
  filters: UserFilters
}

// Smart hook that tries views first, falls back to direct queries
export const useSmartOptimizedUsers = (params: UseSmartOptimizedUsersParams) => {
  // Simple: start with views, let error handling switch to direct queries
  const [useViews, setUseViews] = useState(true)
  
  // ONLY call one hook at a time to prevent double loading
  const viewsResult = useViews ? useOptimizedUsersViews(params) : {
    users: [],
    totalCount: 0,
    loading: false,
    error: null,
    refetch: () => {}
  }
  
  const directResult = !useViews ? useOptimizedUsers(params) : {
    users: [],
    totalCount: 0,
    loading: false,
    error: null,
    refetch: () => {}
  }

  // Monitor for view errors and switch to direct queries
  useEffect(() => {
    if (useViews && viewsResult.error) {
      // Check for any database view related errors
      const isViewError = viewsResult.error.includes('does not exist') || 
                         viewsResult.error.includes('relation') ||
                         viewsResult.error.includes('404')
      
      if (isViewError) {
        console.log('📋 Database views not found, switching to direct queries')
        setUseViews(false)
      }
    }
  }, [useViews, viewsResult.error])

  // Return the appropriate result
  if (useViews) {
    return {
      ...viewsResult,
      mode: 'views' as const
    }
  } else {
    return {
      ...directResult,
      mode: 'direct' as const
    }
  }
}

// Smart filter options hook
export const useSmartUserFilterOptions = () => {
  // Simple: start with views, let error handling switch to direct queries
  const [useViews, setUseViews] = useState(true)
  
  // ONLY call one hook at a time to prevent double loading
  const viewsResult = useViews ? useUserFilterOptionsViews() : {
    countries: [],
    loading: false,
    refetch: () => {}
  }
  
  const directResult = !useViews ? useUserFilterOptions() : {
    countries: [],
    loading: false,
    refetch: () => {}
  }

  // Auto-switch to direct queries after 3 seconds if no countries loaded
  useEffect(() => {
    if (useViews && !viewsResult.loading && viewsResult.countries.length === 0) {
      const timer = setTimeout(() => {
        console.log('📋 No countries from views, switching to direct queries')
        setUseViews(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [useViews, viewsResult.loading, viewsResult.countries.length])

  // Return the appropriate result
  if (useViews) {
    return {
      ...viewsResult,
      mode: 'views' as const
    }
  } else {
    return {
      ...directResult,
      mode: 'direct' as const
    }
  }
}

// Smart statistics hook
export const useSmartUserStatistics = () => {
  // Simple: start with views, let error handling switch to direct queries
  const [useViews, setUseViews] = useState(true)
  
  // ONLY call one hook at a time to prevent double loading
  const viewsResult = useViews ? useUserStatisticsViews() : {
    stats: {
      totalUsers: 0,
      activeUsers: 0,
      adminUsers: 0,
      usersWithIdentities: 0,
      avgIdentitiesPerUser: 0
    },
    loading: false,
    refetch: () => {}
  }
  
  const directResult = !useViews ? useUserStatistics() : {
    stats: {
      totalUsers: 0,
      activeUsers: 0,
      adminUsers: 0,
      usersWithIdentities: 0,
      avgIdentitiesPerUser: 0
    },
    loading: false,
    refetch: () => {}
  }

  // Auto-switch to direct queries after 3 seconds if no stats loaded
  useEffect(() => {
    if (useViews && !viewsResult.loading && viewsResult.stats.totalUsers === 0) {
      const timer = setTimeout(() => {
        console.log('📋 No stats from views, switching to direct queries')
        setUseViews(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [useViews, viewsResult.loading, viewsResult.stats.totalUsers])

  // Return the appropriate result
  if (useViews) {
    return {
      ...viewsResult,
      mode: 'views' as const
    }
  } else {
    return {
      ...directResult,
      mode: 'direct' as const
    }
  }
} 