import React from 'react'
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Stack,
  Divider,
  useTheme,
  alpha,
} from '@mui/material'
import {
  Visibility,
  Email,
  CalendarToday,
} from '@mui/icons-material'

interface UserCardProps {
  user: {
    id: string
    name: string
    email: string
    created_at: string
    gender?: string
    element_number?: number
    active: boolean
    identity_count?: number
  }
  onView: (user: any) => void
  getElementColor: (element?: number) => string
}

export const UserMobileCard: React.FC<UserCardProps> = ({ user, onView, getElementColor }) => {
  const theme = useTheme()
  
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar 
              sx={{ 
                bgcolor: alpha(getElementColor(user.element_number), 0.2),
                color: getElementColor(user.element_number),
                border: `2px solid ${alpha(getElementColor(user.element_number), 0.3)}`
              }}
            >
              {user.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                {user.name}
              </Typography>
              <Chip
                label={user.active ? 'Active' : 'Inactive'}
                size="small"
                color={user.active ? 'success' : 'error'}
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Box>
          <IconButton 
            size="small" 
            onClick={() => onView(user)}
            sx={{
              color: theme.palette.primary.main,
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.1)
              }
            }}
          >
            <Visibility />
          </IconButton>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={1.5}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Email sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
            <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
              {user.email}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarToday sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
              <Typography variant="body2" color="text.secondary">
                {new Date(user.created_at).toLocaleDateString()}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              {user.element_number && (
                <Chip
                  label={`E${user.element_number}`}
                  size="small"
                  sx={{ 
                    bgcolor: alpha(getElementColor(user.element_number), 0.2),
                    color: getElementColor(user.element_number),
                    border: `1px solid ${alpha(getElementColor(user.element_number), 0.3)}`,
                    fontWeight: 500
                  }}
                />
              )}
              <Chip
                label={`${user.identity_count || 0} ID`}
                size="small"
                variant="outlined"
                color={(user.identity_count || 0) > 0 ? 'success' : 'default'}
              />
            </Box>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}
