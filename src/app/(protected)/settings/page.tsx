'use client'

import { Box, Typography, Paper, Chip } from '@mui/material'
import { Settings } from '@mui/icons-material'

export default function SettingsPage() {
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '60vh' 
    }}>
      <Paper sx={{ p: 6, textAlign: 'center', maxWidth: 500 }}>
        <Settings sx={{ fontSize: 80, color: 'text.secondary', mb: 3 }} />
        <Typography variant="h4" gutterBottom fontWeight="600">
          Settings
        </Typography>
        <Chip 
          label="COMING SOON" 
          sx={{ 
            mt: 2,
            mb: 3,
            bgcolor: 'warning.main',
            color: 'white',
            fontWeight: 600,
          }} 
        />
        <Typography variant="body1" color="text.secondary">
          Admin settings and configuration options will be available here. Manage app settings, admin users, and system preferences.
        </Typography>
      </Paper>
    </Box>
  )
}
