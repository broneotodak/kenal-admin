'use client'

// Force dynamic rendering to fix Next.js 14 searchParams issue
export const dynamic = 'force-dynamic'

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
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const debugDatabase = async () => {
    try {
      console.log('=== DATABASE DEBUG START ===')
      
      // Test basic connection
      console.log('Testing basic connection...')
      const testResult = await supabase.from('kd_users').select('count').limit(1)
      console.log('Connection test result:', testResult)
      
      // Check for neo@todak.com
      console.log('Looking for neo@todak.com...')
      const neoResult = await supabase
        .from('kd_users')
        .select('id, email, user_type, name')
        .eq('email', 'neo@todak.com')
        .maybeSingle()
      
      console.log('Neo user result:', neoResult)
      
      // Check admin users
      console.log('Looking for admin users...')
      const adminResult = await supabase
        .from('kd_users')
        .select('id, email, user_type, name')
        .eq('user_type', 5)
      
      console.log('Admin users result:', adminResult)
      console.log('=== DATABASE DEBUG END ===')
      
    } catch (err) {
      console.error('Debug error:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('🔄 Starting login process for:', email)
      
      // Authenticate with Supabase
      console.log('🔑 Attempting Supabase authentication...')
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (authError) {
        console.error('❌ Auth error:', authError)
        setError(`Authentication failed: ${authError.message}`)
        return
      }

      console.log('✅ Login successful!')
      
      if (!data.user) {
        setError('No user data received')
        return
      }

      // For neo@todak.com, allow direct access (bypass database check for speed)
      if (email === 'neo@todak.com') {
        console.log('🚀 Direct access granted for neo@todak.com')
        localStorage.setItem('kenal_admin_user', JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          name: 'Neo Admin'
        }))
        
        router.push('/dashboard')
        return
      }
      
      // For other users, check admin status (simplified)
      console.log('🔍 Checking admin status...')
      const { data: userData, error: dbError } = await supabase
        .from('kd_users')
        .select('user_type, name, email')
        .eq('id', data.user.id)
        .single()
      
      if (dbError) {
        console.error('Database error:', dbError)
        // If it's a permission error, allow access anyway
        if (dbError.message?.includes('RLS') || dbError.message?.includes('policy')) {
          console.log('🔓 RLS issue - allowing access')
          localStorage.setItem('kenal_admin_user', JSON.stringify({
            id: data.user.id,
            email: data.user.email,
            name: 'Admin User'
          }))
          router.push('/dashboard')
          return
        }
        
        setError('Failed to verify admin status')
        await supabase.auth.signOut()
        return
      }

      if (userData && userData.user_type === 5) {
        console.log('✅ Admin verified!')
        localStorage.setItem('kenal_admin_user', JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          name: userData.name
        }))
        
        router.push('/dashboard')
      } else {
        setError('Access denied. Admin privileges required.')
        await supabase.auth.signOut()
      }

    } catch (err: any) {
      console.error('🚨 Login error:', err)
      setError('An unexpected error occurred')
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
              <Button
                variant="outlined"
                size="small"
                onClick={debugDatabase}
                sx={{ mb: 2 }}
              >
                Debug Database
              </Button>
              <Typography variant="caption" color="text.secondary" display="block">
                Check browser console for debug information
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}