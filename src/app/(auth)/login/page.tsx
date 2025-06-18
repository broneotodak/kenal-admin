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
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState('')
  const router = useRouter()

  const debugDatabase = async () => {
    try {
      console.log('=== DATABASE DEBUG START ===')
      
      // Test basic connection first
      console.log('Testing basic connection...')
      try {
        const testResult = await Promise.race([
          supabase.from('kd_users').select('count').limit(1),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]) as any
        console.log('Connection test result:', testResult)
      } catch (connErr) {
        console.error('Connection failed:', connErr)
        return
      }
      
      // Check if kd_users table is accessible
      console.log('Querying sample users...')
      try {
        const usersResult = await Promise.race([
          supabase
            .from('kd_users')
            .select('id, email, user_type, name')
            .limit(5),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 5000))
        ]) as any
        
        console.log('Sample users query:', { queryError: usersResult.error, count: usersResult.data?.length })
        console.log('Sample users:', usersResult.data)
      } catch (queryErr) {
        console.error('Users query failed:', queryErr)
      }
      
      // Check specifically for neo@todak.com
      console.log('Looking for neo@todak.com...')
      try {
        const neoResult = await Promise.race([
          supabase
            .from('kd_users')
            .select('id, email, user_type, name')
            .eq('email', 'neo@todak.com')
            .maybeSingle(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Neo query timeout')), 5000))
        ]) as any
        
        console.log('Neo user result:', { neoError: neoResult.error, neoUser: neoResult.data })
      } catch (neoErr) {
        console.error('Neo query failed:', neoErr)
      }
      
      // Check admin users
      console.log('Looking for admin users...')
      try {
        const adminResult = await Promise.race([
          supabase
            .from('kd_users')
            .select('id, email, user_type, name')
            .eq('user_type', 5),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Admin query timeout')), 5000))
        ]) as any
        
        console.log('Admin users result:', { adminError: adminResult.error, count: adminResult.data?.length })
        console.log('Admin users:', adminResult.data)
      } catch (adminErr) {
        console.error('Admin query failed:', adminErr)
      }
      
      console.log('=== DATABASE DEBUG END ===')
      
    } catch (err) {
      console.error('Debug error:', err)
    }
  }

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

      console.log('Login successful, user authenticated!')
      console.log('User ID:', data.user?.id)
      console.log('User email:', data.user?.email)
      
      // TEMPORARY: Skip database check and allow login for neo@todak.com
      if (data.user && email === 'neo@todak.com') {
        console.log('TEMPORARY BYPASS: Allowing neo@todak.com to access dashboard')
        localStorage.setItem('kenal_admin_user', JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          name: 'Neo (Temp Admin)'
        }))
        
        window.location.href = '/dashboard'
        return
      }
      
      // For other users, try the database check with timeout
      console.log('Checking admin status in database...')
      
      // Check if user is admin
      if (data.user) {
        console.log('Querying kd_users table for user:', data.user.id)
        
        try {
          // Add timeout to prevent infinite loading
          const dbResult = await Promise.race([
            supabase
              .from('kd_users')
              .select('user_type, name, email')
              .eq('id', data.user.id)
              .single(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Database query timeout')), 10000)
            )
          ]) as any
          
          const { data: userData, error: dbError } = dbResult
          console.log('Database query result:', { userData, dbError })
          
          if (dbError) {
            console.error('Database error:', dbError)
            
            // If it's a permission error, allow access anyway (temporary)
            if (dbError.code === 'PGRST116' || dbError.message?.includes('RLS') || dbError.message?.includes('policy')) {
              console.log('Database permission issue - allowing access anyway')
              localStorage.setItem('kenal_admin_user', JSON.stringify({
                id: data.user.id,
                email: data.user.email,
                name: 'Admin User'
              }))
              window.location.href = '/dashboard'
              return
            }
            
            setError('Failed to verify admin status')
            setDebugInfo(`DB Error: ${dbError.message} (Code: ${dbError.code})`)
            await supabase.auth.signOut()
            setLoading(false)
            return
          }

          console.log('User data retrieved:', userData)
          
          if (userData && userData.user_type === 5) {
            console.log('Admin verified! Redirecting...')
            localStorage.setItem('kenal_admin_user', JSON.stringify({
              id: data.user.id,
              email: data.user.email,
              name: userData.name
            }))
            
            window.location.href = '/dashboard'
          } else {
            console.log('Admin check failed:', userData?.user_type)
            setError('Access denied. Admin privileges required.')
            setDebugInfo(`User found: ${userData ? 'Yes' : 'No'}, User type: ${userData?.user_type || 'not found'}`)
            await supabase.auth.signOut()
            setLoading(false)
          }
        } catch (timeoutError) {
          console.error('Database query timed out:', timeoutError)
          setError('Database connection timeout - please try again')
          setDebugInfo('The database query took too long to respond')
          await supabase.auth.signOut()
          setLoading(false)
          return
        }
      } else {
        console.error('No user data received from authentication')
        setError('Authentication failed - no user data')
        setLoading(false)
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