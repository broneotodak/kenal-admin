'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CircularProgress, Box } from '@mui/material'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Use client-side redirect to avoid server-side redirect issues
    router.replace('/login')
  }, [router])

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a1929',
      }}
    >
      <CircularProgress size={40} sx={{ color: '#2B5CE6' }} />
    </Box>
  )
}
