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
  gender: string
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
  const [useViews, setUseViews] = useState(true)
  
  // Try views first
  const viewsResult = useOptimizedUsersViews(params)
  
  // Fallback to direct queries
  const directResult = useOptimizedUsers(params)

  // Monitor for view errors and switch to direct queries
  useEffect(() => {
    if (viewsResult.error && viewsResult.error.includes('relation "admin_users_optimized" does not exist')) {
      console.log('📋 Database views not found, using direct queries. Create views for better performance!')
      setUseViews(false)
    }
  }, [viewsResult.error])

  // Return the appropriate result
  if (useViews && !viewsResult.error) {
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
  const [useViews, setUseViews] = useState(true)
  
  // Try views first
  const viewsResult = useUserFilterOptionsViews()
  
  // Fallback to direct queries
  const directResult = useUserFilterOptions()

  // Monitor for view errors
  useEffect(() => {
    if (viewsResult.countries.length === 0 && !viewsResult.loading) {
      // Check if it's likely due to missing views
      setTimeout(() => {
        if (viewsResult.countries.length === 0) {
          console.log('📋 Country views not found, using direct queries')
          setUseViews(false)
        }
      }, 2000)
    }
  }, [viewsResult.countries.length, viewsResult.loading])

  // Return the appropriate result
  if (useViews && viewsResult.countries.length > 0) {
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
  const [useViews, setUseViews] = useState(true)
  
  // Try views first
  const viewsResult = useUserStatisticsViews()
  
  // Fallback to direct queries
  const directResult = useUserStatistics()

  // Monitor for view errors
  useEffect(() => {
    if (viewsResult.stats.totalUsers === 0 && !viewsResult.loading) {
      // Check if it's likely due to missing views
      setTimeout(() => {
        if (viewsResult.stats.totalUsers === 0) {
          console.log('📋 Statistics views not found, using direct queries')
          setUseViews(false)
        }
      }, 2000)
    }
  }, [viewsResult.stats.totalUsers, viewsResult.loading])

  // Return the appropriate result
  if (useViews && viewsResult.stats.totalUsers > 0) {
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