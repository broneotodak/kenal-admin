'use client'

import { Box, Typography, Paper, Chip } from '@mui/material'
import { Schedule } from '@mui/icons-material'

export default function UserAnalysisPage() {
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '60vh' 
    }}>
      <Paper sx={{ p: 6, textAlign: 'center', maxWidth: 500 }}>
        <Schedule sx={{ fontSize: 80, color: 'text.secondary', mb: 3 }} />
        <Typography variant="h4" gutterBottom fontWeight="600">
          User Analysis
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
          Advanced user analytics and insights will be available here. Track user behavior, engagement patterns, and element preferences.
        </Typography>
      </Paper>
    </Box>
  )
}
