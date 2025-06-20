'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Stack
} from '@mui/material'
import {
  Close,
  Send,
  BugReport,
  Lightbulb,
  Message,
  Warning,
  Email,
  Code
} from '@mui/icons-material'
import { 
  sendBugReport, 
  sendFeatureRequest, 
  sendGeneralMessage, 
  sendUrgentIssue 
} from '@/services/ntfyService'

interface ContactDeveloperDialogProps {
  open: boolean
  onClose: () => void
  adminEmail?: string
}

type MessageType = 'bug' | 'feature' | 'general' | 'urgent'

interface MessageTypeConfig {
  label: string
  icon: React.ReactElement
  color: 'error' | 'info' | 'primary' | 'warning'
  description: string
  placeholder: string
}

const messageTypes: Record<MessageType, MessageTypeConfig> = {
  bug: {
    label: 'Bug Report',
    icon: <BugReport />,
    color: 'error',
    description: 'Report issues, errors, or unexpected behavior',
    placeholder: 'Describe the bug, steps to reproduce, and expected vs actual behavior...'
  },
  feature: {
    label: 'Feature Request',
    icon: <Lightbulb />,
    color: 'info',
    description: 'Suggest new features or improvements',
    placeholder: 'Describe the feature you would like to see added...'
  },
  general: {
    label: 'General Message',
    icon: <Message />,
    color: 'primary',
    description: 'General questions, feedback, or comments',
    placeholder: 'Your message to the developer...'
  },
  urgent: {
    label: 'Urgent Issue',
    icon: <Warning />,
    color: 'warning',
    description: 'Critical issues affecting system functionality',
    placeholder: 'Describe the urgent issue that needs immediate attention...'
  }
}

export default function ContactDeveloperDialog({ 
  open, 
  onClose, 
  adminEmail = '' 
}: ContactDeveloperDialogProps) {
  const [messageType, setMessageType] = useState<MessageType>('general')
  const [email, setEmail] = useState(adminEmail)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleClose = () => {
    if (!sending) {
      onClose()
      // Reset form after a delay to avoid jarring UX
      setTimeout(() => {
        setMessageType('general')
        setSubject('')
        setMessage('')
        setSending(false)
        setSuccess(false)
        setError('')
        setEmail(adminEmail)
      }, 300)
    }
  }

  const handleSend = async () => {
    if (!email.trim() || !message.trim()) {
      setError('Please fill in all required fields')
      return
    }

    if (messageType === 'general' && !subject.trim()) {
      setError('Please provide a subject for general messages')
      return
    }

    setSending(true)
    setError('')

    try {
      let result = false

      switch (messageType) {
        case 'bug':
          result = await sendBugReport(email.trim(), message.trim())
          break
        case 'feature':
          result = await sendFeatureRequest(email.trim(), message.trim())
          break
        case 'urgent':
          result = await sendUrgentIssue(email.trim(), message.trim())
          break
        case 'general':
          result = await sendGeneralMessage(email.trim(), subject.trim(), message.trim())
          break
      }

      if (result) {
        setSuccess(true)
        setTimeout(() => {
          handleClose()
        }, 2000)
      } else {
        setError('Failed to send message. Please try again.')
      }
    } catch (err) {
      console.error('Error sending message:', err)
      setError('An error occurred while sending the message')
    } finally {
      setSending(false)
    }
  }

  const currentConfig = messageTypes[messageType]

  if (success) {
    return (
      <Dialog open={open} maxWidth="sm" fullWidth>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <Box sx={{ mb: 3 }}>
            <Send sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Message Sent!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your message has been sent to the developer via ntfy.
              Thank you for your feedback!
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Code color="primary" />
          <Typography variant="h6">Contact Developer</Typography>
        </Box>
        <Button
          onClick={handleClose}
          disabled={sending}
          sx={{ minWidth: 'auto', p: 1 }}
        >
          <Close />
        </Button>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Send a message directly to the developer via ntfy notifications. 
          Your message will be delivered instantly.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Message Type Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Message Type
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {Object.entries(messageTypes).map(([type, config]) => (
              <Chip
                key={type}
                icon={config.icon}
                label={config.label}
                clickable
                color={messageType === type ? config.color : 'default'}
                variant={messageType === type ? 'filled' : 'outlined'}
                onClick={() => setMessageType(type as MessageType)}
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {currentConfig.description}
          </Typography>
        </Box>

        {/* Email Field */}
        <TextField
          fullWidth
          label="Your Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={sending}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: <Email sx={{ color: 'text.secondary', mr: 1 }} />
          }}
        />

        {/* Subject Field (only for general messages) */}
        {messageType === 'general' && (
          <TextField
            fullWidth
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            disabled={sending}
            sx={{ mb: 3 }}
            placeholder="Brief subject line for your message"
          />
        )}

        {/* Message Field */}
        <TextField
          fullWidth
          label="Message"
          multiline
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          disabled={sending}
          placeholder={currentConfig.placeholder}
          sx={{ mb: 2 }}
        />

        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1, 
          p: 2, 
          bgcolor: 'action.hover', 
          borderRadius: 1 
        }}>
          <Box sx={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            bgcolor: 'success.main' 
          }} />
          <Typography variant="caption" color="text.secondary">
            Messages are sent instantly via ntfy to the developer's notification channel
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={sending}
          variant="outlined"
          sx={{ flex: 1 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSend}
          disabled={sending || !email.trim() || !message.trim() || 
                   (messageType === 'general' && !subject.trim())}
          variant="contained"
          color={currentConfig.color}
          startIcon={sending ? <CircularProgress size={16} /> : currentConfig.icon}
          sx={{ flex: 2 }}
        >
          {sending ? 'Sending...' : `Send ${currentConfig.label}`}
        </Button>
      </DialogActions>
    </Dialog>
  )
} 