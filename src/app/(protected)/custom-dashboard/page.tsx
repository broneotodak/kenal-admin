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
      // Call AI service directly (works in both development and production)
      const result = await aiService.generateDashboardCard({
        userPrompt: prompt,
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
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ChatIcon />}
            onClick={() => setChatOpen(true)}
          >
            AI Assistant
          </Button>
          {dashboardCards.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => {
                setDashboardCards([])
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
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            disabled
          >
            Add Card (Coming Soon)
          </Button>
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
    </Box>
  )
} 