'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Switch,
  FormControlLabel,
  useTheme,
  alpha,
  Stack,
  Paper,
  Divider,
} from '@mui/material'
import {
  TrendingUp,
  Timeline,
  Assessment,
  FilterList,
  ShowChart,
  Event as EventIcon,
} from '@mui/icons-material'
import { supabase } from '@/lib/supabase'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface GrowthEvent {
  id: string
  name: string
  start_date: string
  end_date: string
  event_type: string
  impact_level: number
  notes?: string
}

interface GrowthData {
  date: string
  totalUsers: number
  newUsers: number
  directUsers: number
  invitedUsers: number
  isEventPeriod: boolean
  eventNames?: string[]
}

interface ForecastData {
  date: string
  organic: number
  withEvents: number
  confidence: number
  conservative: number
  optimistic: number
  trendLine: number
  seasonalAdjusted: number
}

interface TrendAnalysis {
  currentTrend: 'accelerating' | 'stable' | 'decelerating'
  trendStrength: number
  weeklySeasonality: number[]
  monthlyGrowthRate: number
  weeklyGrowthRate: number
  volatility: number
}

export default function GrowthForecastingPage() {
  const theme = useTheme()
  const [events, setEvents] = useState<GrowthEvent[]>([])
  const [growthData, setGrowthData] = useState<GrowthData[]>([])
  const [forecastData, setForecastData] = useState<ForecastData[]>([])
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('6m')
  const [showEvents, setShowEvents] = useState(true)
  const [excludeEvents, setExcludeEvents] = useState(true)
  const [forecastDays, setForecastDays] = useState(30)
  const [forecastModel, setForecastModel] = useState('realistic') // conservative, realistic, optimistic

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load events from localStorage with detailed debugging
      const storedEventsRaw = localStorage.getItem('growth_events')
      console.log('Raw localStorage data:', storedEventsRaw)
      
      const eventList: GrowthEvent[] = storedEventsRaw ? JSON.parse(storedEventsRaw) : []
      console.log('Parsed events:', eventList)
      setEvents(eventList)
      
      // Calculate date range
      const endDate = new Date()
      let startDate = new Date()
      switch (timeRange) {
        case '1m':
          startDate.setMonth(endDate.getMonth() - 1)
          break
        case '3m':
          startDate.setMonth(endDate.getMonth() - 3)
          break
        case '6m':
          startDate.setMonth(endDate.getMonth() - 6)
          break
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1)
          break
      }
      
      console.log('Time range debug:', {
        timeRange,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        eventList: eventList.map(e => ({
          name: e.name,
          start: e.start_date,
          end: e.end_date,
          isInRange: e.start_date >= startDate.toISOString().split('T')[0] || e.end_date >= startDate.toISOString().split('T')[0]
        }))
      })

      // Get user registration data with invitation status
      const { data: userData } = await supabase
        .from('kd_users')
        .select('created_at, join_by_invitation')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })

      // Process growth data
      const processedData = processGrowthData(userData || [], eventList, startDate, endDate)
      setGrowthData(processedData)
      
      // Generate forecast
      const forecast = generateForecast(processedData, forecastDays, eventList)
      setForecastData(forecast)
      
    } catch (error) {
      console.error('Error loading growth data:', error)
    } finally {
      setLoading(false)
    }
  }

  const processGrowthData = (
    users: { created_at: string; join_by_invitation: boolean }[], 
    eventList: GrowthEvent[], 
    startDate: Date, 
    endDate: Date
  ): GrowthData[] => {
    const dataMap = new Map<string, { 
      totalUsers: number; 
      newUsers: number; 
      directUsers: number; 
      invitedUsers: number 
    }>()
    let cumulativeUsers = 0

    // Group users by date with invitation status
    users.forEach(user => {
      const date = new Date(user.created_at).toISOString().split('T')[0]
      if (!dataMap.has(date)) {
        dataMap.set(date, { totalUsers: 0, newUsers: 0, directUsers: 0, invitedUsers: 0 })
      }
      const dayData = dataMap.get(date)!
      dayData.newUsers += 1
      if (user.join_by_invitation) {
        dayData.invitedUsers += 1
      } else {
        dayData.directUsers += 1
      }
    })

          // Fill in missing dates and calculate cumulative
      const result: GrowthData[] = []
      const currentDate = new Date(startDate)
      
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0]
        const dayData = dataMap.get(dateStr) || { 
          totalUsers: 0, 
          newUsers: 0, 
          directUsers: 0, 
          invitedUsers: 0 
        }
        
        cumulativeUsers += dayData.newUsers
        
        // Check if this date is within any event period
        const activeEvents = eventList.filter(event => 
          dateStr >= event.start_date && dateStr <= event.end_date
        )
        
        // Debug event matching for first few dates
        if (result.length < 5 && eventList.length > 0) {
          console.log(`Date ${dateStr} check:`, {
            dateStr,
            availableEvents: eventList.map(e => ({ name: e.name, start: e.start_date, end: e.end_date })),
            activeEventsForDate: activeEvents.map(e => e.name),
            dayData
          })
        }
        
        result.push({
          date: dateStr,
          totalUsers: cumulativeUsers,
          newUsers: dayData.newUsers,
          directUsers: dayData.directUsers,
          invitedUsers: dayData.invitedUsers,
          isEventPeriod: activeEvents.length > 0,
          eventNames: activeEvents.map(e => e.name)
        })
        
        currentDate.setDate(currentDate.getDate() + 1)
      }
    
    return result
  }

  // Advanced Trend Analysis
  const analyzeTrend = (data: GrowthData[]): TrendAnalysis => {
    if (data.length < 14) {
      return {
        currentTrend: 'stable',
        trendStrength: 0,
        weeklySeasonality: Array(7).fill(1),
        monthlyGrowthRate: 0,
        weeklyGrowthRate: 0,
        volatility: 0
      }
    }

    const baselineData = excludeEvents ? data.filter(d => !d.isEventPeriod) : data
    
    // Calculate growth rates
    const dailyGrowthRates = []
    for (let i = 1; i < baselineData.length; i++) {
      const rate = baselineData[i].newUsers - baselineData[i-1].newUsers
      dailyGrowthRates.push(rate)
    }

    // Exponential Moving Average for trend detection
    const alpha = 0.3
    let ema = dailyGrowthRates[0] || 0
    const emaValues = [ema]
    
    for (let i = 1; i < dailyGrowthRates.length; i++) {
      ema = alpha * dailyGrowthRates[i] + (1 - alpha) * ema
      emaValues.push(ema)
    }

    // Trend analysis (compare recent vs older EMA)
    const recentEMA = emaValues.slice(-7).reduce((sum, val) => sum + val, 0) / 7
    const olderEMA = emaValues.slice(-21, -7).reduce((sum, val) => sum + val, 0) / 14
    const trendStrength = Math.abs(recentEMA - olderEMA)
    
    let currentTrend: 'accelerating' | 'stable' | 'decelerating' = 'stable'
    if (recentEMA > olderEMA + trendStrength * 0.1) currentTrend = 'accelerating'
    else if (recentEMA < olderEMA - trendStrength * 0.1) currentTrend = 'decelerating'

    // Weekly seasonality detection
    const weeklySeasonality = Array(7).fill(0)
    const weeklyCounts = Array(7).fill(0)
    
    baselineData.forEach(d => {
      const dayOfWeek = new Date(d.date).getDay()
      weeklySeasonality[dayOfWeek] += d.newUsers
      weeklyCounts[dayOfWeek]++
    })
    
    for (let i = 0; i < 7; i++) {
      weeklySeasonality[i] = weeklyCounts[i] > 0 ? weeklySeasonality[i] / weeklyCounts[i] : 1
    }
    
    // Normalize seasonality
    const avgSeasonal = weeklySeasonality.reduce((sum, val) => sum + val, 0) / 7
    for (let i = 0; i < 7; i++) {
      weeklySeasonality[i] = avgSeasonal > 0 ? weeklySeasonality[i] / avgSeasonal : 1
    }

    // Calculate growth rates
    const totalPeriodDays = baselineData.length
    const totalNewUsers = baselineData.reduce((sum, d) => sum + d.newUsers, 0)
    const avgDailyUsers = totalNewUsers / totalPeriodDays
    
    const monthlyGrowthRate = avgDailyUsers * 30
    const weeklyGrowthRate = avgDailyUsers * 7
    
    // Volatility calculation
    const variance = dailyGrowthRates.reduce((sum, rate) => 
      sum + Math.pow(rate - (totalNewUsers / dailyGrowthRates.length), 2), 0
    ) / dailyGrowthRates.length
    const volatility = Math.sqrt(variance)

    return {
      currentTrend,
      trendStrength,
      weeklySeasonality,
      monthlyGrowthRate,
      weeklyGrowthRate,
      volatility
    }
  }

  // Advanced Forecasting with Multiple Models
  const generateForecast = (
    historicalData: GrowthData[], 
    days: number, 
    eventList: GrowthEvent[]
  ): ForecastData[] => {
    if (historicalData.length === 0) return []
    
    const baselineData = excludeEvents 
      ? historicalData.filter(d => !d.isEventPeriod)
      : historicalData
    
    // Perform trend analysis
    const trendAnalysis = analyzeTrend(historicalData)
    setTrendAnalysis(trendAnalysis)
    
    // Exponential Moving Average for better trend detection
    const alpha = 0.2
    let ema = baselineData.length > 0 ? baselineData[0].newUsers : 0
    const emaValues = [ema]
    
    for (let i = 1; i < baselineData.length; i++) {
      ema = alpha * baselineData[i].newUsers + (1 - alpha) * ema
      emaValues.push(ema)
    }
    
    const recentEMA = emaValues.length > 0 ? emaValues[emaValues.length - 1] : 0
    const lastDataPoint = historicalData[historicalData.length - 1]
    const forecast: ForecastData[] = []
    
    // Calculate base growth trend
    const trendMultiplier = trendAnalysis.currentTrend === 'accelerating' ? 1.1 
      : trendAnalysis.currentTrend === 'decelerating' ? 0.9 : 1.0
    
    for (let i = 0; i < days; i++) {
      const forecastDate = new Date(lastDataPoint.date)
      forecastDate.setDate(forecastDate.getDate() + i + 1)
      const dateStr = forecastDate.toISOString().split('T')[0]
      const dayOfWeek = forecastDate.getDay()
      
      // Seasonal adjustment
      const seasonalMultiplier = trendAnalysis.weeklySeasonality[dayOfWeek]
      
      // Advanced growth calculation with decay
      const decayFactor = Math.pow(0.995, i) // Slight decay over time
      const baseGrowth = recentEMA * trendMultiplier * decayFactor * seasonalMultiplier
      
      // Progressive forecasting (each day builds on previous)
      const progressiveGrowth = i === 0 
        ? lastDataPoint.totalUsers + baseGrowth
        : forecast[i-1].organic + baseGrowth
      
      // Conservative, realistic, and optimistic scenarios
      const volatilityFactor = Math.min(trendAnalysis.volatility, recentEMA * 0.5)
      const conservative = progressiveGrowth - volatilityFactor
      const realistic = progressiveGrowth
      const optimistic = progressiveGrowth + volatilityFactor * 0.7
      
      // Check for future events
      const futureEvents = eventList.filter(event => 
        dateStr >= event.start_date && dateStr <= event.end_date &&
        new Date(event.start_date) > new Date()
      )
      
      // Advanced event impact modeling
      let withEventsGrowth = realistic
      if (futureEvents.length > 0) {
        futureEvents.forEach(event => {
          const eventStart = new Date(event.start_date)
          const eventEnd = new Date(event.end_date)
          const currentDate = forecastDate
          
          // Event impact phases: build-up, peak, decay
          const totalEventDays = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24)
          const daysSinceStart = (currentDate.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24)
          
          let impactMultiplier = 1
          if (daysSinceStart < 0) {
            // Pre-event build-up (7 days before)
            const daysBeforeEvent = Math.abs(daysSinceStart)
            if (daysBeforeEvent <= 7) {
              impactMultiplier = 1 + (event.impact_level * 0.1 * (7 - daysBeforeEvent) / 7)
            }
          } else if (daysSinceStart <= totalEventDays) {
            // During event - peak impact
            impactMultiplier = 1 + (event.impact_level * 0.3)
          } else if (daysSinceStart <= totalEventDays + 3) {
            // Post-event decay (3 days after)
            const daysAfterEvent = daysSinceStart - totalEventDays
            impactMultiplier = 1 + (event.impact_level * 0.15 * (3 - daysAfterEvent) / 3)
          }
          
          withEventsGrowth *= impactMultiplier
        })
      }
      
      // Statistical confidence calculation
      const timeDecay = Math.pow(0.95, i / 7) // Weekly decay
      const trendConfidence = Math.max(0.5, 1 - trendAnalysis.trendStrength * 0.1)
      const dataQuality = Math.min(1, baselineData.length / 30) // More data = higher confidence
      const confidence = Math.max(0.2, timeDecay * trendConfidence * dataQuality)
      
      forecast.push({
        date: dateStr,
        organic: Math.max(0, realistic),
        withEvents: Math.max(0, withEventsGrowth),
        confidence: confidence,
        conservative: Math.max(0, conservative),
        optimistic: Math.max(0, optimistic),
        trendLine: Math.max(0, progressiveGrowth),
        seasonalAdjusted: Math.max(0, progressiveGrowth * seasonalMultiplier)
      })
    }
    
    return forecast
  }

  const chartData = {
    labels: [
      ...growthData.map(d => new Date(d.date).toLocaleDateString()),
      ...forecastData.map(d => new Date(d.date).toLocaleDateString())
    ],
    datasets: [
      {
        label: 'Historical Growth',
        data: [
          ...growthData.map(d => d.totalUsers),
          ...Array(forecastData.length).fill(null)
        ],
        borderColor: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        borderWidth: 3,
        pointRadius: 1,
        pointHoverRadius: 5,
        tension: 0.1,
      },
      ...(excludeEvents ? [{
        label: 'Baseline (No Events)',
        data: [
          ...growthData.filter(d => !d.isEventPeriod).map(d => d.totalUsers),
          ...Array(forecastData.length).fill(null)
        ],
        borderColor: theme.palette.success.main,
        backgroundColor: alpha(theme.palette.success.main, 0.1),
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 1,
        pointHoverRadius: 4,
      }] : []),
      // Confidence Interval (Conservative to Optimistic)
      {
        label: 'Confidence Band (Conservative)',
        data: [
          ...Array(growthData.length).fill(null),
          ...forecastData.map(d => d.conservative)
        ],
        borderColor: alpha(theme.palette.grey[500], 0.5),
        backgroundColor: alpha(theme.palette.grey[300], 0.1),
        borderWidth: 1,
        borderDash: [2, 2],
        pointRadius: 0,
        fill: false,
      },
      {
        label: 'Confidence Band (Optimistic)',
        data: [
          ...Array(growthData.length).fill(null),
          ...forecastData.map(d => d.optimistic)
        ],
        borderColor: alpha(theme.palette.grey[500], 0.5),
        backgroundColor: alpha(theme.palette.grey[300], 0.2),
        borderWidth: 1,
        borderDash: [2, 2],
        pointRadius: 0,
        fill: '-1', // Fill between this and previous dataset
      },
      // Main Forecast Lines
      {
        label: `${forecastModel.charAt(0).toUpperCase() + forecastModel.slice(1)} Forecast`,
        data: [
          ...Array(growthData.length).fill(null),
          ...forecastData.map(d => {
            switch(forecastModel) {
              case 'conservative': return d.conservative
              case 'optimistic': return d.optimistic
              default: return d.organic
            }
          })
        ],
        borderColor: theme.palette.info.main,
        backgroundColor: alpha(theme.palette.info.main, 0.2),
        borderWidth: 3,
        borderDash: [8, 4],
        pointRadius: 2,
        pointHoverRadius: 6,
        tension: 0.2,
      },
      {
        label: 'Forecast with Events',
        data: [
          ...Array(growthData.length).fill(null),
          ...forecastData.map(d => d.withEvents)
        ],
        borderColor: theme.palette.warning.main,
        backgroundColor: alpha(theme.palette.warning.main, 0.2),
        borderWidth: 3,
        borderDash: [12, 6],
        pointRadius: 2,
        pointHoverRadius: 6,
        tension: 0.2,
      },
      // Trend Line
      {
        label: 'Trend Line',
        data: [
          ...Array(growthData.length).fill(null),
          ...forecastData.map(d => d.trendLine)
        ],
        borderColor: alpha(theme.palette.secondary.main, 0.7),
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderDash: [3, 3],
        pointRadius: 0,
        pointHoverRadius: 3,
      },
    ].filter(Boolean),
  }

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'User Growth Analysis & Forecasting',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Total Users',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
    },
  }

  // Calculate comprehensive statistics using real database data
  const totalUsers = growthData.length > 0 ? growthData[growthData.length - 1].totalUsers : 0
  const directUsers = growthData.reduce((sum, d) => sum + d.directUsers, 0)
  const invitedUsers = growthData.reduce((sum, d) => sum + d.invitedUsers, 0)
  const eventUsers = growthData.filter(d => d.isEventPeriod).reduce((sum, d) => sum + d.newUsers, 0)
  const activeEvents = events.filter(e => 
    new Date(e.end_date) >= new Date() && new Date(e.start_date) <= new Date()
  ).length

  // Debug event data
  console.log('Event Debug Info:', {
    totalEvents: events.length,
    activeEvents,
    growthDataWithEvents: growthData.filter(d => d.isEventPeriod).length,
    eventUsers,
    excludeEventsToggle: excludeEvents,
    sampleEvents: events.slice(0, 3),
    sampleGrowthData: growthData.slice(0, 5)
  })

  // Advanced metrics
  const averageConfidence = forecastData.length > 0 
    ? Math.round(forecastData.reduce((sum, d) => sum + d.confidence, 0) / forecastData.length * 100)
    : 0
  
  const projectedGrowth = forecastData.length > 0 && totalUsers > 0
    ? Math.round(((forecastData[forecastData.length - 1].organic - totalUsers) / totalUsers) * 100)
    : 0

  const nextWeekForecast = forecastData.slice(0, 7).reduce((sum, d) => 
    sum + (d.organic - (forecastData[0]?.organic || totalUsers)), 0
  )

  // Calculate invitation rate
  const invitationRate = totalUsers > 0 ? Math.round((invitedUsers / totalUsers) * 100) : 0

  useEffect(() => {
    loadData()
  }, [timeRange, excludeEvents, forecastDays, forecastModel])

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="600" gutterBottom>
            Growth Forecasting
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Event-aware user growth analysis and predictions
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Button 
            variant="outlined" 
            size="small" 
            onClick={loadData}
            disabled={loading}
          >
            🔄 Refresh Data
          </Button>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="1m">1 Month</MenuItem>
              <MenuItem value="3m">3 Months</MenuItem>
              <MenuItem value="6m">6 Months</MenuItem>
              <MenuItem value="1y">1 Year</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Forecast Days</InputLabel>
            <Select
              value={forecastDays}
              label="Forecast Days"
              onChange={(e) => setForecastDays(Number(e.target.value))}
            >
              <MenuItem value={7}>7 Days</MenuItem>
              <MenuItem value={30}>30 Days</MenuItem>
              <MenuItem value={60}>60 Days</MenuItem>
              <MenuItem value={90}>90 Days</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Forecast Model</InputLabel>
            <Select
              value={forecastModel}
              label="Forecast Model"
              onChange={(e) => setForecastModel(e.target.value)}
            >
              <MenuItem value="conservative">Conservative</MenuItem>
              <MenuItem value="realistic">Realistic</MenuItem>
              <MenuItem value="optimistic">Optimistic</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>

      {/* Stats Cards - Standardized Heights */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: 140 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingUp sx={{ color: 'primary.main', fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {totalUsers.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                  <Divider sx={{ my: 0.5 }} />
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    {directUsers.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Direct Registrations
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: 140 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <EventIcon sx={{ color: 'secondary.main', fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {invitedUsers.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Invited Users
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({invitationRate}% of total)
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: 140 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ShowChart sx={{ color: 'warning.main', fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {eventUsers.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Event registration (includes invited)
                  </Typography>
                  {events.length === 0 && (
                    <Typography variant="caption" color="warning.main" sx={{ display: 'block', fontSize: '0.65rem' }}>
                      No events configured
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: 140 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Assessment sx={{ color: 'info.main', fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {averageConfidence}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Confidence
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Forecast Metrics - Standardized Heights */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: 140 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Timeline sx={{ color: 'secondary.main', fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold" color={projectedGrowth >= 0 ? 'success.main' : 'error.main'}>
                    {projectedGrowth >= 0 ? '+' : ''}{projectedGrowth}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Projected Growth
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: 140 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <FilterList sx={{ color: 'warning.main', fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {Math.round(nextWeekForecast)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Predicted new users in 7 days
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: 140 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <EventIcon sx={{ color: 'primary.main', fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {activeEvents}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Events
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: 140 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ShowChart sx={{ color: trendAnalysis?.currentTrend === 'accelerating' ? 'success.main' : 
                  trendAnalysis?.currentTrend === 'decelerating' ? 'error.main' : 'info.main', fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {trendAnalysis?.currentTrend === 'accelerating' ? '📈' 
                     : trendAnalysis?.currentTrend === 'decelerating' ? '📉' 
                     : '➡️'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Current User Growth Trend
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Trend Analysis Insights */}
      {trendAnalysis && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="600" gutterBottom>
                  📊 Trend Analysis Insights
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Typography variant="h6" fontWeight="bold" color={
                        trendAnalysis.currentTrend === 'accelerating' ? 'success.main' 
                        : trendAnalysis.currentTrend === 'decelerating' ? 'error.main' 
                        : 'info.main'
                      }>
                        {trendAnalysis.currentTrend === 'accelerating' ? '📈 Accelerating' 
                         : trendAnalysis.currentTrend === 'decelerating' ? '📉 Decelerating' 
                         : '➡️ Stable'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Current Trend
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {trendAnalysis.monthlyGrowthRate.toFixed(1)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Monthly Growth Rate
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {(trendAnalysis.volatility / trendAnalysis.weeklyGrowthRate * 100).toFixed(1)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Volatility Index
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                <Typography variant="subtitle2" fontWeight="600" sx={{ mt: 2, mb: 1 }}>
                  Weekly Seasonality Pattern
                </Typography>
                <Grid container spacing={1}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <Grid item xs key={day}>
                      <Box sx={{ 
                        textAlign: 'center', 
                        p: 1, 
                        bgcolor: alpha(theme.palette.primary.main, Math.max(0, Math.min(1, trendAnalysis.weeklySeasonality[index] - 0.5))),
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}>
                        <Typography variant="caption" fontWeight="bold">
                          {day}
                        </Typography>
                        <Typography variant="body2">
                          {(trendAnalysis.weeklySeasonality[index] * 100).toFixed(0)}%
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="600" gutterBottom>
                  ⚙️ Analysis Settings
                </Typography>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showEvents}
                        onChange={(e) => setShowEvents(e.target.checked)}
                      />
                    }
                    label="Show Event Periods"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={excludeEvents}
                        onChange={(e) => setExcludeEvents(e.target.checked)}
                      />
                    }
                    label="Exclude Events from Baseline"
                  />
                </Stack>
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    🎯 <strong>Real Data Sources:</strong><br/>
                    • Direct vs. Invited registrations from database<br/>
                    • Weekly user registration patterns<br/>
                    • Statistical trend analysis (acceleration/deceleration)<br/>
                    • Multiple forecast scenarios with confidence bands<br/>
                    • Event-aware growth modeling
                  </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Growth Chart */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="600" gutterBottom>
            Growth Analysis
          </Typography>
          <Box sx={{ height: 400, mt: 2 }}>
            <Line data={chartData} options={chartOptions} />
          </Box>
        </CardContent>
      </Card>

      {/* Event Impact Analysis */}
      {events.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Event Impact Analysis
            </Typography>
            <Grid container spacing={2}>
              {events.map((event) => {
                const eventPeriodData = growthData.filter(d => 
                  d.date >= event.start_date && d.date <= event.end_date
                )
                const eventUsers = eventPeriodData.reduce((sum, d) => sum + d.newUsers, 0)
                const isActive = new Date(event.end_date) >= new Date() && new Date(event.start_date) <= new Date()
                const isUpcoming = new Date(event.start_date) > new Date()

                return (
                  <Grid item xs={12} sm={6} md={4} key={event.id}>
                    <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {event.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" fontWeight="bold">
                          {eventUsers} users
                        </Typography>
                        <Chip
                          size="small"
                          label={isUpcoming ? 'Upcoming' : isActive ? 'Active' : 'Completed'}
                          color={isUpcoming ? 'info' : isActive ? 'success' : 'default'}
                          variant="outlined"
                        />
                      </Stack>
                    </Paper>
                  </Grid>
                )
              })}
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  )
} 