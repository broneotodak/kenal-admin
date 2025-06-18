'use client'

import { Box, Typography, Card, CardContent, List, ListItem, ListItemText, Switch } from '@mui/material'

export default function SettingsPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            System Settings
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Auto-refresh Dashboard"
                secondary="Automatically refresh dashboard data every 30 seconds"
              />
              <Switch defaultChecked />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Email Notifications"
                secondary="Receive email notifications for new user registrations"
              />
              <Switch />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  )
}