'use client'

import { Box, Typography, Paper, Chip } from '@mui/material'
import { Article } from '@mui/icons-material'

export default function ContentPage() {
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '60vh' 
    }}>
      <Paper sx={{ p: 6, textAlign: 'center', maxWidth: 500 }}>
        <Article sx={{ fontSize: 80, color: 'text.secondary', mb: 3 }} />
        <Typography variant="h4" gutterBottom fontWeight="600">
          Content Management
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
          Content management features will be available here. Manage articles, AI prompts, quotes, and other app content.
        </Typography>
      </Paper>
    </Box>
  )
}
