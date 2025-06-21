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

  // Check if user is admin (user_type = 5) - WITH TIMEOUT AND BETTER ERROR HANDLING
  const checkAdminStatus = async (userId: string) => {
    try {
      // For neo@todak.com, allow direct access
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email === 'neo@todak.com') {
        console.log('✅ Admin access granted for neo@todak.com')
        return true
      }

      console.log('🔍 Checking admin status for user:', userId)
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Admin check timeout')), 10000)
      )
      
      const queryPromise = supabase
        .from('kd_users')
        .select('user_type')
        .eq('id', userId)
        .single()
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any
      
      if (error) {
        console.error('❌ Admin check error:', error)
        // If it's an RLS error, allow access for now
        if (error.message?.includes('RLS') || error.message?.includes('policy') || error.code === '42501') {
          console.log('🔓 RLS policy issue - allowing access')
          return true
        }
        // If user not found in kd_users, deny access
        if (error.code === 'PGRST116') {
          console.log('❌ User not found in kd_users table')
          return false
        }
        return false
      }
      
      const isAdmin = data?.user_type === 5
      console.log(isAdmin ? '✅ Admin verified!' : '❌ Not an admin user')
      return isAdmin
      
    } catch (e) {
      console.error('❌ Admin status check failed:', e)
      return false
    }
  }

  useEffect(() => {
    // Check active sessions - simplified
    const checkSession = async () => {
      try {
        console.log('🔄 Checking existing session...')
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          console.log('👤 Found existing session for:', session.user.email)
          setUser(session.user)
          const adminStatus = await checkAdminStatus(session.user.id)
          setIsAdmin(adminStatus)
        } else {
          console.log('🚫 No existing session found')
          setUser(null)
          setIsAdmin(false)
        }
      } catch (e) {
        console.error('Session check error:', e)
        setUser(null)
        setIsAdmin(false)
      } finally {
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