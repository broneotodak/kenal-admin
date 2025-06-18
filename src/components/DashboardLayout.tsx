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
} from '@mui/icons-material'
import { KenalLogo } from './KenalLogo'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

const drawerWidth = 280

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const muiTheme = useMUITheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [openUsers, setOpenUsers] = useState(true)
  const [openAnalytics, setOpenAnalytics] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
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
            <ListItemButton 
              sx={{ pl: 4 }}
              onClick={() => router.push('/users/analysis')}
              selected={pathname === '/users/analysis'}
              disabled
            >
              <ListItemIcon>
                <BarChart fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="User Analysis" />
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
              disabled
            >
              <ListItemIcon>
                <CreditCard fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Transactions" />
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
              <Feedback fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Feedback" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => router.push('/settings')}
            selected={pathname === '/settings'}
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
          {/* Mobile menu button */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { sm: 'none' },
              color: 'text.primary'
            }}
          >
            <MenuIcon />
          </IconButton>
          
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
            <Typography 
              variant="body2" 
              sx={{ 
                display: { xs: 'none', md: 'block' },
                color: 'text.secondary'
              }}
            >
              {user?.email}
            </Typography>
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
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
            },
          }}
          open
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
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
          minHeight: 'calc(100vh - 64px)',
          bgcolor: 'background.default',
        }}
      >
        {children}
      </Box>
    </Box>
  )
}
