import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import {
  AutoAwesome as AIIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreIcon,
  Assessment as ChartIcon,
  TableChart as TableIcon,
  Psychology as InsightIcon,
  BarChart as StatIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material'
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { supabase } from '@/lib/supabase'

// Add debugging to verify supabase import
console.log('🔍 Supabase client loaded:', !!supabase)

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

interface DashboardCardProps {
  card: {
    id: string
    title: string
    type: 'stat' | 'chart' | 'table' | 'ai_insight'
    position: { x: number, y: number }
    size: { width: number, height: number }
    content: any
  }
  onDelete: (cardId: string) => void
  onRefresh?: (cardId: string) => void
  onResize?: (cardId: string, newSize: { width: number, height: number }) => void
}

export default function DashboardCard({ card, onDelete, onRefresh, onResize }: DashboardCardProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  // Execute SQL query and fetch data - USE SERVER-SIDE API FOR REAL DATA
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Fetching data for card:', card.title, card.type)
      
      // Determine what type of data to fetch based on card title and content
      let dataType = 'user_count' // default
      const titleLower = card.title.toLowerCase()
      const queryLower = card.content?.data?.query?.toLowerCase() || ''
      
      if (titleLower.includes('age') || queryLower.includes('age') || titleLower.includes('distribution')) {
        dataType = 'user_age'
      } else if (card.type === 'chart' || titleLower.includes('growth') || queryLower.includes('growth')) {
        dataType = 'user_growth'
      } else if (card.type === 'table' || titleLower.includes('table') || titleLower.includes('list')) {
        dataType = 'user_table'
      }
      
      console.log('📊 Requesting data type:', dataType)
      
      // Call server-side API for real data
      const response = await fetch('/api/dashboard/real-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: dataType,
          cardType: card.type
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch real data')
      }
      
      console.log('✅ Real data received:', result)
      
      // Format data based on type
      if (dataType === 'user_count') {
        setData([result.data])
      } else {
        setData(result.data)
      }
      
    } catch (err) {
      console.error('❌ Real data fetch failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
      
      // Only use mock data as last resort
      generateMockData()
    } finally {
      setLoading(false)
    }
  }

  // Generate mock data for demonstration
  const generateMockData = () => {
    // Use card ID as seed for consistent data
    const seed = card.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    const seededRandom = (min: number, max: number) => {
      const x = Math.sin(seed) * 10000
      return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min
    }

    if (card.type === 'stat') {
      setData([{ count: seededRandom(1000, 10000) }])
    } else if (card.type === 'chart') {
      const mockData = Array.from({ length: 12 }, (_, i) => ({
        month: `2024-${String(i + 1).padStart(2, '0')}`,
        value: seededRandom(100, 1000) + i * 10
      }))
      setData(mockData)
    } else if (card.type === 'table') {
      const mockData = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        username: `user_${i + 1}`,
        email: `user${i + 1}@kenal.com`,
        created_at: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        is_active: i % 3 !== 0
      }))
      setData(mockData)
    }
    setError(null)
  }

  useEffect(() => {
    fetchData()
  }, [card.id])

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleDelete = () => {
    onDelete(card.id)
    handleMenuClose()
  }

  const handleRefresh = () => {
    fetchData()
    handleMenuClose()
    if (onRefresh) onRefresh(card.id)
  }

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <CircularProgress />
        </Box>
      )
    }

    if (error) {
      return (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
          <Button size="small" onClick={generateMockData} sx={{ ml: 1 }}>
            Show Demo Data
          </Button>
        </Alert>
      )
    }

    if (!data) {
      return (
        <Typography variant="body2" color="text.secondary">
          No data available
        </Typography>
      )
    }

    switch (card.type) {
      case 'stat':
        const statValue = data[0]?.count || data[0]?.total || data[0]?.value || 0
        return (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="h2" color="primary" fontWeight="bold">
              {statValue.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {card.content?.basic?.description || 'Total Count'}
            </Typography>
          </Box>
        )

      case 'chart':
        const chartData = {
          labels: data.map((item: any) => item.month || item.category || item.date || item.label || item.name),
          datasets: [{
            label: card.title,
            data: data.map((item: any) => item.value || item.count || item.total),
            borderColor: card.content?.chart?.colors?.[0] || '#1976d2',
            backgroundColor: card.content?.chart?.colors?.[0] + '20' || '#1976d220',
            tension: 0.1
          }]
        }

        const chartOptions = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            title: { display: false }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }

        const ChartComponent = card.content?.chart?.type === 'bar' ? Bar :
                              card.content?.chart?.type === 'pie' ? Pie :
                              card.content?.chart?.type === 'doughnut' ? Doughnut : Line

        return (
          <Box sx={{ height: 200 }}>
            <ChartComponent data={chartData} options={chartOptions} />
          </Box>
        )

      case 'table':
        if (!Array.isArray(data) || data.length === 0) {
          return <Typography>No table data available</Typography>
        }

        const columns = Object.keys(data[0])
        return (
          <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell key={column}>{column}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.slice(0, 10).map((row: any, index: number) => (
                  <TableRow key={index}>
                    {columns.map((column) => (
                      <TableCell key={column}>
                        {typeof row[column] === 'string' && row[column].length > 50
                          ? row[column].substring(0, 50) + '...'
                          : row[column]?.toString() || '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )

      case 'ai_insight':
        return (
          <Box>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {card.content?.ai?.insights || 'AI-generated insights will appear here.'}
            </Typography>
            {data && (
              <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Data Summary: {Array.isArray(data) ? `${data.length} records` : 'Single value'}
                </Typography>
              </Box>
            )}
          </Box>
        )

      default:
        return <Typography>Unknown card type</Typography>
    }
  }

  const getCardIcon = () => {
    switch (card.type) {
      case 'stat': return <StatIcon />
      case 'chart': return <ChartIcon />
      case 'table': return <TableIcon />
      case 'ai_insight': return <InsightIcon />
      default: return <AIIcon />
    }
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          {getCardIcon()}
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {card.title}
          </Typography>
          <Chip 
            label={card.type} 
            size="small" 
            color="primary" 
            variant="outlined"
          />
          <IconButton size="small" onClick={handleMenuClick}>
            <MoreIcon />
          </IconButton>
        </Box>

        {/* Description */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {card.content?.basic?.description || 'AI-generated dashboard card'}
        </Typography>

        {/* Content */}
        {renderContent()}
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Size: {card.size.width}x{card.size.height}
        </Typography>
        <Button 
          size="small" 
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </CardActions>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleRefresh}>
          <ListItemIcon>
            <RefreshIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Refresh Data</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuClose()}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Card</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleMenuClose()}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Query</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (onResize) {
            const newWidth = card.size.width === 4 ? 6 : card.size.width === 6 ? 8 : 4
            const newHeight = card.size.height === 3 ? 4 : card.size.height === 4 ? 5 : 3
            onResize(card.id, { width: newWidth, height: newHeight })
          }
          handleMenuClose()
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Resize Card</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Card</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  )
} 