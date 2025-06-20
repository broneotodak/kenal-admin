'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress
} from '@mui/material'
import { Logout, AccessTime } from '@mui/icons-material'

interface AutoLogoutWarningProps {
  open: boolean
  onExtend: () => void
  onLogout: () => void
  warningTime?: number // in minutes
}

export default function AutoLogoutWarning({ 
  open, 
  onExtend, 
  onLogout, 
  warningTime = 5 
}: AutoLogoutWarningProps) {
  const [countdown, setCountdown] = useState(warningTime * 60) // Convert to seconds

  useEffect(() => {
    if (!open) {
      setCountdown(warningTime * 60)
      return
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          onLogout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [open, onLogout, warningTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleExtendSession = () => {
    setCountdown(warningTime * 60)
    onExtend()
  }

  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: 2,
          border: '2px solid',
          borderColor: 'warning.main'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        bgcolor: 'warning.light',
        color: 'warning.contrastText'
      }}>
        <AccessTime />
        Session Timeout Warning
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3, pb: 2 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <CircularProgress
            variant="determinate"
            value={(countdown / (warningTime * 60)) * 100}
            size={80}
            thickness={4}
            color="warning"
            sx={{ mb: 2 }}
          />
          <Typography variant="h4" color="warning.main" fontWeight="bold">
            {formatTime(countdown)}
          </Typography>
        </Box>

        <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }}>
          Your session will expire due to inactivity. You will be automatically logged out in:
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          This helps keep your account secure and ensures fresh data when you return.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button
          onClick={onLogout}
          variant="outlined"
          color="error"
          startIcon={<Logout />}
          sx={{ flex: 1 }}
        >
          Logout Now
        </Button>
        <Button
          onClick={handleExtendSession}
          variant="contained"
          color="primary"
          sx={{ flex: 2 }}
        >
          Stay Logged In
        </Button>
      </DialogActions>
    </Dialog>
  )
} 