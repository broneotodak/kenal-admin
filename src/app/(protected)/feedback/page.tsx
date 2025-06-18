'use client'

import { Box, Typography, Card, CardContent, Chip, Grid } from '@mui/material'

export default function FeedbackPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Feedback & Issues
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h3">15</Typography>
              <Typography color="text.secondary">Total Issues</Typography>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Chip label="5 Open" size="small" color="error" />
                <Chip label="3 In Progress" size="small" color="warning" />
                <Chip label="7 Resolved" size="small" color="success" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}