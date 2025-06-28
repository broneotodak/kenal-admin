'use client'

import { useState } from 'react'
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Chip,
  Avatar,
  Paper,
  Stack,
  Tooltip,
  ListItemSecondaryAction
} from '@mui/material'
import {
  Notifications,
  NotificationsActive,
  CheckCircle,
  Error,
  Warning,
  Info,
  Close,
  MarkEmailRead,
  Delete,
  Settings,
  TrendingUp,
  Computer,
  Assessment,
  Person,
  Circle
} from '@mui/icons-material'
import { useNotifications } from '@/contexts/NotificationContext'
import { formatDistanceToNow } from 'date-fns'

const getNotificationIcon = (type: string, category: string) => {
  if (category === 'growth') return <TrendingUp fontSize="small" />
  if (category === 'system') return <Computer fontSize="small" />
  if (category === 'reports') return <Assessment fontSize="small" />
  if (category === 'user') return <Person fontSize="small" />
  
  switch (type) {
    case 'success': return <CheckCircle fontSize="small" />
    case 'error': return <Error fontSize="small" />
    case 'warning': return <Warning fontSize="small" />
    default: return <Info fontSize="small" />
  }
}

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'success': return 'success.main'
    case 'error': return 'error.main'
    case 'warning': return 'warning.main'
    default: return 'info.main'
  }
}

export default function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    requestPermission,
    settings
  } = useNotifications()

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    if (notification.action) {
      notification.action.onClick()
      handleClose()
    }
  }

  const handleMarkAllRead = () => {
    markAllAsRead()
  }

  const handleClearAll = () => {
    clearAllNotifications()
    handleClose()
  }

  const handleRequestPermission = async () => {
    await requestPermission()
  }

  const recentNotifications = notifications.slice(0, 10)
  const hasNotifications = notifications.length > 0

  return (
    <>
      <Tooltip title="Notifications" arrow>
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{ 
            p: 1,
            color: 'text.primary',
            '&:hover': {
              backgroundColor: 'action.hover'
            }
          }}
          aria-controls={open ? 'notification-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <Badge 
            badgeContent={unreadCount} 
            color="error"
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.7rem',
                height: 18,
                minWidth: 18
              }
            }}
          >
            {unreadCount > 0 ? (
              <NotificationsActive sx={{ color: 'primary.main' }} />
            ) : (
              <Notifications />
            )}
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        id="notification-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            width: 400,
            maxHeight: 600,
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight="600">
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Chip 
                label={`${unreadCount} new`} 
                size="small" 
                color="primary"
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            )}
          </Box>
          
          {/* Action Buttons */}
          {hasNotifications && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              {unreadCount > 0 && (
                <Button
                  size="small"
                  startIcon={<MarkEmailRead />}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMarkAllRead()
                  }}
                  sx={{ fontSize: '0.7rem' }}
                >
                  Mark all read
                </Button>
              )}
              <Button
                size="small"
                startIcon={<Delete />}
                onClick={(e) => {
                  e.stopPropagation()
                  handleClearAll()
                }}
                color="error"
                sx={{ fontSize: '0.7rem' }}
              >
                Clear all
              </Button>
            </Box>
          )}
        </Box>

        {/* Browser Notification Permission */}
        {!settings.browserNotifications && (
          <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Enable browser notifications for important alerts
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={(e) => {
                e.stopPropagation()
                handleRequestPermission()
              }}
              startIcon={<Notifications />}
            >
              Enable Notifications
            </Button>
          </Box>
        )}

        {/* Notifications List */}
        {hasNotifications ? (
          <List sx={{ py: 0, maxHeight: 400, overflow: 'auto' }}>
            {recentNotifications.map((notification, index) => (
              <div key={notification.id}>
                <ListItem
                  component="div"
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.selected'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Avatar
                      sx={{
                        bgcolor: getNotificationColor(notification.type),
                        width: 32,
                        height: 32
                      }}
                    >
                      {getNotificationIcon(notification.type, notification.category)}
                    </Avatar>
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="body2" 
                          fontWeight={notification.read ? 400 : 600}
                          sx={{ flex: 1 }}
                        >
                          {notification.title}
                        </Typography>
                        {!notification.read && (
                          <Circle sx={{ fontSize: 8, color: 'primary.main' }} />
                        )}
                      </Box>
                    }
                    secondary={
                      <Stack spacing={0.5}>
                        <Typography variant="body2" color="text.secondary">
                          {notification.message}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                          </Typography>
                          <Chip
                            label={notification.category}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              height: 16, 
                              fontSize: '0.6rem',
                              textTransform: 'capitalize'
                            }}
                          />
                        </Box>
                      </Stack>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        clearNotification(notification.id)
                      }}
                      sx={{ opacity: 0.7 }}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                
                {index < recentNotifications.length - 1 && <Divider />}
              </div>
            ))}
            
            {notifications.length > 10 && (
              <Box sx={{ p: 2, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary">
                  Showing 10 of {notifications.length} notifications
                </Typography>
              </Box>
            )}
          </List>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Notifications sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No notifications yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You'll see important updates and alerts here
            </Typography>
          </Box>
        )}

        {/* Footer */}
        {hasNotifications && (
          <Box sx={{ p: 1, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
            <Button
              size="small"
              startIcon={<Settings />}
              onClick={(e) => {
                e.stopPropagation()
                window.location.href = '/settings'
              }}
              sx={{ fontSize: '0.7rem' }}
            >
              Notification Settings
            </Button>
          </Box>
        )}
      </Menu>
    </>
  )
} 