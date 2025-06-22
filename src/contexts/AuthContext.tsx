'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

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
      // For neo@todak.com, allow direct access
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email === 'neo@todak.com') {
        console.log('✅ Admin access granted for neo@todak.com')
        return true
      }

      console.log('🔍 Checking admin status for user:', userId)
      
      // Shorter timeout for faster fallback
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Admin check timeout after 5s')), 5000)
      )
      
      const queryPromise = supabase
        .from('kd_users')
        .select('user_type')
        .eq('id', userId)
        .single()
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise])
      
      if (error) {
        console.error('❌ Admin check error:', error)
        
        // Handle specific error cases
        if (error.message?.includes('timeout')) {
          console.warn('⏰ Admin check timed out - denying access for safety')
          return false
        }
        
        // If it's an RLS error, allow access for development
        if (error.message?.includes('RLS') || error.message?.includes('policy') || error.code === '42501') {
          console.log('🔓 RLS policy issue - allowing access (dev mode)')
          return true
        }
        
        // If user not found in kd_users, deny access
        if (error.code === 'PGRST116') {
          console.log('❌ User not found in kd_users table')
          return false
        }
        
        // For other errors, deny access for safety
        console.warn('⚠️ Unknown error - denying access for safety')
        return false
      }
      
      const isAdmin = data?.user_type === 5
      console.log(isAdmin ? '✅ Admin verified!' : '❌ Not an admin user')
      return isAdmin
      
    } catch (e) {
      console.error('❌ Admin status check failed:', e)
      console.log('🔒 Defaulting to non-admin access')
      return false
    }
  }

  useEffect(() => {
    // Check active sessions with timeout protection
    const checkSession = async () => {
      try {
        console.log('🔄 Checking existing session...')
        
        // Add overall timeout for the entire session check
        const sessionCheckPromise = new Promise(async (resolve, reject) => {
          try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          console.log('👤 Found existing session for:', session.user.email)
          setUser(session.user)
              
              // Check admin status with timeout protection
              try {
          const adminStatus = await checkAdminStatus(session.user.id)
          setIsAdmin(adminStatus)
                resolve(true)
              } catch (adminError) {
                console.warn('⚠️ Admin check failed, defaulting to false:', adminError)
                setIsAdmin(false)
                resolve(true)
              }
        } else {
          console.log('🚫 No existing session found')
          setUser(null)
          setIsAdmin(false)
              resolve(true)
            }
          } catch (sessionError) {
            reject(sessionError)
          }
        })
        
        // Add 15-second timeout for the entire session check
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 15000)
        )
        
        await Promise.race([sessionCheckPromise, timeoutPromise])
        
      } catch (e) {
        console.error('🚨 Session check failed:', e)
        console.log('🔓 Falling back to logged-out state')
        setUser(null)
        setIsAdmin(false)
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
        return
      }

      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)
        const adminStatus = await checkAdminStatus(session.user.id)
        setIsAdmin(adminStatus)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

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
        setIsAdmin(true)
      }
    } catch (e) {
      console.error('🚨 Login process failed:', e)
      throw e
    }
  }

  const signOut = async () => {
    try {
      console.log('🚪 Starting logout process...')
      
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('❌ Supabase signOut error:', error)
        throw error
      }
      
      console.log('✅ Supabase signOut successful')
      
      // Clear local auth state
      setUser(null)
      setIsAdmin(false)
      
      console.log('✅ Local auth state cleared')
      
      // Clear any cached auth data from browser storage
      try {
        localStorage.removeItem('sb-etkuxatycjqwvfjjwxqm-auth-token')
        sessionStorage.clear()
        console.log('✅ Browser storage cleared')
      } catch (storageError) {
        console.warn('⚠️ Could not clear storage:', storageError)
      }
      
      // Navigate to login
      router.push('/login')
      console.log('✅ Redirected to login')
      
    } catch (e) {
      console.error('🚨 Complete logout process failed:', e)
      // Even if signOut fails, clear local state and redirect
      setUser(null)
      setIsAdmin(false)
      
      // Clear storage as fallback
      try {
        localStorage.clear()
        sessionStorage.clear()
        console.log('✅ Fallback storage clear completed')
      } catch (storageError) {
        console.warn('⚠️ Fallback storage clear failed:', storageError)
      }
      
      router.push('/login')
    }
  }

  const value = {
    user,
    loading,
    isAdmin,
    signIn,
    signOut
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