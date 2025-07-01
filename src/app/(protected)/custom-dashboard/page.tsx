'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Button,
  TextField,
  IconButton,
  Chip,
  Divider,
  Stack,
  Alert,
  CircularProgress,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Menu,
  MenuItem,
  Snackbar,
} from '@mui/material'
import {
  Add as AddIcon,
  Chat as ChatIcon,
  Dashboard as DashboardIcon,
  AutoAwesome as AIIcon,
  Close as CloseIcon,
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as UserIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  TrendingUp as TrendingUpIcon,
  Public as PublicIcon,
  Wc as GenderIcon,
  Category as ElementIcon,
  TableChart as TableIcon,
  Save as SaveIcon,
  FolderOpen as LoadIcon,
  CloudDownload as CloudDownloadIcon,
  MoreVert as MoreVertIcon,
  Psychology as SmartAIIcon,
  ViewModule as TemplateAIIcon,
} from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@mui/material/styles'
import DashboardCard from './components/DashboardCard'
import { aiService } from '@/services/ai/aiService'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface DashboardCard {
  id: string
  title: string
  type: 'stat' | 'chart' | 'table' | 'ai_insight'
  position: { x: number, y: number }
  size: { width: number, height: number }
  content: any
}

export default function CustomDashboardPage() {
  const { user, isAdmin } = useAuth()
  const theme = useTheme()
  const [dashboardCards, setDashboardCards] = useState<DashboardCard[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help you create custom dashboard cards with data from your KENAL system. Try asking me something like:\n\n• "Show me total users"\n• "Create a chart of user growth"\n• "Display users by country"\n• "Show recent registrations"',
      timestamp: new Date()
    }
  ])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [useSmartAI, setUseSmartAI] = useState(true) // Toggle between smart AI and template AI
  
  // Save/Load functionality state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [loadDialogOpen, setLoadDialogOpen] = useState(false)
  const [dashboardName, setDashboardName] = useState('')
  const [savedDashboards, setSavedDashboards] = useState<any[]>([])
  const [loadingSave, setLoadingSave] = useState(false)
  const [loadingList, setLoadingList] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [currentDashboardName, setCurrentDashboardName] = useState('Untitled Dashboard')

  // Preset commands for quick admin actions
  const presetCommands = [
    {
      id: 'user_count',
      label: 'Total Users',
      prompt: 'Show me total number of users',
      icon: <GroupIcon />,
      category: 'Users',
      description: 'Display total user count'
    },
    {
      id: 'age_distribution', 
      label: 'Age Groups',
      prompt: 'Show me user distribution by age groups',
      icon: <GroupIcon />,
      category: 'Demographics',
      description: 'Age demographics chart'
    },
    {
      id: 'user_growth',
      label: 'Growth Trend',
      prompt: 'Create a chart showing user growth over time',
      icon: <TrendingUpIcon />,
      category: 'Analytics', 
      description: 'Monthly registration trend'
    },
    {
      id: 'geographic',
      label: 'By Country',
      prompt: 'Show users by country distribution',
      icon: <PublicIcon />,
      category: 'Demographics',
      description: 'Geographic distribution'
    },
    {
      id: 'gender',
      label: 'Gender Split',
      prompt: 'Display gender distribution of users',
      icon: <GenderIcon />,
      category: 'Demographics', 
      description: 'Gender breakdown chart'
    },
    {
      id: 'elements',
      label: 'Element Types',
      prompt: 'Show distribution of users by element types',
      icon: <ElementIcon />,
      category: 'KENAL Data',
      description: 'Element 1-9 distribution'
    },
    {
      id: 'recent_users',
      label: 'Recent Users',
      prompt: 'Show me a table of recent user registrations',
      icon: <TableIcon />,
      category: 'Users',
      description: 'Latest user signups'
    },
    {
      id: 'active_users',
      label: 'Active Users',
      prompt: 'Show me count of active users',
      icon: <GroupIcon />,
      category: 'Users', 
      description: 'Currently active users'
    }
  ]

  // Real AI integration - updated to use client-side service
  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    const prompt = currentMessage
    setCurrentMessage('')
    setIsLoading(true)

    try {
      let result, cardConfig, aiResponse

      if (useSmartAI) {
        // 🚀 NEW: Use Smart AI with dynamic SQL generation + Template AI fallback
        console.log('🧠 Using SMART AI service...')
        
        try {
          const response = await fetch('/api/ai/smart-generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userPrompt: prompt,
              userId: user?.id
            })
          })

          const smartResult = await response.json()
          
          if (!response.ok) {
            throw new Error(smartResult.error || 'Smart AI request failed')
          }

          cardConfig = smartResult.cardConfig

          // Create new dashboard card from Smart AI response
          const newCard: DashboardCard = {
            id: Date.now().toString(),
            title: cardConfig.basic.title,
            type: cardConfig.basic.type,
            position: cardConfig.position,
            size: { width: cardConfig.position.width, height: cardConfig.position.height },
            content: cardConfig
          }

          setDashboardCards(prev => [...prev, newCard])

          aiResponse = {
            id: (Date.now() + 1).toString(),
            type: 'assistant' as const,
            content: `✅ Smart AI Analysis Complete! I've created a "${cardConfig.basic.title}" card for you.\n\n📊 **Card Details:**\n• Type: ${cardConfig.basic.type}\n• Description: ${cardConfig.basic.description}\n\n🧠 **Smart AI Info:**\n• Generated SQL: ${smartResult.sqlQuery}\n• Processing time: ${smartResult.processingTimeMs}ms\n• Provider: ${smartResult.provider}\n\n💡 **Explanation:** ${smartResult.explanation}\n\nThe card has been added to your dashboard with real-time data!`,
            timestamp: new Date()
          }

        } catch (smartAIError) {
          // 🔄 FALLBACK: Smart AI failed, automatically use Template AI
          console.warn('⚠️ Smart AI failed, falling back to Template AI:', smartAIError)
          
          result = await aiService.generateDashboardCard({
            userPrompt: prompt,
            availableData: [
              'kd_users', 'kd_identity', 'kd_user_details', 
              'kd_conversations', 'kd_messages', 'kd_analytics'
            ],
            currentDashboard: dashboardCards
          })

          // Parse the AI response
          try {
            cardConfig = JSON.parse(result.content)
          } catch (e) {
            throw new Error('Invalid AI response format')
          }

          // Create new dashboard card from Template AI response
          const newCard: DashboardCard = {
            id: Date.now().toString(),
            title: cardConfig.basic.title,
            type: cardConfig.basic.type,
            position: cardConfig.position,
            size: { width: cardConfig.position.width, height: cardConfig.position.height },
            content: cardConfig
          }

          setDashboardCards(prev => [...prev, newCard])

          aiResponse = {
            id: (Date.now() + 1).toString(),
            type: 'assistant' as const,
            content: `⚠️ Smart AI encountered an issue, so I used Template AI instead.\n\n✅ I've created a "${cardConfig.basic.title}" card for you.\n\n📊 **Card Details:**\n• Type: ${cardConfig.basic.type}\n• Description: ${cardConfig.basic.description}\n\n🤖 **Template AI Info:**\n• Provider: ${result.provider}\n• Processing time: ${result.processingTimeMs}ms\n• Cost: $${result.tokenUsage.estimatedCost.toFixed(6)}\n\n💡 **Note:** The card has been added using predefined templates with real data. Smart AI will be available once API issues are resolved!`,
            timestamp: new Date()
          }
        }

      } else {
        // 📋 OLD: Use Template-based AI (fallback)
        console.log('📋 Using template-based AI service...')
        
        result = await aiService.generateDashboardCard({
          userPrompt: prompt,
          availableData: [
            'kd_users', 'kd_identity', 'kd_user_details', 
            'kd_conversations', 'kd_messages', 'kd_analytics'
          ],
          currentDashboard: dashboardCards
        })

        // Parse the AI response
        try {
          cardConfig = JSON.parse(result.content)
        } catch (e) {
          throw new Error('Invalid AI response format')
        }

        // Create new dashboard card from AI response
        const newCard: DashboardCard = {
          id: Date.now().toString(),
          title: cardConfig.basic.title,
          type: cardConfig.basic.type,
          position: cardConfig.position,
          size: { width: cardConfig.position.width, height: cardConfig.position.height },
          content: cardConfig
        }

        setDashboardCards(prev => [...prev, newCard])

                 aiResponse = {
           id: (Date.now() + 1).toString(),
           type: 'assistant' as const,
           content: `✅ Perfect! I've created a "${cardConfig.basic.title}" card for you.\n\n📊 **Card Details:**\n• Type: ${cardConfig.basic.type}\n• Description: ${cardConfig.basic.description}\n\n🤖 **AI Info:**\n• Provider: ${result.provider}\n• Processing time: ${result.processingTimeMs}ms\n• Cost: $${result.tokenUsage.estimatedCost.toFixed(6)}\n\nThe card has been added to your dashboard!`,
           timestamp: new Date()
         }
      }

      setChatMessages(prev => [...prev, aiResponse])

    } catch (error) {
      console.error('AI Error:', error)
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `❌ Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or rephrase your request.`,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle preset command selection - updated to use client-side service
  const handlePresetCommand = async (command: typeof presetCommands[0]) => {
    console.log('🎯 Preset command selected:', command.label)
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: command.prompt,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Call AI service directly (works in both development and production)
      const result = await aiService.generateDashboardCard({
        userPrompt: command.prompt,
        availableData: [
          'kd_users', 'kd_identity', 'kd_user_details', 
          'kd_conversations', 'kd_messages', 'kd_analytics'
        ],
        currentDashboard: dashboardCards
      })

      // Parse the AI response
      let cardConfig
      try {
        cardConfig = JSON.parse(result.content)
      } catch (e) {
        // Fallback if JSON parsing fails
        throw new Error('Invalid AI response format')
      }

      // Create new dashboard card from AI response
      const newCard: DashboardCard = {
        id: Date.now().toString(),
        title: cardConfig.basic.title,
        type: cardConfig.basic.type,
        position: cardConfig.position,
        size: { width: cardConfig.position.width, height: cardConfig.position.height },
        content: cardConfig
      }

      setDashboardCards(prev => [...prev, newCard])

      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `✅ Perfect! I've created a "${cardConfig.basic.title}" card for you.\n\n📊 **Card Details:**\n• Type: ${cardConfig.basic.type}\n• Description: ${cardConfig.basic.description}\n\n🤖 **AI Info:**\n• Provider: ${result.provider}\n• Processing time: ${result.processingTimeMs}ms\n• Cost: $${result.tokenUsage.estimatedCost.toFixed(6)}\n\nThe card has been added to your dashboard!`,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, aiResponse])

    } catch (error) {
      console.error('Preset Command Error:', error)
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `❌ Sorry, I encountered an error with "${command.label}": ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or use a different command.`,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleDeleteCard = (cardId: string) => {
    setDashboardCards(prev => prev.filter(card => card.id !== cardId))
    
    // Add confirmation message to chat
    const confirmMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'assistant',
      content: '🗑️ Card deleted successfully! You can always ask me to create a new one.',
      timestamp: new Date()
    }
    setChatMessages(prev => [...prev, confirmMessage])
  }

  const handleRefreshCard = (cardId: string) => {
    console.log('Refreshing card:', cardId)
  }

  const handleResizeCard = (cardId: string, newSize: { width: number, height: number }) => {
    setDashboardCards(prev => prev.map(card => 
      card.id === cardId 
        ? { ...card, size: newSize }
        : card
    ))
    
    // Add confirmation message to chat
    const resizeMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'assistant',
      content: `📏 Card resized to ${newSize.width}x${newSize.height}! You can resize again using the card menu.`,
      timestamp: new Date()
    }
    setChatMessages(prev => [...prev, resizeMessage])
  }

  // Save dashboard functionality
  const handleSaveDashboard = async () => {
    if (!dashboardName.trim()) {
      setSnackbar({ open: true, message: 'Please enter a dashboard name', severity: 'error' })
      return
    }

    setLoadingSave(true)
    try {
      const response = await fetch('/api/dashboard/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          userId: user?.id,
          dashboardName: dashboardName.trim(),
          dashboardConfig: {
            cards: dashboardCards,
            metadata: {
              savedAt: new Date().toISOString(),
              cardCount: dashboardCards.length,
              version: '1.0'
            }
          }
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setCurrentDashboardName(dashboardName.trim())
        setSaveDialogOpen(false)
        setDashboardName('')
        setSnackbar({ open: true, message: `Dashboard "${dashboardName.trim()}" saved successfully!`, severity: 'success' })
        
        // Add confirmation to chat
        const saveMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'assistant',
          content: `💾 Dashboard "${dashboardName.trim()}" saved successfully! You can load it anytime from the Load Dashboard menu.`,
          timestamp: new Date()
        }
        setChatMessages(prev => [...prev, saveMessage])
      } else {
        throw new Error(result.error || 'Failed to save dashboard')
      }
    } catch (error) {
      console.error('Save error:', error)
      setSnackbar({ open: true, message: 'Failed to save dashboard', severity: 'error' })
    } finally {
      setLoadingSave(false)
    }
  }

  // Load saved dashboards list
  const loadDashboardsList = async () => {
    setLoadingList(true)
    try {
      const response = await fetch('/api/dashboard/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'list',
          userId: user?.id
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setSavedDashboards(result.data || [])
      } else {
        throw new Error(result.error || 'Failed to load dashboards')
      }
    } catch (error) {
      console.error('Load list error:', error)
      setSnackbar({ open: true, message: 'Failed to load dashboards list', severity: 'error' })
    } finally {
      setLoadingList(false)
    }
  }

  // Load specific dashboard
  const handleLoadDashboard = async (name: string) => {
    try {
      const response = await fetch('/api/dashboard/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'load',
          userId: user?.id,
          dashboardName: name
        })
      })

      const result = await response.json()
      
      if (result.success && result.data) {
        setDashboardCards(result.data.cards || [])
        setCurrentDashboardName(name)
        setLoadDialogOpen(false)
        setSnackbar({ open: true, message: `Dashboard "${name}" loaded successfully!`, severity: 'success' })
        
        // Add confirmation to chat
        const loadMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'assistant',
          content: `📂 Dashboard "${name}" loaded successfully! ${result.data.cards?.length || 0} cards restored.`,
          timestamp: new Date()
        }
        setChatMessages(prev => [...prev, loadMessage])
      } else {
        throw new Error(result.message || 'Failed to load dashboard')
      }
    } catch (error) {
      console.error('Load dashboard error:', error)
      setSnackbar({ open: true, message: `Failed to load dashboard "${name}"`, severity: 'error' })
    }
  }

  // Delete dashboard
  const handleDeleteDashboard = async (name: string) => {
    try {
      const response = await fetch('/api/dashboard/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          userId: user?.id,
          dashboardName: name
        })
      })

      const result = await response.json()
      
      if (result.success) {
        await loadDashboardsList() // Refresh the list
        setSnackbar({ open: true, message: `Dashboard "${name}" deleted successfully!`, severity: 'success' })
      } else {
        throw new Error(result.message || 'Failed to delete dashboard')
      }
    } catch (error) {
      console.error('Delete dashboard error:', error)
      setSnackbar({ open: true, message: `Failed to delete dashboard "${name}"`, severity: 'error' })
    }
  }

  // Auto-load default dashboard on mount
  useEffect(() => {
    const autoLoadDashboard = async () => {
      try {
        const response = await fetch('/api/dashboard/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'load',
            userId: user?.id,
            dashboardName: 'My Dashboard' // Default dashboard name
          })
        })

        const result = await response.json()
        
        if (result.success && result.data) {
          setDashboardCards(result.data.cards || [])
          setCurrentDashboardName('My Dashboard')
          console.log('✅ Auto-loaded default dashboard')
        }
      } catch (error) {
        console.log('ℹ️ No default dashboard found - starting fresh')
      }
    }

    if (user?.id) {
      autoLoadDashboard()
    }
  }, [user?.id])

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access denied. Admin privileges required.
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3, minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <DashboardIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            Custom Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Create your personalized dashboard with AI assistance
          </Typography>
          <Chip 
            label={currentDashboardName} 
            size="small" 
            sx={{ mt: 1 }} 
            icon={<DashboardIcon />}
            color="primary"
            variant="outlined"
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<ChatIcon />}
            onClick={() => setChatOpen(true)}
          >
            AI Assistant
          </Button>
          
          {/* Save Dashboard Button */}
          {dashboardCards.length > 0 && (
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => {
                setDashboardName(currentDashboardName === 'Untitled Dashboard' ? '' : currentDashboardName)
                setSaveDialogOpen(true)
              }}
              color="success"
            >
              Save Dashboard
            </Button>
          )}
          
          {/* Load Dashboard Button */}
          <Button
            variant="outlined"
            startIcon={<LoadIcon />}
            onClick={() => {
              setLoadDialogOpen(true)
              loadDashboardsList()
            }}
          >
            Load Dashboard
          </Button>
          
          {dashboardCards.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => {
                setDashboardCards([])
                setCurrentDashboardName('Untitled Dashboard')
                const clearMessage: ChatMessage = {
                  id: Date.now().toString(),
                  type: 'assistant',
                  content: '🧹 All cards have been cleared! Ready to create new ones.',
                  timestamp: new Date()
                }
                setChatMessages(prev => [...prev, clearMessage])
              }}
            >
              Clear All Cards
            </Button>
          )}
        </Box>
      </Box>

      {/* Dashboard Grid Area */}
      <Paper sx={{ p: 4, minHeight: 400, border: '2px dashed', borderColor: 'divider' }}>
        {dashboardCards.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 300,
              textAlign: 'center'
            }}
          >
            <AIIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              Your Dashboard is Empty
            </Typography>
            <Typography variant="body1" color="text.disabled" sx={{ mb: 3, maxWidth: 500 }}>
              Start by chatting with your AI assistant to create custom cards.
              Ask for statistics, charts, or insights about your KENAL users.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<ChatIcon />}
              onClick={() => setChatOpen(true)}
            >
              Start with AI Assistant
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {dashboardCards.map((card) => {
              // Calculate grid size based on card width
              const getGridSize = (width: number) => {
                if (width >= 8) return { xs: 12, sm: 12, md: 12 }
                if (width >= 6) return { xs: 12, sm: 12, md: 8 }
                return { xs: 12, sm: 6, md: 4 }
              }
              
              const gridSize = getGridSize(card.size.width)
              
              return (
                <Grid item {...gridSize} key={card.id}>
                  <DashboardCard
                    card={card}
                    onDelete={handleDeleteCard}
                    onRefresh={handleRefreshCard}
                    onResize={handleResizeCard}
                  />
                </Grid>
              )
            })}
          </Grid>
        )}
      </Paper>

      {/* AI Chat Dialog */}
      <Dialog
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { height: '70vh', display: 'flex', flexDirection: 'column' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <BotIcon color="primary" />
          AI Dashboard Assistant
          <Box sx={{ flexGrow: 1 }} />
          
          {/* AI Mode Toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
            <Chip
              icon={useSmartAI ? <SmartAIIcon /> : <TemplateAIIcon />}
              label={useSmartAI ? "Smart AI" : "Template AI"}
              color={useSmartAI ? "success" : "default"}
              size="small"
              onClick={() => setUseSmartAI(!useSmartAI)}
              sx={{ cursor: 'pointer' }}
            />
          </Box>
          
          <IconButton onClick={() => setChatOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 0 }}>
          {/* Chat Messages */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            <Stack spacing={2}>
              {chatMessages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: '70%',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1,
                      flexDirection: message.type === 'user' ? 'row-reverse' : 'row'
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: message.type === 'user' ? 'primary.main' : 'secondary.main',
                        color: 'white',
                        flexShrink: 0
                      }}
                    >
                      {message.type === 'user' ? <UserIcon sx={{ fontSize: 18 }} /> : <BotIcon sx={{ fontSize: 18 }} />}
                    </Box>
                    <Paper
                      sx={{
                        p: 2,
                        bgcolor: message.type === 'user' ? 'primary.light' : 'background.paper',
                        color: message.type === 'user' ? 'primary.contrastText' : 'text.primary',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      <Typography variant="body2">
                        {message.content}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 1 }}>
                        {message.timestamp.toLocaleTimeString()}
                      </Typography>
                    </Paper>
                  </Box>
                </Box>
              ))}
              {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'secondary.main',
                        color: 'white'
                      }}
                    >
                      <BotIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Paper sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={16} />
                        <Typography variant="body2" color="text.secondary">
                          AI is thinking...
                        </Typography>
                      </Box>
                    </Paper>
                  </Box>
                </Box>
              )}
            </Stack>
          </Box>

          <Divider />

          {/* Preset Commands Section */}
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AIIcon sx={{ fontSize: 16 }} />
              Quick Commands
            </Typography>
            <Grid container spacing={1}>
              {presetCommands.map((command) => (
                <Grid item xs={12} sm={6} md={4} key={command.id}>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    startIcon={command.icon}
                    onClick={() => {
                      handlePresetCommand(command)
                      setChatOpen(false) // Close chat after clicking
                    }}
                    disabled={isLoading}
                    sx={{ 
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      py: 1,
                      px: 2,
                      '&:hover': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        '& .MuiSvgIcon-root': {
                          color: 'inherit'
                        }
                      }
                    }}
                  >
                    <Box sx={{ textAlign: 'left', overflow: 'hidden' }}>
                      <Typography variant="body2" fontWeight="medium" noWrap>
                        {command.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {command.description}
                      </Typography>
                    </Box>
                  </Button>
                </Grid>
              ))}
            </Grid>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              💡 Click any command above or type your own request below
            </Typography>
          </Box>

          {/* Chat Input */}
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                multiline
                maxRows={3}
                placeholder="Ask me to create dashboard cards... (e.g., 'Show total users')"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
              <IconButton
                color="primary"
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || isLoading}
                sx={{ alignSelf: 'flex-end' }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Floating Action Button for Quick AI Access */}
      {!chatOpen && (
        <Fab
          color="primary"
          onClick={() => setChatOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000
          }}
        >
          <ChatIcon />
        </Fab>
      )}

      {/* Save Dashboard Dialog */}
      <Dialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SaveIcon color="success" />
          Save Dashboard
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Save your current dashboard layout and all cards to access them later.
          </Typography>
          <TextField
            fullWidth
            label="Dashboard Name"
            placeholder="e.g., My Analytics, Daily Overview, Weekly Report"
            value={dashboardName}
            onChange={(e) => setDashboardName(e.target.value)}
            autoFocus
            sx={{ mb: 2 }}
          />
          <Typography variant="caption" color="text.secondary">
            💾 {dashboardCards.length} cards will be saved
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveDashboard}
            variant="contained"
            color="success"
            disabled={!dashboardName.trim() || loadingSave}
            startIcon={loadingSave ? <CircularProgress size={16} /> : <SaveIcon />}
          >
            {loadingSave ? 'Saving...' : 'Save Dashboard'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Load Dashboard Dialog */}
      <Dialog
        open={loadDialogOpen}
        onClose={() => setLoadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <LoadIcon color="primary" />
          Load Dashboard
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={() => setLoadDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {loadingList ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : savedDashboards.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 3 }}>
              <CloudDownloadIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No Saved Dashboards
              </Typography>
              <Typography variant="body2" color="text.disabled">
                Create some dashboard cards and save them to see them here.
              </Typography>
            </Box>
          ) : (
            <List>
              {savedDashboards.map((dashboard, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteDashboard(dashboard.name)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemButton
                    onClick={() => handleLoadDashboard(dashboard.name)}
                    sx={{ borderRadius: 1 }}
                  >
                    <ListItemIcon>
                      <DashboardIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={dashboard.name}
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Last updated: {new Date(dashboard.updated_at).toLocaleDateString()}
                          </Typography>
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            Created: {new Date(dashboard.created_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoadDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
} 