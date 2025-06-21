'use client'

import { Box, Typography, Paper, Chip, Divider, Card, CardContent } from '@mui/material'
import { Settings, Build } from '@mui/icons-material'
import CacheClearButton from '@/components/CacheClearButton'

export default function SettingsPage() {
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {/* Main Settings Header */}
      <Paper sx={{ p: 6, textAlign: 'center', mb: 4 }}>
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

      {/* Troubleshooting Section */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Build sx={{ fontSize: 32, color: 'warning.main', mr: 2 }} />
            <Typography variant="h5" fontWeight="600">
              Troubleshooting
            </Typography>
          </Box>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            If you're experiencing login issues, infinite loading, or outdated data, 
            clearing your browser cache can help resolve these problems.
          </Typography>
          
          <Box sx={{ 
            p: 3, 
            bgcolor: 'grey.50', 
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'grey.200'
          }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <strong>When to use:</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" component="ul" sx={{ pl: 2 }}>
              <li>Login page keeps loading indefinitely</li>
              <li>Dashboard shows old or cached data</li>
              <li>Authentication errors after code updates</li>
              <li>Real-time features not working properly</li>
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ textAlign: 'center' }}>
              <CacheClearButton />
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
