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
  Stack,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  IconButton,
  Divider,
  Skeleton,
  Alert
} from '@mui/material'
import {
  BugReport,
  Lightbulb,
  Message,
  Warning,
  Add,
  ExpandMore,
  Send,
  Comment,
  AccessTime,
  CheckCircle,
  RadioButtonUnchecked,
  Autorenew,
  Cancel
} from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'
import { useFeedback, FeedbackProblem, FeedbackComment } from '@/hooks/useFeedback'
import FeedbackForm from '@/components/FeedbackForm'

export default function FeedbackPage() {
  const { user } = useAuth()
  const { 
    problems, 
    comments, 
    loading, 
    fetchComments, 
    addComment, 
    updateProblemStatus 
  } = useFeedback()
  
  const [activeTab, setActiveTab] = useState(0)
  const [showNewForm, setShowNewForm] = useState(false)
  const [expandedProblem, setExpandedProblem] = useState<string | null>(null)
  const [newComment, setNewComment] = useState<Record<string, string>>({})

  const handleTabChange = (_event: any, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleAccordionChange = (problemId: string) => (
    _event: any, 
    isExpanded: boolean
  ) => {
    if (isExpanded) {
      setExpandedProblem(problemId)
      fetchComments(problemId)
    } else {
      setExpandedProblem(null)
    }
  }

  const handleAddComment = async (problemId: string) => {
    const comment = newComment[problemId]?.trim()
    if (!comment) return

    const success = await addComment({
      problem_id: problemId,
      comment
    })

    if (success) {
      setNewComment(prev => ({ ...prev, [problemId]: '' }))
    }
  }

  const getStatusIcon = (status: FeedbackProblem['status']) => {
    switch (status) {
      case 'open':
        return <RadioButtonUnchecked color="primary" />
      case 'in_progress':
        return <Autorenew color="warning" />
      case 'resolved':
        return <CheckCircle color="success" />
      case 'closed':
        return <Cancel color="action" />
      default:
        return <RadioButtonUnchecked />
    }
  }

  const getTypeColor = (type: FeedbackProblem['type']) => {
    const colors = {
      bug: 'error',
      feature: 'info',
      general: 'primary',
      urgent: 'warning'
    } as const
    return colors[type] || 'default'
  }

  const getTypeIcon = (type: FeedbackProblem['type']) => {
    switch (type) {
      case 'bug':
        return <BugReport />
      case 'feature':
        return <Lightbulb />
      case 'general':
        return <Message />
      case 'urgent':
        return <Warning />
      default:
        return <Message />
    }
  }

  const filteredProblems = () => {
    switch (activeTab) {
      case 0: // All
        return problems
      case 1: // My Feedback
        return problems.filter(p => p.created_by === user?.id)
      case 2: // Open
        return problems.filter(p => p.status === 'open')
      case 3: // Resolved
        return problems.filter(p => ['resolved', 'closed'].includes(p.status))
      default:
        return problems
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Message sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4" fontWeight="600">
              Feedback & Support
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowNewForm(true)}
            sx={{ textTransform: 'none' }}
          >
            Submit Feedback
          </Button>
        </Box>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Track your feedback, bug reports, and feature requests. All feedback is saved to the database 
          and instant notifications are sent to the developer.
        </Typography>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="fullWidth"
          >
            <Tab label={`All (${problems.length})`} />
            <Tab label={`My Feedback (${problems.filter(p => p.created_by === user?.id).length})`} />
            <Tab label={`Open (${problems.filter(p => p.status === 'open').length})`} />
            <Tab label={`Resolved (${problems.filter(p => ['resolved', 'closed'].includes(p.status)).length})`} />
          </Tabs>
        </Paper>
      </Box>

      {/* Problems List */}
      {loading ? (
        <Stack spacing={2}>
          {[1, 2, 3].map(i => (
            <Skeleton key={i} variant="rectangular" height={120} />
          ))}
        </Stack>
      ) : filteredProblems().length === 0 ? (
        <Alert severity="info">
          {activeTab === 1 
            ? "You haven't submitted any feedback yet." 
            : "No feedback found for this filter."}
        </Alert>
      ) : (
        <Stack spacing={2}>
          {filteredProblems().map((problem) => (
            <Accordion
              key={problem.id}
              expanded={expandedProblem === problem.id}
              onChange={handleAccordionChange(problem.id)}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  {getStatusIcon(problem.status)}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {getTypeIcon(problem.type)}
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {problem.title}
                      </Typography>
                      <Chip
                        size="small"
                        label={problem.type.toUpperCase()}
                        color={getTypeColor(problem.type)}
                        variant="outlined"
                      />
                      <Chip
                        size="small"
                        label={problem.status.replace('_', ' ').toUpperCase()}
                        color={problem.status === 'open' ? 'primary' : 
                               problem.status === 'resolved' ? 'success' : 'default'}
                        variant="filled"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'text.secondary' }}>
                      <Typography variant="body2">
                        <AccessTime sx={{ fontSize: 16, mr: 0.5 }} />
                        {formatDate(problem.created_at)}
                      </Typography>
                      <Typography variant="body2">
                        by {problem.admin_email}
                      </Typography>
                      {problem.comments_count > 0 && (
                        <Typography variant="body2">
                          <Comment sx={{ fontSize: 16, mr: 0.5 }} />
                          {problem.comments_count} comment{problem.comments_count !== 1 ? 's' : ''}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              </AccordionSummary>
              
              <AccordionDetails>
                <Box sx={{ pl: 5 }}>
                  <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
                    {problem.description}
                  </Typography>

                  <Divider sx={{ mb: 3 }} />

                  {/* Comments Section */}
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Comments
                  </Typography>

                  {comments[problem.id]?.length > 0 && (
                    <Stack spacing={2} sx={{ mb: 3 }}>
                      {comments[problem.id].map((comment: FeedbackComment) => (
                        <Paper key={comment.id} sx={{ p: 2, bgcolor: 'action.hover' }}>
                          <Typography variant="body2" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
                            {comment.comment}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {comment.is_developer_reply ? '👨‍💻 Developer' : comment.admin_email} • {formatDate(comment.created_at)}
                          </Typography>
                        </Paper>
                      ))}
                    </Stack>
                  )}

                  {/* Add Comment */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Add a comment..."
                      value={newComment[problem.id] || ''}
                      onChange={(e) => setNewComment(prev => ({ 
                        ...prev, 
                        [problem.id]: e.target.value 
                      }))}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleAddComment(problem.id)
                        }
                      }}
                    />
                    <IconButton 
                      onClick={() => handleAddComment(problem.id)}
                      disabled={!newComment[problem.id]?.trim()}
                      color="primary"
                    >
                      <Send />
                    </IconButton>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      )}

      {/* New Feedback Form */}
      <FeedbackForm
        open={showNewForm}
        onClose={() => setShowNewForm(false)}
        adminEmail={user?.email || ''}
      />
    </Box>
  )
}
