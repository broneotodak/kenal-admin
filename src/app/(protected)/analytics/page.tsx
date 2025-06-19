'use client'

import { useEffect, useState, useRef } from 'react'
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
} from '@mui/icons-material'
import { supabase } from '@/lib/supabase'
import { useTheme as useThemeMode } from '@mui/material/styles'
import { Chart } from '@/components/Chart'

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
  usersByElement: { [key: number]: number }
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
  const chartRef = useRef<any>(null)
  
  const [activeTab, setActiveTab] = useState(0)
  const [timeRange, setTimeRange] = useState('Last 30 Days')
  const [loading, setLoading] = useState(true)
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

  // Element information
  const elementInfo = {
    1: { name: 'Fire', color: '#FF6B35', symbol: '🔥' },
    2: { name: 'Earth', color: '#8B6914', symbol: '🌍' },
    3: { name: 'Air', color: '#87CEEB', symbol: '💨' },
    4: { name: 'Water', color: '#4682B4', symbol: '💧' },
    5: { name: 'Wood', color: '#228B22', symbol: '🌳' },
    6: { name: 'Metal', color: '#C0C0C0', symbol: '⚡' },
    7: { name: 'Light', color: '#FFD700', symbol: '☀️' },
    8: { name: 'Dark', color: '#4B0082', symbol: '🌙' },
    9: { name: 'Spirit', color: '#9370DB', symbol: '✨' },
  }

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

      // Get identities data for the time range
      const { data: identities } = await supabase
        .from('kd_identity')
        .select('created_at, user_id')
        .gte('created_at', startDate.toISOString())

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

      console.log('Chart Data Totals:', {
        totalDirectRegistrations,
        totalInvitedRegistrations,
        totalIdentitiesForPeriod,
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

      // Update the analytics data with new totals
      setAnalyticsData(prev => ({
        ...prev,
        totalDirectRegistrations,
        totalInvitedRegistrations,
        totalIdentities: totalIdentitiesForPeriod,
        registrationTrends: dailyTrends
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
      const usersByElement: { [key: number]: number } = {}
      const usersByCountry: { [key: string]: number } = {}
      const usersByGender: { [key: string]: number } = {}
      let adminCount = 0
      let publicCount = 0

      allUsers?.forEach(user => {
        // Element analysis
        if (user.element_number) {
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

      // Growth forecast based on current trends
      const growthForecast = [
        { period: '1 Month', projectedUsers: Math.round((totalUsers || 0) * (1 + monthlyGrowthRate / 100)), growth: Math.round((totalUsers || 0) * monthlyGrowthRate / 100) },
        { period: '3 Months', projectedUsers: Math.round((totalUsers || 0) * Math.pow(1 + monthlyGrowthRate / 100, 3)), growth: Math.round((totalUsers || 0) * (Math.pow(1 + monthlyGrowthRate / 100, 3) - 1)) },
        { period: '6 Months', projectedUsers: Math.round((totalUsers || 0) * Math.pow(1 + monthlyGrowthRate / 100, 6)), growth: Math.round((totalUsers || 0) * (Math.pow(1 + monthlyGrowthRate / 100, 6) - 1)) },
        { period: '12 Months', projectedUsers: Math.round((totalUsers || 0) * Math.pow(1 + monthlyGrowthRate / 100, 12)), growth: Math.round((totalUsers || 0) * (Math.pow(1 + monthlyGrowthRate / 100, 12) - 1)) },
      ]

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
        growthForecast,
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
    const loadData = async () => {
      await loadAnalyticsData()
      await loadChartData(timeRange) // Load chart data immediately after analytics data
    }
    loadData()
  }, []) // Only run on mount

  useEffect(() => {
    loadChartData(timeRange)
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
          <Grid item xs={12} lg={8}>
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
                  <Chart data={userGrowthData} options={chartOptions} ref={chartRef} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Growth Forecast
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Based on current growth rate of {analyticsData.monthlyGrowthRate}% monthly
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Period</TableCell>
                      <TableCell align="right">Projected Users</TableCell>
                      <TableCell align="right">Growth</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analyticsData.growthForecast.map((forecast) => (
                      <TableRow key={forecast.period}>
                        <TableCell>{forecast.period}</TableCell>
                        <TableCell align="right">{forecast.projectedUsers.toLocaleString()}</TableCell>
                        <TableCell align="right">
                          <Typography color="success.main">
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
                  {Object.entries(analyticsData.usersByElement).map(([element, count]) => {
                    const elementNum = parseInt(element)
                    const info = elementInfo[elementNum as keyof typeof elementInfo]
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
                          <Typography sx={{ fontSize: '1.2rem' }}>{info?.symbol}</Typography>
                          <Typography>Element {element}: {info?.name}</Typography>
                        </Box>
                        <Chip 
                          label={count} 
                          size="small" 
                          sx={{ 
                            bgcolor: info?.color, 
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
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  User Behavioral Analytics
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Behavioral insights and user engagement metrics coming soon...
                </Typography>
                <Box sx={{ mt: 3, p: 4, textAlign: 'center', bgcolor: 'action.hover', borderRadius: 2 }}>
                  <Psychology sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Advanced behavioral analytics will include:
                  </Typography>
                  <List sx={{ mt: 2 }}>
                    <ListItem>
                      <ListItemText primary="• Identity creation patterns" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="• User engagement metrics" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="• Session duration analysis" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="• Feature usage tracking" />
                    </ListItem>
                  </List>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
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
                  {Object.entries(analyticsData.usersByElement).map(([element, count]) => {
                    const elementNum = parseInt(element)
                    const info = elementInfo[elementNum as keyof typeof elementInfo]
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
                              {info?.symbol}
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                              Element {element}: {info?.name}
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" color={info?.color}>
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
