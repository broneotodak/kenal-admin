'use client'

import { useState } from 'react'
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
} from '@mui/material'
import { createClient } from '@supabase/supabase-js'

// Create a direct Supabase client for testing
const supabase = createClient(
  'https://etkuxatycjqwvfjjwxqm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0a3V4YXR5Y2pxd3Zmamp3eHFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5MjExMTQsImV4cCI6MjA1ODQ5NzExNH0.howZlko9y3nnJRFe_c53MVxjNvET2nXjka8OCL4mUrA'
)

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setDebugInfo('')
    setLoading(true)

    try {
      console.log('Attempting login with:', email)
      
      // Try to sign in
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (authError) {
        console.error('Auth error:', authError)
        setError(`Authentication failed: ${authError.message}`)
        setDebugInfo(`Error code: ${authError.status || 'unknown'}`)
        setLoading(false)
        return
      }

      console.log('Login successful, checking admin status...')
      
      // Check if user is admin
      if (data.user) {
        const { data: userData, error: dbError } = await supabase
          .from('kd_users')
          .select('user_type, name')
          .eq('id', data.user.id)
          .single()
        
        if (dbError) {
          console.error('Database error:', dbError)
          setError('Failed to verify admin status')
          setDebugInfo(`DB Error: ${dbError.message}`)
          await supabase.auth.signOut()
          setLoading(false)
          return
        }

        if (userData && userData.user_type === 5) {
          console.log('Admin verified! Redirecting...')
          // Store a simple flag in localStorage
          localStorage.setItem('kenal_admin_user', JSON.stringify({
            id: data.user.id,
            email: data.user.email,
            name: userData.name
          }))
          
          // Use window.location for a hard redirect
          window.location.href = '/dashboard'
        } else {
          setError('Access denied. Admin privileges required.')
          setDebugInfo(`User type: ${userData?.user_type || 'not found'}`)
          await supabase.auth.signOut()
        }
      }
    } catch (err: any) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred')
      setDebugInfo(err.toString())
    } finally {
      setLoading(false)
    }
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
                {debugInfo && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    {debugInfo}
                  </Typography>
                )}
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
                placeholder="neo@todak.com"
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

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Check browser console for debug information
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}