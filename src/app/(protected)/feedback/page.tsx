'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  Grid,
  Card,
  CardContent,
  Avatar,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import {
  Visibility,
  Reply,
  Delete,
  Star,
  ThumbUp,
  BugReport,
  Lightbulb,
  QuestionMark,
  CheckCircle,
  Schedule,
  Cancel,
} from '@mui/icons-material'
import { supabase } from '@/lib/supabase'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`feedback-tabpanel-${index}`}
      aria-labelledby={`feedback-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function FeedbackPage() {
  const [tabValue, setTabValue] = useState(0)
  const [feedbacks, setFeedbacks] = useState([])
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [replyDialog, setReplyDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    const loadFeedback = async () => {
      setLoading(true)
      
      // Mock data - in production, this would fetch from Supabase
      setFeedbacks([
        {
          id: 1,
          user: { name: 'Sarah Chen', email: 'sarah@example.com', avatar: null },
          type: 'bug',
          subject: 'App crashes when switching elements',
          message: 'The app crashes whenever I try to switch from Fire to Water element in the profile settings.',
          rating: 2,
          status: 'open',
          priority: 'high',
          created_at: '2025-06-18T10:30:00',
          replies: [],
        },
        {
          id: 2,
          user: { name: 'John Doe', email: 'john@example.com', avatar: null },
          type: 'feature',
          subject: 'Add meditation timer',
          message: 'It would be great to have a built-in meditation timer with ambient sounds for each element.',
          rating: 5,
          status: 'in_progress',
          priority: 'medium',
          created_at: '2025-06-17T14:20:00',
          replies: [
            {
              admin: 'Neo Todak',
              message: 'Great suggestion! We\'re working on this feature.',
              created_at: '2025-06-17T16:00:00',
            },
          ],
        },
        {
          id: 3,
          user: { name: 'Maria Garcia', email: 'maria@example.com', avatar: null },
          type: 'feedback',
          subject: 'Love the daily prompts!',
          message: 'The AI-generated daily prompts based on my element are incredibly helpful. They really resonate with my Fire element personality.',
          rating: 5,
          status: 'resolved',
          priority: 'low',
          created_at: '2025-06-16T09:15:00',
          replies: [
            {
              admin: 'KENAL Team',
              message: 'Thank you for your positive feedback! We\'re glad the prompts are helping you.',
              created_at: '2025-06-16T10:00:00',
            },
          ],
        },
        {
          id: 4,
          user: { name: 'Alex Kim', email: 'alex@example.com', avatar: null },
          type: 'question',
          subject: 'How to interpret element compatibility?',
          message: 'I\'m confused about how element compatibility works. Can you explain what the percentages mean?',
          rating: 4,
          status: 'open',
          priority: 'low',
          created_at: '2025-06-18T08:00:00',
          replies: [],
        },
      ])
      
      setLoading(false)
    }
    
    loadFeedback()
  }, [])

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug':
        return <BugReport sx={{ color: 'error.main' }} />
      case 'feature':
        return <Lightbulb sx={{ color: 'info.main' }} />
      case 'feedback':
        return <ThumbUp sx={{ color: 'success.main' }} />
      case 'question':
        return <QuestionMark sx={{ color: 'warning.main' }} />
      default:
        return <Star />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Schedule sx={{ color: 'warning.main' }} />
      case 'in_progress':
        return <Schedule sx={{ color: 'info.main' }} />
      case 'resolved':
        return <CheckCircle sx={{ color: 'success.main' }} />
      case 'closed':
        return <Cancel sx={{ color: 'text.secondary' }} />
      default:
        return null
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error'
      case 'medium':
        return 'warning'
      case 'low':
        return 'success'
      default:
        return 'default'
    }
  }

  const filteredFeedbacks = feedbacks.filter((feedback: any) => {
    if (filterStatus !== 'all' && feedback.status !== filterStatus) return false
    if (filterType !== 'all' && feedback.type !== filterType) return false
    return true
  })

  const FeedbackStats = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Schedule sx={{ color: 'warning.main', mr: 1 }} />
              <Typography color="text.secondary" variant="body2">
                Open
              </Typography>
            </Box>
            <Typography variant="h4">
              {feedbacks.filter((f: any) => f.status === 'open').length}
            </Typography>
            <Typography variant="body2" color="error.main">
              2 high priority
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Schedule sx={{ color: 'info.main', mr: 1 }} />
              <Typography color="text.secondary" variant="body2">
                In Progress
              </Typography>
            </Box>
            <Typography variant="h4">
              {feedbacks.filter((f: any) => f.status === 'in_progress').length}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CheckCircle sx={{ color: 'success.main', mr: 1 }} />
              <Typography color="text.secondary" variant="body2">
                Resolved
              </Typography>
            </Box>
            <Typography variant="h4">
              {feedbacks.filter((f: any) => f.status === 'resolved').length}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Star sx={{ color: 'warning.main', mr: 1 }} />
              <Typography color="text.secondary" variant="body2">
                Avg Rating
              </Typography>
            </Box>
            <Typography variant="h4">4.0</Typography>
            <Rating value={4} readOnly size="small" />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )

  const FeedbackTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Type</TableCell>
            <TableCell>User</TableCell>
            <TableCell>Subject</TableCell>
            <TableCell>Rating</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Priority</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredFeedbacks.map((feedback: any) => (
            <TableRow key={feedback.id}>
              <TableCell>{getTypeIcon(feedback.type)}</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {feedback.user.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body2">{feedback.user.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {feedback.user.email}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell sx={{ maxWidth: 300 }}>
                <Typography variant="body2" noWrap>
                  {feedback.subject}
                </Typography>
              </TableCell>
              <TableCell>
                <Rating value={feedback.rating} readOnly size="small" />
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {getStatusIcon(feedback.status)}
                  <Typography variant="body2">
                    {feedback.status.replace('_', ' ')}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Chip
                  label={feedback.priority}
                  color={getPriorityColor(feedback.priority) as any}
                  size="small"
                />
              </TableCell>
              <TableCell>
                {new Date(feedback.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => {
                    setSelectedFeedback(feedback)
                    setOpenDialog(true)
                  }}
                >
                  <Visibility />
                </IconButton>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => {
                    setSelectedFeedback(feedback)
                    setReplyDialog(true)
                  }}
                >
                  <Reply />
                </IconButton>
                <IconButton size="small" color="error">
                  <Delete />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Loading feedback...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="bold">
          Feedback Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              label="Type"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="bug">Bug</MenuItem>
              <MenuItem value="feature">Feature</MenuItem>
              <MenuItem value="feedback">Feedback</MenuItem>
              <MenuItem value="question">Question</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <FeedbackStats />

      <FeedbackTable />

      {/* View Feedback Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedFeedback && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getTypeIcon(selectedFeedback.type)}
                {selectedFeedback.subject}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  From: {selectedFeedback.user.name} ({selectedFeedback.user.email})
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Date: {new Date(selectedFeedback.created_at).toLocaleString()}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                  <Rating value={selectedFeedback.rating} readOnly />
                  <Chip
                    label={selectedFeedback.status.replace('_', ' ')}
                    size="small"
                  />
                  <Chip
                    label={selectedFeedback.priority}
                    color={getPriorityColor(selectedFeedback.priority) as any}
                    size="small"
                  />
                </Box>
              </Box>
              <Typography variant="body1" paragraph>
                {selectedFeedback.message}
              </Typography>
              
              {selectedFeedback.replies.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Replies
                  </Typography>
                  {selectedFeedback.replies.map((reply: any, index: number) => (
                    <Paper key={index} sx={{ p: 2, mb: 1, bgcolor: 'background.default' }}>
                      <Typography variant="body2" color="primary" gutterBottom>
                        {reply.admin} - {new Date(reply.created_at).toLocaleString()}
                      </Typography>
                      <Typography variant="body2">{reply.message}</Typography>
                    </Paper>
                  ))}
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)}>Close</Button>
              <Button
                variant="contained"
                startIcon={<Reply />}
                onClick={() => {
                  setOpenDialog(false)
                  setReplyDialog(true)
                }}
              >
                Reply
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Reply Dialog */}
      <Dialog
        open={replyDialog}
        onClose={() => setReplyDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reply to Feedback</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Type your reply..."
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Update Status</InputLabel>
            <Select
              value={selectedFeedback?.status || 'open'}
              label="Update Status"
            >
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReplyDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setReplyDialog(false)}>
            Send Reply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
