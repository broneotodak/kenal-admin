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
  isEventPeriod: boolean
  eventNames?: string[]
}

interface ForecastData {
  date: string
  organic: number
  withEvents: number
  confidence: number
}

export default function GrowthForecastingPage() {
  const theme = useTheme()
  const [events, setEvents] = useState<GrowthEvent[]>([])
  const [growthData, setGrowthData] = useState<GrowthData[]>([])
  const [forecastData, setForecastData] = useState<ForecastData[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('6m')
  const [showEvents, setShowEvents] = useState(true)
  const [excludeEvents, setExcludeEvents] = useState(true)
  const [forecastDays, setForecastDays] = useState(30)

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load events from localStorage
      const storedEvents = localStorage.getItem('growth_events')
      const eventList: GrowthEvent[] = storedEvents ? JSON.parse(storedEvents) : []
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

      // Get user registration data
      const { data: userData } = await supabase
        .from('kd_users')
        .select('created_at')
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
    users: { created_at: string }[], 
    eventList: GrowthEvent[], 
    startDate: Date, 
    endDate: Date
  ): GrowthData[] => {
    const dataMap = new Map<string, { totalUsers: number; newUsers: number }>()
    let cumulativeUsers = 0

    // Group users by date
    users.forEach(user => {
      const date = new Date(user.created_at).toISOString().split('T')[0]
      if (!dataMap.has(date)) {
        dataMap.set(date, { totalUsers: 0, newUsers: 0 })
      }
      const dayData = dataMap.get(date)!
      dayData.newUsers += 1
    })

    // Fill in missing dates and calculate cumulative
    const result: GrowthData[] = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const dayData = dataMap.get(dateStr) || { totalUsers: 0, newUsers: 0 }
      
      cumulativeUsers += dayData.newUsers
      
      // Check if this date is within any event period
      const activeEvents = eventList.filter(event => 
        dateStr >= event.start_date && dateStr <= event.end_date
      )
      
      result.push({
        date: dateStr,
        totalUsers: cumulativeUsers,
        newUsers: dayData.newUsers,
        isEventPeriod: activeEvents.length > 0,
        eventNames: activeEvents.map(e => e.name)
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return result
  }

  const generateForecast = (
    historicalData: GrowthData[], 
    days: number, 
    eventList: GrowthEvent[]
  ): ForecastData[] => {
    if (historicalData.length === 0) return []
    
    // Calculate organic growth rate (excluding event periods)
    const organicData = excludeEvents 
      ? historicalData.filter(d => !d.isEventPeriod)
      : historicalData
    
    const organicGrowthRates = []
    for (let i = 1; i < organicData.length; i++) {
      const rate = organicData[i].newUsers - organicData[i-1].newUsers
      organicGrowthRates.push(rate)
    }
    
    const avgOrganicGrowth = organicGrowthRates.length > 0 
      ? organicGrowthRates.reduce((sum, rate) => sum + rate, 0) / organicGrowthRates.length
      : 0
    
    const lastDataPoint = historicalData[historicalData.length - 1]
    const forecast: ForecastData[] = []
    
    for (let i = 0; i < days; i++) {
      const forecastDate = new Date(lastDataPoint.date)
      forecastDate.setDate(forecastDate.getDate() + i + 1)
      const dateStr = forecastDate.toISOString().split('T')[0]
      
      // Check for future events
      const futureEvents = eventList.filter(event => 
        dateStr >= event.start_date && dateStr <= event.end_date &&
        new Date(event.start_date) > new Date()
      )
      
      const organicGrowth = lastDataPoint.totalUsers + (avgOrganicGrowth * (i + 1))
      let withEventsGrowth = organicGrowth
      
      // Apply event boost if there are future events
      if (futureEvents.length > 0) {
        const eventMultiplier = futureEvents.reduce((sum, event) => 
          sum + (event.impact_level * 0.2), 1
        )
        withEventsGrowth = organicGrowth * eventMultiplier
      }
      
      forecast.push({
        date: dateStr,
        organic: Math.max(0, organicGrowth),
        withEvents: Math.max(0, withEventsGrowth),
        confidence: Math.max(0.3, 1 - (i / days) * 0.7) // Decreasing confidence over time
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
        borderWidth: 2,
        pointRadius: 1,
        pointHoverRadius: 4,
      },
      ...(excludeEvents ? [{
        label: 'Organic Growth (Events Excluded)',
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
      {
        label: 'Organic Forecast',
        data: [
          ...Array(growthData.length).fill(null),
          ...forecastData.map(d => d.organic)
        ],
        borderColor: theme.palette.info.main,
        backgroundColor: alpha(theme.palette.info.main, 0.1),
        borderWidth: 2,
        borderDash: [10, 5],
        pointRadius: 2,
        pointHoverRadius: 5,
      },
      {
        label: 'Forecast with Events',
        data: [
          ...Array(growthData.length).fill(null),
          ...forecastData.map(d => d.withEvents)
        ],
        borderColor: theme.palette.warning.main,
        backgroundColor: alpha(theme.palette.warning.main, 0.1),
        borderWidth: 2,
        borderDash: [15, 5],
        pointRadius: 2,
        pointHoverRadius: 5,
      },
    ],
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

  // Calculate statistics
  const totalUsers = growthData.length > 0 ? growthData[growthData.length - 1].totalUsers : 0
  const organicUsers = growthData.filter(d => !d.isEventPeriod).reduce((sum, d) => sum + d.newUsers, 0)
  const eventUsers = growthData.filter(d => d.isEventPeriod).reduce((sum, d) => sum + d.newUsers, 0)
  const activeEvents = events.filter(e => 
    new Date(e.end_date) >= new Date() && new Date(e.start_date) <= new Date()
  ).length

  useEffect(() => {
    loadData()
  }, [timeRange, excludeEvents, forecastDays])

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
        <Stack direction="row" spacing={2}>
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
        </Stack>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingUp sx={{ color: 'primary.main', fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {totalUsers.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
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
                <ShowChart sx={{ color: 'success.main', fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {organicUsers.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Organic Users
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
                <EventIcon sx={{ color: 'warning.main', fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {eventUsers.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Event-Driven Users
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
                <Assessment sx={{ color: 'info.main', fontSize: 40 }} />
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
      </Grid>

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="600" gutterBottom>
            Analysis Settings
          </Typography>
          <Stack direction="row" spacing={3} flexWrap="wrap">
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
              label="Exclude Events from Organic Trend"
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Excluding events provides a cleaner baseline for organic growth forecasting
          </Typography>
        </CardContent>
      </Card>

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