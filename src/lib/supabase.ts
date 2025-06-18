import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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
