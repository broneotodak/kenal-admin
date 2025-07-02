'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material'
import { Send, Close } from '@mui/icons-material'
import { useFeedback, CreateFeedbackData } from '@/hooks/useFeedback'
import { sendDeveloperNotification } from '@/services/ntfyService'

interface FeedbackFormProps {
  open: boolean
  onClose: () => void
  initialType?: 'bug' | 'feature' | 'general' | 'urgent'
  adminEmail: string
}

export default function FeedbackForm({ 
  open, 
  onClose, 
  initialType = 'general',
  adminEmail 
}: FeedbackFormProps) {
  const { createProblem, submitting } = useFeedback()
  const [formData, setFormData] = useState<CreateFeedbackData>({
    title: '',
    description: '',
    type: initialType,
    project: 'kenal.com'
  })
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      return
    }

    // Debug authentication
    console.log('🔍 Feedback submission debug:', {
      hasAdminEmail: !!adminEmail,
      adminEmail,
      formData,
      timestamp: new Date().toISOString()
    })

    try {
      // Save to database
      const success = await createProblem(formData)
      
      if (success) {
        // Send ntfy notification
        const priorityMap: Record<string, 1 | 2 | 3 | 4 | 5> = {
          urgent: 5,
          bug: 4,
          feature: 3,
          general: 3
        }

        const typeEmojis = {
          bug: '🐛',
          feature: '💡',
          general: '📧',
          urgent: '🚨'
        }

        await sendDeveloperNotification({
          title: `${typeEmojis[formData.type]} New Feedback: ${formData.title}`,
          message: `Type: ${formData.type.toUpperCase()}\n\n${formData.description}`,
          priority: priorityMap[formData.type],
          tags: [formData.type, 'feedback', 'admin'],
          adminEmail
        })

        setShowSuccess(true)
        
        // Immediately notify parent to refresh data
        window.dispatchEvent(new CustomEvent('feedbackSubmitted', {
          detail: { 
            newFeedback: true,
            title: formData.title,
            type: formData.type,
            project: formData.project,
            timestamp: new Date().toISOString() 
          }
        }))
        
        setTimeout(() => {
          setShowSuccess(false)
          handleClose()
        }, 1500)
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
    }
  }

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      type: initialType,
      project: 'kenal.com'
    })
    setShowSuccess(false)
    onClose()
  }

  const typeLabels = {
    bug: 'Bug Report',
    feature: 'Feature Request',
    general: 'General Feedback',
    urgent: 'Urgent Issue'
  }

  const typeColors = {
    bug: 'error',
    feature: 'info',
    general: 'primary',
    urgent: 'warning'
  } as const

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" fontWeight="600">
            Submit Feedback
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {showSuccess ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            Feedback submitted successfully! Notification sent to developer.
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Project</InputLabel>
              <Select
                value={formData.project}
                label="Project"
                onChange={(e) => setFormData(prev => ({ ...prev, project: e.target.value as any }))}
              >
                <MenuItem value="kenal.com">🌐 Kenal.com (Main App)</MenuItem>
                <MenuItem value="ADMIN">⚙️ Admin Dashboard</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Feedback Type</InputLabel>
              <Select
                value={formData.type}
                label="Feedback Type"
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
              >
                <MenuItem value="bug">🐛 Bug Report</MenuItem>
                <MenuItem value="feature">💡 Feature Request</MenuItem>
                <MenuItem value="general">📧 General Feedback</MenuItem>
                <MenuItem value="urgent">🚨 Urgent Issue</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Title"
              placeholder="Brief summary of your feedback"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              fullWidth
              required
            />

            <TextField
              label="Description"
              placeholder="Detailed description of your feedback, issue, or suggestion..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={4}
              fullWidth
              required
            />

            <Alert severity="info" sx={{ mt: 1 }}>
              Your feedback will be saved to the database and an instant notification 
              will be sent to the developer via ntfy.
            </Alert>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={handleClose}
          startIcon={<Close />}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color={typeColors[formData.type]}
          startIcon={submitting ? <CircularProgress size={16} /> : <Send />}
          disabled={submitting || !formData.title.trim() || !formData.description.trim() || showSuccess}
        >
          {submitting ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </DialogActions>
    </Dialog>
  )
} 