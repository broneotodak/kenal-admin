'use client'

import { useEffect, useState, useRef, ReactNode } from 'react'
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Skeleton,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Button,
  ButtonGroup,
  Chip,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Tabs,
  Tab,
  Select,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Stack,
  LinearProgress,
  alpha,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link,
} from '@mui/material'
import { 
  People, 
  PersonAdd,
  TrendingUp,
  TrendingDown,
  Assessment,
  Group,
  Download,
  MoreVert,
  ZoomIn,
  ZoomOut,
  RestartAlt,
  Insights,
  AccountTree,
  Psychology,
  AttachMoney,
  Diversity3,
  Category,
  ChevronRight,
  Public,
  AdminPanelSettings,
  Male,
  Female,
  LocationOn,
  Timeline,
  PieChart,
  BarChart,
  ShowChart,
  TableChart,
  InfoOutlined,
  ExpandMore,
  SecurityOutlined,
  GroupsOutlined,
  EventNoteOutlined,
  BusinessCenterOutlined,
} from '@mui/icons-material'
import { supabase } from '@/lib/supabase'
import { useTheme as useThemeMode } from '@mui/material/styles'
import Chart from '@/components/Chart'
import { ELEMENTS, ELEMENT_NUMBER_TO_TYPE, getElementTypeFromNumber } from '@/lib/constants'
import { useBehavioralAnalytics } from '@/hooks/useBehavioralTracking'

// Types
interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

interface AnalyticsData {
  totalUsers: number
  todayRegistrations: number
  monthlyGrowthRate: number
  avgDailyRegistrations: number
  totalIdentities: number
  usersByElement: { [key: number]: number } // Indexed by element number (1-9)
  usersByCountry: { [key: string]: number }
  usersByGender: { [key: string]: number }
  usersByType: { admin: number, public: number }
  registrationTrends: Array<{
    date: string
    newUsers: number
    directRegistrations: number
    invitedRegistrations: number
    newIdentities: number
    revenue: number
  }>
  userCohorts: Array<{
    month: string
    users: number
  }>
  growthForecast: Array<{
    period: string
    projectedUsers: number
    growth: number
    method?: string
  }>
  advancedGrowthForecast?: Array<{
    period: string
    projectedUsers: number
    growth: number
    method: string
  }>
  totalDirectRegistrations: number
  totalInvitedRegistrations: number
}

interface ChartDataPoint {
  date: string
  newUsers: number
  directRegistrations: number
  invitedRegistrations: number
  newIdentities: number
  revenue: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

export default function AnalyticsPage() {
  const theme = useThemeMode()
  const isDarkMode = theme.palette.mode === 'dark'
  
  const [activeTab, setActiveTab] = useState(0)
  const [timeRange, setTimeRange] = useState('Last 30 Days')
  const [loading, setLoading] = useState(true)
  const hasInitiallyLoaded = useRef(false)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalUsers: 0,
    todayRegistrations: 0,
    monthlyGrowthRate: 0,
    avgDailyRegistrations: 0,
    totalIdentities: 0,
    usersByElement: {},
    usersByCountry: {},
    usersByGender: {},
    usersByType: { admin: 0, public: 0 },
    registrationTrends: [],
    userCohorts: [],
    growthForecast: [],
    totalDirectRegistrations: 0,
    totalInvitedRegistrations: 0
  })

  const [userGrowthData, setUserGrowthData] = useState({
    labels: [] as string[],
    datasets: [
      {
        label: 'Direct Registrations',
        data: [] as number[],
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Invited Registrations',
        data: [] as number[],
        borderColor: '#9C27B0',
        backgroundColor: 'rgba(156, 39, 176, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'New Identities',
        data: [] as number[],
        borderColor: '#FF9800',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  })

  const [userCohortData, setUserCohortData] = useState({
    labels: [] as string[],
    datasets: [{
      label: 'Monthly Registrations',
      data: [] as number[],
      backgroundColor: 'rgba(33, 150, 243, 0.8)',
    }]
  })

  // Behavioral analytics hook
  const { analytics: behavioralAnalytics, loading: behavioralLoading, refreshAnalytics } = useBehavioralAnalytics()

  const loadChartData = async (range: string) => {
    try {
      let startDate: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default fallback
      let periods: { start: Date, end: Date, label: string }[] = []

      const now = new Date()

      // Determine date range and grouping based on selection
      if (range === 'Last 30 Days') {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        // Daily grouping for last 30 days
        for (let i = 29; i >= 0; i--) {
          const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
          const dayStart = new Date(date)
          dayStart.setHours(0, 0, 0, 0)
          const dayEnd = new Date(date)
          dayEnd.setHours(23, 59, 59, 999)
          periods.push({
            start: dayStart,
            end: dayEnd,
            label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          })
        }
      } else if (range === 'Last 60 Days') {
        startDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
        // Daily grouping for last 60 days
        for (let i = 59; i >= 0; i--) {
          const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
          const dayStart = new Date(date)
          dayStart.setHours(0, 0, 0, 0)
          const dayEnd = new Date(date)
          dayEnd.setHours(23, 59, 59, 999)
          periods.push({
            start: dayStart,
            end: dayEnd,
            label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          })
        }
      } else if (range === 'Last 90 Days') {
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        // Weekly grouping for 90 days
        for (let i = 12; i >= 0; i--) {
          const weekStart = new Date(Date.now() - (i * 7 + 6) * 24 * 60 * 60 * 1000)
          weekStart.setHours(0, 0, 0, 0)
          const weekEnd = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000)
          weekEnd.setHours(23, 59, 59, 999)
          periods.push({
            start: weekStart,
            end: weekEnd,
            label: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          })
        }
      } else if (range === 'Last 6 Months') {
        startDate = new Date()
        startDate.setMonth(startDate.getMonth() - 6, 1)
        startDate.setHours(0, 0, 0, 0)
        // Monthly grouping for 6 months
        for (let i = 5; i >= 0; i--) {
          const monthStart = new Date()
          monthStart.setMonth(monthStart.getMonth() - i, 1)
          monthStart.setHours(0, 0, 0, 0)
          const monthEnd = new Date()
          monthEnd.setMonth(monthEnd.getMonth() - i + 1, 0)
          monthEnd.setHours(23, 59, 59, 999)
          periods.push({
            start: monthStart,
            end: monthEnd,
            label: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
          })
        }
      } else if (range === 'Last Year') {
        startDate = new Date()
        startDate.setFullYear(startDate.getFullYear() - 1)
        startDate.setMonth(0, 1)
        startDate.setHours(0, 0, 0, 0)
        // Monthly grouping for last year
        for (let i = 11; i >= 0; i--) {
          const monthStart = new Date()
          monthStart.setMonth(monthStart.getMonth() - i, 1)
          monthStart.setHours(0, 0, 0, 0)
          const monthEnd = new Date()
          monthEnd.setMonth(monthEnd.getMonth() - i + 1, 0)
          monthEnd.setHours(23, 59, 59, 999)
          periods.push({
            start: monthStart,
            end: monthEnd,
            label: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
          })
        }
      } else if (range === 'Lifetime') {
        // Get the earliest user registration date
        const { data: firstUser } = await supabase
          .from('kd_users')
          .select('created_at')
          .order('created_at', { ascending: true })
          .limit(1)
        
        if (firstUser && firstUser.length > 0) {
          startDate = new Date(firstUser[0].created_at)
        } else {
          startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Fallback to 1 year
        }
        
        // Monthly grouping for lifetime
        const monthsCount = Math.ceil((now.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000))
        for (let i = monthsCount - 1; i >= 0; i--) {
          const monthStart = new Date(now)
          monthStart.setMonth(monthStart.getMonth() - i, 1)
          monthStart.setHours(0, 0, 0, 0)
          const monthEnd = new Date(now)
          monthEnd.setMonth(monthEnd.getMonth() - i + 1, 0)
          monthEnd.setHours(23, 59, 59, 999)
          periods.push({
            start: monthStart,
            end: monthEnd,
            label: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
          })
        }
      }

      // Get users data for the time range
      const { data: users } = await supabase
        .from('kd_users')
        .select('created_at, join_by_invitation')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })

      // Get exact count of identities for the time range first
      const { count: totalIdentitiesInPeriod } = await supabase
        .from('kd_identity')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())
      
      // Get identities data for the time range (remove default 1000 limit)
      const { data: identities, error: identitiesError } = await supabase
        .from('kd_identity')
        .select('created_at, user_id')
        .gte('created_at', startDate.toISOString())
        .limit(50000) // Explicit high limit to get all identities
      
      console.log('Identities Query Debug:', {
        totalIdentitiesInPeriod,
        identitiesDataLength: identities?.length,
        identitiesError,
        startDate: startDate.toISOString(),
        range
      })

      // Process data for each period
      const dailyTrends: Array<{
        date: string
        newUsers: number
        directRegistrations: number
        invitedRegistrations: number
        newIdentities: number
        revenue: number
      }> = []
      const labels_array: string[] = []
      const directRegistrationsData: number[] = []
      const invitedRegistrationsData: number[] = []
      const newIdentitiesData: number[] = []

      periods.forEach(period => {
        labels_array.push(period.label)
        
        const usersInPeriod = users?.filter(u => {
          const userDate = new Date(u.created_at)
          return userDate >= period.start && userDate <= period.end
        }) || []
        
        const directUsers = usersInPeriod.filter(u => u.join_by_invitation === false).length
        const invitedUsers = usersInPeriod.filter(u => u.join_by_invitation === true).length
        
        const identitiesInPeriod = identities?.filter(i => {
          const identityDate = new Date(i.created_at)
          return identityDate >= period.start && identityDate <= period.end
        }).length || 0
        
        directRegistrationsData.push(directUsers)
        invitedRegistrationsData.push(invitedUsers)
        newIdentitiesData.push(identitiesInPeriod)
        
        dailyTrends.push({
          date: period.label,
          newUsers: directUsers + invitedUsers,
          directRegistrations: directUsers,
          invitedRegistrations: invitedUsers,
          newIdentities: identitiesInPeriod,
          revenue: 0
        })
      })

      // Calculate registration type totals for the selected period
      const totalDirectRegistrations = directRegistrationsData.reduce((sum, count) => sum + count, 0)
      const totalInvitedRegistrations = invitedRegistrationsData.reduce((sum, count) => sum + count, 0)
      const totalIdentitiesForPeriod = newIdentitiesData.reduce((sum, count) => sum + count, 0)
      
      // Use the accurate count from the count query (not limited by data retrieval)
      const finalIdentitiesCount = totalIdentitiesInPeriod || totalIdentitiesForPeriod

      console.log('Chart Data Totals:', {
        totalDirectRegistrations,
        totalInvitedRegistrations,
        totalIdentitiesForPeriod,
        actualIdentitiesReceived: identities?.length,
        totalIdentitiesInPeriod,
        finalIdentitiesCount,
        range
      })

      // Update chart data
      setUserGrowthData({
        labels: labels_array,
        datasets: [
          {
            label: 'Direct Registrations',
            data: directRegistrationsData,
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            tension: 0.4,
            fill: true,
          },
          {
            label: 'Invited Registrations',
            data: invitedRegistrationsData,
            borderColor: '#9C27B0',
            backgroundColor: 'rgba(156, 39, 176, 0.1)',
            tension: 0.4,
            fill: true,
          },
          {
            label: 'New Identities',
            data: newIdentitiesData,
            borderColor: '#FF9800',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            tension: 0.4,
            fill: true,
          }
        ]
      })

      // Generate advanced forecast using the dailyTrends data that's now available
      const generateAdvancedGrowthForecast = (currentUsers: number, recentGrowthData: typeof dailyTrends) => {
        if (!recentGrowthData || recentGrowthData.length < 7) {
          // Fallback to current simple forecast if insufficient data
          return []
        }

        // Calculate exponential moving average
        const alpha = 0.3
        let ema = recentGrowthData[0]?.newUsers || 0
        const emaValues = [ema]
        
        for (let i = 1; i < recentGrowthData.length; i++) {
          ema = alpha * recentGrowthData[i].newUsers + (1 - alpha) * ema
          emaValues.push(ema)
        }
        
        const currentEMA = emaValues[emaValues.length - 1]
        
        // Apply advanced projections with seasonality adjustment
        const forecasts: Array<{
          period: string
          projectedUsers: number
          growth: number
          method: string
        }> = []
        const periods = [
          { days: 30, label: '1 Month' },
          { days: 90, label: '3 Months' },
          { days: 180, label: '6 Months' },
          { days: 365, label: '12 Months' }
        ]
        
        periods.forEach(({ days, label }) => {
          const decayFactor = Math.pow(0.98, days / 30) // Progressive decay
          const seasonalMultiplier = 1 + Math.sin(Date.now() / (1000 * 60 * 60 * 24 * 365) * 2 * Math.PI) * 0.1 // Seasonal variation
          const projectedUsers = Math.round(currentUsers + (currentEMA * days * decayFactor * seasonalMultiplier))
          
          forecasts.push({
            period: label,
            projectedUsers: Math.max(currentUsers, projectedUsers),
            growth: Math.max(0, projectedUsers - currentUsers),
            method: 'Advanced'
          })
        })
        
        return forecasts
      }

      const currentTotalUsers = totalDirectRegistrations + totalInvitedRegistrations
      const advancedForecast = generateAdvancedGrowthForecast(currentTotalUsers, dailyTrends)

      // Update the analytics data with new totals and both forecast methods
      setAnalyticsData(prev => ({
        ...prev,
        totalDirectRegistrations,
        totalInvitedRegistrations,
        totalIdentities: finalIdentitiesCount, // Use the accurate count
        registrationTrends: dailyTrends,
        advancedGrowthForecast: advancedForecast
      }))

    } catch (error) {
      console.error('Error loading chart data:', error)
    }
  }

  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
      // Get basic user stats
      const { count: totalUsers } = await supabase
        .from('kd_users')
        .select('*', { count: 'exact', head: true })

      // Get today's registrations
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { count: todayRegistrations } = await supabase
        .from('kd_users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())

      // Get last 30 days data for basic analytics
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const { data: recentUsers } = await supabase
        .from('kd_users')
        .select('created_at, user_type, element_number, gender, registration_country, join_by_invitation')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true })

      // Calculate proper monthly growth rate (current month vs last month)
      const currentMonth = new Date()
      currentMonth.setDate(1)
      currentMonth.setHours(0, 0, 0, 0)
      
      const lastMonthStart = new Date(currentMonth)
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1)
      
      const lastMonthEnd = new Date(currentMonth)
      lastMonthEnd.setTime(lastMonthEnd.getTime() - 1)

      const { count: currentMonthUsers } = await supabase
        .from('kd_users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', currentMonth.toISOString())

      const { count: lastMonthUsers } = await supabase
        .from('kd_users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', lastMonthStart.toISOString())
        .lt('created_at', currentMonth.toISOString())

      const monthlyGrowthRate = lastMonthUsers && lastMonthUsers > 0 
        ? ((currentMonthUsers || 0) - lastMonthUsers) / lastMonthUsers * 100 
        : (currentMonthUsers || 0) > 0 ? 100 : 0

      // Get ALL users for segmentation analysis (not just last 30 days)
      const { data: allUsers } = await supabase
        .from('kd_users')
        .select('user_type, element_number, gender, registration_country')

      // Process user segmentation from ALL users
      // Initialize all element numbers (1-9) with 0 count
      const usersByElement: { [key: number]: number } = {
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0
      }
      const usersByCountry: { [key: string]: number } = {}
      const usersByGender: { [key: string]: number } = {}
      let adminCount = 0
      let publicCount = 0

      allUsers?.forEach(user => {
        // Element analysis - Count by individual element numbers
        if (user.element_number && user.element_number >= 1 && user.element_number <= 9) {
          usersByElement[user.element_number] = (usersByElement[user.element_number] || 0) + 1
        }
        
        // Country analysis
        if (user.registration_country) {
          usersByCountry[user.registration_country] = (usersByCountry[user.registration_country] || 0) + 1
        }
        
        // Gender analysis
        if (user.gender) {
          usersByGender[user.gender] = (usersByGender[user.gender] || 0) + 1
        }
        
        // User type analysis
        if (user.user_type === 5) {
          adminCount++
        } else {
          publicCount++
        }
      })

      // Generate user cohorts (last 6 months)
      const cohorts = []
      const cohortLabels = []
      const cohortData = []
      
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date()
        monthStart.setMonth(monthStart.getMonth() - i, 1)
        monthStart.setHours(0, 0, 0, 0)
        
        const monthEnd = new Date()
        monthEnd.setMonth(monthEnd.getMonth() - i + 1, 0)
        monthEnd.setHours(23, 59, 59, 999)
        
        const { count: monthlyUsers } = await supabase
          .from('kd_users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString())
        
        const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        cohortLabels.push(monthLabel)
        cohortData.push(monthlyUsers || 0)
        
        cohorts.push({
          month: monthLabel,
          users: monthlyUsers || 0
        })
      }

      // METHOD 1: Simple Growth Forecast with Market Saturation
      const generateSimpleGrowthForecast = (currentUsers: number, monthlyRate: number) => {
        // Cap extreme growth rates to prevent unrealistic projections
        const cappedRate = Math.min(Math.max(monthlyRate, -50), 30) // Cap between -50% and +30%
        
        // Calculate realistic projections with growth decay
        const forecasts: Array<{
          period: string
          projectedUsers: number
          growth: number
          method: string
        }> = []
        let currentProjection = currentUsers
        let workingRate = cappedRate
        
        // 1 Month - Use current rate with slight decay
        workingRate = workingRate * 0.95 // 5% decay factor
        currentProjection = Math.round(currentProjection * (1 + workingRate / 100))
        forecasts.push({
          period: '1 Month',
          projectedUsers: currentProjection,
          growth: currentProjection - currentUsers,
          method: 'Simple'
        })
        
        // 3 Months - Apply more decay and market saturation
        workingRate = cappedRate * 0.85 // 15% total decay from original
        const threeMonthUsers = Math.round(currentUsers + (currentProjection - currentUsers) * 2.5) // Linear-ish growth
        forecasts.push({
          period: '3 Months',
          projectedUsers: threeMonthUsers,
          growth: threeMonthUsers - currentUsers,
          method: 'Simple'
        })
        
        // 6 Months - Significant decay due to market saturation
        workingRate = cappedRate * 0.7 // 30% total decay
        const sixMonthUsers = Math.round(currentUsers + (currentProjection - currentUsers) * 4.5) // Slower growth
        forecasts.push({
          period: '6 Months',
          projectedUsers: sixMonthUsers,
          growth: sixMonthUsers - currentUsers,
          method: 'Simple'
        })
        
        // 12 Months - Very conservative with market saturation effects
        workingRate = cappedRate * 0.5 // 50% total decay
        const twelveMonthUsers = Math.round(currentUsers + (currentProjection - currentUsers) * 7) // Much slower growth
        forecasts.push({
          period: '12 Months',
          projectedUsers: twelveMonthUsers,
          growth: twelveMonthUsers - currentUsers,
          method: 'Simple'
        })
        
        return forecasts
      }

      // METHOD 2: Advanced Growth Forecast with Exponential Smoothing & Seasonality
      const generateAdvancedGrowthForecast = (currentUsers: number, recentGrowthData: any[]) => {
        if (!recentGrowthData || recentGrowthData.length < 7) {
          // Fallback to simple method if insufficient data
          return generateSimpleGrowthForecast(currentUsers, monthlyGrowthRate)
        }

        // Calculate exponential moving average
        const alpha = 0.3
        let ema = recentGrowthData[0]?.newUsers || 0
        const emaValues = [ema]
        
        for (let i = 1; i < recentGrowthData.length; i++) {
          ema = alpha * recentGrowthData[i].newUsers + (1 - alpha) * ema
          emaValues.push(ema)
        }
        
        const currentEMA = emaValues[emaValues.length - 1]
        const baselineGrowthRate = currentEMA / currentUsers * 100 * 30 // Monthly equivalent
        
        // Apply advanced projections with seasonality adjustment
        const forecasts: Array<{
          period: string
          projectedUsers: number
          growth: number
          method: string
        }> = []
        const periods = [
          { days: 30, label: '1 Month' },
          { days: 90, label: '3 Months' },
          { days: 180, label: '6 Months' },
          { days: 365, label: '12 Months' }
        ]
        
        periods.forEach(({ days, label }) => {
          const decayFactor = Math.pow(0.98, days / 30) // Progressive decay
          const seasonalMultiplier = 1 + Math.sin(Date.now() / (1000 * 60 * 60 * 24 * 365) * 2 * Math.PI) * 0.1 // Seasonal variation
          const projectedUsers = Math.round(currentUsers + (currentEMA * days * decayFactor * seasonalMultiplier))
          
          forecasts.push({
            period: label,
            projectedUsers: Math.max(currentUsers, projectedUsers),
            growth: Math.max(0, projectedUsers - currentUsers),
            method: 'Advanced'
          })
        })
        
        return forecasts
      }

      const simpleGrowthForecast = generateSimpleGrowthForecast(totalUsers || 0, monthlyGrowthRate)
      // Advanced forecast will be generated in loadChartData where dailyTrends is available

      setAnalyticsData({
        totalUsers: totalUsers || 0,
        todayRegistrations: todayRegistrations || 0,
        monthlyGrowthRate: Math.round(monthlyGrowthRate * 10) / 10,
        avgDailyRegistrations: Math.round((recentUsers?.length || 0) / 30),
        totalIdentities: 0, // Will be updated by loadChartData
        usersByElement,
        usersByCountry,
        usersByGender,
        usersByType: { admin: adminCount, public: publicCount },
        registrationTrends: [],
        userCohorts: cohorts,
        growthForecast: simpleGrowthForecast, // Will be updated with both methods in loadChartData
        totalDirectRegistrations: 0, // Will be updated by loadChartData
        totalInvitedRegistrations: 0 // Will be updated by loadChartData
      })

      setUserCohortData({
        labels: cohortLabels,
        datasets: [{
          label: 'Monthly registrations',
          data: cohortData,
          backgroundColor: 'rgba(33, 150, 243, 0.8)',
        }]
      })

    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (hasInitiallyLoaded.current) {
      return
    }
    
    const loadData = async () => {
      await loadAnalyticsData()
      await loadChartData(timeRange) // Load chart data immediately after analytics data
      hasInitiallyLoaded.current = true
    }
    loadData()
  }, []) // Only run on mount

  useEffect(() => {
    // Only load chart data when timeRange changes if initial load is complete
    if (hasInitiallyLoaded.current) {
      loadChartData(timeRange)
    }
  }, [timeRange])

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: isDarkMode ? '#fff' : '#000',
        }
      },
      tooltip: {
        backgroundColor: isDarkMode ? '#424242' : '#fff',
        titleColor: isDarkMode ? '#fff' : '#000',
        bodyColor: isDarkMode ? '#fff' : '#000',
        borderColor: isDarkMode ? '#616161' : '#e0e0e0',
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        grid: {
          color: isDarkMode ? '#424242' : '#e0e0e0',
        },
        ticks: {
          color: isDarkMode ? '#fff' : '#000',
        }
      },
      y: {
        grid: {
          color: isDarkMode ? '#424242' : '#e0e0e0',
        },
        ticks: {
          color: isDarkMode ? '#fff' : '#000',
        }
      }
    }
  }

  const barChartOptions = {
    ...chartOptions,
    scales: {
      x: {
        grid: {
          color: isDarkMode ? '#424242' : '#e0e0e0',
        },
        ticks: {
          color: isDarkMode ? '#fff' : '#000',
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: isDarkMode ? '#424242' : '#e0e0e0',
        },
        ticks: {
          color: isDarkMode ? '#fff' : '#000',
        }
      }
    }
  }

  // Stat Card Component
  const StatCard = ({ icon, title, subtitle, value, growth, color = 'primary' }: any) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" display="block">
                {subtitle}
              </Typography>
            )}
            {growth !== null && growth !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {growth.startsWith('+') ? (
                  <TrendingUp sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
                ) : (
                  <TrendingDown sx={{ color: 'error.main', fontSize: 16, mr: 0.5 }} />
                )}
                <Typography 
                  variant="body2" 
                  color={growth.startsWith('+') ? 'success.main' : 'error.main'}
                >
                  {growth}% vs last month
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          User Analytics
        </Typography>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Card>
                <CardContent>
                  <Skeleton height={60} />
                  <Skeleton height={40} />
                  <Skeleton height={20} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          User Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                     <FormControl size="small" sx={{ minWidth: 150 }}>
             <Select
               value={timeRange}
               onChange={(e) => setTimeRange(e.target.value)}
               displayEmpty
             >
               <MenuItem value="Last 30 Days">Last 30 Days</MenuItem>
               <MenuItem value="Last 60 Days">Last 60 Days</MenuItem>
               <MenuItem value="Last 90 Days">Last 90 Days</MenuItem>
               <MenuItem value="Last 6 Months">Last 6 Months</MenuItem>
               <MenuItem value="Last Year">Last Year</MenuItem>
               <MenuItem value="Lifetime">Lifetime</MenuItem>
             </Select>
           </FormControl>
          <IconButton>
            <BarChart />
          </IconButton>
          <IconButton>
            <TableChart />
          </IconButton>
        </Box>
      </Box>

      {/* Analytics Navigation Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<ShowChart />} label="USER GROWTH" />
          <Tab icon={<PieChart />} label="SEGMENTATION" />
          <Tab icon={<Psychology />} label="BEHAVIORAL" />
          <Tab icon={<AttachMoney />} label="FINANCIAL" />
          <Tab icon={<AccountTree />} label="IDENTITY NETWORK" />
          <Tab icon={<Category />} label="ELEMENT ANALYSIS" />
        </Tabs>
      </Paper>

      {/* USER GROWTH Tab */}
      <TabPanel value={activeTab} index={0}>
        {/* Key Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<People />}
              title="Total Users"
              value={analyticsData.totalUsers}
              growth={analyticsData.monthlyGrowthRate >= 0 ? `+${Math.abs(analyticsData.monthlyGrowthRate).toFixed(1)}` : `-${Math.abs(analyticsData.monthlyGrowthRate).toFixed(1)}`}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<PersonAdd />}
              title="Today's Registrations"
              value={analyticsData.todayRegistrations}
              growth={null} // No growth calculation for daily data
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<TrendingUp />}
              title="Monthly Growth"
              value={`${analyticsData.monthlyGrowthRate.toFixed(1)}%`}
              growth={null} // This IS the growth metric
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              icon={<Assessment />}
              title="Avg Daily Registrations"
              subtitle="Last 30 days"
              value={analyticsData.avgDailyRegistrations}
              growth={null} // Average over 30 days
              color="info"
            />
          </Grid>
        </Grid>

        {/* Registration Trends Chart */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    Registration Trends
                  </Typography>
                  <FormControl size="small">
                    <Select 
                      value={timeRange} 
                      onChange={(e) => setTimeRange(e.target.value)}
                      displayEmpty
                    >
                      <MenuItem value="Last 30 Days">Last 30 Days</MenuItem>
                      <MenuItem value="Last 60 Days">Last 60 Days</MenuItem>
                      <MenuItem value="Last 90 Days">Last 90 Days</MenuItem>
                      <MenuItem value="Last 6 Months">Last 6 Months</MenuItem>
                      <MenuItem value="Last Year">Last Year</MenuItem>
                      <MenuItem value="Lifetime">Lifetime</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                {/* Registration Type Summary */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, backgroundColor: '#4CAF50', borderRadius: '50%' }} />
                    <Typography variant="body2">
                      Direct: {analyticsData.totalDirectRegistrations}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, backgroundColor: '#9C27B0', borderRadius: '50%' }} />
                    <Typography variant="body2">
                      Invited: {analyticsData.totalInvitedRegistrations}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, backgroundColor: '#FF9800', borderRadius: '50%' }} />
                    <Typography variant="body2">
                      Identities: {analyticsData.totalIdentities}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                    Invitation Rate: {analyticsData.totalDirectRegistrations + analyticsData.totalInvitedRegistrations > 0 
                      ? Math.round((analyticsData.totalInvitedRegistrations / (analyticsData.totalDirectRegistrations + analyticsData.totalInvitedRegistrations)) * 100)
                      : 0}% ({timeRange})
                  </Typography>
                </Box>
                <Box sx={{ height: 400 }}>
                  <Chart data={userGrowthData} options={chartOptions} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* User Growth Forecast - Now under Registration Trends */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  🚀 User Growth Forecast (Two Methods)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Comparing simple vs. advanced forecasting methods based on {analyticsData.monthlyGrowthRate.toFixed(1)}% monthly growth rate
                </Typography>
                
                <Grid container spacing={3}>
                  {/* Method 1: Simple Forecast */}
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ bgcolor: alpha('#4CAF50', 0.05), border: '2px solid', borderColor: alpha('#4CAF50', 0.3) }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <SecurityOutlined sx={{ color: '#4CAF50' }} />
                          <Typography variant="h6" fontWeight="bold" sx={{ color: '#4CAF50' }}>
                            Method 1: Simple + Market Saturation
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Growth decay model with capped rates (95% → 85% → 70% → 50%)
                        </Typography>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Period</TableCell>
                              <TableCell align="right">Users</TableCell>
                              <TableCell align="right">Growth</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {analyticsData.growthForecast.map((forecast) => (
                              <TableRow key={forecast.period}>
                                <TableCell>{forecast.period}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                  {forecast.projectedUsers.toLocaleString()}
                                </TableCell>
                                <TableCell align="right">
                                  <Typography color="success.main" fontWeight="bold">
                                    +{forecast.growth.toLocaleString()}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Method 2: Advanced Forecast */}
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined" sx={{ bgcolor: alpha('#2196F3', 0.05), border: '2px solid', borderColor: alpha('#2196F3', 0.3) }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <Timeline sx={{ color: '#2196F3' }} />
                          <Typography variant="h6" fontWeight="bold" sx={{ color: '#2196F3' }}>
                            Method 2: Advanced + Seasonality
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Exponential smoothing with seasonality patterns from real data
                        </Typography>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Period</TableCell>
                              <TableCell align="right">Users</TableCell>
                              <TableCell align="right">Growth</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(analyticsData.advancedGrowthForecast || []).length > 0 ? (
                              analyticsData.advancedGrowthForecast!.map((forecast) => (
                                <TableRow key={forecast.period}>
                                  <TableCell>{forecast.period}</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                    {forecast.projectedUsers.toLocaleString()}
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography color="info.main" fontWeight="bold">
                                      +{forecast.growth.toLocaleString()}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={3} align="center">
                                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                    Advanced forecast calculating...
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Methodology Comparison */}
                <Accordion sx={{ mt: 3, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
                  <AccordionSummary
                    expandIcon={<ExpandMore />}
                    aria-controls="forecast-methodology-content"
                    id="forecast-methodology-header"
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <InfoOutlined color="primary" fontSize="small" />
                      <Typography variant="subtitle2" fontWeight="bold">
                        📊 Methodology Comparison & Future Financial Growth
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" fontWeight="bold" color="success.main" gutterBottom>
                          🟢 Simple Method Benefits:
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          • Easy to understand and explain<br/>
                          • Conservative estimates for safe planning<br/>
                          • Accounts for market saturation effects<br/>
                          • Good for investor presentations
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" fontWeight="bold" color="info.main" gutterBottom>
                          🔵 Advanced Method Benefits:
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          • Uses real historical patterns<br/>
                          • Includes seasonality adjustments<br/>
                          • More accurate for short-term planning<br/>
                          • Adapts to actual user behavior
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ 
                          p: 2, 
                          bgcolor: alpha('#FF9800', theme.palette.mode === 'dark' ? 0.15 : 0.1),
                          border: `1px solid ${alpha('#FF9800', theme.palette.mode === 'dark' ? 0.3 : 0.2)}`,
                          borderRadius: 1 
                        }}>
                          <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#FF9800', mb: 1 }}>
                            💰 Future Financial Growth Tracking
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            <strong>Note:</strong> These forecasts show <strong>User Growth</strong>. When monetization features are implemented, 
                            we'll add separate <strong>Financial Growth</strong> forecasts including revenue, subscription rates, and ARPU metrics 
                            alongside these user metrics for complete business intelligence.
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* User Cohorts */}
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              User Cohorts
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              User cohorts group users by when they registered (by month) to analyze registration patterns and trends over time. Each bar represents how many users joined KENAL in that specific month.
            </Typography>
            <Box sx={{ height: 300 }}>
              <Chart data={userCohortData} options={barChartOptions} />
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      {/* SEGMENTATION Tab */}
      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          {/* User Type Segmentation */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  User Type Distribution
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AdminPanelSettings color="primary" />
                      <Typography>Admin Users</Typography>
                    </Box>
                    <Typography fontWeight="bold">{analyticsData.usersByType.admin}</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(analyticsData.usersByType.admin / analyticsData.totalUsers) * 100} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Public color="success" />
                      <Typography>Public Users</Typography>
                    </Box>
                    <Typography fontWeight="bold">{analyticsData.usersByType.public}</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(analyticsData.usersByType.public / analyticsData.totalUsers) * 100} 
                    color="success"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Gender Distribution */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Gender Distribution
                </Typography>
                <Stack spacing={2}>
                  {Object.entries(analyticsData.usersByGender).map(([gender, count]) => (
                    <Box key={gender}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {gender === 'male' ? <Male color="primary" /> : <Female color="secondary" />}
                          <Typography>{gender.charAt(0).toUpperCase() + gender.slice(1)}</Typography>
                        </Box>
                        <Typography fontWeight="bold">{count}</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={(count / analyticsData.totalUsers) * 100} 
                        color={gender === 'male' ? 'primary' : 'secondary'}
                        sx={{ height: 8, borderRadius: 4, mt: 1 }}
                      />
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Countries */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Top Countries
                </Typography>
                <List>
                  {Object.entries(analyticsData.usersByCountry)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([country, count]) => (
                      <ListItem key={country} disablePadding>
                        <ListItemIcon>
                          <LocationOn />
                        </ListItemIcon>
                        <ListItemText 
                          primary={country} 
                          secondary={`${count} users`}
                        />
                        <Typography fontWeight="bold">
                          {((count / analyticsData.totalUsers) * 100).toFixed(1)}%
                        </Typography>
                      </ListItem>
                    ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Element Distribution */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Element Distribution
                </Typography>
                <Stack spacing={1}>
                  {Object.entries(analyticsData.usersByElement)
                    .sort(([a], [b]) => parseInt(a) - parseInt(b)) // Sort by element number
                    .map(([element, count]) => {
                      const elementNum = parseInt(element)
                      const elementType = ELEMENT_NUMBER_TO_TYPE[elementNum as keyof typeof ELEMENT_NUMBER_TO_TYPE]
                      const info = elementType ? ELEMENTS[elementType as keyof typeof ELEMENTS] : null
                      return (
                        <Box key={element} 
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            p: 1,
                            bgcolor: alpha(info?.color || '#9E9E9E', 0.1),
                            borderRadius: 1,
                            border: `1px solid ${alpha(info?.color || '#9E9E9E', 0.3)}`
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontSize: '1.2rem' }}>{info?.symbol || '❓'}</Typography>
                            <Typography>User with element {element} ({info?.name || 'Unknown'})</Typography>
                          </Box>
                          <Chip 
                            label={count} 
                            size="small" 
                            sx={{ 
                              bgcolor: info?.color || '#9E9E9E', 
                              color: 'white',
                              fontWeight: 'bold'
                            }} 
                          />
                        </Box>
                      )
                    })}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* BEHAVIORAL Tab */}
      <TabPanel value={activeTab} index={2}>
        {behavioralLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* User Journey Funnel */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">
                      kenal.com User Journey Funnel
                    </Typography>
                    <IconButton onClick={refreshAnalytics} size="small">
                      <RestartAlt />
                    </IconButton>
                  </Box>
                  
                  {behavioralAnalytics && (
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={2.4}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 2 }}>
                          <Typography variant="h5" fontWeight="bold">
                            {behavioralAnalytics.completionFunnel.registered}
                          </Typography>
                          <Typography variant="body2">
                            Registered
                          </Typography>
                          <Typography variant="caption">
                            100%
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={2.4}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'secondary.main', color: 'white', borderRadius: 2 }}>
                          <Typography variant="h5" fontWeight="bold">
                            {behavioralAnalytics.completionFunnel.hasElement}
                          </Typography>
                          <Typography variant="body2">
                            Has Element
                          </Typography>
                          <Typography variant="caption">
                            {((behavioralAnalytics.completionFunnel.hasElement / behavioralAnalytics.completionFunnel.registered) * 100).toFixed(1)}%
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={2.4}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.main', color: 'white', borderRadius: 2 }}>
                          <Typography variant="h5" fontWeight="bold">
                            {behavioralAnalytics.completionFunnel.hasProfile}
                          </Typography>
                          <Typography variant="body2">
                            Complete Profile
                          </Typography>
                          <Typography variant="caption">
                            {((behavioralAnalytics.completionFunnel.hasProfile / behavioralAnalytics.completionFunnel.registered) * 100).toFixed(1)}%
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={2.4}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.main', color: 'white', borderRadius: 2 }}>
                          <Typography variant="h5" fontWeight="bold">
                            {behavioralAnalytics.completionFunnel.hasIdentity}
                          </Typography>
                          <Typography variant="body2">
                            Created Identity
                          </Typography>
                          <Typography variant="caption">
                            {((behavioralAnalytics.completionFunnel.hasIdentity / behavioralAnalytics.completionFunnel.registered) * 100).toFixed(1)}%
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={2.4}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.main', color: 'white', borderRadius: 2 }}>
                          <Typography variant="h5" fontWeight="bold">
                            {behavioralAnalytics.completionFunnel.hasEngaged}
                          </Typography>
                          <Typography variant="body2">
                            Gave Feedback
                          </Typography>
                          <Typography variant="caption">
                            {((behavioralAnalytics.completionFunnel.hasEngaged / behavioralAnalytics.completionFunnel.registered) * 100).toFixed(1)}%
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Engagement Scoring */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    User Engagement Score
                  </Typography>
                  
                  {behavioralAnalytics && (
                    <Stack spacing={2}>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">🔥 Engaged (76-100)</Typography>
                          <Typography variant="body2" fontWeight="bold">{behavioralAnalytics.engagementScores.engaged}</Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={(behavioralAnalytics.engagementScores.engaged / behavioralAnalytics.totalUsers) * 100}
                          color="success"
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                      
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">⚡ Active (51-75)</Typography>
                          <Typography variant="body2" fontWeight="bold">{behavioralAnalytics.engagementScores.active}</Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={(behavioralAnalytics.engagementScores.active / behavioralAnalytics.totalUsers) * 100}
                          color="warning"
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                      
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">🌡️ Warm (26-50)</Typography>
                          <Typography variant="body2" fontWeight="bold">{behavioralAnalytics.engagementScores.warm}</Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={(behavioralAnalytics.engagementScores.warm / behavioralAnalytics.totalUsers) * 100}
                          color="info"
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                      
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">🧊 Cold (0-25)</Typography>
                          <Typography variant="body2" fontWeight="bold">{behavioralAnalytics.engagementScores.cold}</Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={(behavioralAnalytics.engagementScores.cold / behavioralAnalytics.totalUsers) * 100}
                          color="error"
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Element-Based Behavior */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Element-Based Behavior Patterns
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    How different element types behave on kenal.com
                  </Typography>
                  
                  {behavioralAnalytics && Object.keys(behavioralAnalytics.elementBehavior).length > 0 ? (
                    <Stack spacing={2}>
                      {Object.entries(behavioralAnalytics.elementBehavior).map(([elementName, data]) => {
                        const elementData = Object.values(ELEMENTS).find(e => e.name === elementName)
                        return (
                          <Box key={elementName} sx={{ 
                            p: 2, 
                            bgcolor: alpha(elementData?.color || '#9E9E9E', 0.1),
                            borderRadius: 2,
                            border: `1px solid ${alpha(elementData?.color || '#9E9E9E', 0.3)}`
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography sx={{ fontSize: '1.2rem' }}>{elementData?.symbol}</Typography>
                              <Typography variant="subtitle1" fontWeight="bold">{elementName}</Typography>
                              <Chip label={`${data.users} users`} size="small" />
                            </Box>
                            <Grid container spacing={1}>
                              <Grid item xs={4}>
                                <Typography variant="caption" color="text.secondary">Avg Identities</Typography>
                                <Typography variant="body2" fontWeight="bold">{data.avgIdentities}</Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="caption" color="text.secondary">Time to Identity</Typography>
                                <Typography variant="body2" fontWeight="bold">{data.avgTimeToIdentity}d</Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="caption" color="text.secondary">Engagement Rate</Typography>
                                <Typography variant="body2" fontWeight="bold">{data.engagementRate}%</Typography>
                              </Grid>
                            </Grid>
                          </Box>
                        )
                      })}
                    </Stack>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Category sx={{ fontSize: 40, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        No element behavior data available
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Time Patterns */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    User Journey Time Patterns
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Average time users take to complete key actions
                  </Typography>
                  
                  {behavioralAnalytics && (
                    <Stack spacing={3}>
                      <Box sx={{ textAlign: 'center', p: 3, bgcolor: 'action.hover', borderRadius: 2 }}>
                        <Typography variant="h4" fontWeight="bold" color="primary.main">
                          {behavioralAnalytics.timePatterns.avgTimeToIdentity}
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">Days</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Average time to first identity creation
                        </Typography>
                      </Box>
                      
                      <Box sx={{ textAlign: 'center', p: 3, bgcolor: 'action.hover', borderRadius: 2 }}>
                        <Typography variant="h4" fontWeight="bold" color="secondary.main">
                          {behavioralAnalytics.timePatterns.avgTimeToFeedback}
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">Days</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Average time to first feedback submission
                        </Typography>
                      </Box>
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Registration Trends */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Registration Trends (Last 30 Days)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Daily registration patterns showing direct vs invited signups
                  </Typography>
                  
                  {behavioralAnalytics && behavioralAnalytics.registrationTrends.length > 0 && (
                    <Box sx={{ height: 300 }}>
                      <Chart 
                        data={{
                          labels: behavioralAnalytics.registrationTrends.map(t => t.date),
                          datasets: [
                            {
                              label: 'Direct Registrations',
                              data: behavioralAnalytics.registrationTrends.map(t => t.direct),
                              borderColor: '#4CAF50',
                              backgroundColor: 'rgba(76, 175, 80, 0.2)',
                              tension: 0.4,
                              fill: true,
                            },
                            {
                              label: 'Invited Registrations',
                              data: behavioralAnalytics.registrationTrends.map(t => t.invited),
                              borderColor: '#9C27B0',
                              backgroundColor: 'rgba(156, 39, 176, 0.2)',
                              tension: 0.4,
                              fill: true,
                            }
                          ]
                        }}
                        options={chartOptions}
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* FINANCIAL Tab */}
      <TabPanel value={activeTab} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Financial Analytics
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Revenue insights and financial metrics coming soon...
                </Typography>
                <Box sx={{ mt: 3, p: 4, textAlign: 'center', bgcolor: 'action.hover', borderRadius: 2 }}>
                  <AttachMoney sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Financial analytics will include:
                  </Typography>
                  <List sx={{ mt: 2 }}>
                    <ListItem>
                      <ListItemText primary="• Revenue tracking" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="• Subscription metrics" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="• Payment analytics" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="• Financial forecasting" />
                    </ListItem>
                  </List>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* IDENTITY NETWORK Tab */}
      <TabPanel value={activeTab} index={4}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Identity Network Overview
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Identities Created
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {analyticsData.totalIdentities.toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Avg Identities per User
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {analyticsData.totalUsers > 0 
                      ? (analyticsData.totalIdentities / analyticsData.totalUsers).toFixed(1)
                      : '0'
                    }
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Identity network analysis shows the connections between users through shared identity patterns and mutual identities.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Network Analytics
                </Typography>
                <Box sx={{ mt: 3, p: 4, textAlign: 'center', bgcolor: 'action.hover', borderRadius: 2 }}>
                  <AccountTree sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Advanced network analysis coming soon...
                  </Typography>
                  <List sx={{ mt: 2 }}>
                    <ListItem>
                      <ListItemText primary="• Mutual identity connections" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="• Identity pattern analysis" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="• Network visualization" />
                    </ListItem>
                  </List>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* ELEMENT ANALYSIS Tab */}
      <TabPanel value={activeTab} index={5}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Element Analysis Overview
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Distribution and analysis of user elements across the platform
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  {Object.entries(analyticsData.usersByElement)
                    .sort(([a], [b]) => parseInt(a) - parseInt(b)) // Sort by element number
                    .map(([element, count]) => {
                      const elementNum = parseInt(element)
                      const elementType = ELEMENT_NUMBER_TO_TYPE[elementNum as keyof typeof ELEMENT_NUMBER_TO_TYPE]
                      const info = elementType ? ELEMENTS[elementType as keyof typeof ELEMENTS] : null
                      const percentage = ((count / analyticsData.totalUsers) * 100).toFixed(1)
                      
                      return (
                        <Grid item xs={12} sm={6} md={4} key={element}>
                          <Card 
                            variant="outlined"
                            sx={{ 
                              bgcolor: alpha(info?.color || '#9E9E9E', 0.1),
                              border: `2px solid ${alpha(info?.color || '#9E9E9E', 0.3)}`
                            }}
                          >
                            <CardContent sx={{ textAlign: 'center' }}>
                              <Typography sx={{ fontSize: '2rem', mb: 1 }}>
                                {info?.symbol || '❓'}
                              </Typography>
                              <Typography variant="h6" fontWeight="bold" gutterBottom>
                                Element {element} ({info?.name || 'Unknown'})
                              </Typography>
                              <Typography variant="h4" fontWeight="bold" color={info?.color || '#9E9E9E'}>
                                {count}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {percentage}% of users
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      )
                    })}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  )
}
