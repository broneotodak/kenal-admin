'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Collapse,
  Chip,
  Tooltip,
  useTheme as useMUITheme,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  Analytics,
  Article,
  Feedback,
  Settings,
  Logout,
  AccountCircle,
  ExpandLess,
  ExpandMore,
  Group,
  BarChart,
  CreditCard,
  LightMode,
  DarkMode,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Event,
  AutoAwesome,
} from '@mui/icons-material'
import { KenalLogo } from './KenalLogo'
import NotificationCenter from './NotificationCenter'
import VersionInfo from './VersionInfo'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useAutoLogout } from '@/hooks/useAutoLogout'
import AutoLogoutWarning from './AutoLogoutWarning'
import { UI, AUTO_LOGOUT } from '@/lib/constants'

const drawerWidth = UI.DRAWER_WIDTH

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const muiTheme = useMUITheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopOpen, setDesktopOpen] = useState(true)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [openUsers, setOpenUsers] = useState(true)
  const [openAnalytics, setOpenAnalytics] = useState(true)
  const [showLogoutWarning, setShowLogoutWarning] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()

  const handleLogout = async () => {
    try {
      console.log('🔄 Dashboard logout initiated...')
      setShowLogoutWarning(false)
      
      // Immediate UI feedback
      setAnchorEl(null)
      
      // Let AuthContext handle the complete logout process including navigation
      await signOut()
      
      console.log('✅ Dashboard logout completed')
    } catch (error) {
      console.error('❌ Dashboard logout error:', error)
      
      // Force logout - clear everything manually
      try {
        // Clear all localStorage
        localStorage.clear()
        sessionStorage.clear()
        
        // Clear all cookies
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
        })
      } catch (e) {
        console.error('Storage clear error:', e)
      }
      
      // Force navigation using multiple methods
      try {
        // Method 1: window.location (most reliable)
        window.location.href = '/login'
      } catch (e1) {
        try {
          // Method 2: window.location.replace
          window.location.replace('/login')
        } catch (e2) {
          try {
            // Method 3: router.push as last resort
            router.push('/login')
          } catch (e3) {
            // Method 4: Force reload to root
            window.location.href = '/'
          }
        }
      }
    }
  }

  // Auto-logout functionality
  const { extendSession } = useAutoLogout({
    inactivityTimeout: AUTO_LOGOUT.INACTIVITY_TIMEOUT,
    warningTime: AUTO_LOGOUT.WARNING_TIME,
    onWarning: () => {
      setShowLogoutWarning(true)
    },
    onLogout: handleLogout
  })

  const handleMobileDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleDesktopDrawerToggle = () => {
    setDesktopOpen(!desktopOpen)
  }

  // Universal toggle that handles both mobile and desktop
  const handleDrawerToggle = () => {
    // On mobile, toggle mobile drawer
    if (window.innerWidth < muiTheme.breakpoints.values.sm) {
      setMobileOpen(!mobileOpen)
    } else {
      // On desktop, toggle desktop drawer
      setDesktopOpen(!desktopOpen)
    }
  }

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleExtendSession = () => {
    setShowLogoutWarning(false)
    extendSession()
  }

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', pt: '64px' }}>
      <Box sx={{ px: 2, py: 3 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>
          Navigation
        </Typography>
      </Box>
      
      <List sx={{ px: 1 }}>
        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => router.push('/dashboard')}
            selected={pathname === '/dashboard'}
            sx={{
              color: 'text.secondary',
              '& .MuiListItemIcon-root': { color: 'text.secondary', minWidth: 40 },
              '&.Mui-selected': {
                color: 'primary.main',
                '& .MuiListItemIcon-root': { color: 'primary.main' },
              },
            }}
          >
            <ListItemIcon>
              <Dashboard fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => router.push('/custom-dashboard')}
            selected={pathname === '/custom-dashboard'}
            sx={{
              color: 'text.secondary',
              '& .MuiListItemIcon-root': { color: 'text.secondary', minWidth: 40 },
              '&.Mui-selected': {
                color: 'primary.main',
                '& .MuiListItemIcon-root': { color: 'primary.main' },
              },
            }}
          >
            <ListItemIcon>
              <AutoAwesome fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Custom Dashboard" />
            <Chip 
              label="AI" 
              size="small" 
              color="primary" 
              variant="outlined"
              sx={{ 
                height: 18, 
                fontSize: '0.6rem',
                '& .MuiChip-label': { px: 0.5 }
              }} 
            />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => setOpenUsers(!openUsers)}
            sx={{
              color: 'text.secondary',
              '& .MuiListItemIcon-root': { color: 'text.secondary', minWidth: 40 },
            }}
          >
            <ListItemIcon>
              <People fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Users" />
            {openUsers ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={openUsers} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton 
              sx={{ pl: 4 }}
              onClick={() => router.push('/users')}
              selected={pathname === '/users'}
            >
              <ListItemIcon>
                <Group fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="All Users" />
            </ListItemButton>
          </List>
        </Collapse>

        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => setOpenAnalytics(!openAnalytics)}
            sx={{
              color: 'text.secondary',
              '& .MuiListItemIcon-root': { color: 'text.secondary', minWidth: 40 },
            }}
          >
            <ListItemIcon>
              <Analytics fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Analytics" />
            {openAnalytics ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={openAnalytics} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton 
              sx={{ pl: 4 }}
              onClick={() => router.push('/analytics')}
              selected={pathname === '/analytics'}
            >
              <ListItemIcon>
                <BarChart fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="User Analytics" />
            </ListItemButton>
            <ListItemButton 
              sx={{ pl: 4 }}
              onClick={() => router.push('/analytics/growth')}
              selected={pathname === '/analytics/growth'}
            >
              <ListItemIcon>
                <TrendingUp fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Growth Forecasting" />
            </ListItemButton>
            <ListItemButton 
              sx={{ pl: 4 }}
              onClick={() => router.push('/analytics/events')}
              selected={pathname === '/analytics/events'}
            >
              <ListItemIcon>
                <Event fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Event Management" />
            </ListItemButton>
          </List>
        </Collapse>

        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => router.push('/content')}
            selected={pathname === '/content'}
            disabled
            sx={{
              color: 'text.secondary',
              '& .MuiListItemIcon-root': { color: 'text.secondary', minWidth: 40 },
              '&.Mui-selected': {
                color: 'primary.main',
                '& .MuiListItemIcon-root': { color: 'primary.main' },
              },
            }}
          >
            <ListItemIcon>
              <Article fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Content" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => router.push('/feedback')}
            selected={pathname === '/feedback'}
            sx={{
              color: 'text.secondary',
              '& .MuiListItemIcon-root': { color: 'text.secondary', minWidth: 40 },
              '&.Mui-selected': {
                color: 'primary.main',
                '& .MuiListItemIcon-root': { color: 'primary.main' },
              },
            }}
          >
            <ListItemIcon>
              <Feedback fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Feedback" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => router.push('/settings')}
            selected={pathname === '/settings'}
            sx={{
              color: 'text.secondary',
              '& .MuiListItemIcon-root': { color: 'text.secondary', minWidth: 40 },
              '&.Mui-selected': {
                color: 'primary.main',
                '& .MuiListItemIcon-root': { color: 'primary.main' },
              },
            }}
          >
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
      </List>
      
      <Box sx={{ flexGrow: 1 }} />
      <Divider sx={{ borderColor: muiTheme.palette.divider }} />
      <List sx={{ px: 1, pb: 2 }}>
        <ListItem disablePadding>
          <ListItemButton 
            onClick={handleLogout}
            sx={{
              color: 'text.secondary',
              '& .MuiListItemIcon-root': { color: 'text.secondary', minWidth: 40 },
              '&:hover': {
                color: 'error.main',
                '& .MuiListItemIcon-root': { color: 'error.main' },
              },
            }}
          >
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  )

  // Get page title based on pathname
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Admin Dashboard'
    if (pathname === '/users') return 'Users Management'
    if (pathname === '/analytics') return 'Analytics'
    if (pathname === '/custom-dashboard') return 'Custom Dashboard'
    if (pathname === '/content') return 'Content'
    if (pathname === '/feedback') return 'Feedback'
    if (pathname === '/settings') return 'Settings'
    return 'Admin Dashboard'
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      {/* Full-width AppBar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          boxShadow: 'none',
          borderBottom: `1px solid ${muiTheme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
          {/* Sidebar toggle button - always visible */}
          <Tooltip 
            title="Toggle Sidebar"
            arrow
          >
            <IconButton
              color="inherit"
              aria-label="toggle sidebar"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                mr: 2,
                color: 'text.primary',
                transition: 'transform 0.2s ease',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  transform: 'scale(1.1)',
                }
              }}
            >
              {/* Show different icons based on screen size and drawer state */}
              <Box
                sx={{
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                {desktopOpen ? <ChevronLeft /> : <ChevronRight />}
              </Box>
              <Box
                sx={{
                  display: { xs: 'block', sm: 'none' }
                }}
              >
                <MenuIcon />
              </Box>
            </IconButton>
          </Tooltip>
          
          {/* Logo on the left */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <KenalLogo size="medium" color={muiTheme.palette.mode === 'dark' ? 'white' : 'theme'} variant="text" />
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                fontWeight: 500,
                color: 'text.primary',
                fontSize: '1rem',
                display: { xs: 'none', sm: 'block' }
              }}
            >
              {getPageTitle()}
            </Typography>
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />

          {/* Right side controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <NotificationCenter />
            <VersionInfo />
            <IconButton
              onClick={toggleTheme}
              size="small"
              sx={{ 
                p: 1,
                color: 'text.primary'
              }}
            >
              {isDarkMode ? <LightMode /> : <DarkMode />}
            </IconButton>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  display: { xs: 'none', md: 'block' },
                  color: 'text.secondary'
                }}
              >
                {user?.email}
              </Typography>
              <Chip
                label="Auto-logout: 30min"
                size="small"
                variant="outlined"
                color="success"
                sx={{
                  display: { xs: 'none', lg: 'flex' },
                  height: 20,
                  fontSize: '0.65rem',
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            </Box>
            <IconButton
              size="large"
              onClick={handleMenu}
              sx={{ color: 'text.primary' }}
            >
              <AccountCircle />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{
                sx: {
                  mt: 1.5,
                }
              }}
            >
              <MenuItem onClick={handleClose}>Profile</MenuItem>
              <MenuItem 
                onClick={() => {
                  handleExtendSession()
                  handleClose()
                }}
              >
                Extend Session
              </MenuItem>

              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ 
          width: { sm: desktopOpen ? drawerWidth : 0 }, 
          flexShrink: { sm: 0 },
          transition: muiTheme.transitions.create('width', {
            easing: muiTheme.transitions.easing.sharp,
            duration: muiTheme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleMobileDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: `1px solid ${muiTheme.palette.divider}`,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="persistent"
          open={desktopOpen}
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: `1px solid ${muiTheme.palette.divider}`,
              transition: muiTheme.transitions.create('width', {
                easing: muiTheme.transitions.easing.sharp,
                duration: muiTheme.transitions.duration.enteringScreen,
              }),
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { 
            xs: '100%',
            sm: desktopOpen ? `calc(100% - ${drawerWidth}px)` : '100%'
          },
          ml: { 
            xs: 0,
            sm: desktopOpen ? 0 : 0
          },
          mt: '64px',
          minHeight: 'calc(100vh - 64px)',
          bgcolor: 'background.default',
          transition: muiTheme.transitions.create(['width', 'margin'], {
            easing: muiTheme.transitions.easing.sharp,
            duration: muiTheme.transitions.duration.enteringScreen,
          }),
          position: 'relative',
        }}
      >
        {children}
      </Box>

      {/* Auto-logout warning modal */}
      <AutoLogoutWarning
        open={showLogoutWarning}
        onExtend={handleExtendSession}
        onLogout={handleLogout}
        warningTime={5}
      />


    </Box>
  )
}
