'use client'

import { Box, Typography, Card, CardContent, Grid, Tabs, Tab } from '@mui/material'
import { useState } from 'react'

export default function ContentPage() {
  const [tab, setTab] = useState(0)

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Content Management
      </Typography>
      
      <Card>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label="Elements" />
          <Tab label="Patterns" />
          <Tab label="Life Phases" />
          <Tab label="Destinations" />
        </Tabs>
        
        <CardContent>
          <Typography color="text.secondary">
            Manage numerology content including elements, patterns, life phases, and destination numbers.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}