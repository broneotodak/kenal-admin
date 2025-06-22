import { COUNTRY_FLAGS, COUNTRY_NAMES, ELEMENTS } from './constants'

// ===== COUNTRY UTILITIES =====
export const getCountryFlag = (countryCode?: string): string => {
  if (!countryCode) return '🌍'
  return COUNTRY_FLAGS[countryCode as keyof typeof COUNTRY_FLAGS] || 
         COUNTRY_FLAGS[countryCode.toUpperCase() as keyof typeof COUNTRY_FLAGS] || 
         '🌍'
}

export const getCountryName = (countryCode?: string): string => {
  if (!countryCode) return 'Unknown'
  return COUNTRY_NAMES[countryCode as keyof typeof COUNTRY_NAMES] || 
         COUNTRY_NAMES[countryCode.toUpperCase() as keyof typeof COUNTRY_NAMES] || 
         countryCode
}

// ===== ELEMENT UTILITIES =====
export const getElementInfo = (element?: number) => {
  if (!element || !(element in ELEMENTS)) {
    return { name: 'Unknown', color: '#9E9E9E', symbol: '❓' }
  }
  return ELEMENTS[element as keyof typeof ELEMENTS]
}

export const getElementColor = (element?: number): string => {
  return getElementInfo(element).color
}

// ===== DATE UTILITIES =====
export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  }
  return dateObj.toLocaleDateString('en-US', options || defaultOptions)
}

export const formatTime = (date: string | Date, timezone: string = 'Asia/Kuala_Lumpur'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleTimeString('en-MY', { 
    timeZone: timezone,
    hour12: false 
  })
}

export const formatDateTime = (date: string | Date, timezone?: string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return `${formatDate(dateObj)} ${formatTime(dateObj, timezone)}`
}

// ===== CHART UTILITIES =====
export const createChartDataset = (
  label: string,
  data: number[],
  borderColor: string,
  backgroundColor?: string,
  options?: Partial<any>
) => ({
  label,
  data,
  borderColor,
  backgroundColor: backgroundColor || borderColor.replace(')', ', 0.1)').replace('rgb', 'rgba'),
  tension: 0.4,
  fill: true,
  pointRadius: 5,
  pointHoverRadius: 8,
  pointBackgroundColor: borderColor,
  pointBorderColor: '#fff',
  pointBorderWidth: 2,
  pointHoverBackgroundColor: borderColor,
  pointHoverBorderColor: '#fff',
  pointHoverBorderWidth: 3,
  ...options
})

// ===== GROWTH UTILITIES =====
export const calculateGrowthPercentage = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

export const formatGrowthPercentage = (growth: number): string => {
  return growth >= 0 ? `+${growth}%` : `${growth}%`
}

// ===== VALIDATION UTILITIES =====
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidDate = (date: string): boolean => {
  const dateObj = new Date(date)
  return !isNaN(dateObj.getTime())
}

// ===== STRING UTILITIES =====
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

export const capitalizeFirst = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export const getDisplayName = (user: { first_name?: string; last_name?: string; name?: string }): string => {
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`
  }
  return user.name || 'N/A'
}

// ===== ARRAY UTILITIES =====
export const groupBy = <T, K extends keyof any>(
  array: T[],
  getKey: (item: T) => K
): Record<K, T[]> => {
  return array.reduce((result, item) => {
    const key = getKey(item)
    if (!result[key]) {
      result[key] = []
    }
    result[key].push(item)
    return result
  }, {} as Record<K, T[]>)
}

export const uniqueBy = <T, K>(array: T[], getKey: (item: T) => K): T[] => {
  const seen = new Set<K>()
  return array.filter(item => {
    const key = getKey(item)
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

// ===== ERROR UTILITIES =====
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unexpected error occurred'
}

// ===== EXPORT UTILITIES =====
export const downloadCSV = (data: Record<string, any>[], filename: string): void => {
  if (typeof window === 'undefined' || data.length === 0) return
  
  const csvContent = [
    Object.keys(data[0]).join(','),
    ...data.map(row => Object.values(row).join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}

// ===== STORAGE UTILITIES =====
export const storage = {
  get: (key: string): string | null => {
    if (typeof window === 'undefined') return null
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  
  set: (key: string, value: string): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  },
  
  remove: (key: string): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error)
    }
  },
  
  clear: (): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.clear()
    } catch (error) {
      console.warn('Failed to clear localStorage:', error)
    }
  }
} 