'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase, withTimeout, batchQueries, queryCache } from '@/lib/supabase'

// Custom hook for optimized user fetching with caching
export const useOptimizedUsers = (
  page: number = 0,
  rowsPerPage: number = 10,
  searchQuery: string = '',
  filters: Record<string, any> = {}
) => {
  const [users, setUsers] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Memoize cache key to prevent unnecessary refetches
  const cacheKey = useMemo(() => 
    `users_${page}_${rowsPerPage}_${searchQuery}_${JSON.stringify(filters)}`,
    [page, rowsPerPage, searchQuery, filters]
  )

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Check cache first
      const cached = queryCache.get(cacheKey)
      if (cached) {
        console.log('✅ Cache hit for users:', cacheKey)
        setUsers(cached.data || [])
        setTotalCount(cached.count || 0)
        setLoading(false)
        return
      }

      console.log('🔄 Fetching fresh user data...')

      // Optimized user query with simplified fields first
      const executeUserQuery = async () => {
        let query = supabase
          .from('kd_users')
          .select(`
            id,
            name,
            email,
            created_at,
            join_by_invitation,
            element_type,
            user_type,
            active,
            birth_date,
            country
          `, { count: 'exact' })

        // Apply search filter
        if (searchQuery.trim()) {
          query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        }

        // Apply filters efficiently
        if (filters.user_type) {
          if (filters.user_type === 'Admin') {
            query = query.eq('user_type', 5)
          } else if (filters.user_type === 'Public') {
            query = query.not('user_type', 'eq', 5)
          }
        }
        if (filters.invitation_status) {
          if (filters.invitation_status === 'Invited') {
            query = query.eq('join_by_invitation', true)
          } else if (filters.invitation_status === 'Direct') {
            query = query.eq('join_by_invitation', false)
          }
        }
        if (filters.country) {
          query = query.eq('country', filters.country)
        }

        return query
          .order('created_at', { ascending: false })
          .range(page * rowsPerPage, (page + 1) * rowsPerPage - 1)
      }

      const result = await withTimeout(executeUserQuery(), 10000)

      if (result.error) {
        throw new Error(result.error.message || 'Failed to fetch users')
      }

      const users = result.data || []
      const count = result.count || 0

      // Batch fetch identity counts for better performance
      if (users.length > 0) {
        const userIds = users.map(user => user.id)
        
        try {
          const identityQuery = async () => {
            return supabase
              .from('kd_identity')
              .select('user_id')
              .in('user_id', userIds)
          }
          
          const identityResult = await withTimeout(identityQuery(), 5000)
          
          if (!identityResult.error && identityResult.data) {
            // Count identities per user
            const identityCounts: { [key: string]: number } = {}
            identityResult.data.forEach((identity: any) => {
              identityCounts[identity.user_id] = (identityCounts[identity.user_id] || 0) + 1
            })
            
            // Add identity counts to users
            users.forEach((user: any) => {
              user.identity_count = identityCounts[user.id] || 0
            })
          }
        } catch (identityError) {
          console.warn('⚠️ Failed to fetch identity counts:', identityError)
          // Continue without identity counts rather than failing completely
        }
      }

      // Cache the result for 5 minutes
      queryCache.set(cacheKey, { data: users, count }, 300000)

      setUsers(users)
      setTotalCount(count)
      console.log(`✅ Fetched ${users.length} users (${count} total)`)
    } catch (err: any) {
      console.error('❌ Error fetching users:', err)
      setError(err.message || 'Failed to fetch users')
      setUsers([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [cacheKey, page, rowsPerPage, searchQuery, filters])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return {
    users,
    totalCount,
    loading,
    error,
    refetch: fetchUsers,
    clearCache: () => queryCache.clear()
  }
}

// Optimized analytics hook with batched queries
export const useOptimizedAnalytics = (timeRange: string = 'Last 30 Days') => {
  const [analyticsData, setAnalyticsData] = useState<any>({
    totalUsers: 0,
    todayRegistrations: 0,
    monthlyGrowthRate: 0,
    avgDailyRegistrations: 0,
    totalIdentities: 0,
    usersByElement: {},
    usersByCountry: {},
    usersByInvitation: {},
    usersByType: { admin: 0, public: 0 },
    totalDirectRegistrations: 0,
    totalInvitedRegistrations: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cacheKey = useMemo(() => `analytics_${timeRange}`, [timeRange])

  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Check cache first
      const cached = queryCache.get(cacheKey)
      if (cached) {
        console.log('✅ Cache hit for analytics:', cacheKey)
        setAnalyticsData(cached)
        setLoading(false)
        return
      }

      console.log('🔄 Batching analytics queries for optimal performance...')

      // Batch all queries together for better performance
      const queries = {
        totalUsers: () => supabase
          .from('kd_users')
          .select('*', { count: 'exact', head: true }),
        
        todayRegistrations: () => {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          return supabase
            .from('kd_users')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today.toISOString())
        },
        
        allUsers: () => supabase
          .from('kd_users')
          .select('user_type, element_type, country, created_at, join_by_invitation'),
        
        currentMonthUsers: () => {
          const currentMonth = new Date()
          currentMonth.setDate(1)
          currentMonth.setHours(0, 0, 0, 0)
          return supabase
            .from('kd_users')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', currentMonth.toISOString())
        },
        
        lastMonthUsers: () => {
          const currentMonth = new Date()
          currentMonth.setDate(1)
          currentMonth.setHours(0, 0, 0, 0)
          const lastMonthStart = new Date(currentMonth)
          lastMonthStart.setMonth(lastMonthStart.getMonth() - 1)
          return supabase
            .from('kd_users')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', lastMonthStart.toISOString())
            .lt('created_at', currentMonth.toISOString())
        }
      }

      const results = await batchQueries(queries)

      // Process results
      const totalUsers = results.totalUsers?.count || 0
      const todayRegistrations = results.todayRegistrations?.count || 0
      const currentMonthUsers = results.currentMonthUsers?.count || 0
      const lastMonthUsers = results.lastMonthUsers?.count || 0
      const allUsers = results.allUsers?.data || []

      // Calculate monthly growth rate
      const monthlyGrowthRate = lastMonthUsers && lastMonthUsers > 0 
        ? ((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100 
        : currentMonthUsers > 0 ? 100 : 0

      // Calculate average daily registrations (last 30 days)
      const avgDailyRegistrations = Math.round(totalUsers / 30)

      // Process user segmentation efficiently
      const usersByElement: { [key: number]: number } = {}
      const usersByCountry: { [key: string]: number } = {}
      const usersByInvitation: { [key: string]: number } = {}
      let adminCount = 0
      let publicCount = 0
      let directRegistrations = 0
      let invitedRegistrations = 0

      allUsers.forEach((user: any) => {
        // Element analysis
        if (user.element_type) {
          usersByElement[user.element_type] = (usersByElement[user.element_type] || 0) + 1
        }
        
        // Country analysis
        if (user.country) {
          usersByCountry[user.country] = (usersByCountry[user.country] || 0) + 1
        }
        
        // Invitation analysis
        const invitationType = user.join_by_invitation ? 'Invited' : 'Direct'
        usersByInvitation[invitationType] = (usersByInvitation[invitationType] || 0) + 1
        
        // User type analysis
        if (user.user_type === 5) {
          adminCount++
        } else {
          publicCount++
        }

        // Registration type analysis
        if (user.join_by_invitation === false) {
          directRegistrations++
        } else if (user.join_by_invitation === true) {
          invitedRegistrations++
        }
      })

      const processedData = {
        totalUsers,
        todayRegistrations,
        monthlyGrowthRate,
        avgDailyRegistrations,
        totalIdentities: 0,
        usersByElement,
        usersByCountry,
        usersByInvitation,
        usersByType: { admin: adminCount, public: publicCount },
        totalDirectRegistrations: directRegistrations,
        totalInvitedRegistrations: invitedRegistrations
      }

      // Cache for 10 minutes
      queryCache.set(cacheKey, processedData, 600000)
      setAnalyticsData(processedData)
      
      console.log('✅ Analytics data processed successfully:', {
        totalUsers,
        directRegistrations,
        invitedRegistrations,
        monthlyGrowthRate: monthlyGrowthRate.toFixed(1) + '%'
      })

    } catch (err: any) {
      console.error('❌ Error fetching analytics:', err)
      setError(err.message || 'Failed to fetch analytics data')
    } finally {
      setLoading(false)
    }
  }, [cacheKey, timeRange])

  useEffect(() => {
    fetchAnalyticsData()
  }, [fetchAnalyticsData])

  return {
    analyticsData,
    loading,
    error,
    refetch: fetchAnalyticsData,
    clearCache: () => queryCache.clear()
  }
} 