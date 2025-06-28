'use client'

import { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Paper, 
  Card, 
  CardContent, 
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  TextField,
  ButtonGroup,
  Tooltip,
  IconButton
} from '@mui/material'
import { 
  Settings, 
  Security, 
  Dashboard as DashboardIcon,
  Timer,
  Refresh,
  Speed,
  Palette,
  ViewModule,
  Save,
  RestoreFromTrash,
  Info,
  ExpandMore,
  Cached,
  Analytics,
  Schedule,
  Memory,
  Notifications,
  Build
} from '@mui/icons-material'
import CacheClearButton from '@/components/CacheClearButton'
import { AUTO_LOGOUT, CACHE_DURATIONS } from '@/lib/constants'

interface AdminSettings {
  // System Configuration
  autoLogout: {
    inactivityTimeout: number
    warningTime: number
    enabled: boolean
  }
  cache: {
    dashboardStats: number
    recentUsers: number
    chartData: number
    userDetails: number
    autoRefresh: boolean
  }
  performance: {
    realTimeFeatures: boolean
    dataRefreshInterval: number
    itemsPerPage: number
    enableAnimations: boolean
  }
  
  // Dashboard Preferences
  dashboard: {
    defaultAnalyticsTab: number
    defaultTimeRange: string
    compactMode: boolean
    showWelcomeMessage: boolean
  }
  charts: {
    defaultChartType: string
    showDataLabels: boolean
    animateCharts: boolean
    colorScheme: string
  }
  notifications: {
    growthAlerts: boolean
    systemAlerts: boolean
    weeklyReports: boolean
    soundEnabled: boolean
  }
}

const defaultSettings: AdminSettings = {
  autoLogout: {
    inactivityTimeout: AUTO_LOGOUT.INACTIVITY_TIMEOUT,
    warningTime: AUTO_LOGOUT.WARNING_TIME,
    enabled: true
  },
  cache: {
    dashboardStats: CACHE_DURATIONS.DASHBOARD_STATS / (60 * 1000),
    recentUsers: CACHE_DURATIONS.RECENT_USERS / (60 * 1000),
    chartData: CACHE_DURATIONS.CHART_DATA / (60 * 1000),
    userDetails: CACHE_DURATIONS.USER_DETAILS / (60 * 1000),
    autoRefresh: true
  },
  performance: {
    realTimeFeatures: true,
    dataRefreshInterval: 5,
    itemsPerPage: 10,
    enableAnimations: true
  },
  dashboard: {
    defaultAnalyticsTab: 0,
    defaultTimeRange: 'Last 30 Days',
    compactMode: false,
    showWelcomeMessage: true
  },
  charts: {
    defaultChartType: 'line',
    showDataLabels: true,
    animateCharts: true,
    colorScheme: 'default'
  },
  notifications: {
    growthAlerts: true,
    systemAlerts: true,
    weeklyReports: false,
    soundEnabled: false
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings)
  const [hasChanges, setHasChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('kenal-admin-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsed })
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }
  }, [])

  const updateSetting = (category: keyof AdminSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
    setHasChanges(true)
  }

  const saveSettings = async () => {
    setSaveStatus('saving')
    try {
      localStorage.setItem('kenal-admin-settings', JSON.stringify(settings))
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate save delay
      setSaveStatus('saved')
      setHasChanges(false)
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    setHasChanges(true)
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Paper sx={{ p: 4, mb: 4, textAlign: 'center' }}>
        <Settings sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom fontWeight="600">
          Admin Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure system preferences and dashboard behavior
        </Typography>
      </Paper>

      {/* Save/Reset Actions */}
      {hasChanges && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Typography>You have unsaved changes</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={resetSettings}
                startIcon={<RestoreFromTrash />}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={saveSettings}
                disabled={saveStatus === 'saving'}
                startIcon={<Save />}
              >
                {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        </Alert>
      )}

      {saveStatus === 'saved' && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}

      {saveStatus === 'error' && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error saving settings. Please try again.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* System Configuration */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Security sx={{ fontSize: 28, color: 'primary.main', mr: 2 }} />
                <Typography variant="h5" fontWeight="600">
                  System Configuration
                </Typography>
              </Box>

              {/* Auto-Logout Settings */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Timer sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="h6">Auto-Logout Settings</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.autoLogout.enabled}
                            onChange={(e) => updateSetting('autoLogout', 'enabled', e.target.checked)}
                          />
                        }
                        label="Enable Auto-Logout"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth disabled={!settings.autoLogout.enabled}>
                        <InputLabel>Inactivity Timeout</InputLabel>
                        <Select
                          value={settings.autoLogout.inactivityTimeout}
                          onChange={(e) => updateSetting('autoLogout', 'inactivityTimeout', e.target.value)}
                        >
                          <MenuItem value={15}>15 minutes</MenuItem>
                          <MenuItem value={30}>30 minutes</MenuItem>
                          <MenuItem value={60}>1 hour</MenuItem>
                          <MenuItem value={120}>2 hours</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth disabled={!settings.autoLogout.enabled}>
                        <InputLabel>Warning Time</InputLabel>
                        <Select
                          value={settings.autoLogout.warningTime}
                          onChange={(e) => updateSetting('autoLogout', 'warningTime', e.target.value)}
                        >
                          <MenuItem value={2}>2 minutes</MenuItem>
                          <MenuItem value={5}>5 minutes</MenuItem>
                          <MenuItem value={10}>10 minutes</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Cache Management */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Cached sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="h6">Cache Management</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.cache.autoRefresh}
                            onChange={(e) => updateSetting('cache', 'autoRefresh', e.target.checked)}
                          />
                        }
                        label="Auto-refresh cached data"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography gutterBottom>Dashboard Stats Cache (minutes)</Typography>
                      <Slider
                        value={settings.cache.dashboardStats}
                        onChange={(e, value) => updateSetting('cache', 'dashboardStats', value)}
                        min={1}
                        max={30}
                        marks={[{value: 5, label: '5m'}, {value: 15, label: '15m'}, {value: 30, label: '30m'}]}
                        valueLabelDisplay="auto"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography gutterBottom>Chart Data Cache (minutes)</Typography>
                      <Slider
                        value={settings.cache.chartData}
                        onChange={(e, value) => updateSetting('cache', 'chartData', value)}
                        min={5}
                        max={60}
                        marks={[{value: 10, label: '10m'}, {value: 30, label: '30m'}, {value: 60, label: '1h'}]}
                        valueLabelDisplay="auto"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ textAlign: 'center', pt: 2 }}>
                        <CacheClearButton />
                      </Box>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Performance Settings */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Speed sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="h6">Performance Settings</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.performance.realTimeFeatures}
                            onChange={(e) => updateSetting('performance', 'realTimeFeatures', e.target.checked)}
                          />
                        }
                        label="Real-time features"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.performance.enableAnimations}
                            onChange={(e) => updateSetting('performance', 'enableAnimations', e.target.checked)}
                          />
                        }
                        label="Enable animations"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Items per page</InputLabel>
                        <Select
                          value={settings.performance.itemsPerPage}
                          onChange={(e) => updateSetting('performance', 'itemsPerPage', e.target.value)}
                        >
                          <MenuItem value={5}>5 items</MenuItem>
                          <MenuItem value={10}>10 items</MenuItem>
                          <MenuItem value={25}>25 items</MenuItem>
                          <MenuItem value={50}>50 items</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Data refresh interval</InputLabel>
                        <Select
                          value={settings.performance.dataRefreshInterval}
                          onChange={(e) => updateSetting('performance', 'dataRefreshInterval', e.target.value)}
                        >
                          <MenuItem value={1}>1 minute</MenuItem>
                          <MenuItem value={5}>5 minutes</MenuItem>
                          <MenuItem value={10}>10 minutes</MenuItem>
                          <MenuItem value={30}>30 minutes</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </CardContent>
          </Card>
        </Grid>

        {/* Dashboard Preferences */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <DashboardIcon sx={{ fontSize: 28, color: 'primary.main', mr: 2 }} />
                <Typography variant="h5" fontWeight="600">
                  Dashboard Preferences
                </Typography>
              </Box>

              {/* Dashboard Layout */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ViewModule sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="h6">Layout & Display</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Default Analytics Tab</InputLabel>
                        <Select
                          value={settings.dashboard.defaultAnalyticsTab}
                          onChange={(e) => updateSetting('dashboard', 'defaultAnalyticsTab', e.target.value)}
                        >
                          <MenuItem value={0}>User Growth</MenuItem>
                          <MenuItem value={1}>Segmentation</MenuItem>
                          <MenuItem value={2}>Behavioral</MenuItem>
                          <MenuItem value={4}>Identity Network</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Default Time Range</InputLabel>
                        <Select
                          value={settings.dashboard.defaultTimeRange}
                          onChange={(e) => updateSetting('dashboard', 'defaultTimeRange', e.target.value)}
                        >
                          <MenuItem value="Last 30 Days">Last 30 Days</MenuItem>
                          <MenuItem value="Last 60 Days">Last 60 Days</MenuItem>
                          <MenuItem value="Last 90 Days">Last 90 Days</MenuItem>
                          <MenuItem value="Last 6 Months">Last 6 Months</MenuItem>
                          <MenuItem value="Last Year">Last Year</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.dashboard.compactMode}
                            onChange={(e) => updateSetting('dashboard', 'compactMode', e.target.checked)}
                          />
                        }
                        label="Compact mode"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.dashboard.showWelcomeMessage}
                            onChange={(e) => updateSetting('dashboard', 'showWelcomeMessage', e.target.checked)}
                          />
                        }
                        label="Show welcome message"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Chart Preferences */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Analytics sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="h6">Chart Preferences</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Default Chart Type</InputLabel>
                        <Select
                          value={settings.charts.defaultChartType}
                          onChange={(e) => updateSetting('charts', 'defaultChartType', e.target.value)}
                        >
                          <MenuItem value="line">Line Chart</MenuItem>
                          <MenuItem value="bar">Bar Chart</MenuItem>
                          <MenuItem value="area">Area Chart</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Color Scheme</InputLabel>
                        <Select
                          value={settings.charts.colorScheme}
                          onChange={(e) => updateSetting('charts', 'colorScheme', e.target.value)}
                        >
                          <MenuItem value="default">Default</MenuItem>
                          <MenuItem value="vibrant">Vibrant</MenuItem>
                          <MenuItem value="pastel">Pastel</MenuItem>
                          <MenuItem value="monochrome">Monochrome</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.charts.showDataLabels}
                            onChange={(e) => updateSetting('charts', 'showDataLabels', e.target.checked)}
                          />
                        }
                        label="Show data labels"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.charts.animateCharts}
                            onChange={(e) => updateSetting('charts', 'animateCharts', e.target.checked)}
                          />
                        }
                        label="Animate charts"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Notification Preferences */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Notifications sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="h6">Notifications</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.notifications.growthAlerts}
                            onChange={(e) => updateSetting('notifications', 'growthAlerts', e.target.checked)}
                          />
                        }
                        label="Growth alerts"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.notifications.systemAlerts}
                            onChange={(e) => updateSetting('notifications', 'systemAlerts', e.target.checked)}
                          />
                        }
                        label="System alerts"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.notifications.weeklyReports}
                            onChange={(e) => updateSetting('notifications', 'weeklyReports', e.target.checked)}
                          />
                        }
                        label="Weekly reports"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.notifications.soundEnabled}
                            onChange={(e) => updateSetting('notifications', 'soundEnabled', e.target.checked)}
                          />
                        }
                        label="Sound notifications"
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Settings Summary */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Info sx={{ mr: 1, color: 'info.main' }} />
            <Typography variant="h6">Current Settings Summary</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Chip 
                label={`Auto-logout: ${settings.autoLogout.enabled ? `${settings.autoLogout.inactivityTimeout}min` : 'Disabled'}`}
                color={settings.autoLogout.enabled ? 'success' : 'default'}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Chip 
                label={`Real-time: ${settings.performance.realTimeFeatures ? 'Enabled' : 'Disabled'}`}
                color={settings.performance.realTimeFeatures ? 'success' : 'default'}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Chip 
                label={`Default range: ${settings.dashboard.defaultTimeRange}`}
                color="primary"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Chip 
                label={`Items/page: ${settings.performance.itemsPerPage}`}
                color="primary"
                variant="outlined"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  )
}
