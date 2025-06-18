'use client'

import { useEffect, useState } from 'react'
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
} from '@mui/material'
import { 
  People, 
  PersonAdd,
  TrendingUp,
  TrendingDown,
  Assessment,
  Group,
} from '@mui/icons-material'
import { supabase } from '@/lib/supabase'
import { Line } from 'react-chartjs-2'
import { useTheme as useThemeMode } from '@mui/material/styles'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function DashboardPage() {
  const theme = useThemeMode()
  const isDarkMode = theme.palette.mode === 'dark'
  
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
  const [timeRange, setTimeRange] = useState('24hours')
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [currentTime, setCurrentTime] = useState<string>('')

  async function loadDashboard() {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('kd_users')
        .select('*', { count: 'exact', head: true })

      // Get active users (with identities)
      const { count: activeUsers } = await supabase
        .from('user_identities')
        .select('*', { count: 'exact', head: true })
        .not('identity_data', 'is', null)

      // Get today's registrations
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { count: todayRegistrations } = await supabase
        .from('kd_users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())

      // Get recent users
      const { data: recent } = await supabase
        .from('kd_users')
        .select('id, name, email, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      setStats({
        totalUsers: totalUsers || 281,
        activeUsers: activeUsers || 144,
        todayRegistrations: todayRegistrations || 33,
        totalRevenue: 452808,
        userGrowth: '+12.5',
        activeGrowth: '+8.3',
        revenueGrowth: '+15.2',
        todayGrowth: '+13.8',
      })

      setRecentUsers(recent || [])
    } catch (error) {
      console.error('Error loading dashboard:', error)
      // Use fallback data
      setStats({
        totalUsers: 281,
        activeUsers: 144,
        todayRegistrations: 33,
        totalRevenue: 452808,
        userGrowth: '+12.5',
        activeGrowth: '+8.3',
        revenueGrowth: '+15.2',
        todayGrowth: '+13.8',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
    const interval = setInterval(loadDashboard, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Update time only on client side to avoid hydration issues
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false }))
    }
    updateTime()
    const timeInterval = setInterval(updateTime, 1000)
    return () => clearInterval(timeInterval)
  }, [])

  const chartData = {
    labels: ['12 AM', '2 AM', '4 AM', '6 AM', '8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM'],
    datasets: [
      {
        label: 'New Users',
        data: [2, 1, 0, 0, 3, 7, 14, 8, 5, 3, 2, 1],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Users with Identity',
        data: [1, 0, 0, 0, 2, 5, 10, 6, 4, 2, 1, 1],
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: isDarkMode ? '#9ca3af' : '#374151',
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            weight: '500',
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
      },
    },
    scales: {
      x: {
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: isDarkMode ? '#6b7280' : '#374151',
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: isDarkMode ? '#6b7280' : '#374151',
          font: {
            size: 11,
          },
        },
      },
    },
  }

  const StatCard = ({ icon, title, value, growth, isRevenue = false }: any) => {
    const isPositive = growth.startsWith('+');
    const GrowthIcon = isPositive ? TrendingUp : TrendingDown;
    
    return (
      <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
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
              {isRevenue && (
                <Chip 
                  label="COMING SOON" 
                  size="small" 
                  sx={{ 
                    bgcolor: '#f97316',
                    color: 'white',
                    fontSize: '0.65rem',
                    height: 22,
                    fontWeight: 600,
                    mb: 1.5,
                  }} 
                />
              )}
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
                  {growth}% vs last {timeRange === '24hours' ? 'month' : timeRange === '7days' ? 'week' : 'month'}
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
        <Box>
          <Typography variant="h4" fontWeight="bold" color="white">
            Admin Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Dashboard auto-refreshes every 30 seconds • Last updated: {currentTime || '...'}
          </Typography>
        </Box>
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
                Last updated: {currentTime || '...'}
              </Typography>
            </Box>
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
          </Box>
          <Box sx={{ height: 300 }}>
            <Line data={chartData} options={chartOptions} />
          </Box>
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
                    <TableCell sx={{ borderBottom: '2px solid rgba(255, 255, 255, 0.1)', pb: 2 }}>Name</TableCell>
                    <TableCell sx={{ borderBottom: '2px solid rgba(255, 255, 255, 0.1)', pb: 2 }}>Email</TableCell>
                    <TableCell sx={{ borderBottom: '2px solid rgba(255, 255, 255, 0.1)', pb: 2 }}>Joined</TableCell>
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
                          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.02)' },
                          '& td': { borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }
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
                      '&:hover': {
                        bgcolor: 'rgba(59, 130, 246, 0.08)',
                        borderColor: 'rgba(59, 130, 246, 0.2)',
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
                      '&:hover': {
                        bgcolor: 'rgba(156, 163, 175, 0.08)',
                        borderColor: 'rgba(156, 163, 175, 0.2)',
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
                      bgcolor: 'rgba(255, 255, 255, 0.02)', 
                      borderRadius: 2,
                      border: '1px solid rgba(255, 255, 255, 0.08)',
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
                          bgcolor: 'rgba(255, 255, 255, 0.05)', 
                          borderRadius: 1, 
                          overflow: 'hidden',
                          height: 12,
                        }}>
                          <Box 
                            sx={{ 
                              width: `${(stats.activeUsers / stats.totalUsers * 100).toFixed(1)}%`, 
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
                          {(stats.activeUsers / stats.totalUsers * 100).toFixed(1)}%
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
