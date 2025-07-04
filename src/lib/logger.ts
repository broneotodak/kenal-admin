/**
 * Logger utility for development
 * Automatically disabled in production environments
 */

const isDevelopment = process.env.NODE_ENV === 'development'
const isDebugEnabled = process.env.NEXT_PUBLIC_DEBUG === 'true'

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment || isDebugEnabled) {
      console.log(...args)
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors
    console.error(...args)
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment || isDebugEnabled) {
      console.warn(...args)
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment || isDebugEnabled) {
      console.info(...args)
    }
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment || isDebugEnabled) {
      console.debug(...args)
    }
  },
  
  group: (label: string) => {
    if (isDevelopment || isDebugEnabled) {
      console.group(label)
    }
  },
  
  groupEnd: () => {
    if (isDevelopment || isDebugEnabled) {
      console.groupEnd()
    }
  },
  
  table: (data: any) => {
    if (isDevelopment || isDebugEnabled) {
      console.table(data)
    }
  },
  
  time: (label: string) => {
    if (isDevelopment || isDebugEnabled) {
      console.time(label)
    }
  },
  
  timeEnd: (label: string) => {
    if (isDevelopment || isDebugEnabled) {
      console.timeEnd(label)
    }
  }
}

// Export a shorthand
export const log = logger.log 