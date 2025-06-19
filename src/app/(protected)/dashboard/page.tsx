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
import { 
  useFallbackDashboardStats, 
  useFallbackRecentUsers, 
  useFallbackChartData 
} from '@/hooks/useOptimizedDashboardFallback'

// Helper function to get country flag emoji
const getCountryFlag = (countryCode?: string): string => {
  if (!countryCode) return '🌍'
  
  const flagMap: { [key: string]: string } = {
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
    'MX': '🇲🇽', 'Mexico': '🇲🇽',
  }
  
  return flagMap[countryCode] || flagMap[countryCode.toUpperCase()] || '🌍'
}

// Helper function to get country display name
const getCountryName = (countryCode?: string): string => {
  if (!countryCode) return 'Unknown'
  
  const countryMap: { [key: string]: string } = {
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
    'MX': 'Mexico',
  }
  
  return countryMap[countryCode] || countryMap[countryCode.toUpperCase()] || countryCode
}

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
  const [timeRange, setTimeRange] = useState<'24hours' | '7days' | '12months'>('24hours')
  const [currentTime, setCurrentTime] = useState<string>('')

  // Use fallback hooks for immediate data loading (no database views required)
  const { stats, loading: statsLoading } = useFallbackDashboardStats(timeRange, 30000) // Dynamic comparison with 30s refresh
  const { recentUsers, loading: usersLoading } = useFallbackRecentUsers(5)
  const { chartData, chartDataPoints, loading: chartLoading } = useFallbackChartData(timeRange)

  const handleExportChart = () => {
    setAnchorEl(null)
    
    // Only run on client side
    if (typeof window === 'undefined') return
    
    const csvData = chartDataPoints.map((point: any, index: number) => ({
      'Date/Time': chartData.labels[index],
      'New Users': point.newUsers,
      'Users with Identity': point.usersWithIdentity,
    }))
    
    if (csvData.length === 0) return
    
    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map((row: any) => Object.values(row).join(','))
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

  // Update time only on client side to avoid hydration issues (Malaysia timezone)
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-MY', { 
        timeZone: 'Asia/Kuala_Lumpur',
        hour12: false 
      }))
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

  const StatCard = ({ icon, title, value, growth, isRevenue = false, comparisonPeriod }: any) => {
    const isPositive = growth >= 0;
    const GrowthIcon = isPositive ? TrendingUp : TrendingDown;
    const formattedGrowth = growth >= 0 ? `+${growth}` : `${growth}`;
    const displayComparisonPeriod = comparisonPeriod || stats.comparisonPeriod;
    
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
                {statsLoading ? <Skeleton width={100} /> : isRevenue ? `RM ${value.toLocaleString()}` : value.toLocaleString()}
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
                  {formattedGrowth}% vs {displayComparisonPeriod}
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
          Dashboard auto-refreshes every 30 seconds • Last updated: {currentTime || '...'} 🇲🇾 MY Time
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={`Comparing vs ${stats.comparisonPeriod}`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: 24 }}
          />
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
            comparisonPeriod={stats.todayComparisonPeriod}
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
                Last updated: {currentTime || '...'} 🇲🇾 MY Time • Click on data points for details
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
                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <span><strong>{detail.name || 'N/A'}</strong> ({detail.email})</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {getCountryFlag(detail.country)} {getCountryName(detail.country)}
                      </span>
                      <Chip 
                        label={detail.registrationType} 
                        size="small" 
                        color={detail.registrationType === 'Invited' ? 'secondary' : 'primary'}
                        sx={{ height: 16, fontSize: '0.6rem', '& .MuiChip-label': { px: 0.5 } }}
                      />
                      <span>• {detail.time}</span>
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
                    <TableCell sx={{ borderBottom: (theme) => `2px solid ${theme.palette.divider}`, pb: 2 }}>Country</TableCell>
                    <TableCell sx={{ borderBottom: (theme) => `2px solid ${theme.palette.divider}`, pb: 2 }}>Registration</TableCell>
                    <TableCell sx={{ borderBottom: (theme) => `2px solid ${theme.palette.divider}`, pb: 2 }}>Joined</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {usersLoading ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Skeleton />
                      </TableCell>
                    </TableRow>
                  ) : recentUsers.length > 0 ? (
                    recentUsers.map((user: any) => (
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
                              {user.display_name?.[0] || user.name?.[0] || user.email[0].toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {user.display_name || user.name || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {user.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1" sx={{ fontSize: '1.2rem' }}>
                              {getCountryFlag(user.registration_country)}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {user.country_display}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.registration_type}
                            size="small"
                            color={user.registration_type === 'Invited' ? 'secondary' : 'primary'}
                            sx={{ 
                              fontSize: '0.7rem',
                              height: 20,
                              fontWeight: 500,
                              '& .MuiChip-label': {
                                px: 1
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {user.created_at_malaysia ? user.created_at_malaysia.split(' ')[0] : new Date(user.created_at).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>
                            🇲🇾 {user.created_at_malaysia ? user.created_at_malaysia.split(' ')[1] : ''}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
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
