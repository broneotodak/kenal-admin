'use client'

import { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent,
  LinearProgress,
  Chip,
  useTheme,
  alpha
} from '@mui/material'
import { 
  Psychology, 
  Person, 
  Category, 
  TrendingUp, 
  Group,
  Assessment 
} from '@mui/icons-material'
import { useUserStatistics } from '@/hooks/useOptimizedUsers'
import { useUserAnalyticsViews } from '@/hooks/useOptimizedUsersViews'
import { useSmartUserStatistics } from '@/hooks/useSmartOptimizedUsers'
import { supabase } from '@/lib/supabase'

interface AnalyticsData {
  elementDistribution: { element: number, count: number, percentage: number }[]
  genderDistribution: { gender: string, count: number, percentage: number }[]
  registrationTrend: { month: string, count: number }[]
  identityStats: { hasIdentity: number, noIdentity: number }
}

export default function UserAnalysisPage() {
  const theme = useTheme()
  const { stats, loading: statsLoading, mode: statsMode } = useSmartUserStatistics()
  const { analyticsData: viewsAnalyticsData, loading: viewsLoading } = useUserAnalyticsViews()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    elementDistribution: [],
    genderDistribution: [],
    registrationTrend: [],
    identityStats: { hasIdentity: 0, noIdentity: 0 }
  })
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'views' | 'direct'>('views')

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)

      // Get element distribution
      const { data: elementData } = await supabase
        .from('kd_users')
        .select('element_type')
        .not('element_type', 'is', null)

      // Get gender distribution
      const { data: genderData } = await supabase
        .from('kd_users')
        .select('gender')
        .not('gender', 'is', null)

      // Get registration trend (last 6 months)
      const { data: registrationData } = await supabase
        .from('kd_users')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())

      // Process element distribution
      const elementCounts: { [key: number]: number } = {}
      elementData?.forEach(item => {
        elementCounts[item.element_type] = (elementCounts[item.element_type] || 0) + 1
      })

      const totalElements = Object.values(elementCounts).reduce((sum, count) => sum + count, 0)
      const elementDistribution = Object.entries(elementCounts).map(([element, count]) => ({
        element: parseInt(element),
        count,
        percentage: totalElements > 0 ? (count / totalElements) * 100 : 0
      })).sort((a, b) => b.count - a.count)

      // Process gender distribution
      const genderCounts: { [key: string]: number } = {}
      genderData?.forEach(item => {
        const gender = item.gender || 'Not specified'
        genderCounts[gender] = (genderCounts[gender] || 0) + 1
      })

      const totalGender = Object.values(genderCounts).reduce((sum, count) => sum + count, 0)
      const genderDistribution = Object.entries(genderCounts).map(([gender, count]) => ({
        gender,
        count,
        percentage: totalGender > 0 ? (count / totalGender) * 100 : 0
      })).sort((a, b) => b.count - a.count)

      // Process registration trend
      const monthCounts: { [key: string]: number } = {}
      registrationData?.forEach(item => {
        const month = new Date(item.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        })
        monthCounts[month] = (monthCounts[month] || 0) + 1
      })

      const registrationTrend = Object.entries(monthCounts)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())

      setAnalyticsData({
        elementDistribution,
        genderDistribution,
        registrationTrend,
        identityStats: {
          hasIdentity: stats.usersWithIdentities,
          noIdentity: stats.totalUsers - stats.usersWithIdentities
        }
      })
    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Try to use views data first
    if (!viewsLoading && viewsAnalyticsData.elementDistribution.length > 0) {
      console.log('🚀 Using analytics data from database views')
      setAnalyticsData({
        elementDistribution: viewsAnalyticsData.elementDistribution,
        genderDistribution: viewsAnalyticsData.genderDistribution,
        registrationTrend: viewsAnalyticsData.registrationTrend,
        identityStats: {
          hasIdentity: stats.usersWithIdentities,
          noIdentity: stats.totalUsers - stats.usersWithIdentities
        }
      })
      setMode('views')
      setLoading(false)
    } else if (!statsLoading && stats.totalUsers > 0) {
      // Fallback to manual data loading
      console.log('📋 Database views not available, loading analytics manually')
      setMode('direct')
      loadAnalyticsData()
    }
  }, [statsLoading, stats, viewsLoading, viewsAnalyticsData])

  const getElementInfo = (element: number) => {
    const elementInfo: { [key: number]: { name: string, color: string, symbol: string } } = {
      1: { name: 'Wood', color: '#059669', symbol: '🌳' },    // emerald-600
      2: { name: 'Metal', color: '#4B5563', symbol: '⚡' },   // gray-600  
      3: { name: 'Earth', color: '#D97706', symbol: '🏔️' },   // amber-600
      4: { name: 'Fire', color: '#DC2626', symbol: '🔥' },    // red-600
      5: { name: 'Water', color: '#2563EB', symbol: '🌊' },   // blue-600
    }
    return elementInfo[element] || { name: 'Unknown', color: '#9E9E9E', symbol: '❓' }
  }

  if (loading || statsLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom fontWeight="600">
          User Analytics
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <LinearProgress sx={{ width: '50%' }} />
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="600">
            User Analytics
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              label={mode === 'views' ? '🚀 Database Views' : '📋 Direct Queries'}
              size="small"
              color={mode === 'views' ? 'success' : 'default'}
              variant="outlined"
            />
            {mode === 'direct' && (
              <Chip 
                label="Run SQL views for faster analytics"
                size="small"
                color="warning"
                variant="outlined"
              />
            )}
          </Box>
        </Box>
      </Box>
      
      {/* Overview Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Assessment sx={{ color: 'primary.main', fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {((stats.usersWithIdentities / stats.totalUsers) * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Identity Completion Rate
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingUp sx={{ color: 'success.main', fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {analyticsData.registrationTrend.length > 1 ? 
                      analyticsData.registrationTrend[analyticsData.registrationTrend.length - 1].count : 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Recent Month Signups
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Psychology sx={{ color: 'warning.main', fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {analyticsData.elementDistribution.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Elements
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Group sx={{ color: 'info.main', fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {stats.avgIdentitiesPerUser}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Identities per User
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Element Distribution */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="600">
                Element Distribution
              </Typography>
              {analyticsData.elementDistribution.length === 0 ? (
                <Typography color="text.secondary">No element data available</Typography>
              ) : (
                analyticsData.elementDistribution.map((item) => {
                  const elementInfo = getElementInfo(item.element)
                  return (
                    <Box key={item.element} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6">{elementInfo.symbol}</Typography>
                          <Typography variant="body1">
                            Element {item.element}: {elementInfo.name}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {item.count} ({item.percentage.toFixed(1)}%)
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={item.percentage}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: alpha(elementInfo.color, 0.2),
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: elementInfo.color,
                            borderRadius: 4,
                          }
                        }}
                      />
                    </Box>
                  )
                })
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="600">
                Gender Distribution
              </Typography>
              {analyticsData.genderDistribution.length === 0 ? (
                <Typography color="text.secondary">No gender data available</Typography>
              ) : (
                analyticsData.genderDistribution.map((item) => (
                  <Box key={item.gender} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body1" textTransform="capitalize">
                        {item.gender}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.count} ({item.percentage.toFixed(1)}%)
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={item.percentage}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="600">
                Registration Trend (Last 6 Months)
              </Typography>
              {analyticsData.registrationTrend.length === 0 ? (
                <Typography color="text.secondary">No registration data available</Typography>
              ) : (
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {analyticsData.registrationTrend.map((item) => (
                    <Chip 
                      key={item.month}
                      label={`${item.month}: ${item.count}`}
                      variant="outlined"
                      sx={{ mb: 1 }}
                    />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
