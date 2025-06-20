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
  Mail,
} from '@mui/icons-material'
import { supabase } from '@/lib/supabase'
import { useTheme as useThemeMode } from '@mui/material/styles'
import Chart from '@/components/Chart'
import { useSimpleDashboard } from '@/hooks/useSimpleDashboard'

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
  label: string
  directRegistrations: number
  invitedRegistrations: number
  usersWithIdentity: number
}

export default function DashboardPage() {
  const theme = useThemeMode()
  const isDarkMode = theme.palette.mode === 'dark'
  const chartRef = useRef<any>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedDataPoint, setSelectedDataPoint] = useState<ChartDataPoint | null>(null)
  const [timeRange, setTimeRange] = useState<'24hours' | '7days' | '12months'>('24hours')
  const [currentTime, setCurrentTime] = useState<string>('')

  // Use simplified dashboard hook - no complex state management
  const {
    stats,
    recentUsers,
    chartData,
    chartDataPoints,
    loading,
    error,
    refetch: refreshDashboard
  } = useSimpleDashboard(timeRange)

  const handleExportChart = () => {
    setAnchorEl(null)
    
    // Only run on client side
    if (typeof window === 'undefined') return
    
    const csvData = chartDataPoints.map((point: any, index: number) => ({
      'Date/Time': chartData.labels[index],
      'Direct Registrations': point.directRegistrations || 0,
      'Invited Registrations': point.invitedRegistrations || 0,
      'Total New Users': (point.directRegistrations || 0) + (point.invitedRegistrations || 0),
      'Users with Identity': point.usersWithIdentity || 0,
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
    const displayComparisonPeriod = comparisonPeriod || 'last period';
    
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
          {loading && (
            <Chip
              icon={<CircularProgress size={12} />}
              label="Refreshing..."
              size="small"
              color="info"
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: 24 }}
            />
          )}
          <Tooltip title="Manually refresh dashboard">
            <IconButton
              size="small"
              onClick={refreshDashboard}
              disabled={loading}
              sx={{ 
                ml: 1,
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  transform: 'rotate(180deg)',
                  transition: 'transform 0.3s ease'
                }
              }}
            >
              <RestartAlt fontSize="small" />
            </IconButton>
          </Tooltip>
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

          <Box sx={{ 
            height: 400, 
            position: 'relative',
            '& canvas': {
              cursor: 'crosshair'
            }
          }}>
            {loading ? (
              <Box sx={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 2
              }}>
                <CircularProgress size={40} />
                <Typography variant="body2" color="text.secondary">
                  Loading chart data...
                </Typography>
              </Box>
            ) : (
              <Chart 
                data={chartData} 
                options={chartOptions}
                onResetZoom={handleResetZoom}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Reset zoom level">
                <span>
                  <IconButton 
                    size="small" 
                    onClick={handleResetZoom}
                    disabled={loading}
                    sx={{ color: 'text.secondary' }}
                  >
                    <RestartAlt fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="More options">
                <span>
                  <IconButton 
                    size="small"
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    disabled={loading}
                    sx={{ color: 'text.secondary' }}
                  >
                    <MoreVert fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Box>

          {/* Simplified Chart Info */}
          {selectedDataPoint && (
            <Box sx={{ 
              mt: 4, 
              p: 2, 
              bgcolor: (theme) => theme.palette.action.hover,
              borderRadius: 1,
              border: (theme) => `1px solid ${theme.palette.divider}`
            }}>
              <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                Data for {selectedDataPoint.label}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedDataPoint.directRegistrations || 0} direct registrations, {selectedDataPoint.invitedRegistrations || 0} invited registrations, {selectedDataPoint.usersWithIdentity || 0} with identity
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Recent Users - Full Width */}
      <Card sx={{ mb: 3 }}>
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
              {loading ? (
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

      {/* Identity and Invitation Stats Grid */}
      <Grid container spacing={3}>
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
                        {stats.lifetimeActiveUsers}
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
                        {stats.totalUsers - stats.lifetimeActiveUsers}
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
                      minHeight: '72px', // Match invitation card height
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
                              width: `${stats.totalUsers > 0 ? (stats.lifetimeActiveUsers / stats.totalUsers * 100).toFixed(1) : 0}%`, 
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
                          {stats.totalUsers > 0 ? (stats.lifetimeActiveUsers / stats.totalUsers * 100).toFixed(1) : 0}%
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                User Identity Registered via Invitation
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ 
                      textAlign: 'center', 
                      p: 3, 
                      bgcolor: 'rgba(139, 69, 19, 0.05)', 
                      borderRadius: 2,
                      border: '1px solid rgba(139, 69, 19, 0.1)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'rgba(139, 69, 19, 0.08)',
                        borderColor: 'rgba(139, 69, 19, 0.2)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(139, 69, 19, 0.15)',
                      }
                    }}>
                      <Typography variant="h3" sx={{ color: '#8b4513', fontWeight: 700, mb: 1 }}>
                        {loading ? <Skeleton width={60} /> : stats.invitedUsers.toLocaleString()}
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        Invited Users
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ 
                      textAlign: 'center', 
                      p: 3, 
                      bgcolor: 'rgba(101, 163, 13, 0.05)', 
                      borderRadius: 2,
                      border: '1px solid rgba(101, 163, 13, 0.1)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'rgba(101, 163, 13, 0.08)',
                        borderColor: 'rgba(101, 163, 13, 0.2)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(101, 163, 13, 0.15)',
                      }
                    }}>
                      <Typography variant="h3" sx={{ color: '#65a30d', fontWeight: 700, mb: 1 }}>
                        {loading ? <Skeleton width={60} /> : (stats.totalUsers - stats.invitedUsers).toLocaleString()}
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        Direct Users
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
                      minHeight: '72px', // Match identity card height
                    }}>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          color: 'text.secondary', 
                          fontWeight: 500,
                          mb: 2 
                        }}
                      >
                        Invitation Conversion Rate
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
                              width: `${stats.totalUsers > 0 ? (stats.invitedUsers / stats.totalUsers * 100).toFixed(1) : 0}%`, 
                              height: '100%', 
                              bgcolor: '#8b4513',
                              background: 'linear-gradient(90deg, #8b4513 0%, #cd853f 100%)',
                              transition: 'width 0.3s ease',
                            }} 
                          />
                        </Box>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 700,
                            color: '#8b4513',
                            minWidth: '60px',
                            textAlign: 'right'
                          }}
                        >
                          {stats.totalUsers > 0 ? (stats.invitedUsers / stats.totalUsers * 100).toFixed(1) : 0}%
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
