'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  alpha,
  Stack,
  Tooltip,
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Event as EventIcon,
  TrendingUp,
  Assessment,
  DateRange,
} from '@mui/icons-material'
import { supabase } from '@/lib/supabase'

interface GrowthEvent {
  id: string
  name: string
  start_date: string
  end_date: string
  event_type: string
  impact_level: number
  notes?: string
  created_at?: string
  estimated_users?: number
}

const EVENT_TYPES = [
  { value: 'conference', label: 'Conference', color: 'primary' },
  { value: 'marketing', label: 'Marketing Campaign', color: 'success' },
  { value: 'viral', label: 'Viral Moment', color: 'warning' },
  { value: 'partnership', label: 'Partnership', color: 'info' },
  { value: 'media', label: 'Media Coverage', color: 'secondary' },
  { value: 'other', label: 'Other', color: 'default' },
] as const

const IMPACT_LEVELS = [
  { value: 1, label: 'Very Low', color: '#4CAF50' },
  { value: 2, label: 'Low', color: '#8BC34A' },
  { value: 3, label: 'Medium', color: '#FF9800' },
  { value: 4, label: 'High', color: '#FF5722' },
  { value: 5, label: 'Very High', color: '#F44336' },
]

export default function EventManagementPage() {
  const theme = useTheme()
  const [events, setEvents] = useState<GrowthEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingEvent, setEditingEvent] = useState<GrowthEvent | null>(null)
  const [formData, setFormData] = useState<Partial<GrowthEvent>>({
    name: '',
    start_date: '',
    end_date: '',
    event_type: 'conference',
    impact_level: 3,
    notes: '',
  })

  const loadEvents = async () => {
    try {
      setLoading(true)
      // For now, use localStorage since we don't have a database table yet
      const storedEvents = localStorage.getItem('growth_events')
      if (storedEvents) {
        setEvents(JSON.parse(storedEvents))
      } else {
        // Add demo IFTDO event if no events exist
        const demoEvents: GrowthEvent[] = [
          {
            id: 'iftdo-2025',
            name: '51st IFTDO World Conference & Exhibition 2025',
            start_date: '2025-06-17',
            end_date: '2025-06-19',
            event_type: 'conference',
            impact_level: 4,
            notes: '51st IFTDO (International Federation of Training and Development Organisation) World Conference & Exhibition 2025 at Jakarta International Convention Center - expected high user growth during this period',
            created_at: new Date().toISOString(),
          }
        ]
        localStorage.setItem('growth_events', JSON.stringify(demoEvents))
        setEvents(demoEvents)
      }
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveEvents = (newEvents: GrowthEvent[]) => {
    // Save to localStorage for now
    localStorage.setItem('growth_events', JSON.stringify(newEvents))
    setEvents(newEvents)
  }

  const handleSaveEvent = () => {
    if (!formData.name || !formData.start_date || !formData.end_date) {
      alert('Please fill in all required fields')
      return
    }

    const eventData: GrowthEvent = {
      id: editingEvent?.id || crypto.randomUUID(),
      name: formData.name!,
      start_date: formData.start_date!,
      end_date: formData.end_date!,
      event_type: formData.event_type!,
      impact_level: formData.impact_level!,
      notes: formData.notes,
      created_at: editingEvent?.created_at || new Date().toISOString(),
    }

    let newEvents: GrowthEvent[]
    if (editingEvent) {
      newEvents = events.map(event => event.id === editingEvent.id ? eventData : event)
    } else {
      newEvents = [...events, eventData]
    }

    saveEvents(newEvents)
    handleCloseDialog()
  }

  const handleDeleteEvent = (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      const newEvents = events.filter(event => event.id !== eventId)
      saveEvents(newEvents)
    }
  }

  const handleOpenDialog = (event?: GrowthEvent) => {
    if (event) {
      setEditingEvent(event)
      setFormData(event)
    } else {
      setEditingEvent(null)
      setFormData({
        name: '',
        start_date: '',
        end_date: '',
        event_type: 'conference',
        impact_level: 3,
        notes: '',
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingEvent(null)
    setFormData({})
  }

  const getEventTypeInfo = (type: string) => {
    return EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[EVENT_TYPES.length - 1]
  }

  const getImpactLevelInfo = (level: number) => {
    return IMPACT_LEVELS.find(l => l.value === level) || IMPACT_LEVELS[2]
  }

  useEffect(() => {
    loadEvents()
  }, [])

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="600" gutterBottom>
            Event Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage growth events to improve forecasting accuracy
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{ height: 'fit-content' }}
        >
          Add Event
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <EventIcon sx={{ color: 'primary.main', fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {events.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Events
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingUp sx={{ color: 'success.main', fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {events.filter(e => new Date(e.end_date) >= new Date()).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Events
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Assessment sx={{ color: 'warning.main', fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {events.filter(e => e.impact_level >= 4).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    High Impact Events
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <DateRange sx={{ color: 'info.main', fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {new Date().getFullYear()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Current Year
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Events Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="600" gutterBottom>
            Growth Events
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Event Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Impact Level</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No events found. Add your first growth event to get started.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((event) => {
                    const eventType = getEventTypeInfo(event.event_type)
                    const impactLevel = getImpactLevelInfo(event.impact_level)
                    const isActive = new Date(event.end_date) >= new Date()
                    const isUpcoming = new Date(event.start_date) > new Date()

                    return (
                      <TableRow key={event.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body1" fontWeight={500}>
                              {event.name}
                            </Typography>
                            {event.notes && (
                              <Typography variant="body2" color="text.secondary">
                                {event.notes}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={eventType.label}
                            size="small"
                            color={eventType.color as any}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(event.start_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(event.end_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={impactLevel.label}
                            size="small"
                            sx={{
                              bgcolor: alpha(impactLevel.color, 0.1),
                              color: impactLevel.color,
                              border: `1px solid ${alpha(impactLevel.color, 0.3)}`,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={isUpcoming ? 'Upcoming' : isActive ? 'Active' : 'Completed'}
                            size="small"
                            color={isUpcoming ? 'info' : isActive ? 'success' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="Edit Event">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDialog(event)}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Event">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteEvent(event.id)}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Event Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingEvent ? 'Edit Event' : 'Add New Event'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Event Name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., IFTDO Conference 2025"
            />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={formData.start_date || ''}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={formData.end_date || ''}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Event Type</InputLabel>
                  <Select
                    value={formData.event_type || 'conference'}
                    label="Event Type"
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                  >
                    {EVENT_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Impact Level</InputLabel>
                  <Select
                    value={formData.impact_level || 3}
                    label="Impact Level"
                    onChange={(e) => setFormData({ ...formData, impact_level: Number(e.target.value) })}
                  >
                    {IMPACT_LEVELS.map((level) => (
                      <MenuItem key={level.value} value={level.value}>
                        {level.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Notes (Optional)"
              multiline
              rows={3}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this event..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveEvent}
            variant="contained"
          >
            {editingEvent ? 'Update' : 'Add'} Event
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
} 