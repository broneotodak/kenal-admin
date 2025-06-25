import { useState, useEffect, useCallback } from 'react'

// Persistent cache using localStorage to survive hot reloads
const VIEWS_CACHE_KEY = 'kenal_admin_views_exist'

const getViewsExistCache = (): boolean | null => {
  if (typeof window === 'undefined') return null
  const cached = localStorage.getItem(VIEWS_CACHE_KEY)
  return cached ? JSON.parse(cached) : null
}

const setViewsExistCache = (exists: boolean): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(VIEWS_CACHE_KEY, JSON.stringify(exists))
}
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
  // Always start with true to avoid SSR hydration mismatch, then check cache
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

  // Check cache immediately on client-side mount
  useEffect(() => {
    if (getViewsExistCache() === false) {
      console.log('📋 Using cached knowledge that views don\'t exist, switching to direct queries')
      setUseViews(false)
    }
  }, [])

  // Monitor for view errors and switch to direct queries IMMEDIATELY
  useEffect(() => {
    if (useViews && viewsResult.error) {
      // Check for any database view related errors
      const isViewError = viewsResult.error.includes('does not exist') || 
                         viewsResult.error.includes('relation') ||
                         viewsResult.error.includes('404')
      
      if (isViewError) {
        console.log('📋 Database views not found, switching to direct queries permanently')
        setViewsExistCache(false) // Remember this in localStorage
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
  // Always start with true to avoid SSR hydration mismatch, then check cache
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

  // Check cache immediately on client-side mount
  useEffect(() => {
    if (getViewsExistCache() === false) {
      console.log('📋 Using cached knowledge that views don\'t exist, switching to direct queries')
      setUseViews(false)
    }
  }, [])

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
  // Always start with true to avoid SSR hydration mismatch, then check cache
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

  // Check cache immediately on client-side mount
  useEffect(() => {
    if (getViewsExistCache() === false) {
      console.log('📋 Using cached knowledge that views don\'t exist, switching to direct queries')
      setUseViews(false)
    }
  }, [])

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