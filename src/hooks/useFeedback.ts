import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface FeedbackProblem {
  id: string
  title: string
  description: string
  type: 'bug' | 'feature' | 'general' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: number
  created_at: string
  updated_at: string
  created_by: string
  admin_email: string
  comments_count?: number | null
}

export interface FeedbackComment {
  id: string
  problem_id: string
  comment: string
  created_at: string
  created_by: string
  admin_email: string
  is_developer_reply: boolean
}

export interface CreateFeedbackData {
  title: string
  description: string
  type: 'bug' | 'feature' | 'general' | 'urgent'
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
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Fetch all problems with comment counts
  const fetchProblems = async () => {
    try {
      const { data, error } = await supabase
        .from('kd_problem_updates')
        .select(`
          *,
          comments:kd_problem_comments(count)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedProblems = data?.map((problem: any) => ({
        ...problem,
        comments_count: problem.comments?.[0]?.count || 0
      })) || []

      setProblems(formattedProblems)
    } catch (error) {
      console.error('Error fetching problems:', error)
    }
  }

  // Fetch comments for a specific problem
  const fetchComments = async (problemId: string) => {
    try {
      const { data, error } = await supabase
        .from('kd_problem_comments')
        .select('*')
        .eq('problem_id', problemId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setComments((prev: Record<string, FeedbackComment[]>) => ({
        ...prev,
        [problemId]: data || []
      }))
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  // Create a new problem/feedback
  const createProblem = async (data: CreateFeedbackData): Promise<boolean> => {
    if (!user?.email) return false

    setSubmitting(true)
    try {
      const priorityMap = {
        urgent: 5,
        bug: 4,
        feature: 3,
        general: 3
      }

      const { error } = await supabase
        .from('kd_problem_updates')
        .insert({
          title: data.title,
          description: data.description,
          type: data.type,
          status: 'open',
          priority: data.priority || priorityMap[data.type],
          created_by: user.id,
          admin_email: user.email
        })

      if (error) throw error

      await fetchProblems() // Refresh the list
      return true
    } catch (error) {
      console.error('Error creating problem:', error)
      return false
    } finally {
      setSubmitting(false)
    }
  }

  // Add a comment to a problem
  const addComment = async (data: CreateCommentData): Promise<boolean> => {
    if (!user?.email) return false

    try {
      const { error } = await supabase
        .from('kd_problem_comments')
        .insert({
          problem_id: data.problem_id,
          comment: data.comment,
          created_by: user.id,
          admin_email: user.email,
          is_developer_reply: false
        })

      if (error) throw error

      await fetchComments(data.problem_id) // Refresh comments
      await fetchProblems() // Refresh problems to update comment count
      return true
    } catch (error) {
      console.error('Error adding comment:', error)
      return false
    }
  }

  // Update problem status
  const updateProblemStatus = async (problemId: string, status: FeedbackProblem['status']): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('kd_problem_updates')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', problemId)

      if (error) throw error

      await fetchProblems() // Refresh the list
      return true
    } catch (error) {
      console.error('Error updating problem status:', error)
      return false
    }
  }

  // Get problems by status
  const getProblemsByStatus = (status?: FeedbackProblem['status']) => {
    if (!status) return problems
    return problems.filter((problem: FeedbackProblem) => problem.status === status)
  }

  // Get user's problems
  const getUserProblems = () => {
    if (!user?.id) return []
    return problems.filter((problem: FeedbackProblem) => problem.created_by === user.id)
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchProblems()
      setLoading(false)
    }

    loadData()
  }, [])

  return {
    problems,
    comments,
    loading,
    submitting,
    createProblem,
    addComment,
    updateProblemStatus,
    fetchComments,
    getProblemsByStatus,
    getUserProblems,
    refreshProblems: fetchProblems
  }
} 