'use client'

import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Alert,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Collapse,
  CardActions,
  Tooltip
} from '@mui/material'
import {
  Feedback,
  GitHub,
  Computer,
  Code,
  Notifications,
  Science,
  ExpandMore,
  ExpandLess,
  Minimize
} from '@mui/icons-material'
import { useNotifications } from '@/contexts/NotificationContext'
import { useAuth } from '@/contexts/AuthContext'

export default function NotificationTester() {
  const { user } = useAuth()
  const { addNotification, settings } = useNotifications()
  const [selectedType, setSelectedType] = useState<'info' | 'success' | 'warning' | 'error'>('info')
  const [selectedCategory, setSelectedCategory] = useState<'feedback' | 'github' | 'system' | 'development'>('feedback')
  const [isExpanded, setIsExpanded] = useState(false)

  // 🔒 SECURITY: Only visible to neo@todak.com
  if (!user || user.email !== 'neo@todak.com') {
    return null
  }

  const testNotifications = [
    {
      category: 'feedback' as const,
      icon: <Feedback />,
      color: '#1976d2',
      title: 'Feedback Notifications',
      description: 'Test feedback submission and status updates',
      examples: [
        'New feedback submitted',
        'Feedback status changed to completed',
        'Comment added to feedback'
      ]
    },
    {
      category: 'github' as const,
      icon: <GitHub />,
      color: '#333',
      title: 'GitHub Notifications',
      description: 'Test GitHub push and commit updates',
      examples: [
        'New commit pushed',
        'Pull request merged',
        'Release published'
      ]
    },
    {
      category: 'system' as const,
      icon: <Computer />,
      color: '#2196f3',
      title: 'System Notifications',
      description: 'Test system status and alerts',
      examples: [
        'Server restart completed',
        'Database backup finished',
        'Maintenance window scheduled'
      ]
    },
    {
      category: 'development' as const,
      icon: <Code />,
      color: '#9c27b0',
      title: 'Development Notifications',
      description: 'Test development updates and deployments',
      examples: [
        'Feature deployment completed',
        'Build process finished',
        'Code review requested'
      ]
    }
  ]

  const handleTestNotification = (category: typeof testNotifications[0]['category'], customType?: string) => {
    const notificationConfig = testNotifications.find(n => n.category === category)
    if (!notificationConfig) return

    const types = ['info', 'success', 'warning', 'error']
    const type = customType || types[Math.floor(Math.random() * types.length)]
    
    const messages = {
      feedback: [
        'New feedback "UI Enhancement Request" submitted successfully.',
        'Feedback "Bug in Dashboard" status changed to completed.',
        'New comment added to feedback "Feature Request".'
      ],
      github: [
        'New push: "feat: Enhanced notification system" - Developer',
        'Pull request merged: "fix: Dashboard loading issues"',
        'Release v2.1.0 published with new features.'
      ],
      system: [
        'Server maintenance completed successfully.',
        'Database backup finished - 1.2GB backed up.',
        'System monitoring detected high CPU usage.'
      ],
      development: [
        'Feature deployment to production completed.',
        'Build #124 finished successfully in 3m 45s.',
        'Code review requested for pull request #67.'
      ]
    }

    const randomMessage = messages[category][Math.floor(Math.random() * messages[category].length)]

    addNotification({
      type: type as any,
      title: `Test ${notificationConfig.title.split(' ')[0]} Alert`,
      message: randomMessage,
      category: category,
      action: {
        label: 'View Details',
        onClick: () => console.log(`Clicked ${category} notification action`)
      }
    })
  }

  const handleCustomNotification = () => {
    addNotification({
      type: selectedType,
      title: `Custom ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Test`,
      message: `This is a custom ${selectedType} notification for the ${selectedCategory} category.`,
      category: selectedCategory,
      action: {
        label: 'Test Action',
        onClick: () => alert(`Custom ${selectedCategory} action clicked!`)
      }
    })
  }

  const triggerFeedbackEvent = () => {
    window.dispatchEvent(new CustomEvent('feedbackSubmitted', {
      detail: { 
        title: 'Test Feedback via Event',
        type: 'bug',
        project: 'ADMIN',
        timestamp: new Date().toISOString() 
      }
    }))
  }

  const triggerStatusChangeEvent = () => {
    window.dispatchEvent(new CustomEvent('feedbackStatusChanged', {
      detail: { 
        problemId: 'test-123',
        newStatus: 'completed',
        title: 'Test Status Change',
        type: 'bug',
        timestamp: new Date().toISOString() 
      }
    }))
  }

  const sendReleaseAnnouncement = async () => {
    try {
      const response = await fetch('/api/notifications/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const result = await response.json()
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: '🚀 Release Announcement Sent',
          message: 'Smart AI Dashboard v2.0 announcement has been sent to the development team via ntfy!',
          category: 'development',
          action: {
            label: 'View on ntfy.sh',
            onClick: () => window.open('https://ntfy.sh/neo_notifications', '_blank')
          }
        })
      } else {
        throw new Error(result.error || 'Failed to send announcement')
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Release Announcement Failed',
        message: `Failed to send announcement: ${error}`,
        category: 'development'
      })
    }
  }

  const clearDuplicateNotifications = () => {
    // Clear duplicate startup notifications
    const currentNotifications = JSON.parse(localStorage.getItem('kenal-notifications') || '[]')
    const filteredNotifications = currentNotifications.filter((notification: any, index: number, array: any[]) => {
      // Remove duplicate "KENAL Admin Ready" notifications
      if (notification.title === 'KENAL Admin Ready' && notification.category === 'system') {
        // Keep only the first occurrence
        return array.findIndex(n => n.title === 'KENAL Admin Ready' && n.category === 'system') === index
      }
      return true
    })
    
    localStorage.setItem('kenal-notifications', JSON.stringify(filteredNotifications))
    
    // Force page reload to apply changes
    window.location.reload()
  }

  return (
    <Card sx={{ mb: 4, transition: 'all 0.3s ease' }}>
      <CardActions 
        sx={{ 
          px: 2, 
          py: 1, 
          bgcolor: 'action.hover',
          cursor: 'pointer',
          '&:hover': {
            bgcolor: 'action.selected'
          }
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <Science sx={{ color: 'primary.main' }} />
          <Typography variant="h6" fontWeight="600">
            Notification System Tester
          </Typography>
          <Chip 
            label="Development Tool" 
            size="small" 
            color="warning" 
            variant="outlined"
          />
        </Box>
        <Tooltip title={isExpanded ? "Collapse" : "Expand"}>
          <IconButton 
            size="small"
            sx={{ 
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease'
            }}
          >
            <ExpandMore />
          </IconButton>
        </Tooltip>
      </CardActions>
      
      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
        <CardContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              This testing interface helps verify the enhanced notification system. 
              Current settings: Feedback {settings.feedbackAlerts ? '✅' : '❌'}, 
              GitHub {settings.githubAlerts ? '✅' : '❌'}, 
              System {settings.systemAlerts ? '✅' : '❌'}, 
              Development {settings.developmentAlerts ? '✅' : '❌'}
            </Typography>
          </Alert>

          {/* Quick Test Buttons */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {testNotifications.map((notification, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { 
                      boxShadow: 2,
                      transform: 'translateY(-2px)'
                    }
                  }}
                  onClick={() => handleTestNotification(notification.category)}
                >
                  <CardContent sx={{ textAlign: 'center', p: 2 }}>
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        mb: 1,
                        color: notification.color 
                      }}
                    >
                      {notification.icon}
                    </Box>
                    <Typography variant="body2" fontWeight="600" gutterBottom>
                      {notification.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {notification.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Custom Notification Builder */}
          <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1, mb: 3 }}>
            <Typography variant="subtitle2" fontWeight="600" gutterBottom>
              Custom Notification Builder
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={selectedType}
                    label="Type"
                    onChange={(e) => setSelectedType(e.target.value as any)}
                  >
                    <MenuItem value="info">Info</MenuItem>
                    <MenuItem value="success">Success</MenuItem>
                    <MenuItem value="warning">Warning</MenuItem>
                    <MenuItem value="error">Error</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    label="Category"
                    onChange={(e) => setSelectedCategory(e.target.value as any)}
                  >
                    <MenuItem value="feedback">Feedback</MenuItem>
                    <MenuItem value="github">GitHub</MenuItem>
                    <MenuItem value="system">System</MenuItem>
                    <MenuItem value="development">Development</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <Button 
              variant="contained" 
              size="small" 
              onClick={handleCustomNotification}
              startIcon={<Notifications />}
            >
              Create Custom Notification
            </Button>
          </Box>

          {/* Event Testing */}
          <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" fontWeight="600" gutterBottom>
              Event System Testing
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Test the actual events that trigger notifications in the real system.
            </Typography>
            
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={triggerFeedbackEvent}
              >
                Trigger Feedback Event
              </Button>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={triggerStatusChangeEvent}
              >
                Trigger Status Change
              </Button>
              <Button 
                variant="contained" 
                size="small"
                color="success"
                onClick={sendReleaseAnnouncement}
                startIcon={<GitHub />}
              >
                🚀 Send Release Announcement
              </Button>
            </Stack>

            <Typography variant="subtitle2" fontWeight="600" gutterBottom sx={{ mt: 2 }}>
              Cleanup Tools
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Fix duplicate notifications and reset the system.
            </Typography>
            
            <Button 
              variant="contained" 
              size="small" 
              color="warning"
              onClick={clearDuplicateNotifications}
            >
              Clear Duplicate Notifications
            </Button>
          </Box>
        </CardContent>
      </Collapse>
    </Card>
  )
} 