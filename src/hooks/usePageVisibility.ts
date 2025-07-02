import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'

// Hook to detect page visibility changes (tab switching, minimizing, etc.)
export const usePageVisibility = () => {
  const [isVisible, setIsVisible] = useState(true)
  const [wasHidden, setWasHidden] = useState(false)
  const { refreshSession, isSessionValid, user } = useAuth()
  const lastHiddenTime = useRef<number>(0)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleVisibilityChange = async () => {
      const visible = !document.hidden
      
      if (!visible) {
        // Tab became hidden - record the time
        lastHiddenTime.current = Date.now()
        setWasHidden(true)
        console.log('👁️ Tab hidden, recording time for session management')
      } else if (wasHidden && user) {
        // Tab became visible after being hidden
        const hiddenDuration = Date.now() - lastHiddenTime.current
        const hiddenMinutes = Math.floor(hiddenDuration / (1000 * 60))
        
        console.log(`🔄 Tab visible again after ${hiddenMinutes} minutes`)
        
        // If hidden for more than 5 minutes, refresh session proactively
        if (hiddenDuration > 300000) { // 5 minutes
          console.log('⏰ Extended AFK detected, refreshing session...')
          
          // Clear any existing refresh timeout
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current)
            refreshTimeoutRef.current = null
          }
          
          // Refresh session with a small delay to ensure proper reconnection
          refreshTimeoutRef.current = setTimeout(async () => {
            try {
              await refreshSession()
              console.log('✅ Session refreshed after AFK return')
            } catch (error) {
              console.error('❌ Session refresh failed after AFK:', error)
            }
          }, 1000)
        }
        
        // If session is invalid, force refresh
        if (!isSessionValid) {
          console.log('⚠️ Invalid session detected on return, forcing refresh...')
          try {
            await refreshSession()
          } catch (error) {
            console.error('❌ Force session refresh failed:', error)
          }
        }
      }
      
      setIsVisible(visible)
    }

    // Initial state
    setIsVisible(!document.hidden)

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Also listen for focus/blur events as backup
    const handleFocus = async () => {
      if (wasHidden && user) {
        const hiddenDuration = Date.now() - lastHiddenTime.current
        const hiddenMinutes = Math.floor(hiddenDuration / (1000 * 60))
        
        console.log(`🔄 Window focused after ${hiddenMinutes} minutes AFK`)
        
        // Refresh session if hidden for extended period or session is invalid
        if (hiddenDuration > 300000 || !isSessionValid) {
          console.log('🔄 Refreshing session on focus return...')
          try {
            await refreshSession()
          } catch (error) {
            console.error('❌ Session refresh on focus failed:', error)
          }
        }
        
        setIsVisible(true)
      }
    }

    const handleBlur = () => {
      lastHiddenTime.current = Date.now()
      setWasHidden(true)
      setIsVisible(false)
      console.log('👁️ Window lost focus, starting AFK timer')
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
      
      // Clear any pending refresh timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
        refreshTimeoutRef.current = null
      }
    }
  }, [wasHidden, refreshSession, isSessionValid, user])

  return { 
    isVisible, 
    wasHidden,
    // Reset the wasHidden flag after handling
    resetHiddenFlag: () => setWasHidden(false),
    // New utility functions
    getAFKDuration: () => {
      if (!lastHiddenTime.current) return 0
      return Date.now() - lastHiddenTime.current
    },
    getAFKMinutes: () => {
      if (!lastHiddenTime.current) return 0
      return Math.floor((Date.now() - lastHiddenTime.current) / (1000 * 60))
    }
  }
} 