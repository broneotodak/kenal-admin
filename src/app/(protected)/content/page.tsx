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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
} from '@mui/material'
import {
  Edit,
  Delete,
  Visibility,
  Add,
  Article,
  Psychology,
  QuestionAnswer,
  FormatQuote,
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
      id={`content-tabpanel-${index}`}
      aria-labelledby={`content-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function ContentPage() {
  const [tabValue, setTabValue] = useState(0)
  const [articles, setArticles] = useState([])
  const [prompts, setPrompts] = useState([])
  const [quotes, setQuotes] = useState([])
  const [openDialog, setOpenDialog] = useState(false)
  const [contentType, setContentType] = useState('article')
  const [loading, setLoading] = useState(true)

  // Mock data for demonstration
  useEffect(() => {
    const loadContent = async () => {
      setLoading(true)
      
      // Mock data - in production, this would fetch from Supabase
      setArticles([
        {
          id: 1,
          title: 'Understanding Your Element',
          category: 'Education',
          status: 'published',
          views: 1245,
          created_at: '2025-06-15',
        },
        {
          id: 2,
          title: 'Daily Meditation Guide',
          category: 'Wellness',
          status: 'draft',
          views: 0,
          created_at: '2025-06-17',
        },
      ])
      
      setPrompts([
        {
          id: 1,
          element: 'Fire',
          prompt: 'What ignites your passion today?',
          uses: 342,
          status: 'active',
        },
        {
          id: 2,
          element: 'Water',
          prompt: 'How can you flow with today\'s challenges?',
          uses: 289,
          status: 'active',
        },
      ])
      
      setQuotes([
        {
          id: 1,
          quote: 'The mind is everything. What you think you become.',
          author: 'Buddha',
          category: 'Mindfulness',
          likes: 523,
        },
        {
          id: 2,
          quote: 'Your element is your strength, not your limitation.',
          author: 'KENAL Team',
          category: 'Motivation',
          likes: 412,
        },
      ])
      
      setLoading(false)
    }
    
    loadContent()
  }, [])

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const ContentStats = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Article sx={{ color: 'primary.main', mr: 1 }} />
              <Typography color="text.secondary" variant="body2">
                Articles
              </Typography>
            </Box>
            <Typography variant="h4">{articles.length}</Typography>
            <Typography variant="body2" color="success.main">
              2 published
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Psychology sx={{ color: 'secondary.main', mr: 1 }} />
              <Typography color="text.secondary" variant="body2">
                AI Prompts
              </Typography>
            </Box>
            <Typography variant="h4">{prompts.length}</Typography>
            <Typography variant="body2" color="text.secondary">
              All active
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <FormatQuote sx={{ color: 'warning.main', mr: 1 }} />
              <Typography color="text.secondary" variant="body2">
                Quotes
              </Typography>
            </Box>
            <Typography variant="h4">{quotes.length}</Typography>
            <Typography variant="body2" color="text.secondary">
              1,935 likes
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <QuestionAnswer sx={{ color: 'info.main', mr: 1 }} />
              <Typography color="text.secondary" variant="body2">
                Responses
              </Typography>
            </Box>
            <Typography variant="h4">631</Typography>
            <Typography variant="body2" color="text.secondary">
              This week
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )

  const ArticlesTab = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Views</TableCell>
            <TableCell>Created</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {articles.map((article: any) => (
            <TableRow key={article.id}>
              <TableCell>{article.title}</TableCell>
              <TableCell>{article.category}</TableCell>
              <TableCell>
                <Chip
                  label={article.status}
                  color={article.status === 'published' ? 'success' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell>{article.views.toLocaleString()}</TableCell>
              <TableCell>{article.created_at}</TableCell>
              <TableCell>
                <IconButton size="small" color="primary">
                  <Visibility />
                </IconButton>
                <IconButton size="small" color="primary">
                  <Edit />
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

  const PromptsTab = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Element</TableCell>
            <TableCell>Prompt</TableCell>
            <TableCell>Uses</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {prompts.map((prompt: any) => (
            <TableRow key={prompt.id}>
              <TableCell>
                <Chip
                  label={prompt.element}
                  sx={{
                    backgroundColor: 
                      prompt.element === 'Fire' ? '#ef4444' :
                      prompt.element === 'Water' ? '#3b82f6' :
                      prompt.element === 'Earth' ? '#84cc16' :
                      prompt.element === 'Air' ? '#06b6d4' :
                      prompt.element === 'Ether' ? '#8b5cf6' : '#gray',
                    color: 'white',
                  }}
                  size="small"
                />
              </TableCell>
              <TableCell sx={{ maxWidth: 400 }}>{prompt.prompt}</TableCell>
              <TableCell>{prompt.uses}</TableCell>
              <TableCell>
                <Chip
                  label={prompt.status}
                  color="success"
                  size="small"
                />
              </TableCell>
              <TableCell>
                <IconButton size="small" color="primary">
                  <Edit />
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

  const QuotesTab = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Quote</TableCell>
            <TableCell>Author</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Likes</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {quotes.map((quote: any) => (
            <TableRow key={quote.id}>
              <TableCell sx={{ maxWidth: 400 }}>"{quote.quote}"</TableCell>
              <TableCell>{quote.author}</TableCell>
              <TableCell>{quote.category}</TableCell>
              <TableCell>{quote.likes}</TableCell>
              <TableCell>
                <IconButton size="small" color="primary">
                  <Edit />
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
        <Typography>Loading content...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight="bold">
          Content Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
          sx={{
            background: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
            },
          }}
        >
          Create Content
        </Button>
      </Box>

      <ContentStats />

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '1rem',
            },
          }}
        >
          <Tab label="Articles" icon={<Article />} iconPosition="start" />
          <Tab label="AI Prompts" icon={<Psychology />} iconPosition="start" />
          <Tab label="Quotes" icon={<FormatQuote />} iconPosition="start" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <ArticlesTab />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <PromptsTab />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <QuotesTab />
        </TabPanel>
      </Paper>

      {/* Create Content Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Content</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>Content Type</InputLabel>
            <Select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              label="Content Type"
            >
              <MenuItem value="article">Article</MenuItem>
              <MenuItem value="prompt">AI Prompt</MenuItem>
              <MenuItem value="quote">Quote</MenuItem>
            </Select>
          </FormControl>
          
          {contentType === 'article' && (
            <>
              <TextField fullWidth label="Title" margin="normal" />
              <TextField fullWidth label="Category" margin="normal" />
              <TextField fullWidth label="Content" multiline rows={4} margin="normal" />
            </>
          )}
          
          {contentType === 'prompt' && (
            <>
              <FormControl fullWidth margin="normal">
                <InputLabel>Element</InputLabel>
                <Select label="Element">
                  <MenuItem value="Fire">Fire</MenuItem>
                  <MenuItem value="Water">Water</MenuItem>
                  <MenuItem value="Earth">Earth</MenuItem>
                  <MenuItem value="Air">Air</MenuItem>
                  <MenuItem value="Ether">Ether</MenuItem>
                </Select>
              </FormControl>
              <TextField fullWidth label="Prompt Text" multiline rows={3} margin="normal" />
            </>
          )}
          
          {contentType === 'quote' && (
            <>
              <TextField fullWidth label="Quote" multiline rows={3} margin="normal" />
              <TextField fullWidth label="Author" margin="normal" />
              <TextField fullWidth label="Category" margin="normal" />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setOpenDialog(false)}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
