import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase, queryCache } from '@/lib/supabase'

// ===== SUPER-OPTIMIZED USER HOOKS (using database views) =====

interface User {
  id: string
  name: string
  email: string
  created_at: string
  gender?: string
  element_number?: number
  user_type?: number
  active: boolean
  identity_count?: number
  birth_date?: string
  registration_country?: string
  country_display?: string
  registration_type?: string
  display_name?: string
  element_display?: string
  user_type_display?: string
}

interface UserFilters {
  user_type: string
  invitation_status: string
  country: string
}

interface UseOptimizedUsersViewsParams {
  page: number
  rowsPerPage: number
  searchQuery: string
  filters: UserFilters
}

// Super-optimized hook using database views
export const useOptimizedUsersViews = ({ 
  page, 
  rowsPerPage, 
  searchQuery, 
  filters 
}: UseOptimizedUsersViewsParams) => {
  const [users, setUsers] = useState<User[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create cache key from all parameters
  const cacheKey = useMemo(() => {
    return `users_views_${page}_${rowsPerPage}_${searchQuery}_${JSON.stringify(filters)}`
  }, [page, rowsPerPage, searchQuery, filters])

  const loadUsers = useCallback(async () => {
    try {
      console.log('🚀 Loading users with SUPER-OPTIMIZED database views...')
      setLoading(true)
      setError(null)

      // Check cache first (3-minute cache for view data)
      const cached = queryCache.get(cacheKey)
      if (cached) {
        console.log('⚡ Users loaded from cache (views)')
        setUsers(cached.users)
        setTotalCount(cached.totalCount)
        setLoading(false)
        return
      }

      // Query the optimized view instead of raw tables
      let query = supabase
        .from('admin_users_optimized')
        .select('*', { count: 'exact' })

      // Apply search filter efficiently (searches multiple fields)
      if (searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
      }

      // Apply filters using pre-calculated fields
      if (filters.user_type) {
        query = query.eq('user_type_display', filters.user_type)
      }
      if (filters.invitation_status) {
        query = query.eq('registration_type', filters.invitation_status)
      }
      if (filters.country) {
        query = query.eq('registration_country', filters.country)
      }

      // Add efficient pagination and ordering
      query = query
        .order('created_at', { ascending: false })
        .range(page * rowsPerPage, (page + 1) * rowsPerPage - 1)

      const { data: usersData, error: usersError, count } = await query

      if (usersError) {
        throw new Error(`Failed to fetch users from view: ${usersError.message}`)
      }

      if (!usersData) {
        setUsers([])
        setTotalCount(0)
        return
      }

      setUsers(usersData)
      setTotalCount(count || 0)

      // Cache results for 3 minutes (views are faster so we can cache longer)
      queryCache.set(cacheKey, { users: usersData, totalCount: count || 0 }, 180000)
      
      console.log(`✅ Users loaded from VIEW: ${usersData.length} users (${count} total)`)
    } catch (error: any) {
      console.error('❌ Error loading users from views:', error)
      setError(error.message || 'Failed to load users')
      setUsers([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [cacheKey])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  return { users, totalCount, loading, error, refetch: loadUsers }
}

// Hook for getting available filter options from views
export const useUserFilterOptionsViews = () => {
  const [countries, setCountries] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const loadFilterOptions = useCallback(async () => {
    try {
      console.log('🚀 Loading filter options from optimized view...')

      // Check cache first (15-minute cache for filter options)
      const cacheKey = 'user_filter_options_views'
      const cached = queryCache.get(cacheKey)
      if (cached) {
        console.log('⚡ Filter options loaded from cache (views)')
        setCountries(cached.countries)
        setLoading(false)
        return
      }

      // Query the countries view (pre-calculated and sorted)
      const { data: countryData, error } = await supabase
        .from('admin_countries_list')
        .select('country')
        .order('user_count', { ascending: false })

      if (!error && countryData) {
        const countries = countryData.map(item => item.country)

        setCountries(countries)

        // Cache for 15 minutes
        queryCache.set(cacheKey, { countries }, 900000)
        console.log(`✅ Filter options loaded from VIEW: ${countries.length} countries`)
      }
    } catch (error: any) {
      console.error('❌ Error loading filter options from views:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFilterOptions()
  }, [loadFilterOptions])

  return { countries, loading, refetch: loadFilterOptions }
}

// Hook for user statistics from views
export const useUserStatisticsViews = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    usersWithIdentities: 0,
    avgIdentitiesPerUser: 0
  })
  const [loading, setLoading] = useState(true)

  const loadStats = useCallback(async () => {
    try {
      console.log('🚀 Loading user statistics from optimized view...')

      // Check cache first (5-minute cache for stats)
      const cacheKey = 'user_statistics_views'
      const cached = queryCache.get(cacheKey)
      if (cached) {
        console.log('⚡ User statistics loaded from cache (views)')
        setStats(cached)
        setLoading(false)
        return
      }

      // Query the statistics view (single query gets all stats)
      const { data, error } = await supabase
        .from('admin_user_statistics')
        .select('*')
        .single()

      if (error) {
        throw new Error(`Failed to fetch statistics: ${error.message}`)
      }

      const statistics = {
        totalUsers: data.total_users || 0,
        activeUsers: data.active_users || 0,
        adminUsers: data.admin_users || 0,
        usersWithIdentities: data.users_with_identities || 0,
        avgIdentitiesPerUser: Number(data.avg_identities_per_user) || 0
      }

      setStats(statistics)

      // Cache for 5 minutes
      queryCache.set(cacheKey, statistics, 300000)
      console.log('✅ User statistics loaded from VIEW')
    } catch (error: any) {
      console.error('❌ Error loading user statistics from views:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  return { stats, loading, refetch: loadStats }
}

// Hook for analytics data from views
export const useUserAnalyticsViews = () => {
  const [analyticsData, setAnalyticsData] = useState({
    elementDistribution: [] as any[],
    genderDistribution: [] as any[],
    registrationTrend: [] as any[]
  })
  const [loading, setLoading] = useState(true)

  const loadAnalyticsData = useCallback(async () => {
    try {
      console.log('🚀 Loading analytics data from optimized view...')

      // Check cache first (10-minute cache for analytics)
      const cacheKey = 'user_analytics_views'
      const cached = queryCache.get(cacheKey)
      if (cached) {
        console.log('⚡ Analytics data loaded from cache (views)')
        setAnalyticsData(cached)
        setLoading(false)
        return
      }

      // Query the analytics summary view (single query gets all analytics)
      const { data, error } = await supabase
        .from('admin_user_analytics_summary')
        .select('*')
        .single()

      if (error) {
        throw new Error(`Failed to fetch analytics: ${error.message}`)
      }

      const analytics = {
        elementDistribution: data.element_distribution || [],
        genderDistribution: data.gender_distribution || [],
        registrationTrend: data.registration_trend || []
      }

      setAnalyticsData(analytics)

      // Cache for 10 minutes
      queryCache.set(cacheKey, analytics, 600000)
      console.log('✅ Analytics data loaded from VIEW')
    } catch (error: any) {
      console.error('❌ Error loading analytics from views:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAnalyticsData()
  }, [loadAnalyticsData])

  return { analyticsData, loading, refetch: loadAnalyticsData }
}

// Hook for recent users from views  
export const useRecentUsersViews = (limit: number = 5) => {
  const [recentUsers, setRecentUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const loadRecentUsers = useCallback(async () => {
    try {
      console.log('🚀 Loading recent users from optimized view...')

      // Check cache first (2-minute cache for recent users)
      const cacheKey = `recent_users_views_${limit}`
      const cached = queryCache.get(cacheKey)
      if (cached) {
        console.log('⚡ Recent users loaded from cache (views)')
        setRecentUsers(cached)
        setLoading(false)
        return
      }

      // Query the recent users view (already ordered by created_at DESC)
      const { data, error } = await supabase
        .from('admin_recent_users_optimized')
        .select('*')
        .limit(limit)

      if (error) {
        throw new Error(`Failed to fetch recent users: ${error.message}`)
      }

      setRecentUsers(data || [])

      // Cache for 2 minutes
      queryCache.set(cacheKey, data || [], 120000)
      console.log(`✅ Recent users loaded from VIEW: ${(data || []).length} users`)
    } catch (error: any) {
      console.error('❌ Error loading recent users from views:', error)
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    loadRecentUsers()
  }, [loadRecentUsers])

  return { recentUsers, loading, refetch: loadRecentUsers }
} 