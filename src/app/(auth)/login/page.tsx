'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Divider,
} from '@mui/material'
import { useAuth } from '@/contexts/AuthContext'
import CacheClearButton from '@/components/CacheClearButton'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { user, isAdmin, signIn, loading: authLoading } = useAuth()

  // Redirect if already authenticated
  useEffect(() => {
    console.log('🔍 Login page auth state:', { authLoading, user: user?.email, isAdmin })
    
    if (!authLoading && user && isAdmin) {
      console.log('✅ User already authenticated, redirecting to dashboard')
      router.push('/dashboard')
    }
  }, [user, isAdmin, authLoading, router])

  // Debug logging for auth loading state changes
  useEffect(() => {
    console.log('🔄 Auth loading state changed:', authLoading)
  }, [authLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('🔄 Starting login process for:', email)
      
      // Use simplified signIn from AuthContext
      await signIn(email, password)
      
      console.log('✅ Login successful! Redirecting to dashboard...')
      router.push('/dashboard')

    } catch (err: any) {
      console.error('🚨 Login error:', err)
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a1929',
          gap: 2
        }}
      >
        <CircularProgress />
        <Typography variant="body2" color="white" sx={{ mt: 2 }}>
          Checking authentication...
        </Typography>
        {/* Debug info */}
        <Typography variant="caption" color="white" sx={{ opacity: 0.7 }}>
          Debug: authLoading={String(authLoading)}, user={user?.email || 'none'}, isAdmin={String(isAdmin)}
        </Typography>
      </Box>
    )
  }

  // Don't show login form if already authenticated
  if (user && isAdmin) {
    return null
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a1929',
        backgroundImage: 'radial-gradient(circle at 20% 80%, #2B5CE6 0%, transparent 50%)',
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <img
                src="https://etkuxatycjqwvfjjwxqm.supabase.co/storage/v1/object/public/images/kenal-logo-icon.png"
                alt="Kenal Logo"
                style={{ width: 80, height: 80, marginBottom: 16 }}
              />
              <Typography variant="h4" component="h1" gutterBottom>
                Kenal Admin
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sign in to access the admin dashboard
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                (Admin users only - user_type = 5)
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                autoFocus
                placeholder="Enter your email"
                disabled={loading}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                placeholder="Your Kenal password"
                disabled={loading}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  mt: 3,
                  mb: 2,
                  bgcolor: '#2B5CE6',
                  '&:hover': {
                    bgcolor: '#1e3a8a',
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Having trouble logging in? Try clearing your browser cache:
              </Typography>
              <CacheClearButton />
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}