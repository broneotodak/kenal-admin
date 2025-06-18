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
} from '@mui/icons-material'
import { supabase } from '@/lib/supabase'
import { useTheme as useThemeMode } from '@mui/material/styles'
import { Chart } from '@/components/Chart'

// Use any for chart options due to dynamic import
type ChartOptions = any

interface ChartDataPoint {
  date: string
  hour?: string
  newUsers: number
  usersWithIdentity: number
  details?: any[]
}

export default function DashboardPage() {
  const theme = useThemeMode()
  const isDarkMode = theme.palette.mode === 'dark'
  const chartRef = useRef<any>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedDataPoint, setSelectedDataPoint] = useState<ChartDataPoint | null>(null)
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    todayRegistrations: 0,
    totalRevenue: 452808,
    userGrowth: '+12.5',
    activeGrowth: '+8.3',
    revenueGrowth: '+15.2',
    todayGrowth: '+13.8',
  })
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('24hours')
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [currentTime, setCurrentTime] = useState<string>('')
  const [chartDataPoints, setChartDataPoints] = useState<ChartDataPoint[]>([])
  const [chartData, setChartData] = useState({
    labels: [] as string[],
    datasets: [
      {
        label: 'New Users',
        data: [] as number[],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: '#3b82f6',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3,
      },
      {
        label: 'Users with Identity',
        data: [] as number[],
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: '#f97316',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: '#f97316',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3,
      },
    ],
  })

  const handleExportChart = () => {
    setAnchorEl(null)
    
    // Only run on client side
    if (typeof window === 'undefined') return
    
    const csvData = chartDataPoints.map((point, index) => ({
      'Date/Time': chartData.labels[index],
      'New Users': point.newUsers,
      'Users with Identity': point.usersWithIdentity,
    }))
    
    if (csvData.length === 0) return
    
    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kenal-users-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleResetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom()
    }
  }

  async function loadChartData(range: string) {
    setChartLoading(true)
    try {
      const now = new Date()
      let startDate: Date
      let labels: string[] = []
      let userCounts: number[] = []
      let identityCounts: number[] = []
      let dataPoints: ChartDataPoint[] = []

      if (range === '24hours') {
        // Last 24 hours, grouped by hour
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        
        // Get all users created in last 24 hours
        const { data: users } = await supabase
          .from('kd_users')
          .select('id, name, email, created_at')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true })

        // Get all users with identities created in last 24 hours
        const { data: identities } = await supabase
          .from('kd_identity')
          .select('created_at, user_id')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true })

        // Initialize hour buckets
        for (let i = 0; i < 24; i++) {
          const hour = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000)
          const hourStr = hour.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
          labels.push(hourStr)
          userCounts.push(0)
          identityCounts.push(0)
          dataPoints.push({
            date: hour.toISOString(),
            hour: hourStr,
            newUsers: 0,
            usersWithIdentity: 0,
            details: []
          })
        }

        // Count users per hour and store details
        users?.forEach(user => {
          const hourDiff = Math.floor((new Date(user.created_at).getTime() - startDate.getTime()) / (60 * 60 * 1000))
          if (hourDiff >= 0 && hourDiff < 24) {
            userCounts[hourDiff]++
            dataPoints[hourDiff].newUsers++
            dataPoints[hourDiff].details?.push({
              type: 'user',
              name: user.name,
              email: user.email,
              time: new Date(user.created_at).toLocaleTimeString()
            })
          }
        })

        // Count unique users with identities per hour
        const uniqueUsersWithIdentities = new Set<string>()
        identities?.forEach(identity => {
          if (!uniqueUsersWithIdentities.has(identity.user_id)) {
            uniqueUsersWithIdentities.add(identity.user_id)
            const hourDiff = Math.floor((new Date(identity.created_at).getTime() - startDate.getTime()) / (60 * 60 * 1000))
            if (hourDiff >= 0 && hourDiff < 24) {
              identityCounts[hourDiff]++
              dataPoints[hourDiff].usersWithIdentity++
            }
          }
        })

      } else if (range === '7days') {
        // Last 7 days, grouped by day
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        
        const { data: users } = await supabase
          .from('kd_users')
          .select('id, name, email, created_at')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true })

        const { data: identities } = await supabase
          .from('kd_identity')
          .select('created_at, user_id')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true })

        // Initialize day buckets
        for (let i = 0; i < 7; i++) {
          const day = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000)
          const dayStr = day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
          labels.push(dayStr)
          userCounts.push(0)
          identityCounts.push(0)
          dataPoints.push({
            date: day.toISOString(),
            newUsers: 0,
            usersWithIdentity: 0,
            details: []
          })
        }

        // Count users per day
        users?.forEach(user => {
          const dayDiff = Math.floor((new Date(user.created_at).getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
          if (dayDiff >= 0 && dayDiff < 7) {
            userCounts[dayDiff]++
            dataPoints[dayDiff].newUsers++
            dataPoints[dayDiff].details?.push({
              type: 'user',
              name: user.name,
              email: user.email,
              time: new Date(user.created_at).toLocaleDateString()
            })
          }
        })

        // Count unique users with identities per day
        const dailyIdentities: { [key: number]: Set<string> } = {}
        for (let i = 0; i < 7; i++) {
          dailyIdentities[i] = new Set()
        }

        identities?.forEach(identity => {
          const dayDiff = Math.floor((new Date(identity.created_at).getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
          if (dayDiff >= 0 && dayDiff < 7) {
            dailyIdentities[dayDiff].add(identity.user_id)
          }
        })

        for (let i = 0; i < 7; i++) {
          identityCounts[i] = dailyIdentities[i].size
          dataPoints[i].usersWithIdentity = dailyIdentities[i].size
        }

      } else {
        // Last 12 months, grouped by month
        startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1)
        
        const { data: users } = await supabase
          .from('kd_users')
          .select('id, name, email, created_at')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true })

        const { data: identities } = await supabase
          .from('kd_identity')
          .select('created_at, user_id')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true })

        // Initialize month buckets
        for (let i = 0; i < 12; i++) {
          const month = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
          const monthStr = month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
          labels.push(monthStr)
          userCounts.push(0)
          identityCounts.push(0)
          dataPoints.push({
            date: month.toISOString(),
            newUsers: 0,
            usersWithIdentity: 0,
            details: []
          })
        }

        // Count users per month
        users?.forEach(user => {
          const userDate = new Date(user.created_at)
          const monthDiff = (userDate.getFullYear() - startDate.getFullYear()) * 12 + 
                           (userDate.getMonth() - startDate.getMonth())
          if (monthDiff >= 0 && monthDiff < 12) {
            userCounts[monthDiff]++
            dataPoints[monthDiff].newUsers++
            dataPoints[monthDiff].details?.push({
              type: 'user',
              name: user.name,
              email: user.email,
              time: userDate.toLocaleDateString()
            })
          }
        })

        // Count unique users with identities per month
        const monthlyIdentities: { [key: number]: Set<string> } = {}
        for (let i = 0; i < 12; i++) {
          monthlyIdentities[i] = new Set()
        }

        identities?.forEach(identity => {
          const identityDate = new Date(identity.created_at)
          const monthDiff = (identityDate.getFullYear() - startDate.getFullYear()) * 12 + 
                           (identityDate.getMonth() - startDate.getMonth())
          if (monthDiff >= 0 && monthDiff < 12) {
            monthlyIdentities[monthDiff].add(identity.user_id)
          }
        })

        for (let i = 0; i < 12; i++) {
          identityCounts[i] = monthlyIdentities[i].size
          dataPoints[i].usersWithIdentity = monthlyIdentities[i].size
        }
      }

      setChartDataPoints(dataPoints)
      setChartData({
        labels,
        datasets: [
          {
            label: 'New Users',
            data: userCounts,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 8,
            pointBackgroundColor: '#3b82f6',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverBackgroundColor: '#3b82f6',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 3,
          },
          {
            label: 'Users with Identity',
            data: identityCounts,
            borderColor: '#f97316',
            backgroundColor: 'rgba(249, 115, 22, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 8,
            pointBackgroundColor: '#f97316',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHoverBackgroundColor: '#f97316',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 3,
          },
        ],
      })
    } catch (error) {
      console.error('Error loading chart data:', error)
    } finally {
      setChartLoading(false)
    }
  }

  async function loadDashboard() {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('kd_users')
        .select('*', { count: 'exact', head: true })

      // Get active users (have at least one identity)
      const { data: usersWithIdentity } = await supabase
        .from('kd_identity')
        .select('user_id', { count: 'exact' })
        .not('user_id', 'is', null)
      
      // Count unique users with identities
      const uniqueUsersWithIdentity = new Set(usersWithIdentity?.map(item => item.user_id) || [])
      const activeUsers = uniqueUsersWithIdentity.size

      // Get today's registrations
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { count: todayRegistrations } = await supabase
        .from('kd_users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())

      // Calculate growth percentages (comparing to last month/week)
      const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      const { count: lastMonthUsers } = await supabase
        .from('kd_users')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', lastMonth.toISOString())

      const userGrowth = lastMonthUsers && lastMonthUsers > 0 
        ? ((totalUsers! - lastMonthUsers) / lastMonthUsers * 100).toFixed(1)
        : '0'

      // Get recent users
      const { data: recent } = await supabase
        .from('kd_users')
        .select('id, name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        todayRegistrations: todayRegistrations || 0,
        totalRevenue: 452808,
        userGrowth: userGrowth.startsWith('-') ? userGrowth : `+${userGrowth}`,
        activeGrowth: '+8.3',
        revenueGrowth: '+15.2',
        todayGrowth: todayRegistrations && todayRegistrations > 0 ? '+13.8' : '0',
      })

      setRecentUsers(recent || [])
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
    const interval = setInterval(loadDashboard, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    loadChartData(timeRange)
  }, [timeRange])

  // Update time only on client side to avoid hydration issues
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false }))
    }
    updateTime()
    const timeInterval = setInterval(updateTime, 1000)
    return () => clearInterval(timeInterval)
  }, [])

  const chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    onClick: (event: any, activeElements: any[]) => {
      if (activeElements.length > 0) {
        const index = activeElements[0].index
        const dataPoint = chartDataPoints[index]
        setSelectedDataPoint(dataPoint)
      }
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: isDarkMode ? '#9ca3af' : '#374151',
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            weight: 500 as const,
          },
        },
      },
      tooltip: {
        backgroundColor: isDarkMode ? '#1a1a1a' : '#1f2937',
        titleColor: '#ffffff',
        bodyColor: isDarkMode ? '#9ca3af' : '#d1d5db',
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 6,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y + ' users';
            }
            return label;
          },
          afterLabel: function(context: any) {
            const dataPoint = chartDataPoints[context.dataIndex]
            if (dataPoint && dataPoint.details && dataPoint.details.length > 0) {
              return `Click to see ${dataPoint.details.length} user details`;
            }
            return '';
          }
        }
      },
      zoom: {
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true
          },
          mode: 'x',
        },
        pan: {
          enabled: true,
          mode: 'x',
        },
        limits: {
          x: {min: 'original', max: 'original'},
        },
      }
    },
    scales: {
      x: {
        border: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: isDarkMode ? '#6b7280' : '#374151',
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        border: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: isDarkMode ? '#6b7280' : '#374151',
          font: {
            size: 11,
          },
          stepSize: 1,
        },
      },
    },
  }

  const StatCard = ({ icon, title, value, growth, isRevenue = false }: any) => {
    const isPositive = growth.startsWith('+');
    const GrowthIcon = isPositive ? TrendingUp : TrendingDown;
    
    return (
      <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
        {isRevenue && (
          <Box
            sx={{
              position: 'absolute',
              top: 20,
              right: -30,
              bgcolor: '#f97316',
              color: 'white',
              px: 4,
              py: 0.5,
              fontSize: '0.65rem',
              fontWeight: 700,
              transform: 'rotate(45deg)',
              transformOrigin: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              zIndex: 1,
              letterSpacing: '0.05em',
            }}
          >
            COMING SOON
          </Box>
        )}
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box sx={{ flex: 1 }}>
              <Typography 
                color="text.secondary" 
                gutterBottom 
                variant="body2" 
                sx={{ 
                  fontSize: '0.75rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.1em',
                  fontWeight: 500,
                  mb: 1.5
                }}
              >
                {title}
              </Typography>
              <Typography 
                variant="h4" 
                component="div" 
                sx={{ 
                  fontWeight: 700, 
                  mb: 1.5,
                  fontSize: '2rem',
                  lineHeight: 1.2
                }}
              >
                {loading ? <Skeleton width={100} /> : isRevenue ? `RM ${value.toLocaleString()}` : value.toLocaleString()}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <GrowthIcon 
                  sx={{ 
                    fontSize: '1rem', 
                    color: isPositive ? '#10b981' : '#ef4444' 
                  }} 
                />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: isPositive ? '#10b981' : '#ef4444',
                    fontWeight: 600,
                    fontSize: '0.875rem'
                  }}
                >
                  {growth}% vs last month
                </Typography>
              </Box>
            </Box>
            <Avatar 
              sx={{ 
                bgcolor: 'rgba(59, 130, 246, 0.1)', 
                width: 56, 
                height: 56,
                border: '1px solid rgba(59, 130, 246, 0.2)',
                '& .MuiSvgIcon-root': {
                  fontSize: '1.75rem'
                }
              }}
            >
              {icon}
            </Avatar>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Dashboard auto-refreshes every 30 seconds • Last updated: {currentTime || '...'}
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<People sx={{ color: '#3b82f6' }} />}
            title="TOTAL USERS"
            value={stats.totalUsers}
            growth={stats.userGrowth}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Group sx={{ color: '#f97316' }} />}
            title="ACTIVE USERS"
            value={stats.activeUsers}
            growth={stats.activeGrowth}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Assessment sx={{ color: '#10b981' }} />}
            title="TOTAL REVENUE"
            value={stats.totalRevenue}
            growth={stats.revenueGrowth}
            isRevenue={true}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<PersonAdd sx={{ color: '#60a5fa' }} />}
            title="USERS REGISTERED TODAY"
            value={stats.todayRegistrations}
            growth={stats.todayGrowth}
          />
        </Grid>
      </Grid>

      <Card sx={{ 
        mb: 3,
        bgcolor: (theme) => theme.palette.mode === 'light' ? '#f9fafb' : theme.palette.background.paper,
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h6" fontWeight="600">
                Users & Identity Registration Trends
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last updated: {currentTime || '...'} • Click on data points for details
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <ButtonGroup size="small">
                <Button 
                  variant={timeRange === '24hours' ? 'contained' : 'outlined'}
                  onClick={() => setTimeRange('24hours')}
                  sx={{
                    color: timeRange === '24hours' ? 'white' : (theme) => theme.palette.text.primary,
                    borderColor: (theme) => theme.palette.divider,
                    '&:hover': {
                      borderColor: (theme) => theme.palette.divider,
                      backgroundColor: timeRange === '24hours' ? undefined : (theme) => theme.palette.action.hover,
                    },
                  }}
                >
                  24 HOURS
                </Button>
                <Button 
                  variant={timeRange === '7days' ? 'contained' : 'outlined'}
                  onClick={() => setTimeRange('7days')}
                  sx={{
                    color: timeRange === '7days' ? 'white' : (theme) => theme.palette.text.primary,
                    borderColor: (theme) => theme.palette.divider,
                    '&:hover': {
                      borderColor: (theme) => theme.palette.divider,
                      backgroundColor: timeRange === '7days' ? undefined : (theme) => theme.palette.action.hover,
                    },
                  }}
                >
                  7 DAYS
                </Button>
                <Button 
                  variant={timeRange === '12months' ? 'contained' : 'outlined'}
                  onClick={() => setTimeRange('12months')}
                  sx={{
                    color: timeRange === '12months' ? 'white' : (theme) => theme.palette.text.primary,
                    borderColor: (theme) => theme.palette.divider,
                    '&:hover': {
                      borderColor: (theme) => theme.palette.divider,
                      backgroundColor: timeRange === '12months' ? undefined : (theme) => theme.palette.action.hover,
                    },
                  }}
                >
                  12 MONTHS
                </Button>
              </ButtonGroup>
              <Tooltip title="Chart Options">
                <IconButton 
                  size="small" 
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  sx={{ ml: 1 }}
                >
                  <MoreVert />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Chart Actions Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem onClick={handleExportChart}>
              <Download sx={{ mr: 1, fontSize: 20 }} />
              Export as CSV
            </MenuItem>
            <MenuItem onClick={handleResetZoom}>
              <RestartAlt sx={{ mr: 1, fontSize: 20 }} />
              Reset Zoom
            </MenuItem>
          </Menu>

          <Box sx={{ height: 300, position: 'relative' }}>
            {chartLoading ? (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                bgcolor: theme.palette.action.hover,
                borderRadius: 1,
              }}>
                <CircularProgress size={40} />
              </Box>
            ) : (
              <>
                                        <Chart ref={chartRef} data={chartData} options={chartOptions} />
                <Box sx={{ 
                  position: 'absolute', 
                  bottom: -40, 
                  right: 0,
                  display: 'flex',
                  gap: 1,
                  fontSize: '0.75rem',
                  color: 'text.secondary'
                }}>
                  <Typography variant="caption">
                    <ZoomIn sx={{ fontSize: 14, verticalAlign: 'middle' }} /> Scroll to zoom
                  </Typography>
                  <Typography variant="caption">
                    • Click data points for details
                  </Typography>
                </Box>
              </>
            )}
          </Box>

          {/* Selected Data Point Details */}
          {selectedDataPoint && selectedDataPoint.details && selectedDataPoint.details.length > 0 && (
            <Box sx={{ 
              mt: 4, 
              p: 2, 
              bgcolor: (theme) => theme.palette.action.hover,
              borderRadius: 1,
              border: (theme) => `1px solid ${theme.palette.divider}`
            }}>
              <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                Details for {selectedDataPoint.hour || chartData.labels[chartDataPoints.indexOf(selectedDataPoint)]}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedDataPoint.newUsers} new users, {selectedDataPoint.usersWithIdentity} with identity
              </Typography>
              <Box sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                {selectedDataPoint.details.slice(0, 10).map((detail, index) => (
                  <Box key={index} sx={{ py: 0.5 }}>
                    <Typography variant="caption">
                      {detail.name || 'N/A'} ({detail.email}) - {detail.time}
                    </Typography>
                  </Box>
                ))}
                {selectedDataPoint.details.length > 10 && (
                  <Typography variant="caption" color="text.secondary">
                    ... and {selectedDataPoint.details.length - 10} more
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                Recent Users
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ borderBottom: (theme) => `2px solid ${theme.palette.divider}`, pb: 2 }}>Name</TableCell>
                    <TableCell sx={{ borderBottom: (theme) => `2px solid ${theme.palette.divider}`, pb: 2 }}>Email</TableCell>
                    <TableCell sx={{ borderBottom: (theme) => `2px solid ${theme.palette.divider}`, pb: 2 }}>Joined</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Skeleton />
                      </TableCell>
                    </TableRow>
                  ) : recentUsers.length > 0 ? (
                    recentUsers.map((user) => (
                      <TableRow 
                        key={user.id}
                        sx={{ 
                          '&:hover': { bgcolor: (theme) => theme.palette.action.hover },
                          '& td': { borderBottom: (theme) => `1px solid ${theme.palette.divider}` }
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar 
                              sx={{ 
                                width: 36, 
                                height: 36,
                                bgcolor: 'primary.main',
                                fontSize: '0.875rem',
                                fontWeight: 600
                              }}
                            >
                              {user.name?.[0] || user.email[0].toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {user.name || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {user.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {new Date(user.created_at).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No recent users
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                User Identity Registered Stat
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ 
                      textAlign: 'center', 
                      p: 3, 
                      bgcolor: 'rgba(59, 130, 246, 0.05)', 
                      borderRadius: 2,
                      border: '1px solid rgba(59, 130, 246, 0.1)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'rgba(59, 130, 246, 0.08)',
                        borderColor: 'rgba(59, 130, 246, 0.2)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                      }
                    }}>
                      <Typography variant="h3" sx={{ color: '#3b82f6', fontWeight: 700, mb: 1 }}>
                        {stats.activeUsers}
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        With Identity
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ 
                      textAlign: 'center', 
                      p: 3, 
                      bgcolor: 'rgba(156, 163, 175, 0.05)', 
                      borderRadius: 2,
                      border: '1px solid rgba(156, 163, 175, 0.1)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'rgba(156, 163, 175, 0.08)',
                        borderColor: 'rgba(156, 163, 175, 0.2)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(156, 163, 175, 0.15)',
                      }
                    }}>
                      <Typography variant="h3" sx={{ color: '#6b7280', fontWeight: 700, mb: 1 }}>
                        {stats.totalUsers - stats.activeUsers}
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        Without Identity
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ 
                      mt: 3, 
                      p: 3, 
                      bgcolor: (theme) => theme.palette.action.hover, 
                      borderRadius: 2,
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                    }}>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          color: 'text.secondary', 
                          fontWeight: 500,
                          mb: 2 
                        }}
                      >
                        Identity Completion Rate
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ 
                          flex: 1, 
                          bgcolor: (theme) => theme.palette.action.selected, 
                          borderRadius: 1, 
                          overflow: 'hidden',
                          height: 12,
                        }}>
                          <Box 
                            sx={{ 
                              width: `${stats.totalUsers > 0 ? (stats.activeUsers / stats.totalUsers * 100).toFixed(1) : 0}%`, 
                              height: '100%', 
                              bgcolor: 'primary.main',
                              background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
                              transition: 'width 0.3s ease',
                            }} 
                          />
                        </Box>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 700,
                            color: 'primary.main',
                            minWidth: '60px',
                            textAlign: 'right'
                          }}
                        >
                          {stats.totalUsers > 0 ? (stats.activeUsers / stats.totalUsers * 100).toFixed(1) : 0}%
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
