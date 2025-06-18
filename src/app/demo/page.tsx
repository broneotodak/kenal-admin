'use client'

import { useState } from 'react'
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
  Alert,
} from '@mui/material'
import {
  PersonOutline,
  TrendingUp,
  Assessment,
  Feedback,
} from '@mui/icons-material'
import { gradients } from '@/theme/kenalTheme'

const StatCard = ({ title, value, icon, color }: any) => (
  <Card 
    sx={{ 
      height: '100%',
      background: 'white',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
      }
    }}
  >
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar 
          sx={{ 
            bgcolor: color, 
            mr: 2,
            width: 48,
            height: 48,
          }}
        >
          {icon}
        </Avatar>
        <Typography variant="h6" component="h2" color="text.secondary">
          {title}
        </Typography>
      </Box>
      <Typography variant="h3" component="p" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
)

export default function DemoPage() {
  const router = useRouter()
  const [stats] = useState({
    totalUsers: 279,
    activeSessions: 42,
    insights: 1567,
    feedback: 7
  })

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Alert severity="info" sx={{ mb: 4 }}>
        This is a demo page to showcase the KENAL design implementation. Authentication is bypassed for testing.
      </Alert>

      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 700,
            background: gradients.primary,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Welcome to KENAL Admin Dashboard
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
            color="#1e3a8a"
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
            color="#ea580c"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Feedback"
            value={stats.feedback}
            icon={<Feedback />}
            color="#dc2626"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper 
            sx={{ 
              p: 3,
              background: 'white',
              borderRadius: 2,
            }}
          >
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ color: 'primary.main', fontWeight: 600 }}
            >
              Recent Activity
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ 
                p: 2, 
                mb: 2, 
                borderLeft: '3px solid',
                borderColor: 'primary.main',
                backgroundColor: 'gray.50'
              }}>
                <Typography variant="body2" fontWeight={500}>
                  New user registered: Sarah Johnson
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  2 minutes ago • Element: Water (7)
                </Typography>
              </Box>
              <Box sx={{ 
                p: 2, 
                mb: 2, 
                borderLeft: '3px solid',
                borderColor: 'secondary.main',
                backgroundColor: 'gray.50'
              }}>
                <Typography variant="body2" fontWeight={500}>
                  Pattern analysis completed for batch #1567
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  15 minutes ago • 42 users analyzed
                </Typography>
              </Box>
              <Box sx={{ 
                p: 2, 
                borderLeft: '3px solid',
                borderColor: 'success.main',
                backgroundColor: 'gray.50'
              }}>
                <Typography variant="body2" fontWeight={500}>
                  System health check: All systems operational
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  1 hour ago
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper 
            sx={{ 
              p: 3,
              background: gradients.primary,
              color: 'white'
            }}
          >
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Quick Actions
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Chip 
                label="View All Users" 
                onClick={() => router.push('/users')} 
                clickable
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.3)',
                  }
                }}
              />
              <Chip 
                label="Analytics Dashboard" 
                onClick={() => router.push('/analytics')} 
                clickable
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.3)',
                  }
                }}
              />
              <Chip 
                label="Content Management" 
                onClick={() => router.push('/content')} 
                clickable
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.3)',
                  }
                }}
              />
              <Chip 
                label="System Settings" 
                onClick={() => router.push('/settings')} 
                clickable
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.3)',
                  }
                }}
              />
              <Chip 
                label="Back to Login" 
                onClick={() => router.push('/login')} 
                clickable
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  color: '#1e3a8a',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,1)',
                  }
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}
