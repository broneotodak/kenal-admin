import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface FeedbackProblem {
  id: string
  title: string
  description: string
  type: 'bug' | 'feature' | 'general' | 'urgent'
  status: 'pending' | 'completed' | 'in_progress' | 'on_hold' | 'cancelled'
  priority: number
  created_at: string
  updated_at: string
  created_by: string
  project: 'kenal.com' | 'ADMIN'
  user_name?: string
  user_email?: string
}

export interface FeedbackComment {
  id: string
  problem_id: string
  content: string
  created_at: string
  created_by: string
  project: 'kenal.com' | 'ADMIN'
  user_name?: string
  user_email?: string
}

export interface CreateFeedbackData {
  title: string
  description: string
  type: 'bug' | 'feature' | 'general' | 'urgent'
  project: 'kenal.com' | 'ADMIN'
  priority?: number
}

export interface CreateCommentData {
  problem_id: string
  comment: string
}

export function useFeedback() {
  const { user } = useAuth()
  const [problems, setProblems] = useState<FeedbackProblem[]>([])
  const [comments, setComments] = useState<Record<string, FeedbackComment[]>>({})
  const [allComments, setAllComments] = useState<FeedbackComment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const hasInitiallyLoaded = useRef(false)

  // Simple fetch all problems with user information
  const fetchProblems = useCallback(async () => {
    try {
      console.log('🔄 Fetching all problems with user data...')
      const { data, error } = await supabase
        .from('kd_problem_updates')
        .select(`
          *,
          user:kd_users!created_by(name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching problems:', error)
        return
      }

      console.log('✅ Problems fetched:', data?.length || 0)
      
      // Format the data to include user information
      const formattedProblems = data?.map((problem: any) => ({
        ...problem,
        user_name: problem.user?.name || problem.user?.email || 'Unknown User',
        user_email: problem.user?.email || ''
      })) || []

      setProblems(formattedProblems)
    } catch (error) {
      console.error('❌ Fetch problems error:', error)
    }
  }, [])

  // Fetch all comments with user information
  const fetchAllComments = useCallback(async () => {
    try {
      console.log('🔄 Fetching all comments with user data...')
      const { data, error } = await supabase
        .from('kd_problem_comments')
        .select(`
          *,
          user:kd_users!created_by(name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching comments:', error)
        return
      }

      console.log('✅ Comments fetched:', data?.length || 0)
      
      // Format comments to include user information
      const formattedComments = data?.map((comment: any) => ({
        ...comment,
        user_name: comment.user?.name || comment.user?.email || 'Unknown User',
        user_email: comment.user?.email || ''
      })) || []

      setAllComments(formattedComments)
    } catch (error) {
      console.error('❌ Fetch comments error:', error)
    }
  }, [])

  // Fetch comments for a specific problem with user information
  const fetchComments = useCallback(async (problemId: string) => {
    try {
      const { data, error } = await supabase
        .from('kd_problem_comments')
        .select(`
          *,
          user:kd_users!created_by(name, email)
        `)
        .eq('problem_id', problemId)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Format comments to include user information
      const formattedComments = data?.map((comment: any) => ({
        ...comment,
        user_name: comment.user?.name || comment.user?.email || 'Unknown User',
        user_email: comment.user?.email || ''
      })) || []

      setComments(prev => ({
        ...prev,
        [problemId]: formattedComments
      }))
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }, [])

  // Create a new problem/feedback
  const createProblem = useCallback(async (data: CreateFeedbackData): Promise<boolean> => {
    console.log('🔍 createProblem called with:', {
      hasUser: !!user,
      userEmail: user?.email,
      data,
      timestamp: new Date().toISOString()
    })

    if (!user?.email) {
      console.error('❌ createProblem failed: No authenticated user')
      return false
    }

    setSubmitting(true)
    try {
      const priorityMap = {
        urgent: 5,
        bug: 4,
        feature: 3,
        general: 3
      }

      console.log('🔍 Attempting insert with content length:', data.description.length)
      console.log('🔍 Content preview:', data.description.substring(0, 100) + '...')
      
      const { data: result, error } = await supabase
        .from('kd_problem_updates')
        .insert({
          title: data.title,
          description: data.description,
          type: data.type,
          status: 'pending',
          project: data.project,
          priority: data.priority || priorityMap[data.type],
          created_by: user.id
        })
        .select()
        
      console.log('📊 Insert response:', { result, error })

      if (error) throw error

      // Refresh data
      await fetchProblems()
      return true
    } catch (error) {
      console.error('Error creating problem:', error)
      return false
    } finally {
      setSubmitting(false)
    }
  }, [user, fetchProblems])

  // Add a comment to a problem
  const addComment = useCallback(async (data: CreateCommentData): Promise<boolean> => {
    if (!user?.email) return false

    try {
      // Find the parent problem to get its project
      const parentProblem = problems.find(p => p.id === data.problem_id)
      const projectValue = parentProblem?.project || 'kenal.com'

      const { error } = await supabase
        .from('kd_problem_comments')
        .insert({
          problem_id: data.problem_id,
          content: data.comment,
          created_by: user.id,
          project: projectValue
        })

      if (error) throw error

      await fetchComments(data.problem_id)
      return true
    } catch (error) {
      console.error('Error adding comment:', error)
      return false
    }
  }, [user, problems, fetchComments])

  // Update problem status
  const updateProblemStatus = useCallback(async (problemId: string, status: FeedbackProblem['status']): Promise<boolean> => {
    try {
      console.log('🔄 Updating problem status:', { problemId, status })
      
      // Get the problem details before updating for notification
      const problem = problems.find(p => p.id === problemId)
      
      const { error } = await supabase
        .from('kd_problem_updates')
        .update({ 
          status, 
          updated_at: new Date().toISOString(),
          updated_by: user?.id 
        })
        .eq('id', problemId)

      if (error) {
        console.error('❌ Status update error:', error)
        throw error
      }

      console.log('✅ Status updated successfully')
      
      // Emit feedback status change event for notifications
      if (problem) {
        window.dispatchEvent(new CustomEvent('feedbackStatusChanged', {
          detail: { 
            problemId, 
            newStatus: status, 
            title: problem.title,
            type: problem.type,
            timestamp: new Date().toISOString() 
          }
        }))
      }
      
      await fetchProblems()
      return true
    } catch (error) {
      console.error('Error updating problem status:', error)
      return false
    }
  }, [user, fetchProblems, problems])

  // Delete problem (admin only)
  const deleteProblem = useCallback(async (problemId: string): Promise<boolean> => {
    if (!user?.email || !['neo@todak.com', 'lan@todak.com'].includes(user.email)) {
      console.error('❌ Delete access denied - admin privileges required')
      return false
    }

    try {
      console.log('🗑️ Deleting problem:', problemId)
      
      // First delete associated comments
      const { error: commentsError } = await supabase
        .from('kd_problem_comments')
        .delete()
        .eq('problem_id', problemId)

      if (commentsError) {
        console.error('❌ Error deleting comments:', commentsError)
        throw commentsError
      }

      // Then delete the problem
      const { error: problemError } = await supabase
        .from('kd_problem_updates')
        .delete()
        .eq('id', problemId)

      if (problemError) {
        console.error('❌ Error deleting problem:', problemError)
        throw problemError
      }

      console.log('✅ Problem deleted successfully')
      await refreshData()
      return true
    } catch (error) {
      console.error('Error deleting problem:', error)
      return false
    }
  }, [user])

  // Manual refresh function
  const refreshData = useCallback(async () => {
    console.log('🔄 Manual data refresh triggered...')
    setLoading(true)
    try {
      await Promise.all([
        fetchProblems(),
        fetchAllComments()
      ])
      console.log('✅ Manual refresh completed')
    } catch (error) {
      console.error('❌ Manual refresh failed:', error)
    } finally {
      setLoading(false)
    }
  }, [fetchProblems, fetchAllComments])

  // Get problems by status
  const getProblemsByStatus = useCallback((status?: FeedbackProblem['status']) => {
    if (!status) return problems
    return problems.filter(problem => problem.status === status)
  }, [problems])

  // Get user's problems
  const getUserProblems = useCallback(() => {
    if (!user?.id) return []
    return problems.filter(problem => problem.created_by === user.id)
  }, [user, problems])

  // Check if user has admin privileges for feedback management
  const isPrivilegedUser = useCallback(() => {
    return user?.email && ['neo@todak.com', 'lan@todak.com'].includes(user.email)
  }, [user])

  // Initial data load - FIXED to prevent infinite loops
  useEffect(() => {
    if (!hasInitiallyLoaded.current) {
      const loadData = async () => {
        console.log('🚀 Loading feedback data...')
        setLoading(true)
        
        try {
          await Promise.all([
            fetchProblems(),
            fetchAllComments()
          ])
          
          hasInitiallyLoaded.current = true
          console.log('✅ Feedback data loaded')
        } catch (error) {
          console.error('❌ Initial data load failed:', error)
        } finally {
          setLoading(false)
        }
      }

      loadData()
    }
  }, []) // Empty dependency array - only run once!

  return {
    // Data
    problems,
    comments,
    allComments,
    
    // State
    loading,
    submitting,
    
    // Actions
    createProblem,
    addComment,
    updateProblemStatus,
    deleteProblem,
    fetchComments,
    refreshData,
    
    // Utilities
    getProblemsByStatus,
    getUserProblems,
    isPrivilegedUser
  }
} 