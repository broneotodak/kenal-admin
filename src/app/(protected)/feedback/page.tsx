'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Stack,
  Paper,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Divider,
  Skeleton,
  Alert,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
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
  Cancel,
  Delete,
  Edit,
  Check,
  Close,
  Pause
} from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'
import { useFeedback, FeedbackProblem, FeedbackComment } from '@/hooks/useFeedback'
import FeedbackForm from '@/components/FeedbackForm'
import { formatDate } from '@/lib/utils'

export default function FeedbackPage() {
  const { user } = useAuth()
  const { 
    problems, 
    comments, 
    allComments,
    loading, 
    fetchComments, 
    addComment, 
    updateProblemStatus,
    deleteProblem,
    refreshData,
    isPrivilegedUser 
  } = useFeedback()
  
  const [showNewForm, setShowNewForm] = useState(false)
  const [expandedProblem, setExpandedProblem] = useState<string | null>(null)
  const [newComment, setNewComment] = useState<Record<string, string>>({})
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'completed' | 'with_comments' | 'kenal.com' | 'ADMIN'>('all')
  
  // Admin controls state
  const [adminMenuAnchor, setAdminMenuAnchor] = useState<{[key: string]: HTMLElement | null}>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null)

  // Filter problems based on active filter
  const filteredProblems = problems.filter(problem => {
    switch (activeFilter) {
      case 'pending':
        return problem.status === 'pending'
      case 'completed':
        return problem.status === 'completed'
      case 'with_comments':
        // Check if this problem has comments
        const problemComments = allComments.filter(comment => comment.problem_id === problem.id)
        return problemComments.length > 0
      case 'kenal.com':
        return problem.project === 'kenal.com'
      case 'ADMIN':
        return problem.project === 'ADMIN'
      case 'all':
      default:
        return true
    }
  })

  // Debug logging
  console.log('🔍 Feedback Page Debug:', {
    loading,
    problemsCount: problems.length,
    filteredCount: filteredProblems.length,
    activeFilter,
    problems: problems.slice(0, 2), // Log first 2 problems only
    user: user?.email,
    userObject: user ? { id: user.id, email: user.email } : null,
    hasUser: !!user,
    timestamp: new Date().toISOString()
  })

  // Listen for feedback submission events to refresh data
  useEffect(() => {
    const handleFeedbackSubmitted = (event: any) => {
      console.log('📬 Feedback submitted, refreshing data...', event.detail)
      
      // Refresh data elegantly without page reload
      setTimeout(() => {
        refreshData()
      }, 500) // Small delay to allow success message to show
    }

    window.addEventListener('feedbackSubmitted', handleFeedbackSubmitted)
    return () => window.removeEventListener('feedbackSubmitted', handleFeedbackSubmitted)
  }, [refreshData])

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

  // Admin handlers
  const handleAdminMenuOpen = (problemId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    setAdminMenuAnchor(prev => ({ ...prev, [problemId]: event.currentTarget }))
  }

  const handleAdminMenuClose = (problemId: string) => {
    setAdminMenuAnchor(prev => ({ ...prev, [problemId]: null }))
  }

  const handleStatusChange = async (problemId: string, newStatus: FeedbackProblem['status']) => {
    const success = await updateProblemStatus(problemId, newStatus)
    if (success) {
      handleAdminMenuClose(problemId)
    }
  }

  const handleDeleteClick = (problemId: string) => {
    setDeleteDialogOpen(problemId)
    handleAdminMenuClose(problemId)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialogOpen) return
    
    const success = await deleteProblem(deleteDialogOpen)
    if (success) {
      setDeleteDialogOpen(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(null)
  }

  const getStatusIcon = (status: FeedbackProblem['status']) => {
    switch (status) {
      case 'pending':
        return <RadioButtonUnchecked color="primary" />
      case 'in_progress':
        return <Autorenew color="warning" />
      case 'completed':
        return <CheckCircle color="success" />
      case 'on_hold':
        return <Pause color="info" />
      case 'cancelled':
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
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Track your feedback, bug reports, and feature requests. All feedback is saved to the database 
          and instant notifications are sent to the developer.
        </Typography>

        {/* Debug: Auth Status Indicator */}
        {user ? (
          <Alert severity="success" sx={{ mb: 3 }}>
            ✅ Authenticated as: {user.email}
            {isPrivilegedUser() && (
              <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
                🔧 Admin privileges: You can manage feedback status and delete items
              </Typography>
            )}
          </Alert>
        ) : (
          <Alert severity="warning" sx={{ mb: 3 }}>
            ⚠️ Not authenticated - please log in to submit feedback
          </Alert>
        )}

        {/* Navigation Stats */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: activeFilter === 'all' ? 2 : 0,
                borderColor: 'primary.main',
                transform: activeFilter === 'all' ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': { transform: 'scale(1.02)', boxShadow: 4 }
              }}
              onClick={() => setActiveFilter('all')}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <Message />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="600">
                      {problems.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Feedback
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: activeFilter === 'pending' ? 2 : 0,
                borderColor: 'warning.main',
                transform: activeFilter === 'pending' ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': { transform: 'scale(1.02)', boxShadow: 4 }
              }}
              onClick={() => setActiveFilter('pending')}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <RadioButtonUnchecked />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="600">
                      {problems.filter(p => p.status === 'pending').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Issues
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: activeFilter === 'completed' ? 2 : 0,
                borderColor: 'success.main',
                transform: activeFilter === 'completed' ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': { transform: 'scale(1.02)', boxShadow: 4 }
              }}
              onClick={() => setActiveFilter('completed')}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <CheckCircle />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="600">
                      {problems.filter(p => p.status === 'completed').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: activeFilter === 'with_comments' ? 2 : 0,
                borderColor: 'info.main',
                transform: activeFilter === 'with_comments' ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': { transform: 'scale(1.02)', boxShadow: 4 }
              }}
              onClick={() => setActiveFilter('with_comments')}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <Comment />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="600">
                      {problems.filter(p => allComments.some(c => c.problem_id === p.id)).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      With Comments
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Project Filter Cards */}
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: activeFilter === 'kenal.com' ? 2 : 0,
                borderColor: 'purple',
                transform: activeFilter === 'kenal.com' ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': { transform: 'scale(1.02)', boxShadow: 4 }
              }}
              onClick={() => setActiveFilter('kenal.com')}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'purple' }}>
                    🌐
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="600">
                      {problems.filter(p => p.project === 'kenal.com').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Kenal.com
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                border: activeFilter === 'ADMIN' ? 2 : 0,
                borderColor: 'darkblue',
                transform: activeFilter === 'ADMIN' ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': { transform: 'scale(1.02)', boxShadow: 4 }
              }}
              onClick={() => setActiveFilter('ADMIN')}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'darkblue' }}>
                    ⚙️
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="600">
                      {problems.filter(p => p.project === 'ADMIN').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Admin Dashboard
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Active Filter Indicator */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {activeFilter === 'all' && (
            <>
              <Message color="primary" />
              All Feedback ({filteredProblems.length})
            </>
          )}
          {activeFilter === 'pending' && (
            <>
              <RadioButtonUnchecked color="warning" />
              Pending Issues ({filteredProblems.length})
            </>
          )}
          {activeFilter === 'completed' && (
            <>
              <CheckCircle color="success" />
              Completed Issues ({filteredProblems.length})
            </>
          )}
          {activeFilter === 'with_comments' && (
            <>
              <Comment color="info" />
              Feedback with Comments ({filteredProblems.length})
            </>
          )}
          {activeFilter === 'kenal.com' && (
            <>
              🌐
              Kenal.com Feedback ({filteredProblems.length})
            </>
          )}
          {activeFilter === 'ADMIN' && (
            <>
              ⚙️
              Admin Dashboard Feedback ({filteredProblems.length})
            </>
          )}
        </Typography>
      </Box>

      {/* Problems List */}
      {loading ? (
        <Stack spacing={2}>
          {[1, 2, 3].map(i => (
            <Skeleton key={i} variant="rectangular" height={120} />
          ))}
        </Stack>
      ) : filteredProblems.length === 0 ? (
        <Alert severity="info">
          {activeFilter === 'all' && 'No feedback found. Be the first to submit feedback!'}
          {activeFilter === 'pending' && 'No pending issues found.'}
          {activeFilter === 'completed' && 'No completed issues found.'}
          {activeFilter === 'with_comments' && 'No feedback with comments found.'}
          {activeFilter === 'kenal.com' && 'No Kenal.com feedback found.'}
          {activeFilter === 'ADMIN' && 'No Admin Dashboard feedback found.'}
        </Alert>
      ) : (
        <Stack spacing={2}>
          {filteredProblems.map((problem: FeedbackProblem) => (
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
                        label={problem.project === 'ADMIN' ? 'Admin Dashboard' : 'Kenal.com'}
                        color={problem.project === 'ADMIN' ? 'secondary' : 'primary'}
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                      <Chip
                        size="small"
                        label={problem.type.toUpperCase()}
                        color={getTypeColor(problem.type)}
                        variant="outlined"
                      />
                      <Chip
                        size="small"
                        label={problem.status.replace('_', ' ').toUpperCase()}
                        color={problem.status === 'pending' ? 'primary' : 
                               problem.status === 'completed' ? 'success' : 'default'}
                        variant="filled"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'text.secondary' }}>
                      <Typography variant="body2">
                        <AccessTime sx={{ fontSize: 16, mr: 0.5 }} />
                        {formatDate(problem.created_at)}
                      </Typography>
                      <Typography variant="body2">
                        by {problem.user_name || problem.user_email || 'Unknown User'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* Admin Controls for Privileged Users */}
                  {isPrivilegedUser() && (
                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAdminMenuOpen(problem.id, e)
                        }}
                        sx={{ 
                          bgcolor: 'action.hover',
                          '&:hover': { bgcolor: 'action.selected' }
                        }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      
                      <Menu
                        anchorEl={adminMenuAnchor[problem.id]}
                        open={Boolean(adminMenuAnchor[problem.id])}
                        onClose={() => handleAdminMenuClose(problem.id)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MenuItem onClick={() => handleStatusChange(problem.id, 'pending')}>
                          <RadioButtonUnchecked sx={{ mr: 1, color: 'primary.main' }} />
                          Mark as Pending
                        </MenuItem>
                        <MenuItem onClick={() => handleStatusChange(problem.id, 'in_progress')}>
                          <Autorenew sx={{ mr: 1, color: 'warning.main' }} />
                          Mark as In Progress
                        </MenuItem>
                        <MenuItem onClick={() => handleStatusChange(problem.id, 'completed')}>
                          <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
                          Mark as Completed
                        </MenuItem>
                        <MenuItem onClick={() => handleStatusChange(problem.id, 'on_hold')}>
                          <Pause sx={{ mr: 1, color: 'info.main' }} />
                          Put On Hold
                        </MenuItem>
                        <MenuItem onClick={() => handleStatusChange(problem.id, 'cancelled')}>
                          <Cancel sx={{ mr: 1, color: 'action.main' }} />
                          Cancel
                        </MenuItem>
                        <Divider />
                        <MenuItem 
                          onClick={() => handleDeleteClick(problem.id)}
                          sx={{ color: 'error.main' }}
                        >
                          <Delete sx={{ mr: 1 }} />
                          Delete Feedback
                        </MenuItem>
                      </Menu>
                    </Box>
                  )}
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
                            {comment.content}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {comment.user_name || comment.user_email || 'Unknown User'} • {formatDate(comment.created_at)}
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
                      multiline
                      maxRows={3}
                    />
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Send />}
                      onClick={() => handleAddComment(problem.id)}
                      disabled={!newComment[problem.id]?.trim()}
                      sx={{ minWidth: 'auto', px: 2 }}
                    >
                      Send
                    </Button>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Stack>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteDialogOpen)}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete Feedback
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this feedback? This action cannot be undone and will also delete all associated comments.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            startIcon={<Delete />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Form Dialog */}
      <FeedbackForm
        open={showNewForm}
        onClose={() => setShowNewForm(false)}
        adminEmail={user?.email || ''}
      />
    </Box>
  )
}
