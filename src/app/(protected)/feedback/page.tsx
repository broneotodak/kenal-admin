'use client'

import { Box, Typography, Paper, Chip } from '@mui/material'
import { Feedback } from '@mui/icons-material'

export default function FeedbackPage() {
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '60vh' 
    }}>
      <Paper sx={{ p: 6, textAlign: 'center', maxWidth: 500 }}>
        <Feedback sx={{ fontSize: 80, color: 'text.secondary', mb: 3 }} />
        <Typography variant="h4" gutterBottom fontWeight="600">
          Feedback Management
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
          User feedback management will be available here. Handle bug reports, feature requests, and user suggestions.
        </Typography>
      </Paper>
    </Box>
  )
}
