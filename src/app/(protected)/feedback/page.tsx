'use client'

import { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Stack
} from '@mui/material'
import {
  BugReport,
  Lightbulb,
  Message,
  Warning,
  Code,
  Feedback as FeedbackIcon,
  Send
} from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'
import ContactDeveloperDialog from '@/components/ContactDeveloperDialog'

export default function FeedbackPage() {
  const { user } = useAuth()
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [selectedMessageType, setSelectedMessageType] = useState<'bug' | 'feature' | 'general' | 'urgent'>('general')

  const feedbackTypes = [
    {
      type: 'bug' as const,
      title: 'Report a Bug',
      description: 'Found an issue? Let us know about errors, crashes, or unexpected behavior.',
      icon: <BugReport sx={{ fontSize: 40 }} />,
      color: 'error' as const,
      examples: ['Dashboard not loading', 'Chart displaying wrong data', 'Login errors', 'Export functionality broken']
    },
    {
      type: 'feature' as const,
      title: 'Request a Feature',
      description: 'Have an idea for improvement? Suggest new features or enhancements.',
      icon: <Lightbulb sx={{ fontSize: 40 }} />,
      color: 'info' as const,
      examples: ['New chart types', 'Advanced filtering', 'Export formats', 'User management features']
    },
    {
      type: 'general' as const,
      title: 'General Feedback',
      description: 'Share your thoughts, questions, or general comments about the admin panel.',
      icon: <Message sx={{ fontSize: 40 }} />,
      color: 'primary' as const,
      examples: ['User experience feedback', 'Questions about features', 'Suggestions for improvement']
    },
    {
      type: 'urgent' as const,
      title: 'Urgent Issue',
      description: 'Critical problems that need immediate attention and are affecting operations.',
      icon: <Warning sx={{ fontSize: 40 }} />,
      color: 'warning' as const,
      examples: ['System down', 'Data loss', 'Security concerns', 'Critical functionality broken']
    }
  ]

  const handleSendFeedback = (type: typeof selectedMessageType) => {
    setSelectedMessageType(type)
    setShowContactDialog(true)
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <FeedbackIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight="600">
            Feedback & Support
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Your feedback helps us improve the Kenal Admin experience. Choose the type of feedback you'd like to send.
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1, 
          p: 2, 
          bgcolor: 'success.light', 
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'success.main'
        }}>
          <Box sx={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            bgcolor: 'success.main' 
          }} />
          <Typography variant="body2" color="success.dark">
            Messages are sent instantly via ntfy to the developer's notification channel
          </Typography>
        </Box>
      </Box>

      {/* Feedback Type Cards */}
      <Grid container spacing={3}>
        {feedbackTypes.map((feedback) => (
          <Grid item xs={12} md={6} key={feedback.type}>
            <Card 
              sx={{ 
                height: '100%',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                  [`& .${feedback.color}-icon`]: {
                    transform: 'scale(1.1)'
                  }
                },
                border: '1px solid',
                borderColor: 'divider'
              }}
              onClick={() => handleSendFeedback(feedback.type)}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                  <Box 
                    className={`${feedback.color}-icon`}
                    sx={{ 
                      color: `${feedback.color}.main`,
                      transition: 'transform 0.3s ease',
                      mt: 0.5
                    }}
                  >
                    {feedback.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="600" gutterBottom>
                      {feedback.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      {feedback.description}
                    </Typography>
                    
                    <Typography variant="subtitle2" gutterBottom sx={{ color: `${feedback.color}.main` }}>
                      Common examples:
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
                      {feedback.examples.slice(0, 2).map((example, index) => (
                        <Chip
                          key={index}
                          label={example}
                          size="small"
                          variant="outlined"
                          color={feedback.color}
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      ))}
                      {feedback.examples.length > 2 && (
                        <Chip
                          label={`+${feedback.examples.length - 2} more`}
                          size="small"
                          variant="outlined"
                          color="default"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      )}
                    </Stack>

                    <Button
                      variant="contained"
                      color={feedback.color}
                      startIcon={<Send />}
                      fullWidth
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600
                      }}
                    >
                      Send {feedback.title}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Developer Info */}
      <Card sx={{ mt: 4, bgcolor: 'action.hover' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Code color="primary" />
            <Typography variant="h6" fontWeight="600">
              Direct Developer Contact
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            All feedback is sent directly to the developer via real-time notifications. 
            You can expect a response for urgent issues within hours, and other feedback within 1-2 business days.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Your current session: {user?.email} • Messages include your email for follow-up
          </Typography>
        </CardContent>
      </Card>

      {/* Contact Developer Dialog */}
      <ContactDeveloperDialog
        open={showContactDialog}
        onClose={() => setShowContactDialog(false)}
        adminEmail={user?.email || ''}
        initialMessageType={selectedMessageType}
      />
    </Box>
  )
}
