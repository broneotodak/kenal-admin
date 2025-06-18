'use client'

import { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Avatar,
  IconButton,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Tab,
  Tabs,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  Edit,
  Save,
  Cancel,
  PhotoCamera,
  Add,
  Delete,
  Security,
  Notifications,
  Palette,
  Language,
  Storage,
  Mail,
  Key,
} from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'

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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [tabValue, setTabValue] = useState(0)
  const [editMode, setEditMode] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [openAddAdmin, setOpenAddAdmin] = useState(false)
  
  // Profile settings
  const [profile, setProfile] = useState({
    name: 'Neo Todak',
    email: user?.email || 'neo@todak.com',
    role: 'Super Admin',
    avatar: null,
  })
  
  // App settings
  const [appSettings, setAppSettings] = useState({
    appName: 'KENAL Admin',
    appVersion: '1.0.0',
    maintenanceMode: false,
    allowRegistration: true,
    emailNotifications: true,
    pushNotifications: false,
    autoBackup: true,
    backupFrequency: 'daily',
    dataRetention: '90',
    sessionTimeout: '30',
    maxLoginAttempts: '5',
    language: 'en',
    timezone: 'Asia/Jakarta',
    theme: 'light',
  })
  
  // Admin users
  const [adminUsers] = useState([
    { id: 1, name: 'Neo Todak', email: 'neo@todak.com', role: 'Super Admin', status: 'active' },
    { id: 2, name: 'Lan Todak', email: 'lan@todak.com', role: 'Admin', status: 'active' },
    { id: 3, name: 'Hafiz Todak', email: 'hafiz@todak.com', role: 'Admin', status: 'active' },
    { id: 4, name: 'Tom Todak', email: 'tom@todak.com', role: 'Admin', status: 'inactive' },
  ])

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleSaveProfile = () => {
    setEditMode(false)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const handleSaveSettings = () => {
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const ProfileTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Avatar
            sx={{
              width: 120,
              height: 120,
              mx: 'auto',
              mb: 2,
              bgcolor: 'primary.main',
              fontSize: '3rem',
            }}
          >
            {profile.name.charAt(0)}
          </Avatar>
          <IconButton color="primary" component="label">
            <PhotoCamera />
            <input type="file" hidden accept="image/*" />
          </IconButton>
          <Typography variant="h6" gutterBottom>
            {profile.name}
          </Typography>
          <Chip label={profile.role} color="primary" />
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6">Profile Information</Typography>
            {!editMode ? (
              <Button startIcon={<Edit />} onClick={() => setEditMode(true)}>
                Edit
              </Button>
            ) : (
              <Box>
                <Button startIcon={<Cancel />} onClick={() => setEditMode(false)} sx={{ mr: 1 }}>
                  Cancel
                </Button>
                <Button startIcon={<Save />} variant="contained" onClick={handleSaveProfile}>
                  Save
                </Button>
              </Box>
            )}
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={profile.name}
                disabled={!editMode}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                value={profile.email}
                disabled={!editMode}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Role"
                value={profile.role}
                disabled
              />
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h6" gutterBottom>
            Security
          </Typography>
          <Button startIcon={<Key />} variant="outlined" sx={{ mr: 2 }}>
            Change Password
          </Button>
          <Button startIcon={<Security />} variant="outlined">
            Enable 2FA
          </Button>
        </Paper>
      </Grid>
    </Grid>
  )

  const AppSettingsTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Palette />
                General Settings
              </Box>
            </Typography>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="App Name"
                value={appSettings.appName}
                onChange={(e) => setAppSettings({ ...appSettings, appName: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Version"
                value={appSettings.appVersion}
                disabled
                margin="normal"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={appSettings.maintenanceMode}
                    onChange={(e) => setAppSettings({ ...appSettings, maintenanceMode: e.target.checked })}
                  />
                }
                label="Maintenance Mode"
                sx={{ mt: 2 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={appSettings.allowRegistration}
                    onChange={(e) => setAppSettings({ ...appSettings, allowRegistration: e.target.checked })}
                  />
                }
                label="Allow New Registrations"
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Notifications />
                Notifications
              </Box>
            </Typography>
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={appSettings.emailNotifications}
                    onChange={(e) => setAppSettings({ ...appSettings, emailNotifications: e.target.checked })}
                  />
                }
                label="Email Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={appSettings.pushNotifications}
                    onChange={(e) => setAppSettings({ ...appSettings, pushNotifications: e.target.checked })}
                  />
                }
                label="Push Notifications"
              />
              <TextField
                fullWidth
                label="Session Timeout (minutes)"
                type="number"
                value={appSettings.sessionTimeout}
                onChange={(e) => setAppSettings({ ...appSettings, sessionTimeout: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Max Login Attempts"
                type="number"
                value={appSettings.maxLoginAttempts}
                onChange={(e) => setAppSettings({ ...appSettings, maxLoginAttempts: e.target.value })}
                margin="normal"
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Storage />
                Data & Backup
              </Box>
            </Typography>
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={appSettings.autoBackup}
                    onChange={(e) => setAppSettings({ ...appSettings, autoBackup: e.target.checked })}
                  />
                }
                label="Automatic Backup"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Backup Frequency</InputLabel>
                <Select
                  value={appSettings.backupFrequency}
                  onChange={(e) => setAppSettings({ ...appSettings, backupFrequency: e.target.value })}
                  label="Backup Frequency"
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Data Retention (days)"
                type="number"
                value={appSettings.dataRetention}
                onChange={(e) => setAppSettings({ ...appSettings, dataRetention: e.target.value })}
                margin="normal"
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Language />
                Localization
              </Box>
            </Typography>
            <Box sx={{ mt: 2 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Language</InputLabel>
                <Select
                  value={appSettings.language}
                  onChange={(e) => setAppSettings({ ...appSettings, language: e.target.value })}
                  label="Language"
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="id">Indonesian</MenuItem>
                  <MenuItem value="zh">Chinese</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>Timezone</InputLabel>
                <Select
                  value={appSettings.timezone}
                  onChange={(e) => setAppSettings({ ...appSettings, timezone: e.target.value })}
                  label="Timezone"
                >
                  <MenuItem value="Asia/Jakarta">Asia/Jakarta</MenuItem>
                  <MenuItem value="Asia/Singapore">Asia/Singapore</MenuItem>
                  <MenuItem value="Asia/Tokyo">Asia/Tokyo</MenuItem>
                  <MenuItem value="UTC">UTC</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>Theme</InputLabel>
                <Select
                  value={appSettings.theme}
                  onChange={(e) => setAppSettings({ ...appSettings, theme: e.target.value })}
                  label="Theme"
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                  <MenuItem value="auto">Auto</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSaveSettings}
            sx={{
              background: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              },
            }}
          >
            Save Settings
          </Button>
        </Box>
      </Grid>
    </Grid>
  )

  const AdminUsersTab = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">Admin Users</Typography>
        <Button
          startIcon={<Add />}
          variant="contained"
          onClick={() => setOpenAddAdmin(true)}
        >
          Add Admin
        </Button>
      </Box>
      
      <List>
        {adminUsers.map((admin) => (
          <Paper key={admin.id} sx={{ mb: 2 }}>
            <ListItem>
              <Avatar sx={{ mr: 2 }}>{admin.name.charAt(0)}</Avatar>
              <ListItemText
                primary={admin.name}
                secondary={
                  <Box>
                    <Typography variant="body2">{admin.email}</Typography>
                    <Chip
                      label={admin.role}
                      size="small"
                      color="primary"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <Chip
                  label={admin.status}
                  color={admin.status === 'active' ? 'success' : 'default'}
                  size="small"
                  sx={{ mr: 2 }}
                />
                <IconButton edge="end" color="error">
                  <Delete />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          </Paper>
        ))}
      </List>
      
      <Alert severity="info" sx={{ mt: 3 }}>
        Admin users have user_type = 5 in the database. Only users with this type can access the admin dashboard.
      </Alert>
    </Box>
  )

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Settings
      </Typography>

      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}

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
          <Tab label="Profile" />
          <Tab label="App Settings" />
          <Tab label="Admin Users" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <ProfileTab />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <AppSettingsTab />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <AdminUsersTab />
        </TabPanel>
      </Paper>

      {/* Add Admin Dialog */}
      <Dialog open={openAddAdmin} onClose={() => setOpenAddAdmin(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Admin</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            margin="normal"
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select label="Role" defaultValue="Admin">
              <MenuItem value="Admin">Admin</MenuItem>
              <MenuItem value="Super Admin">Super Admin</MenuItem>
            </Select>
          </FormControl>
          <Alert severity="info" sx={{ mt: 2 }}>
            The user will be sent an invitation email to set up their password.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddAdmin(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setOpenAddAdmin(false)}>
            Add Admin
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
