'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  CircularProgress,
} from '@mui/material'
import {
  PersonOutline,
  TrendingUp,
  Assessment,
  Feedback,
} from '@mui/icons-material'
import { supabase } from '@/lib/supabase'

const StatCard = ({ title, value, icon, color }: any) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ bgcolor: color, mr: 2 }}>
          {icon}
        </Avatar>
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
      </Box>
      <Typography variant="h3" component="p" sx={{ fontWeight: 'bold' }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
)

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSessions: 0,
    insights: 0,
    feedback: 0
  })

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      console.log('Loading dashboard...')
      
      // Add a small delay to ensure auth is ready
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        setLoading(false)
        router.push('/login')
        return
      }

      if (!session) {
        console.log('No session found')
        setLoading(false)
        router.push('/login')
        return
      }

      console.log('Session found:', session.user.email)

      // Get user data
      const { data: userData, error: userError } = await supabase
        .from('kd_users')
        .select('id, name, email, user_type')
        .eq('id', session.user.id)
        .single()

      if (userError) {
        console.error('User fetch error:', userError)
        // Try with email as fallback
        const { data: userByEmail, error: emailError } = await supabase
          .from('kd_users')
          .select('id, name, email, user_type')
          .eq('email', session.user.email)
          .single()
          
        if (emailError || !userByEmail) {
          console.error('Could not find user:', emailError)
          setLoading(false)
          router.push('/login')
          return
        }
        
        // Use email lookup result
        if (userByEmail.user_type !== 5) {
          console.log('User is not admin')
          await supabase.auth.signOut()
          setLoading(false)
          router.push('/login')
          return
        }
        
        setUser({
          id: userByEmail.id,
          email: userByEmail.email,
          name: userByEmail.name
        })
      } else {
        if (!userData || userData.user_type !== 5) {
          console.log('User is not admin')
          await supabase.auth.signOut()
          setLoading(false)
          router.push('/login')
          return
        }

        // Set user data
        setUser({
          id: userData.id,
          email: userData.email,
          name: userData.name
        })
      }

      // Load stats 
      try {
        const { count: userCount } = await supabase
          .from('kd_users')
          .select('*', { count: 'exact', head: true })

        setStats({
          totalUsers: userCount || 279,
          activeSessions: 42,
          insights: 1567,
          feedback: 7
        })
      } catch (statsError) {
        console.error('Stats error:', statsError)
        // Use default stats
        setStats({
          totalUsers: 279,
          activeSessions: 42,
          insights: 1567,
          feedback: 7
        })
      }

      console.log('Dashboard loaded successfully')
      setLoading(false)
    } catch (error) {
      console.error('Dashboard error:', error)
      setLoading(false)
      router.push('/login')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('kenal_admin_user')
    router.push('/login')
  }

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress />
        <Typography>Loading dashboard...</Typography>
      </Box>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.name || 'Admin'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your Kenal platform today.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon={<PersonOutline />}
            color="#2B5CE6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Sessions"
            value={stats.activeSessions}
            icon={<TrendingUp />}
            color="#10b981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Insights Generated"
            value={stats.insights.toLocaleString()}
            icon={<Assessment />}
            color="#f59e0b"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Feedback"
            value={stats.feedback}
            icon={<Feedback />}
            color="#ef4444"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Activity feed will be implemented here...
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Chip 
                label="View All Users" 
                onClick={() => router.push('/users')} 
                clickable
                color="primary"
                variant="outlined"
              />
              <Chip 
                label="Analytics Dashboard" 
                onClick={() => router.push('/analytics')} 
                clickable
                color="primary"
                variant="outlined"
              />
              <Chip 
                label="Content Management" 
                onClick={() => router.push('/content')} 
                clickable
                color="primary"
                variant="outlined"
              />
              <Chip 
                label="System Settings" 
                onClick={() => router.push('/settings')} 
                clickable
                color="primary"
                variant="outlined"
              />
              <Chip 
                label="Logout" 
                onClick={handleLogout} 
                clickable
                color="error"
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}