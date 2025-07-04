'use client'

import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  isSessionValid: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSessionValid, setIsSessionValid] = useState(true)
  const router = useRouter()
  const hasInitiallyChecked = useRef(false)
  const sessionRefreshInterval = useRef<NodeJS.Timeout | null>(null)
  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null)

  // Global cleanup function for all real-time subscriptions
  const globalCleanup = () => {
    console.log('🧹 Performing global cleanup...')
    
    // Clear session intervals
    if (sessionRefreshInterval.current) {
      clearInterval(sessionRefreshInterval.current)
      sessionRefreshInterval.current = null
    }
    
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current)
      sessionCheckInterval.current = null
    }
    
    // Remove all Supabase channels
    try {
      const channels = supabase.getChannels()
      channels.forEach(channel => {
        console.log('🗑️ Removing channel:', channel.topic)
        supabase.removeChannel(channel)
      })
      console.log(`✅ Cleaned up ${channels.length} real-time channels`)
    } catch (error) {
      console.warn('⚠️ Error during global cleanup:', error)
    }
  }

  // Session refresh function
  const refreshSession = async () => {
    try {
      console.log('🔄 Refreshing session...')
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('❌ Session refresh failed:', error)
        setIsSessionValid(false)
        
        // If refresh fails, user might need to re-login
        if (error.message?.includes('refresh_token_not_found') || 
            error.message?.includes('invalid_grant')) {
          console.log('🚪 Session expired, logging out...')
          await signOut()
        }
        return
      }
      
      if (data.session) {
        console.log('✅ Session refreshed successfully')
        setIsSessionValid(true)
        setUser(data.session.user)
      }
    } catch (error) {
      console.error('❌ Session refresh error:', error)
      setIsSessionValid(false)
    }
  }

  // Session validity checker
  const checkSessionValidity = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('❌ Session check error:', error)
        setIsSessionValid(false)
        return false
      }
      
      if (!session) {
        console.log('🚫 No active session found')
        setIsSessionValid(false)
        return false
      }
      
      // Check if session is close to expiry (within 5 minutes)
      const expiresAt = session.expires_at
      if (expiresAt) {
        const now = Math.floor(Date.now() / 1000)
        const timeUntilExpiry = expiresAt - now
        
        if (timeUntilExpiry < 300) { // Less than 5 minutes
          console.log('⏰ Session expiring soon, refreshing...')
          await refreshSession()
        } else {
          setIsSessionValid(true)
        }
      } else {
        setIsSessionValid(true)
      }
      
      return true
    } catch (error) {
      console.error('❌ Session validity check failed:', error)
      setIsSessionValid(false)
      return false
    }
  }

  // Setup session monitoring
  const setupSessionMonitoring = () => {
    // Check session validity every 2 minutes
    sessionCheckInterval.current = setInterval(() => {
      checkSessionValidity()
    }, 120000) // 2 minutes
    
    // Refresh session every 30 minutes as backup
    sessionRefreshInterval.current = setInterval(() => {
      refreshSession()
    }, 1800000) // 30 minutes
    
    console.log('✅ Session monitoring started')
  }

  // Safety mechanism: Force stop loading after maximum timeout
  useEffect(() => {
    const forceStopLoading = setTimeout(() => {
      if (loading) {
        console.warn('🚨 Auth loading timeout reached - forcing stop')
        setLoading(false)
        setUser(null)
        setIsAdmin(false)
      }
    }, 20000) // 20 second maximum timeout

    return () => clearTimeout(forceStopLoading)
  }, [loading])

  // Check if user is admin (user_type = 5) - WITH IMPROVED ERROR HANDLING
  const checkAdminStatus = async (userId: string): Promise<boolean> => {
    try {
      // For neo@todak.com, allow direct access - check both session and user parameter
      const { data: { session } } = await supabase.auth.getSession()
      const currentUserEmail = session?.user?.email
      
      console.log('🔍 Admin check for:', { userId, currentUserEmail })
      
      if (currentUserEmail === 'neo@todak.com') {
        console.log('✅ Admin access granted for neo@todak.com (special access)')
        return true
      }

      console.log('🔍 Checking admin status in database for user:', userId)
      
      // Shorter timeout for faster fallback
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Admin check timeout after 5s')), 5000)
      )
      
      const queryPromise = supabase
        .from('kd_users')
        .select('user_type, email')
        .eq('id', userId)
        .single()
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise])
      
      if (error) {
        console.error('❌ Admin check error:', error)
        
        // Handle specific error cases
        if (error.message?.includes('timeout')) {
          console.warn('⏰ Admin check timed out - checking if neo@todak.com')
          // Double-check for neo@todak.com in case of timeout
          if (currentUserEmail === 'neo@todak.com') {
            console.log('✅ Allowing neo@todak.com despite timeout')
            return true
          }
          return false
        }
        
        // If it's an RLS error, allow access for development
        if (error.message?.includes('RLS') || error.message?.includes('policy') || error.code === '42501') {
          console.log('🔓 RLS policy issue - checking if neo@todak.com')
          if (currentUserEmail === 'neo@todak.com') {
            console.log('✅ Allowing neo@todak.com despite RLS error')
            return true
          }
          return false
        }
        
        // If user not found in kd_users, check email
        if (error.code === 'PGRST116') {
          console.log('❌ User not found in kd_users table')
          if (currentUserEmail === 'neo@todak.com') {
            console.log('✅ Allowing neo@todak.com even though not in kd_users')
            return true
          }
          return false
        }
        
        // For other errors, still check for neo@todak.com
        console.warn('⚠️ Unknown error - checking if neo@todak.com')
        if (currentUserEmail === 'neo@todak.com') {
          console.log('✅ Allowing neo@todak.com despite unknown error')
          return true
        }
        return false
      }
      
      // Check if email matches neo@todak.com from database
      if (data?.email === 'neo@todak.com') {
        console.log('✅ Admin access granted for neo@todak.com (from database)')
        return true
      }
      
      const isAdmin = data?.user_type === 5
      console.log(isAdmin ? '✅ Admin verified!' : '❌ Not an admin user')
      return isAdmin
      
    } catch (e) {
      console.error('❌ Admin status check failed:', e)
      
      // Last resort - check session email again
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user?.email === 'neo@todak.com') {
          console.log('✅ Final fallback: Allowing neo@todak.com')
          return true
        }
      } catch {}
      
      console.log('🔒 Defaulting to non-admin access')
      return false
    }
  }

  useEffect(() => {
    // Prevent double execution in React StrictMode with improved ref handling
    if (hasInitiallyChecked.current) {
      console.log('🔄 Auth already initialized, skipping duplicate check')
      return
    }
    
    // Mark as checked immediately to prevent any race conditions
    hasInitiallyChecked.current = true

    // Check active sessions with timeout protection
    const checkSession = async () => {
      try {
        console.log('🔄 Checking existing session...')
        
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          console.log('👤 Found existing session for:', session.user.email)
          setUser(session.user)
          setIsSessionValid(true)
          
          // Check admin status with timeout protection
          try {
            const adminStatus = await checkAdminStatus(session.user.id)
            setIsAdmin(adminStatus)
            
            if (adminStatus) {
              // Setup session monitoring for admin users
              setupSessionMonitoring()
            }
            
            // For neo@todak.com, double-check admin status
            if (session.user.email === 'neo@todak.com' && !adminStatus) {
              console.warn('⚠️ neo@todak.com should be admin, retrying...')
              // Retry once after a short delay
              setTimeout(async () => {
                const retryStatus = await checkAdminStatus(session.user.id)
                if (retryStatus) {
                  console.log('✅ Admin status confirmed on retry')
                  setIsAdmin(true)
                  setupSessionMonitoring()
                }
              }, 500)
            }
          } catch (adminError) {
            console.warn('⚠️ Admin check failed, defaulting to false:', adminError)
            setIsAdmin(false)
          }
        } else {
          console.log('🚫 No existing session found')
          setUser(null)
          setIsAdmin(false)
          setIsSessionValid(false)
        }
        
      } catch (e) {
        console.error('🚨 Session check failed:', e)
        console.log('🔓 Falling back to logged-out state')
        setUser(null)
        setIsAdmin(false)
        setIsSessionValid(false)
      } finally {
        console.log('✅ Auth loading complete')
        setLoading(false)
      }
    }
    
    checkSession()

    // Listen for auth changes - simplified to prevent loops
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event, session?.user?.email)
      
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null)
        setIsAdmin(false)
        setIsSessionValid(false)
        globalCleanup()
        return
      }

      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        setIsSessionValid(true)
        
        // Add small delay to ensure session is fully established
        setTimeout(async () => {
          const adminStatus = await checkAdminStatus(session.user.id)
          setIsAdmin(adminStatus)
          
          if (adminStatus) {
            setupSessionMonitoring()
          }
        }, 100) // 100ms delay
      }
      
      if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('🔄 Token refreshed for:', session.user.email)
        setIsSessionValid(true)
      }
    })

    return () => {
      subscription.unsubscribe()
      globalCleanup()
    }
  }, []) // Empty dependency array to run only once

  // Simplified signIn - no automatic redirects
  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting login for:', email)
      console.log('🌍 Environment check:', {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        isProduction: process.env.NODE_ENV === 'production',
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'server'
      })
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.error('❌ Auth error:', error)
        console.error('❌ Auth error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        })
        throw error
      }
      
      console.log('✅ Authentication successful!')
      
      // Don't automatically redirect - let login page handle it
      if (data.user) {
        console.log('🔍 Verifying admin status...')
        const adminStatus = await checkAdminStatus(data.user.id)
        if (!adminStatus) {
          console.error('❌ Admin verification failed - signing out')
          await supabase.auth.signOut()
          throw new Error('Access denied. Admin privileges required.')
        }
        console.log('✅ Admin verification successful!')
        setUser(data.user) // Fix: Set the user object
        setIsAdmin(true)
        setIsSessionValid(true)
        
        // Setup session monitoring for new login
        setupSessionMonitoring()
      }
    } catch (e) {
      console.error('🚨 Login process failed:', e)
      throw e
    }
  }

  const signOut = async () => {
    try {
      console.log('🚪 Starting enhanced logout process...')
      
      // First, cleanup all real-time subscriptions and intervals
      globalCleanup()
      
      // Clear local auth state immediately
      setUser(null)
      setIsAdmin(false)
      setIsSessionValid(false)
      
      console.log('✅ Local auth state cleared')
      
      // Clear browser storage
      try {
        // Get all localStorage keys
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.includes('supabase') || key.includes('sb-'))) {
            keysToRemove.push(key)
          }
        }
        
        // Remove all Supabase-related keys
        keysToRemove.forEach(key => {
          localStorage.removeItem(key)
        })
        
        // Also clear sessionStorage
        sessionStorage.clear()
        
        // Clear cookies if any
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
        })
        
        console.log('✅ All auth storage cleared')
      } catch (storageError) {
        console.warn('⚠️ Storage clear error:', storageError)
      }
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('❌ Supabase signOut error:', error)
        // Don't throw - we've already cleaned up local state
      } else {
        console.log('✅ Supabase signOut successful')
      }
      
      // Additional cleanup - force remove any remaining channels
      setTimeout(() => {
        globalCleanup()
      }, 1000)
      
      // Force reload to clear any in-memory state and redirect
      if (typeof window !== 'undefined') {
        // Use replace to prevent back button issues
        window.location.replace('/login')
      } else {
        // Fallback for SSR
        router.push('/login')
      }
      
      console.log('✅ Enhanced logout process completed')
      
    } catch (e) {
      console.error('🚨 Logout process error:', e)
      // Even if signOut fails, we've already cleaned up local state
      globalCleanup()
      
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch {}
      
      // Force redirect
      window.location.replace('/login')
    }
  }

  const value = {
    user,
    loading,
    isAdmin,
    signIn,
    signOut,
    refreshSession,
    isSessionValid
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}