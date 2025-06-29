'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

// Type declaration for browser Notification API
declare global {
  interface Window {
    Notification: {
      new(title: string, options?: NotificationOptions): Notification
      permission: NotificationPermission
      requestPermission(): Promise<NotificationPermission>
    }
  }
}
import { 
  Snackbar, 
  Alert, 
  AlertColor, 
  IconButton, 
  Slide, 
  SlideProps,
  Box,
  Typography,
  Button
} from '@mui/material'
import { Close, CheckCircle, Error, Warning, Info } from '@mui/icons-material'

export interface NotificationItem {
  id: string
  type: AlertColor
  title: string
  message: string
  timestamp: Date
  read: boolean
  persistent?: boolean
  action?: {
    label: string
    onClick: () => void
  }
  category: 'growth' | 'system' | 'reports' | 'user' | 'error'
}

interface ToastNotification {
  id: string
  type: AlertColor
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface NotificationContextType {
  // Toast notifications
  showToast: (type: AlertColor, message: string, duration?: number, action?: { label: string, onClick: () => void }) => void
  
  // Browser notifications
  requestPermission: () => Promise<boolean>
  showBrowserNotification: (title: string, message: string, options?: NotificationOptions) => void
  
  // In-app notifications
  notifications: NotificationItem[]
  unreadCount: number
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotification: (id: string) => void
  clearAllNotifications: () => void
  
  // Settings integration
  settings: {
    growthAlerts: boolean
    systemAlerts: boolean
    weeklyReports: boolean
    soundEnabled: boolean
    browserNotifications: boolean
  }
  updateSettings: (newSettings: Partial<NotificationContextType['settings']>) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  // Toast state
  const [toasts, setToasts] = useState<ToastNotification[]>([])
  const [currentToast, setCurrentToast] = useState<ToastNotification | null>(null)
  
  // In-app notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  
  // Settings
  const [settings, setSettings] = useState({
    growthAlerts: true,
    systemAlerts: true,
    weeklyReports: false,
    soundEnabled: false,
    browserNotifications: false
  })

  // Load settings and notifications from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('kenal-notification-settings')
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (error) {
        console.error('Error loading notification settings:', error)
      }
    }

    const savedNotifications = localStorage.getItem('kenal-notifications')
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications)
        setNotifications(parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        })))
      } catch (error) {
        console.error('Error loading notifications:', error)
      }
    }
  }, [])

  // Save notifications to localStorage
  useEffect(() => {
    localStorage.setItem('kenal-notifications', JSON.stringify(notifications))
  }, [notifications])

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('kenal-notification-settings', JSON.stringify(settings))
  }, [settings])

  // Toast management
  const showToast = useCallback((
    type: AlertColor, 
    message: string, 
    duration = 6000,
    action?: { label: string, onClick: () => void }
  ) => {
    const id = Date.now().toString()
    const newToast: ToastNotification = { id, type, message, duration, action }
    
    setToasts(prev => [...prev, newToast])
    
    if (!currentToast) {
      setCurrentToast(newToast)
    }
  }, [currentToast])

  // Process toast queue
  useEffect(() => {
    if (!currentToast && toasts.length > 0) {
      setCurrentToast(toasts[0])
      setToasts(prev => prev.slice(1))
    }
  }, [currentToast, toasts])

  const closeToast = () => {
    setCurrentToast(null)
  }

  // Browser notifications
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      return false
    }

    const permission = await Notification.requestPermission()
    const granted = permission === 'granted'
    
    setSettings(prev => ({ ...prev, browserNotifications: granted }))
    return granted
  }, [])

  const showBrowserNotification = useCallback((
    title: string, 
    message: string, 
    options: NotificationOptions = {}
  ) => {
    // Browser notifications disabled for build compatibility
    console.log('Browser notification (disabled):', title, message)
    return
  }, [settings.browserNotifications, settings.soundEnabled])

  // In-app notifications
  const addNotification = useCallback((notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    // Check if this type of notification is enabled
    const isEnabled = 
      (notification.category === 'growth' && settings.growthAlerts) ||
      (notification.category === 'system' && settings.systemAlerts) ||
      (notification.category === 'reports' && settings.weeklyReports) ||
      (notification.category === 'user') ||
      (notification.category === 'error')

    if (!isEnabled) return

    const newNotification: NotificationItem = {
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
      ...notification
    }

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]) // Keep max 50 notifications

    // Show toast for immediate feedback
    showToast(notification.type, notification.message)

    // Show browser notification for important alerts
    if (['error', 'warning'].includes(notification.type) || notification.category === 'growth') {
      showBrowserNotification(notification.title, notification.message)
    }
  }, [settings, showToast, showBrowserNotification])

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const updateSettings = useCallback((newSettings: Partial<NotificationContextType['settings']>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }, [])

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length

  // Demo notifications for testing
  useEffect(() => {
    const hasShownDemo = localStorage.getItem('kenal-demo-notifications-shown')
    if (!hasShownDemo) {
      setTimeout(() => {
        addNotification({
          type: 'success',
          title: 'Welcome to KENAL Admin',
          message: 'Notification system is now active!',
          category: 'system'
        })
        localStorage.setItem('kenal-demo-notifications-shown', 'true')
      }, 2000)
    }
  }, [addNotification])

  const value: NotificationContextType = {
    showToast,
    requestPermission,
    showBrowserNotification,
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    settings,
    updateSettings
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Toast Snackbar */}
      <Snackbar
        open={!!currentToast}
        autoHideDuration={currentToast?.duration || 6000}
        onClose={closeToast}
        TransitionComponent={SlideTransition}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={closeToast}
          severity={currentToast?.type || 'info'}
          variant="filled"
          sx={{ 
            width: '100%',
            minWidth: 300,
            '& .MuiAlert-action': {
              alignItems: 'center'
            }
          }}
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {currentToast?.action && (
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => {
                    currentToast.action?.onClick()
                    closeToast()
                  }}
                >
                  {currentToast.action.label}
                </Button>
              )}
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={closeToast}
              >
                <Close fontSize="small" />
              </IconButton>
            </Box>
          }
        >
          {currentToast?.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  )
}

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

// Utility functions for common notification types
export const createNotificationHelpers = (context: NotificationContextType) => ({
  success: (message: string, action?: { label: string, onClick: () => void }) => {
    context.showToast('success', message, 4000, action)
  },
  
  error: (message: string, action?: { label: string, onClick: () => void }) => {
    context.showToast('error', message, 8000, action)
  },
  
  warning: (message: string, action?: { label: string, onClick: () => void }) => {
    context.showToast('warning', message, 6000, action)
  },
  
  info: (message: string, action?: { label: string, onClick: () => void }) => {
    context.showToast('info', message, 5000, action)
  },

  growthAlert: (title: string, message: string, userCount: number) => {
    context.addNotification({
      type: 'success',
      title,
      message,
      category: 'growth',
      action: {
        label: 'View Analytics',
        onClick: () => window.location.href = '/analytics'
      }
    })
  },

  systemAlert: (title: string, message: string, severity: AlertColor = 'info') => {
    context.addNotification({
      type: severity,
      title,
      message,
      category: 'system'
    })
  }
}) 