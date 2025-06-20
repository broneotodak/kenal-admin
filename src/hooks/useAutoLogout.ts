import { useEffect, useRef, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface UseAutoLogoutOptions {
  inactivityTimeout?: number // in minutes
  warningTime?: number // in minutes before logout
  onWarning?: () => void
  onLogout?: () => void
}

export const useAutoLogout = ({
  inactivityTimeout = 30, // 30 minutes default
  warningTime = 5, // 5 minutes warning
  onWarning,
  onLogout
}: UseAutoLogoutOptions = {}) => {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const isActiveRef = useRef<boolean>(true)

  // Convert minutes to milliseconds
  const inactivityMs = inactivityTimeout * 60 * 1000
  const warningMs = warningTime * 60 * 1000

  const logout = useCallback(async () => {
    try {
      console.log('🚪 Auto-logout: Logging out user due to inactivity')
      
      // Clear timeouts
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
      
      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Call custom logout handler
      onLogout?.()
      
      // Redirect to login
      router.push('/login')
      
      // Show notification (optional)
      if (typeof window !== 'undefined') {
        // You could integrate with a toast library here
        console.log('Session expired due to inactivity. Please login again.')
      }
      
    } catch (error) {
      console.error('Error during auto-logout:', error)
    }
  }, [router, onLogout])

  const showWarning = useCallback(() => {
    console.log('⚠️ Auto-logout: Warning user about impending logout')
    onWarning?.()
    
    // Set final timeout for actual logout
    timeoutRef.current = setTimeout(logout, warningMs)
  }, [logout, warningMs, onWarning])

  const resetTimeout = useCallback(() => {
    // Clear existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
    
    // Update last activity
    lastActivityRef.current = Date.now()
    
    // Set warning timeout (inactivity - warning time)
    const warningTimeoutMs = inactivityMs - warningMs
    warningTimeoutRef.current = setTimeout(showWarning, warningTimeoutMs)
  }, [inactivityMs, warningMs, showWarning])

  const handleActivity = useCallback(() => {
    if (!isActiveRef.current) return
    
    const now = Date.now()
    const timeSinceLastActivity = now - lastActivityRef.current
    
    // Only reset if enough time has passed (avoid excessive resets)
    if (timeSinceLastActivity > 1000) { // 1 second throttle
      resetTimeout()
    }
  }, [resetTimeout])

  const handleVisibilityChange = useCallback(() => {
    if (typeof document === 'undefined') return
    
    if (document.hidden) {
      // Page is hidden - pause auto-logout
      isActiveRef.current = false
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
    } else {
      // Page is visible - resume auto-logout
      isActiveRef.current = true
      resetTimeout()
    }
  }, [resetTimeout])

  // Check session validity
  const checkSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session) {
        console.log('🚪 Auto-logout: Invalid session detected, logging out')
        logout()
        return false
      }
      
      // Check if token is expired or close to expiry
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = session.expires_at || 0
      const timeUntilExpiry = expiresAt - now
      
      // If token expires in less than 5 minutes, logout
      if (timeUntilExpiry < 300) {
        console.log('🚪 Auto-logout: Session expiring soon, logging out')
        logout()
        return false
      }
      
      return true
    } catch (error) {
      console.error('Error checking session:', error)
      return false
    }
  }, [logout])

  // Set mounted state after hydration
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return

    // Don't run auto-logout on login page or other auth pages
    const currentPath = window.location.pathname
    if (currentPath.includes('/login') || currentPath.includes('/auth')) {
      return
    }

    // Set up activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Set up visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Check session periodically (every 5 minutes)
    const sessionCheckInterval = setInterval(checkSession, 5 * 60 * 1000)

    // Initial session check
    checkSession()

    // Start the timeout
    resetTimeout()

    // Cleanup function
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
      if (sessionCheckInterval) clearInterval(sessionCheckInterval)
    }
  }, [isMounted, handleActivity, handleVisibilityChange, checkSession, resetTimeout])

  // Manual reset function (can be called to extend session)
  const extendSession = useCallback(() => {
    console.log('🔄 Auto-logout: Session extended manually')
    resetTimeout()
  }, [resetTimeout])

  return {
    extendSession
  }
} 