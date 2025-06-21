import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase, queryCache } from '@/lib/supabase'

// ===== OPTIMIZED USER HOOKS =====

interface User {
  id: string
  name: string
  email: string
  created_at: string
  gender?: string
  element_type?: number
  user_type?: number
  active: boolean
  identity_count?: number
  birth_date?: string
  registration_country?: string
  country_display?: string
  registration_type?: string
  display_name?: string
}

interface UserFilters {
  user_type: string
  invitation_status: string
  country: string
}

interface UseOptimizedUsersParams {
  page: number
  rowsPerPage: number
  searchQuery: string
  filters: UserFilters
}

// Main hook for optimized user fetching
export const useOptimizedUsers = ({ 
  page, 
  rowsPerPage, 
  searchQuery, 
  filters 
}: UseOptimizedUsersParams) => {
  const [users, setUsers] = useState<User[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create cache key from all parameters
  const cacheKey = useMemo(() => {
    return `users_${page}_${rowsPerPage}_${searchQuery}_${JSON.stringify(filters)}`
  }, [page, rowsPerPage, searchQuery, filters])

  const loadUsers = useCallback(async () => {
    try {
      console.log('🔄 Loading users with optimized query...')
      setLoading(true)
      setError(null)

      // Check cache first (2-minute cache for user data)
      const cached = queryCache.get(cacheKey)
      if (cached) {
        console.log('⚡ Users loaded from cache')
        setUsers(cached.users)
        setTotalCount(cached.totalCount)
        setLoading(false)
        return
      }

      // Build optimized query with all data in single request
      let query = supabase
        .from('kd_users')
        .select(`
          id,
          name,
          email,
          created_at,
          gender,
          element_type,
          user_type,
          active,
          birth_date,
          registration_country,
          join_by_invitation,
          first_name,
          last_name
        `, { count: 'exact' })

      // Apply search filter efficiently
      if (searchQuery.trim()) {
        query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
      }

      // Apply filters
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
        query = query.eq('registration_country', filters.country)
      }

      // Add efficient pagination and ordering
      query = query
        .order('created_at', { ascending: false })
        .range(page * rowsPerPage, (page + 1) * rowsPerPage - 1)

      const { data: usersData, error: usersError, count } = await query

      if (usersError) {
        throw new Error(`Failed to fetch users: ${usersError.message}`)
      }

      if (!usersData) {
        setUsers([])
        setTotalCount(0)
        return
      }

      // Get identity counts efficiently in batch
      const userIds = usersData.map(user => user.id)
      let identityCounts: { [key: string]: number } = {}

      if (userIds.length > 0) {
        const { data: identityData, error: identityError } = await supabase
          .from('kd_identity')
          .select('user_id')
          .in('user_id', userIds)

        if (!identityError && identityData) {
          identityData.forEach(identity => {
            identityCounts[identity.user_id] = (identityCounts[identity.user_id] || 0) + 1
          })
        }
      }

      // Transform users with calculated fields
      const transformedUsers = usersData.map(user => ({
        ...user,
        identity_count: identityCounts[user.id] || 0,
        country_display: user.registration_country || 'Unknown',
        registration_type: user.join_by_invitation ? 'Invited' : 'Direct',
        display_name: user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}` 
          : user.name || 'N/A'
      }))

      setUsers(transformedUsers)
      setTotalCount(count || 0)

      // Cache results for 2 minutes
      queryCache.set(cacheKey, { users: transformedUsers, totalCount: count || 0 }, 120000)
      
      console.log(`✅ Users loaded: ${transformedUsers.length} users (${count} total)`)
    } catch (error: any) {
      console.error('❌ Error loading users:', error)
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

// Hook for getting available filter options
export const useUserFilterOptions = () => {
  const [countries, setCountries] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const loadFilterOptions = useCallback(async () => {
    try {
      console.log('🔄 Loading filter options...')

      // Check cache first (10-minute cache for filter options)
      const cacheKey = 'user_filter_options'
      const cached = queryCache.get(cacheKey)
      if (cached) {
        console.log('⚡ Filter options loaded from cache')
        setCountries(cached.countries)
        setLoading(false)
        return
      }

      // Get unique countries efficiently
      const { data: countryData, error } = await supabase
        .from('kd_users')
        .select('registration_country')
        .not('registration_country', 'is', null)
        .neq('registration_country', '')

      if (!error && countryData) {
        const uniqueCountries = Array.from(
          new Set(countryData.map(item => item.registration_country).filter(Boolean))
        ).sort()

        setCountries(uniqueCountries)

        // Cache for 10 minutes
        queryCache.set(cacheKey, { countries: uniqueCountries }, 600000)
        console.log(`✅ Filter options loaded: ${uniqueCountries.length} countries`)
      }
    } catch (error: any) {
      console.error('❌ Error loading filter options:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFilterOptions()
  }, [loadFilterOptions])

  return { countries, loading, refetch: loadFilterOptions }
}

// Hook for getting detailed user with identities
export const useOptimizedUserDetails = (userId: string | null) => {
  const [userDetails, setUserDetails] = useState<any>(null)
  const [userIdentities, setUserIdentities] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadUserDetails = useCallback(async () => {
    if (!userId) return

    try {
      console.log(`🔄 Loading user details for ${userId}...`)
      setLoading(true)
      setError(null)

      // Check cache first (5-minute cache for user details)
      const cacheKey = `user_details_${userId}`
      const cached = queryCache.get(cacheKey)
      if (cached) {
        console.log('⚡ User details loaded from cache')
        setUserDetails(cached.userDetails)
        setUserIdentities(cached.userIdentities)
        setLoading(false)
        return
      }

      // Get user details and identities in parallel
      const [userResponse, identitiesResponse] = await Promise.all([
        supabase
          .from('kd_users')
          .select('*')
          .eq('id', userId)
          .single(),
        supabase
          .from('kd_identity')
          .select('*')
          .eq('user_id', userId)
      ])

      if (userResponse.error) {
        throw new Error(`Failed to fetch user: ${userResponse.error.message}`)
      }

      if (identitiesResponse.error) {
        console.warn('Error fetching identities:', identitiesResponse.error)
      }

      const userDetails = userResponse.data
      const userIdentities = identitiesResponse.data || []

      setUserDetails(userDetails)
      setUserIdentities(userIdentities)

      // Cache for 5 minutes
      queryCache.set(cacheKey, { userDetails, userIdentities }, 300000)
      
      console.log(`✅ User details loaded: ${userIdentities.length} identities`)
    } catch (error: any) {
      console.error('❌ Error loading user details:', error)
      setError(error.message || 'Failed to load user details')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadUserDetails()
  }, [loadUserDetails])

  return { userDetails, userIdentities, loading, error, refetch: loadUserDetails }
}

// Hook for user statistics
export const useUserStatistics = () => {
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
      console.log('🔄 Loading user statistics...')

      // Check cache first (5-minute cache for stats)
      const cacheKey = 'user_statistics'
      const cached = queryCache.get(cacheKey)
      if (cached) {
        console.log('⚡ User statistics loaded from cache')
        setStats(cached)
        setLoading(false)
        return
      }

      // Get all stats in parallel
      const [
        { count: totalUsers },
        { count: activeUsers },
        { count: adminUsers },
        { data: identityData }
      ] = await Promise.all([
        supabase.from('kd_users').select('*', { count: 'exact', head: true }),
        supabase.from('kd_users').select('*', { count: 'exact', head: true }).eq('active', true),
        supabase.from('kd_users').select('*', { count: 'exact', head: true }).eq('user_type', 5),
        supabase.from('kd_identity').select('user_id')
      ])

      // Calculate users with identities and average
      const uniqueUsersWithIdentities = new Set(identityData?.map(item => item.user_id) || []).size
      const avgIdentitiesPerUser = totalUsers && totalUsers > 0 
        ? (identityData?.length || 0) / totalUsers 
        : 0

      const statistics = {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        adminUsers: adminUsers || 0,
        usersWithIdentities: uniqueUsersWithIdentities,
        avgIdentitiesPerUser: Number(avgIdentitiesPerUser.toFixed(1))
      }

      setStats(statistics)

      // Cache for 5 minutes
      queryCache.set(cacheKey, statistics, 300000)
      console.log('✅ User statistics loaded successfully')
    } catch (error: any) {
      console.error('❌ Error loading user statistics:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  return { stats, loading, refetch: loadStats }
} 