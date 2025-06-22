'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ELEMENT_NUMBER_TO_TYPE, ELEMENTS } from '@/lib/constants'

// Types for real user behavioral analysis
interface UserJourneyStage {
  userId: number
  email: string
  registrationDate: string
  registrationMethod: 'direct' | 'invitation'
  hasElement: boolean
  elementNumber?: number
  elementType?: string
  hasGender: boolean
  hasCountry: boolean
  identityCount: number
  firstIdentityDate?: string
  timeToFirstIdentity?: number // days
  feedbackCount: number
  lastFeedbackDate?: string
  lifecycleStage: 'new' | 'onboarding' | 'active' | 'engaged' | 'dormant' | 'churned'
  completionScore: number // 0-100
}

interface BehavioralAnalytics {
  totalUsers: number
  userJourneyStages: UserJourneyStage[]
  completionFunnel: {
    registered: number
    hasElement: number
    hasIdentity: number
    hasProfile: number
    hasEngaged: number
  }
  elementBehavior: {
    [elementType: string]: {
      users: number
      avgIdentities: number
      avgTimeToIdentity: number
      engagementRate: number
    }
  }
  registrationTrends: {
    date: string
    direct: number
    invited: number
    total: number
  }[]
  engagementScores: {
    cold: number      // 0-25: Registered only
    warm: number      // 26-50: Has element/profile  
    active: number    // 51-75: Has identities
    engaged: number   // 76-100: Provides feedback
  }
  timePatterns: {
    avgTimeToElement: number
    avgTimeToIdentity: number
    avgTimeToFeedback: number
  }
}

// Calculate lifecycle stage based on user data
const calculateLifecycleStage = (user: any, identities: any[], feedback: any[]): UserJourneyStage['lifecycleStage'] => {
  const daysSinceRegistration = Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysSinceRegistration <= 7) return 'new'
  if (!user.element_number || !user.gender) return 'onboarding'
  if (identities.length === 0) return 'active'
  if (feedback.length > 0) return 'engaged'
  if (daysSinceRegistration > 90) return 'dormant'
  return 'active'
}

// Calculate completion score (0-100)
const calculateCompletionScore = (user: any, identities: any[], feedback: any[]): number => {
  let score = 20 // Base score for registration
  
  if (user.element_number) score += 20
  if (user.gender) score += 15
  if (user.registration_country) score += 15
  if (identities.length > 0) score += 20
  if (feedback.length > 0) score += 10
  
  return Math.min(score, 100)
}

// Hook for analyzing real user behavioral data
export const useBehavioralAnalytics = () => {
  const [analytics, setAnalytics] = useState<BehavioralAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  const loadBehavioralAnalytics = async () => {
    setLoading(true)
    try {
      // Get all user data
      const { data: users } = await supabase
        .from('kd_users')
        .select('id, email, element_number, gender, registration_country, created_at, user_type, join_by_invitation')
        .eq('user_type', 1) // Only get regular users, not admins

      const { data: identities } = await supabase
        .from('kd_identity')
        .select('user_id, created_at')

      const { data: feedback } = await supabase
        .from('kd_problem_updates')
        .select('created_by, created_at, project')

      if (!users) {
        console.error('No users data found')
        return
      }

      // Process user journey stages
      const userJourneyStages: UserJourneyStage[] = users.map(user => {
        const userIdentities = identities?.filter(i => i.user_id === user.id) || []
        const userFeedback = feedback?.filter(f => f.created_by === user.email) || []

        // Calculate time to first identity
        let timeToFirstIdentity: number | undefined
        let firstIdentityDate: string | undefined
        if (userIdentities.length > 0) {
          const firstIdentity = userIdentities.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]
          firstIdentityDate = firstIdentity.created_at
          timeToFirstIdentity = Math.floor((new Date(firstIdentity.created_at).getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
        }

        // Get element type
        let elementType: string | undefined
        if (user.element_number) {
          const elementTypeId = ELEMENT_NUMBER_TO_TYPE[user.element_number as keyof typeof ELEMENT_NUMBER_TO_TYPE]
          elementType = elementTypeId ? ELEMENTS[elementTypeId as keyof typeof ELEMENTS]?.name : undefined
        }

        return {
          userId: user.id,
          email: user.email,
          registrationDate: user.created_at,
          registrationMethod: user.join_by_invitation ? 'invitation' : 'direct',
          hasElement: !!user.element_number,
          elementNumber: user.element_number,
          elementType,
          hasGender: !!user.gender,
          hasCountry: !!user.registration_country,
          identityCount: userIdentities.length,
          firstIdentityDate,
          timeToFirstIdentity,
          feedbackCount: userFeedback.length,
          lastFeedbackDate: userFeedback.length > 0 ? userFeedback.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at : undefined,
          lifecycleStage: calculateLifecycleStage(user, userIdentities, userFeedback),
          completionScore: calculateCompletionScore(user, userIdentities, userFeedback)
        }
      })

      // Calculate completion funnel
      const completionFunnel = {
        registered: users.length,
        hasElement: userJourneyStages.filter(u => u.hasElement).length,
        hasIdentity: userJourneyStages.filter(u => u.identityCount > 0).length,
        hasProfile: userJourneyStages.filter(u => u.hasGender && u.hasCountry).length,
        hasEngaged: userJourneyStages.filter(u => u.feedbackCount > 0).length
      }

      // Calculate element behavior patterns
      const elementBehavior: BehavioralAnalytics['elementBehavior'] = {}
      Object.values(ELEMENTS).forEach(element => {
        const elementUsers = userJourneyStages.filter(u => u.elementType === element.name)
        if (elementUsers.length > 0) {
          const avgIdentities = elementUsers.reduce((sum, u) => sum + u.identityCount, 0) / elementUsers.length
          const usersWithIdentities = elementUsers.filter(u => u.timeToFirstIdentity !== undefined)
          const avgTimeToIdentity = usersWithIdentities.length > 0 
            ? usersWithIdentities.reduce((sum, u) => sum + (u.timeToFirstIdentity || 0), 0) / usersWithIdentities.length 
            : 0
          const engagementRate = (elementUsers.filter(u => u.feedbackCount > 0).length / elementUsers.length) * 100

          elementBehavior[element.name] = {
            users: elementUsers.length,
            avgIdentities: Number(avgIdentities.toFixed(1)),
            avgTimeToIdentity: Number(avgTimeToIdentity.toFixed(1)),
            engagementRate: Number(engagementRate.toFixed(1))
          }
        }
      })

      // Calculate registration trends (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const recentUsers = users.filter(u => new Date(u.created_at) >= thirtyDaysAgo)
      const registrationTrends = []

      for (let i = 29; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        const dayStart = new Date(date)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(date)
        dayEnd.setHours(23, 59, 59, 999)

        const dayUsers = recentUsers.filter(u => {
          const userDate = new Date(u.created_at)
          return userDate >= dayStart && userDate <= dayEnd
        })

        registrationTrends.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          direct: dayUsers.filter(u => !u.join_by_invitation).length,
          invited: dayUsers.filter(u => u.join_by_invitation).length,
          total: dayUsers.length
        })
      }

      // Calculate engagement scores
      const engagementScores = {
        cold: userJourneyStages.filter(u => u.completionScore <= 25).length,
        warm: userJourneyStages.filter(u => u.completionScore > 25 && u.completionScore <= 50).length,
        active: userJourneyStages.filter(u => u.completionScore > 50 && u.completionScore <= 75).length,
        engaged: userJourneyStages.filter(u => u.completionScore > 75).length
      }

      // Calculate time patterns
      const usersWithIdentities = userJourneyStages.filter(u => u.timeToFirstIdentity !== undefined)
      const usersWithFeedback = userJourneyStages.filter(u => u.feedbackCount > 0 && u.lastFeedbackDate)

      const timePatterns = {
        avgTimeToElement: 0, // We don't have element assignment timestamp
        avgTimeToIdentity: usersWithIdentities.length > 0 
          ? Number((usersWithIdentities.reduce((sum, u) => sum + (u.timeToFirstIdentity || 0), 0) / usersWithIdentities.length).toFixed(1))
          : 0,
        avgTimeToFeedback: usersWithFeedback.length > 0
          ? Number((usersWithFeedback.reduce((sum, u) => {
              const feedbackTime = Math.floor((new Date(u.lastFeedbackDate!).getTime() - new Date(u.registrationDate).getTime()) / (1000 * 60 * 60 * 24))
              return sum + feedbackTime
            }, 0) / usersWithFeedback.length).toFixed(1))
          : 0
      }

      setAnalytics({
        totalUsers: users.length,
        userJourneyStages,
        completionFunnel,
        elementBehavior,
        registrationTrends,
        engagementScores,
        timePatterns
      })

    } catch (error) {
      console.error('Error loading behavioral analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBehavioralAnalytics()
  }, [])

  return {
    analytics,
    loading,
    refreshAnalytics: loadBehavioralAnalytics
  }
} 