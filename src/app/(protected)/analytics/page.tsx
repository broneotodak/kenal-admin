'use client'

import { useEffect, useState } from 'react'
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid,
  Paper,
  Chip,
  CircularProgress,
} from '@mui/material'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'
import { TrendingUp, Groups, Category, Assessment } from '@mui/icons-material'
import { supabase } from '@/lib/supabase'

interface ChartData {
  userGrowth: any[]
  elementDistribution: any[]
  genderDistribution: any[]
  activityByHour: any[]
  elementRadar: any[]
}

const ELEMENT_COLORS = {
  1: '#FF6B35', 2: '#8B6914', 3: '#87CEEB',
  4: '#4682B4', 5: '#228B22', 6: '#C0C0C0',
  7: '#FFD700', 8: '#4B0082', 9: '#9370DB',
}

const GENDER_COLORS = {
  male: '#2196F3',
  female: '#E91E63',
  other: '#9C27B0',
  unknown: '#9E9E9E'
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalIdentities: 0,
    avgIdentitiesPerUser: 0
  })
  const [chartData, setChartData] = useState<ChartData>({
    userGrowth: [],
    elementDistribution: [],
    genderDistribution: [],
    activityByHour: [],
    elementRadar: []
  })

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const fetchAnalyticsData = async () => {
    try {
      // Fetch overall stats
      const { count: totalUsers } = await supabase
        .from('kd_users')
        .select('*', { count: 'exact', head: true })

      const { count: activeUsers } = await supabase
        .from('kd_users')
        .select('*', { count: 'exact', head: true })
        .eq('active', true)

      const { count: totalIdentities } = await supabase
        .from('kd_identity')
        .select('*', { count: 'exact', head: true })

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalIdentities: totalIdentities || 0,
        avgIdentitiesPerUser: totalUsers ? Math.round((totalIdentities || 0) / totalUsers * 10) / 10 : 0
      })

      // Fetch user growth data (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: users } = await supabase
        .from('kd_users')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at')

      // Process user growth data
      const growthMap = new Map()
      users?.forEach(user => {
        const date = new Date(user.created_at).toLocaleDateString()
        growthMap.set(date, (growthMap.get(date) || 0) + 1)
      })

      const userGrowth = Array.from(growthMap.entries()).map(([date, count]) => ({
        date,
        users: count
      }))

      // Fetch element distribution
      const { data: elementData } = await supabase
        .from('kd_users')
        .select('element_number')
        .not('element_number', 'is', null)

      const elementCounts = elementData?.reduce((acc: any, user) => {
        acc[user.element_number] = (acc[user.element_number] || 0) + 1
        return acc
      }, {})

      const elementDistribution = Object.entries(elementCounts || {}).map(([element, count]) => ({
        element: `Element ${element}`,
        count: count as number,
        color: ELEMENT_COLORS[parseInt(element) as keyof typeof ELEMENT_COLORS]
      }))

      // Element radar data
      const elementRadar = Object.entries(elementCounts || {}).map(([element, count]) => ({
        element: `E${element}`,
        value: count as number,
        fullMark: Math.max(...Object.values(elementCounts || {})) as number
      }))

      // Fetch gender distribution
      const { data: genderData } = await supabase
        .from('kd_users')
        .select('gender')

      const genderCounts = genderData?.reduce((acc: any, user) => {
        const gender = user.gender || 'unknown'
        acc[gender] = (acc[gender] || 0) + 1
        return acc
      }, {})

      const genderDistribution = Object.entries(genderCounts || {}).map(([gender, count]) => ({
        gender: gender.charAt(0).toUpperCase() + gender.slice(1),
        count: count as number,
        color: GENDER_COLORS[gender as keyof typeof GENDER_COLORS]
      }))

      // Simulated activity by hour (would need actual activity data)
      const activityByHour = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        activities: Math.floor(Math.random() * 100) + 20
      }))

      setChartData({
        userGrowth,
        elementDistribution,
        genderDistribution,
        activityByHour,
        elementRadar
      })

      setLoading(false)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon, color }: any) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
          <Box sx={{ color: color || 'primary.main' }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Analytics Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Users" 
            value={stats.totalUsers}
            icon={<Groups fontSize="large" />}
            color="#2196F3"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Active Users" 
            value={stats.activeUsers}
            icon={<TrendingUp fontSize="large" />}
            color="#4CAF50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Total Identities" 
            value={stats.totalIdentities}
            icon={<Category fontSize="large" />}
            color="#FF9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="Avg Identities/User" 
            value={stats.avgIdentitiesPerUser}
            icon={<Assessment fontSize="large" />}
            color="#9C27B0"
          />
        </Grid>

        {/* User Growth Chart */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              User Growth (Last 30 Days)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#2196F3" 
                  strokeWidth={2}
                  dot={{ fill: '#2196F3' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Gender Distribution */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Gender Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.genderDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.gender}: ${entry.count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {chartData.genderDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Element Distribution */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Element Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.elementDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="element" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count">
                  {chartData.elementDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Element Radar Chart */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Element Balance
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={chartData.elementRadar}>
                <PolarGrid />
                <PolarAngleAxis dataKey="element" />
                <PolarRadiusAxis />
                <Radar 
                  name="Users" 
                  dataKey="value" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6} 
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Activity Heatmap */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Activity by Hour (Simulated)
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData.activityByHour}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="activities" fill="#FF9800" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}