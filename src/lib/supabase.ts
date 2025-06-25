import { createClient } from '@supabase/supabase-js'

// Environment variable validation with helpful error messages
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error(`
    Missing NEXT_PUBLIC_SUPABASE_URL environment variable.
    
    Please create a .env.local file in your project root with:
    NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0a3V4YXR5Y2pxd3Zmamp3eHFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5MjExMTQsImV4cCI6MjA1ODQ5NzExNH0.howZlko9y3nnJRFe_c53MVxjNvET2nXjka8OCL4mUrA
    
    Get these values from your Supabase dashboard → Settings → API
  `)
}

if (!supabaseAnonKey) {
  throw new Error(`
    Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.
    
    Please create a .env.local file in your project root with:
    NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0a3V4YXR5Y2pxd3Zmamp3eHFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5MjExMTQsImV4cCI6MjA1ODQ5NzExNH0.howZlko9y3nnJRFe_c53MVxjNvET2nXjka8OCL4mUrA
    
    Get these values from your Supabase dashboard → Settings → API
  `)
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: {
      getItem: (key) => {
        if (typeof window !== 'undefined') {
          return window.localStorage.getItem(key)
        }
        return null
      },
      setItem: (key, value) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value)
        }
      },
      removeItem: (key) => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key)
        }
      },
    },
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
      'connection': 'keep-alive',
    },
  },
})

// Helper function to handle Supabase errors
export function handleSupabaseError(error: any) {
  console.error('Supabase Error:', error)
  
  // Common error patterns
  if (error?.message?.includes('JWT')) {
    console.error('Authentication issue - user may need to log in again')
    return 'Authentication expired. Please log in again.'
  }
  
  if (error?.message?.includes('row-level security') || error?.code === '42501') {
    console.error('RLS Policy issue - check Supabase RLS policies')
    return 'Access denied. Please check your permissions.'
  }
  
  if (error?.message?.includes('relation') && error?.message?.includes('does not exist')) {
    console.error('Table or relation does not exist')
    return 'Database configuration error.'
  }
  
  return error?.message || 'An unexpected error occurred'
}

// Debug function to check auth status
export async function checkAuthStatus() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  console.log('Auth Status:', {
    hasSession: !!session,
    hasUser: !!user,
    sessionError,
    userError,
    userId: user?.id,
    userEmail: user?.email,
  })
  
  return {
    isAuthenticated: !!session && !!user,
    session,
    user,
    error: sessionError || userError
  }
}

// Helper to refresh session if needed
export async function refreshSession() {
  const { data, error } = await supabase.auth.refreshSession()
  if (error) {
    console.error('Failed to refresh session:', error)
    return false
  }
  return true
}

// ===== PERFORMANCE OPTIMIZATIONS =====

// Utility function to add timeout to any Supabase query (excluding auth operations)
export const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 8000, skipForAuth: boolean = false): Promise<T> => {
  // Skip timeout for auth operations to prevent conflicts
  if (skipForAuth) {
    return promise
  }
  
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Query timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ])
}

// Safe query executor that doesn't interfere with auth
export const safeQuery = async <T>(queryFn: () => Promise<T>, options: { timeout?: number; skipAuth?: boolean } = {}): Promise<T> => {
  const { timeout = 8000, skipAuth = false } = options
  
  try {
    if (skipAuth) {
      // For auth operations, use the original promise without our timeout wrapper
      return await queryFn()
    } else {
      // For regular queries, use our optimization
      return await withTimeout(queryFn(), timeout)
    }
  } catch (error) {
    console.error('Query execution error:', error)
    throw error
  }
}

// Optimized query builder with automatic retries and error handling
export const createOptimizedQuery = () => {
  const retryQuery = async <T>(queryFn: () => Promise<T>, retries: number = 2): Promise<T> => {
    for (let i = 0; i <= retries; i++) {
      try {
        return await withTimeout(queryFn(), 10000)
      } catch (error) {
        if (i === retries) throw error
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
    throw new Error('Max retries exceeded')
  }
  
  return { retryQuery }
}

// Batch query utility for combining multiple queries (updated to handle Supabase builders)
export const batchQueries = async <T extends Record<string, any>>(
  queries: Record<string, () => any>
): Promise<T> => {
  const results = await Promise.allSettled(
    Object.entries(queries).map(async ([key, queryFn]) => {
      const queryBuilder = queryFn()
      // Execute the query if it's a Supabase builder
      const result = await withTimeout(queryBuilder, 8000)
      return [key, result]
    })
  )
  
  const batchResult = {} as T
  results.forEach((result, index) => {
    const [key] = Object.entries(queries)[index]
    if (result.status === 'fulfilled') {
      batchResult[key as keyof T] = result.value[1] as any
    } else {
      console.error(`Query ${key} failed:`, result.reason)
      batchResult[key as keyof T] = undefined as any
    }
  })
  
  return batchResult
}

// Memoization utility for expensive queries
export const createQueryCache = () => {
  const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  
  const get = (key: string): any | null => {
    const cached = cache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }
    cache.delete(key)
    return null
  }
  
  const set = (key: string, data: any, ttlMs: number = 300000): void => { // 5 min default
    cache.set(key, { data, timestamp: Date.now(), ttl: ttlMs })
  }
  
  const clear = (): void => {
    cache.clear()
  }
  
  return { get, set, clear }
}

// Global query cache instance
export const queryCache = createQueryCache()

// Optimized paginated query with caching (simplified version without type issues)
export const createPaginatedQuery = (
  tableName: string,
  selectFields: string = '*',
  cacheKey?: string,
  cacheTtl: number = 300000
) => {
  return async (
    page: number = 0,
    limit: number = 10,
    filters?: Record<string, any>,
    orderBy?: { column: string; ascending?: boolean }
  ) => {
    try {
      const cacheKeyWithParams = `${cacheKey || tableName}_${page}_${limit}_${JSON.stringify(filters)}_${JSON.stringify(orderBy)}`
      
      // Check cache first
      if (cacheKey) {
        const cached = queryCache.get(cacheKeyWithParams)
        if (cached) {
          console.log(`Cache hit for ${cacheKeyWithParams}`)
          return cached
        }
      }
      
      // Execute query with timeout
      const executeQuery = async () => {
        let query = supabase
          .from(tableName)
          .select(selectFields, { count: 'exact' })
          .range(page * limit, (page + 1) * limit - 1)
        
        // Apply filters
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              query = query.eq(key, value)
            }
          })
        }
        
        // Apply ordering
        if (orderBy) {
          query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true })
        }
        
        return query
      }
      
      const result = await withTimeout(executeQuery(), 8000)
      
      // Cache result
      if (cacheKey && !result.error) {
        queryCache.set(cacheKeyWithParams, result, cacheTtl)
      }
      
      return result
    } catch (error) {
      console.error(`Paginated query error for ${tableName}:`, error)
      return { data: [], count: 0, error }
    }
  }
}
