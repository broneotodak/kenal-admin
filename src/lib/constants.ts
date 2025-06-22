// ===== CACHE CONFIGURATION =====
export const CACHE_DURATIONS = {
  DASHBOARD_STATS: 5 * 60 * 1000,    // 5 minutes
  RECENT_USERS: 2 * 60 * 1000,       // 2 minutes  
  CHART_DATA: 10 * 60 * 1000,        // 10 minutes
  USER_DETAILS: 5 * 60 * 1000,       // 5 minutes
  FILTER_OPTIONS: 15 * 60 * 1000,    // 15 minutes
  DEFAULT: 5 * 60 * 1000              // 5 minutes default
} as const

// ===== TIMEOUT CONFIGURATION =====
export const TIMEOUTS = {
  DEFAULT_QUERY: 8000,     // 8 seconds
  LONG_QUERY: 10000,       // 10 seconds
  AUTH_CHECK: 10000,       // 10 seconds
  SESSION_CHECK: 5000      // 5 seconds
} as const

// ===== RETRY CONFIGURATION =====
export const RETRY_CONFIG = {
  MAX_RETRIES: 2,
  BACKOFF_BASE: 1000,      // 1 second base delay
  BACKOFF_MULTIPLIER: 2    // Exponential backoff
} as const

// ===== AUTO-LOGOUT CONFIGURATION =====
export const AUTO_LOGOUT = {
  INACTIVITY_TIMEOUT: 30,  // 30 minutes
  WARNING_TIME: 5,         // 5 minutes warning
  SESSION_CHECK_INTERVAL: 5 * 60 * 1000  // 5 minutes
} as const

// ===== PAGINATION DEFAULTS =====
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50, 100]
} as const

// ===== CHART COLORS =====
export const CHART_COLORS = {
  PRIMARY: '#3b82f6',
  SECONDARY: '#f97316', 
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  DIRECT_REGISTRATIONS: '#4CAF50',
  INVITED_REGISTRATIONS: '#9C27B0',
  USERS_WITH_IDENTITY: '#FF9800',
  NEW_USERS: '#3b82f6',
  USERS_WITH_IDENTITY_ALT: '#f97316'
} as const

// ===== UI CONSTANTS =====
export const UI = {
  DRAWER_WIDTH: 280,
  SKELETON_ANIMATION_SPEED: 'wave'
} as const

// ===== ELEMENT TYPES =====
export const ELEMENTS = {
  1: { name: 'Wood', color: '#059669', symbol: '🌳' },
  2: { name: 'Metal', color: '#4B5563', symbol: '⚡' },
  3: { name: 'Earth', color: '#D97706', symbol: '🏔️' },
  4: { name: 'Fire', color: '#DC2626', symbol: '🔥' },
  5: { name: 'Water', color: '#2563EB', symbol: '🌊' }
} as const

// ===== ELEMENT NUMBER TO TYPE MAPPING =====
// Based on element_style.json associatedNumbers
export const ELEMENT_NUMBER_TO_TYPE = {
  1: 2, // Metal
  2: 5, // Water  
  3: 4, // Fire
  4: 1, // Wood
  5: 3, // Earth
  6: 2, // Metal
  7: 5, // Water
  8: 4, // Fire
  9: 1  // Wood
} as const

// Helper function to get element type info from element number
export const getElementTypeFromNumber = (elementNumber: number) => {
  const elementType = ELEMENT_NUMBER_TO_TYPE[elementNumber as keyof typeof ELEMENT_NUMBER_TO_TYPE]
  return elementType ? ELEMENTS[elementType as keyof typeof ELEMENTS] : null
}

// ===== COUNTRY FLAGS =====
export const COUNTRY_FLAGS = {
  'US': '🇺🇸', 'USA': '🇺🇸', 'United States': '🇺🇸',
  'MY': '🇲🇾', 'Malaysia': '🇲🇾',
  'SG': '🇸🇬', 'Singapore': '🇸🇬',
  'ID': '🇮🇩', 'Indonesia': '🇮🇩',
  'TH': '🇹🇭', 'Thailand': '🇹🇭',
  'VN': '🇻🇳', 'Vietnam': '🇻🇳',
  'PH': '🇵🇭', 'Philippines': '🇵🇭',
  'CN': '🇨🇳', 'China': '🇨🇳',
  'JP': '🇯🇵', 'Japan': '🇯🇵',
  'KR': '🇰🇷', 'Korea': '🇰🇷', 'South Korea': '🇰🇷',
  'IN': '🇮🇳', 'India': '🇮🇳',
  'AU': '🇦🇺', 'Australia': '🇦🇺',
  'UK': '🇬🇧', 'GB': '🇬🇧', 'United Kingdom': '🇬🇧',
  'CA': '🇨🇦', 'Canada': '🇨🇦',
  'DE': '🇩🇪', 'Germany': '🇩🇪',
  'FR': '🇫🇷', 'France': '🇫🇷',
  'BR': '🇧🇷', 'Brazil': '🇧🇷',
  'MX': '🇲🇽', 'Mexico': '🇲🇽'
} as const

// ===== COUNTRY NAMES =====
export const COUNTRY_NAMES = {
  'US': 'United States', 'USA': 'United States',
  'MY': 'Malaysia',
  'SG': 'Singapore',
  'ID': 'Indonesia',
  'TH': 'Thailand',
  'VN': 'Vietnam',
  'PH': 'Philippines',
  'CN': 'China',
  'JP': 'Japan',
  'KR': 'South Korea', 'Korea': 'South Korea',
  'IN': 'India',
  'AU': 'Australia',
  'UK': 'United Kingdom', 'GB': 'United Kingdom',
  'CA': 'Canada',
  'DE': 'Germany',
  'FR': 'France',
  'BR': 'Brazil',
  'MX': 'Mexico'
} as const

// ===== TIME RANGES =====
export const TIME_RANGES = {
  '24hours': '24hours',
  '7days': '7days', 
  '12months': '12months'
} as const

// ===== USER TYPES =====
export const USER_TYPES = {
  ADMIN: 5,
  REGULAR: 1
} as const

// ===== REVENUE CONFIGURATION =====
export const REVENUE = {
  MOCK_TOTAL: 452808,
  MOCK_GROWTH: 15.2
} as const 