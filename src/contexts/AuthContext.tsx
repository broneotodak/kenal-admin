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

  // Check if user is admin (user_type = 5)
  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('kd_users')
        .select('user_type')
        .eq('id', userId)
        .single()
      
      if (!error && data) {
        return data.user_type === 5
      }
    } catch (e) {
      console.error('Error checking admin status:', e)
    }
    return false
  }

  useEffect(() => {
    // Check active sessions
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          setUser(session.user)
          const adminStatus = await checkAdminStatus(session.user.id)
          setIsAdmin(adminStatus)
        }
      } catch (e) {
        console.error('Session check error:', e)
      } finally {
        setLoading(false)
      }
    }
    
    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const adminStatus = await checkAdminStatus(session.user.id)
        setIsAdmin(adminStatus)
      } else {
        setIsAdmin(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.error('Sign in error:', error)
        throw error
      }
      
      // Check if user is admin after successful login
      if (data.user) {
        const adminStatus = await checkAdminStatus(data.user.id)
        if (!adminStatus) {
          // Sign out if not admin
          await supabase.auth.signOut()
          throw new Error('Access denied. Admin privileges required.')
        }
        setIsAdmin(true)
        // Navigate to dashboard
        window.location.href = '/dashboard'
      }
    } catch (e) {
      console.error('Login error:', e)
      throw e
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setIsAdmin(false)
      router.push('/login')
    } catch (e) {
      console.error('Sign out error:', e)
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