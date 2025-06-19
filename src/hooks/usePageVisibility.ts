import { useState, useEffect } from 'react'

// Hook to detect page visibility changes (tab switching, minimizing, etc.)
export const usePageVisibility = () => {
  const [isVisible, setIsVisible] = useState(true)
  const [wasHidden, setWasHidden] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleVisibilityChange = () => {
      const visible = !document.hidden
      
      if (!visible) {
        // Tab became hidden
        setWasHidden(true)
      } else if (wasHidden) {
        // Tab became visible after being hidden
        console.log('🔄 Tab became visible again - refreshing data...')
      }
      
      setIsVisible(visible)
    }

    // Initial state
    setIsVisible(!document.hidden)

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Also listen for focus/blur events as backup
    window.addEventListener('focus', () => {
      if (wasHidden) {
        console.log('🔄 Window focused after being hidden - refreshing data...')
        setIsVisible(true)
      }
    })

    window.addEventListener('blur', () => {
      setWasHidden(true)
      setIsVisible(false)
    })

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', () => {})
      window.removeEventListener('blur', () => {})
    }
  }, [wasHidden])

  return { 
    isVisible, 
    wasHidden,
    // Reset the wasHidden flag after handling
    resetHiddenFlag: () => setWasHidden(false)
  }
} 