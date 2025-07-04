import React, { useState, useEffect } from 'react'
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
  Divider
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
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as LineChartIcon,
  DonutLarge as DoughnutIcon,
  Radar as RadarIcon,
  ScatterPlot as ScatterIcon,
  BubbleChart as BubbleIcon,
  Hexagon as PolarIcon
} from '@mui/icons-material'
import { Line, Bar, Pie, Doughnut, Radar, Scatter, PolarArea, Bubble } from 'react-chartjs-2'
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
  RadialLinearScale,
  Filler,
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
  Legend,
  RadialLinearScale,
  Filler
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
  onChartTypeChange?: (cardId: string, newChartType: string) => void
}

export default function DashboardCard({ card, onDelete, onRefresh, onResize, onChartTypeChange }: DashboardCardProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [currentChartType, setCurrentChartType] = useState(card.content?.chart?.type || 'bar')
  const [chartTypeMenuAnchor, setChartTypeMenuAnchor] = useState<null | HTMLElement>(null)

  // Execute SQL query and fetch data - USE SERVER-SIDE API FOR REAL DATA
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Fetching data for card:', card.title, card.type)
      console.log('🔍 Card content:', card.content)
      
      // Check if this is a smart AI generated card with embedded data
      if (card.content?.smartData) {
        console.log('🧠 Smart AI card detected, using embedded data')
        setData(card.content.smartData)
        setLoading(false)
        return
      }

      // Extract query information from AI-generated card
      const query = card.content?.data?.query || ''
      const processing = card.content?.data?.processing || ''
      const source = card.content?.data?.source || 'kd_users'
      
      console.log('📊 Calling real-data API with:', { query, processing, source })
      
      // Call the new real-data API
      const response = await fetch('/api/dashboard/real-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          processing,
          source
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch real data')
      }
      
      console.log('✅ Real data received:', result)
      setData(result.data)
      
    } catch (err) {
      console.error('❌ Real data fetch failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [card.id])

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setChartTypeMenuAnchor(null)
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

  const handleChartTypeMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setChartTypeMenuAnchor(event.currentTarget)
  }

  const handleChartTypeMenuClose = () => {
    setChartTypeMenuAnchor(null)
  }

  const handleChartTypeChange = (newType: string) => {
    setCurrentChartType(newType)
    if (onChartTypeChange) {
      onChartTypeChange(card.id, newType)
    }
    handleChartTypeMenuClose()
    handleMenuClose()
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
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="bold">Real Data Only</Typography>
          {error}
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Unable to fetch real data from KENAL database. Please check your connection or try refreshing the card.
          </Typography>
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
        // Smart detection for stat values - support multiple formats
        let statValue = 0
        
        console.log('📊 Stat card data received:', data)
        
        if (Array.isArray(data) && data.length > 0) {
          const firstItem = data[0]
          // Try common stat field names
          statValue = firstItem?.count || firstItem?.total || firstItem?.value || 
                     firstItem?.total_users || firstItem?.user_count || 
                     firstItem?.registrations ||
                     Object.values(firstItem).find(val => typeof val === 'number') || 0
        } else if (typeof data === 'object' && data !== null) {
          // Handle direct object format
          statValue = data.count || data.total || data.value ||
                     data.total_users || data.user_count ||
                     Object.values(data).find(val => typeof val === 'number') || 0
        }
        
        console.log('📊 Final stat value:', statValue)
        
        return (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="h2" color="primary" fontWeight="bold">
              {typeof statValue === 'number' ? statValue.toLocaleString() : statValue}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {card.content?.basic?.description || 'Total Count'}
            </Typography>
          </Box>
        )

      case 'chart':
        // Handle cross-analysis data format (datasets + labels) vs regular array format
        let chartData
        
        // Check for new cross-analysis format with metadata
        const crossAnalysisMetadata = data.find((item: any) => item._chartType)
        
        if (crossAnalysisMetadata) {
          // New cross-analysis format with metadata
          console.log('📊 Cross-analysis with metadata detected:', crossAnalysisMetadata._chartType)
          chartData = {
            labels: crossAnalysisMetadata._labels,
            datasets: crossAnalysisMetadata._datasets
          }
        } else if (data?.datasets && data?.labels) {
          // Legacy cross-analysis format from API (age+gender, country+age, etc.)
          console.log('📊 Legacy cross-analysis data detected:', data)
          chartData = {
            labels: data.labels,
            datasets: data.datasets
          }
        } else {
          // Standard array format
          chartData = {
            labels: data.map((item: any) => item.month || item.category || item.date || item.label || item.name),
            datasets: [{
              label: card.title,
              data: data.map((item: any) => item.value || item.count || item.total),
              borderColor: card.content?.chart?.colors?.[0] || '#1976d2',
              backgroundColor: card.content?.chart?.colors?.[0] + '20' || '#1976d220',
              tension: 0.1,
              // Enhanced styling for different chart types
              borderWidth: 2,
              hoverBackgroundColor: card.content?.chart?.colors?.[0] + '40' || '#1976d240',
              hoverBorderColor: card.content?.chart?.colors?.[0] || '#1976d2',
            }]
          }
        }

        // Use current chart type from state (user can manually change it)
        let selectedChartType = currentChartType
        
        // Auto-detect better chart type based on data - handle both formats
        let hasTimeData = false
        let hasCategoricalData = false
        let dataLength = 0
        let isCrossAnalysis = false
        
        if (crossAnalysisMetadata) {
          // New cross-analysis format with metadata
          const labels = crossAnalysisMetadata._labels || []
          dataLength = labels.length
          isCrossAnalysis = true
          
          // Force categorical for cross-analysis
          hasCategoricalData = true
          
          // Age-based cross analysis
          hasTimeData = labels.some((label: string) => 
            typeof label === 'string' && (label.includes('-') || label.includes('Q') || label.match(/\d{4}/))
          )
          
          console.log('📊 Cross-analysis type detected:', crossAnalysisMetadata._chartType)
          
        } else if (data?.datasets && data?.labels) {
          // Legacy cross-analysis format - check labels for patterns
          const labels = data.labels || []
          dataLength = labels.length
          hasTimeData = labels.some((label: string) => 
            typeof label === 'string' && (label.includes('-') || label.includes('Q') || label.match(/\d{4}/))
          )
          hasCategoricalData = labels.some((label: string) => 
            typeof label === 'string' && (
              label.includes('age') || label.includes('Under') || label.includes('Over') ||
              label.includes('male') || label.includes('female') ||
              label.includes('country') || label.includes('element')
            )
          ) || labels.length <= 10 // Small number of categories suggests categorical data
        } else if (Array.isArray(data)) {
          // Standard array format
          hasTimeData = data.some((item: any) => item.month || item.date)
          hasCategoricalData = data.some((item: any) => item.category)
          dataLength = data.length
        }
        
        console.log('📊 Chart data analysis:', {
          selectedChartType,
          hasTimeData,
          hasCategoricalData,
          dataLength,
          isCrossAnalysis,
          sampleLabels: chartData.labels.slice(0, 3)
        })
        
        // No longer auto-override chart type - user has manual control
        console.log('📊 Using user-selected chart type:', selectedChartType)

        // Map chart type to component
        const ChartComponent = 
          selectedChartType === 'bar' ? Bar :
          selectedChartType === 'pie' ? Pie :
          selectedChartType === 'doughnut' ? Doughnut :
          selectedChartType === 'radar' ? Radar :
          selectedChartType === 'scatter' ? Scatter :
          selectedChartType === 'polarArea' ? PolarArea :
          selectedChartType === 'bubble' ? Bubble :
          Line

        // Build chart options based on type
        let typeSpecificOptions: any = {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { 
              display: true,
              position: 'top' as const,
              labels: {
                usePointStyle: true,
                padding: 15
              }
            },
            title: { display: false },
            tooltip: {
              mode: 'index' as const,
              intersect: false,
              callbacks: {
                label: function(context: any) {
                  const label = context.dataset.label || ''
                  const value = context.parsed.y || context.parsed.r || context.parsed
                  return `${label}: ${value.toLocaleString()}`
                }
              }
            }
          },
          animation: {
            duration: 1000,
            easing: 'easeInOutQuart' as const
          }
        }

        // Add scale configuration based on chart type
        if (selectedChartType === 'radar' || selectedChartType === 'polarArea') {
          // Radial charts use 'r' scale
          typeSpecificOptions.scales = {
            r: {
              beginAtZero: true,
              ticks: {
                callback: function(value: any) {
                  return value.toLocaleString()
                }
              }
            }
          }
        } else if (selectedChartType === 'scatter' || selectedChartType === 'bubble') {
          // Scatter/bubble charts need linear x scale
          typeSpecificOptions.scales = {
            x: {
              type: 'linear' as const,
              position: 'bottom' as const,
              ticks: {
                callback: function(value: any) {
                  return value.toLocaleString()
                }
              }
            },
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value: any) {
                  return value.toLocaleString()
                }
              }
            }
          }
        } else if (selectedChartType !== 'pie' && selectedChartType !== 'doughnut') {
          // Standard x/y scales for line, bar charts (pie/doughnut don't have scales)
          typeSpecificOptions.scales = {
            y: { 
              beginAtZero: true,
              ticks: {
                callback: function(value: any) {
                  return value.toLocaleString()
                }
              }
            },
            x: {
              ticks: {
                maxRotation: 45,
                minRotation: 0
              }
            }
          }
        }

        return (
          <Box sx={{ height: 200 }}>
            <ChartComponent data={chartData} options={typeSpecificOptions} />
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

  const getChartTypeIcon = (type: string) => {
    switch (type) {
      case 'bar': return <BarChartIcon fontSize="small" />
      case 'line': return <LineChartIcon fontSize="small" />
      case 'pie': return <PieChartIcon fontSize="small" />
      case 'doughnut': return <DoughnutIcon fontSize="small" />
      case 'radar': return <RadarIcon fontSize="small" />
      case 'scatter': return <ScatterIcon fontSize="small" />
      case 'bubble': return <BubbleIcon fontSize="small" />
      case 'polarArea': return <PolarIcon fontSize="small" />
      default: return <ChartIcon fontSize="small" />
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
        {card.type === 'chart' && (
          <>
            <Divider />
            <MenuItem onClick={handleChartTypeMenuOpen}>
              <ListItemIcon>
                {getChartTypeIcon(currentChartType)}
              </ListItemIcon>
              <ListItemText>Change Chart Type</ListItemText>
            </MenuItem>
          </>
        )}
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

      {/* Chart Type Submenu */}
      <Menu
        anchorEl={chartTypeMenuAnchor}
        open={Boolean(chartTypeMenuAnchor)}
        onClose={handleChartTypeMenuClose}
      >
        <MenuItem onClick={() => handleChartTypeChange('bar')} selected={currentChartType === 'bar'}>
          <ListItemIcon>
            <BarChartIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Bar Chart</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleChartTypeChange('line')} selected={currentChartType === 'line'}>
          <ListItemIcon>
            <LineChartIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Line Chart</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleChartTypeChange('pie')} selected={currentChartType === 'pie'}>
          <ListItemIcon>
            <PieChartIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Pie Chart</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleChartTypeChange('doughnut')} selected={currentChartType === 'doughnut'}>
          <ListItemIcon>
            <DoughnutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Doughnut Chart</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleChartTypeChange('radar')} selected={currentChartType === 'radar'}>
          <ListItemIcon>
            <RadarIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Radar Chart</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleChartTypeChange('polarArea')} selected={currentChartType === 'polarArea'}>
          <ListItemIcon>
            <PolarIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Polar Area Chart</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleChartTypeChange('scatter')} selected={currentChartType === 'scatter'}>
          <ListItemIcon>
            <ScatterIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Scatter Plot</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleChartTypeChange('bubble')} selected={currentChartType === 'bubble'}>
          <ListItemIcon>
            <BubbleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Bubble Chart</ListItemText>
        </MenuItem>
      </Menu>
    </Card>
  )
} 