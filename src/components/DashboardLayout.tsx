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
} from '@mui/icons-material'
import { KenalLogo } from './KenalLogo'
import { useAuth } from '@/contexts/AuthContext'

const drawerWidth = 260

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [openUsers, setOpenUsers] = useState(true)
  const [openAnalytics, setOpenAnalytics] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut } = useAuth()

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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#000' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
        <KenalLogo size="medium" color="white" />
      </Box>
      
      <Box sx={{ px: 2, pb: 2 }}>
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
            >
              <ListItemIcon>
                <BarChart fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="User Analysis" />
              <Chip label="Coming Soon" size="small" sx={{ bgcolor: 'text.secondary', height: 20 }} />
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
                <CreditCard fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Transactions" />
              <Chip label="Coming Soon" size="small" sx={{ bgcolor: 'text.secondary', height: 20 }} />
            </ListItemButton>
          </List>
        </Collapse>

        <ListItem disablePadding>
          <ListItemButton 
            onClick={() => router.push('/content')}
            selected={pathname === '/content'}
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
            <Chip label="Coming Soon" size="small" sx={{ bgcolor: 'text.secondary', height: 20 }} />
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
            <Chip label="Coming Soon" size="small" sx={{ bgcolor: 'text.secondary', height: 20 }} />
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
            <Chip label="Coming Soon" size="small" sx={{ bgcolor: 'text.secondary', height: 20 }} />
          </ListItemButton>
        </ListItem>
      </List>
      
      <Box sx={{ flexGrow: 1 }} />
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)' }} />
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

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: '#0a0a0a',
          color: 'text.primary',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Admin Dashboard
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
            <IconButton
              size="large"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleClose}>Profile</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
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
              backgroundColor: '#000000',
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
              backgroundColor: '#000000',
              borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
          backgroundColor: '#0a0a0a',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {children}
      </Box>
    </Box>
  )
}
