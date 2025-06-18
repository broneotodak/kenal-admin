'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Skeleton,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Divider,
  Paper,
  useTheme,
  useMediaQuery,
  alpha,
} from '@mui/material'
import {
  Search,
  Download,
  Visibility,
  Close,
  Email,
  Person,
  CalendarToday,
  Cake,
  Psychology,
  Category,
  Delete,
} from '@mui/icons-material'
import { supabase } from '@/lib/supabase'
import { UserMobileCard } from '@/components/UserMobileCard'

interface User {
  id: string
  name: string
  email: string
  created_at: string
  gender?: string
  element_number?: number
  user_type?: number
  active: boolean
  identity_count?: number
  birth_date?: string
  country?: string
  kd_identity?: any[]
}

interface UserFilters {
  user_type: string
  gender: string
  country: string
}

// Element visualization component
const ElementVisualization = ({ element }: { element: number }) => {
  const theme = useTheme()
  const elementInfo = {
    1: { name: 'Fire', color: '#FF6B35', symbol: '🔥' },
    2: { name: 'Earth', color: '#8B6914', symbol: '🌍' },
    3: { name: 'Air', color: '#87CEEB', symbol: '💨' },
    4: { name: 'Water', color: '#4682B4', symbol: '💧' },
    5: { name: 'Wood', color: '#228B22', symbol: '🌳' },
    6: { name: 'Metal', color: '#C0C0C0', symbol: '⚡' },
    7: { name: 'Light', color: '#FFD700', symbol: '☀️' },
    8: { name: 'Dark', color: '#4B0082', symbol: '🌙' },
    9: { name: 'Spirit', color: '#9370DB', symbol: '✨' },
  }

  const info = elementInfo[element as keyof typeof elementInfo] || { 
    name: 'Unknown', 
    color: '#9E9E9E', 
    symbol: '❓' 
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      p: 3,
      bgcolor: alpha(info.color, theme.palette.mode === 'dark' ? 0.15 : 0.1),
      borderRadius: 2,
      border: `2px solid ${alpha(info.color, theme.palette.mode === 'dark' ? 0.5 : 0.3)}`
    }}>
      <Typography variant="h1" sx={{ fontSize: '4rem', mb: 1 }}>
        {info.symbol}
      </Typography>
      <Typography 
        variant="h6" 
        sx={{ 
          color: theme.palette.mode === 'dark' ? info.color : info.color,
          fontWeight: 'bold' 
        }}
      >
        Element {element}: {info.name}
      </Typography>
    </Box>
  )
}

// Loading skeleton for table rows
const TableRowSkeleton = () => (
  <TableRow>
    <TableCell>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Skeleton variant="circular" width={40} height={40} />
        <Box>
          <Skeleton width={120} height={20} />
          <Skeleton width={150} height={16} />
        </Box>
      </Box>
    </TableCell>
    <TableCell><Skeleton width={80} height={24} /></TableCell>
    <TableCell><Skeleton width={60} height={20} /></TableCell>
    <TableCell><Skeleton width={90} height={24} /></TableCell>
    <TableCell><Skeleton width={60} height={24} /></TableCell>
    <TableCell><Skeleton width={80} height={20} /></TableCell>
    <TableCell align="right"><Skeleton width={40} height={40} /></TableCell>
  </TableRow>
)

// Identity Card component with mutual users
const IdentityCard = ({ identity, theme }: { identity: any, theme: any }) => {
  const [mutualUsers, setMutualUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMutualUsers = async () => {
      try {
        // Debug: log identity object to see available fields
        console.log('Identity object:', identity)
        console.log('Registration status:', {
          registered: identity.registered,
          email: identity.email,
          isRegistered: identity.registered !== null && identity.email
        })
        
        // Get other users who have this same identity pattern
        const patternToMatch = identity.pattern_name || identity.name || identity.id
        const { data: identityData, error } = await supabase
          .from('kd_identity')
          .select('user_id')
          .eq(identity.pattern_name ? 'pattern_name' : (identity.name ? 'name' : 'id'), patternToMatch)
          .neq('user_id', identity.user_id) // Exclude current user
        
        if (!error && identityData && identityData.length > 0) {
          const userIds = identityData.map(item => item.user_id)
          
          // Get user details for those user IDs
          const { data: userData, error: userError } = await supabase
            .from('kd_users')
            .select('id, name, email, birth_date, active')
            .in('id', userIds)
          
          if (!userError && userData) {
            setMutualUsers(userData)
          }
        }
      } catch (error) {
        console.error('Error fetching mutual users:', error)
      } finally {
        setLoading(false)
      }
    }

    if (identity.pattern_name || identity.name || identity.id) {
      fetchMutualUsers()
    } else {
      setLoading(false)
    }
  }, [identity])

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        p: 2,
        bgcolor: theme.palette.mode === 'dark' 
          ? 'rgba(255, 255, 255, 0.03)' 
          : 'rgba(0, 0, 0, 0.02)',
        borderColor: theme.palette.divider
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          {identity.pattern_name || identity.name || `Identity #${identity.id?.slice(-8) || 'Unknown'}`}
        </Typography>
        <Chip
          label={identity.registered !== null && identity.email ? 'Registered' : 'Not Registered'}
          size="small"
          color={identity.registered !== null && identity.email ? 'success' : 'warning'}
          sx={{ fontSize: '0.7rem', height: 20 }}
        />
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {identity.email ? `📧 ${identity.email}` : 'No e-mail registered'}
      </Typography>
      
      {/* Show mutual users */}
      {mutualUsers.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Other users with this identity:
            </Typography>
            {!loading && (
              <Chip
                label={`${mutualUsers.length} mutual`}
                size="small"
                color={mutualUsers.length > 0 ? 'secondary' : 'default'}
                sx={{ fontSize: '0.7rem', height: 18 }}
              />
            )}
          </Box>
          <Stack spacing={1}>
            {mutualUsers.map((user) => (
              <Box 
                key={user.id}
                sx={{ 
                  p: 1, 
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.03)',
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.divider}`
                }}
              >
                <Typography variant="body2" fontWeight={500}>
                  {user.name || 'No name'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user.email || 'No email'}
                </Typography>
                {user.birth_date && (
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                    Born: {new Date(user.birth_date).toLocaleDateString()}
                  </Typography>
                )}
                <Chip
                  label={user.active ? 'Active' : 'Inactive'}
                  size="small"
                  color={user.active ? 'success' : 'default'}
                  sx={{ ml: 1, fontSize: '0.7rem', height: 20 }}
                />
              </Box>
            ))}
          </Stack>
        </Box>
      )}
      
      <Typography variant="caption" color="text.secondary">
        Created: {new Date(identity.created_at).toLocaleDateString()}
      </Typography>
    </Card>
  )
}

export default function UsersPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [openModal, setOpenModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [filters, setFilters] = useState<UserFilters>({
    user_type: '',
    gender: '',
    country: ''
  })
  const [availableCountries, setAvailableCountries] = useState<string[]>([])
  const [totalMutualCount, setTotalMutualCount] = useState<number>(0)
  const router = useRouter()

  // Fetch available countries from database
  const fetchAvailableCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('kd_users')
        .select('country')
        .not('country', 'is', null)
        .neq('country', '')

      if (!error && data) {
        const uniqueCountries = Array.from(new Set(data.map(item => item.country).filter(Boolean)))
        setAvailableCountries(uniqueCountries.sort())
      }
    } catch (error) {
      console.error('Error fetching countries:', error)
    }
  }

  // Calculate total mutual count for all user identities
  const calculateTotalMutualCount = async (identities: any[]) => {
    try {
      let totalMutual = 0
      
      for (const identity of identities) {
        // Get other users who have this same identity pattern
        const patternToMatch = identity.pattern_name || identity.name || identity.id
        const { data: identityData, error } = await supabase
          .from('kd_identity')
          .select('user_id')
          .eq(identity.pattern_name ? 'pattern_name' : (identity.name ? 'name' : 'id'), patternToMatch)
          .neq('user_id', identity.user_id) // Exclude current user
        
        if (!error && identityData) {
          totalMutual += identityData.length
        }
      }
      
      setTotalMutualCount(totalMutual)
    } catch (error) {
      console.error('Error calculating total mutual count:', error)
      setTotalMutualCount(0)
    }
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      console.log('=== FETCHING USERS DEBUG START ===')
      
      // Test if Supabase client is working at all
      console.log('Testing Supabase client...')
      try {
        const { data: { user } } = await supabase.auth.getUser()
        console.log('Auth user check:', user ? 'User authenticated' : 'No user')
      } catch (authErr) {
        console.error('Auth check failed:', authErr)
      }
      
      // Test basic table access - try different approaches
      console.log('Testing basic table access...')
      
      // Try 1: Most basic query possible
      try {
        console.log('Try 1: Basic count query...')
        const { count, error: countError } = await Promise.race([
          supabase.from('kd_users').select('*', { count: 'exact', head: true }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Count timeout')), 5000))
        ]) as any
        console.log('Count result:', { count, countError })
      } catch (countErr) {
        console.error('Count query failed:', countErr)
      }
      
      // Try 2: Check if table exists with a different method
      try {
        console.log('Try 2: Simple select query...')
        const { data: testUsers, error: testError } = await Promise.race([
          supabase
            .from('kd_users')
            .select('id')
            .limit(1),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Select timeout')), 5000))
        ]) as any
        console.log('Simple select result:', { testUsers, testError })
        
        if (testError) {
          console.error('Simple query failed with error:', testError)
          
          // Check if it's an RLS issue
          if (testError.message?.includes('RLS') || testError.message?.includes('policy')) {
            console.log('🚨 RLS Policy Issue Detected!')
            console.log('Even though docs say RLS is disabled, there might be policies blocking access')
          }
          
          // Check if it's a table access issue
          if (testError.message?.includes('relation') || testError.message?.includes('does not exist')) {
            console.log('🚨 Table Access Issue - kd_users table may not exist or be accessible')
          }
          
          setUsers([])
          setTotalCount(0)
          return
        }
        
        if (testUsers && testUsers.length >= 0) {
          console.log('✅ Basic query successful! Table is accessible.')
        }
        
      } catch (selectErr) {
        console.error('Select query timed out:', selectErr)
        setUsers([])
        setTotalCount(0)
        return
      }
      
      console.log('Basic query successful, fetching full data...')
      
              // Build simpler query first (without the complex join)
        let query = supabase
          .from('kd_users')
          .select(`
            id,
            name,
            email,
            created_at,
            gender,
            element_number,
            active,
            birth_date
          `, { count: 'exact' })

      // Apply search filter
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
      }

      // Apply filters
      if (filters.user_type) {
        if (filters.user_type === 'Admin') {
          query = query.eq('user_type', 5)
        } else if (filters.user_type === 'Public') {
          query = query.not('user_type', 'eq', 5)
        }
      }
      if (filters.gender) {
        query = query.eq('gender', filters.gender)
      }
      if (filters.country) {
        query = query.eq('country', filters.country)
      }

      // Add pagination
      query = query
        .order('created_at', { ascending: false })
        .range(page * rowsPerPage, (page + 1) * rowsPerPage - 1)

      console.log('Executing main query...')
      const { data, error, count } = await Promise.race([
        query,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Main query timeout')), 10000))
      ]) as any

      console.log('Main query result:', { data: data?.length, error, count })

      if (error) {
        console.error('Error fetching users:', error)
        setUsers([])
        setTotalCount(0)
        return
      }

      // Get real identity counts for these users
      const userIds = data?.map((user: any) => user.id) || []
      let identityCounts: { [key: string]: number } = {}
      
      if (userIds.length > 0) {
        try {
          const { data: identityData, error: identityError } = await supabase
            .from('kd_identity')
            .select('user_id')
            .in('user_id', userIds)
          
          if (!identityError && identityData) {
            // Count identities per user
            identityData.forEach(identity => {
              identityCounts[identity.user_id] = (identityCounts[identity.user_id] || 0) + 1
            })
          }
        } catch (error) {
          console.error('Error fetching identity counts:', error)
        }
      }

      const transformedUsers = data?.map((user: any) => ({
        ...user,
        identity_count: identityCounts[user.id] || 0,
      })) || []

      console.log('Transformed users:', transformedUsers.length)
      setUsers(transformedUsers)
      setTotalCount(count || 0)
      
      console.log('=== FETCHING USERS DEBUG END ===')
    } catch (error) {
      console.error('Fetch users error:', error)
      setUsers([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, rowsPerPage, searchQuery, filters])

  useEffect(() => {
    fetchAvailableCountries()
  }, [])

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleViewUser = async (user: User) => {
    setSelectedUser(user)
    setEditingUser({ ...user })
    setOpenModal(true)
    setIsEditing(true)
    setTotalMutualCount(0) // Reset mutual count
    
    // Fetch real identity count and details for this user
    try {
      const { data: identityData, error } = await supabase
        .from('kd_identity')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (!error && identityData) {
        const updatedUser = { 
          ...user, 
          identity_count: identityData.length,
          kd_identity: identityData
        }
        setEditingUser(updatedUser)
        setSelectedUser(updatedUser)
        
        // Calculate total mutual count for all identities
        if (identityData.length > 0) {
          await calculateTotalMutualCount(identityData)
        }
      }
    } catch (error) {
      console.error('Error fetching identity details:', error)
    }
  }

  const handleCloseModal = () => {
    setOpenModal(false)
    setSelectedUser(null)
    setEditingUser(null)
    setIsEditing(false)
    setTotalMutualCount(0) // Reset mutual count
  }

  const handleSaveUser = async () => {
    if (!editingUser) return

    try {
      const { error } = await supabase
        .from('kd_users')
        .update({
          name: editingUser.name,
          email: editingUser.email,
          gender: editingUser.gender,
          element_number: editingUser.element_number,
          active: editingUser.active,
          birth_date: editingUser.birth_date
        })
        .eq('id', editingUser.id)

      if (error) {
        console.error('Error updating user:', error)
        alert('Error updating user. Please try again.')
      } else {
        alert('User updated successfully!')
        fetchUsers() // Refresh the user list
        handleCloseModal()
      }
    } catch (error) {
      console.error('Update user error:', error)
      alert('Error updating user. Please try again.')
    }
  }

  const handleEditingUserChange = (field: keyof User, value: any) => {
    if (editingUser) {
      setEditingUser({ ...editingUser, [field]: value })
    }
  }

  const getElementColor = (element?: number) => {
    const colors = {
      1: '#FF6B35', 2: '#8B6914', 3: '#87CEEB',
      4: '#4682B4', 5: '#228B22', 6: '#C0C0C0',
      7: '#FFD700', 8: '#4B0082', 9: '#9370DB',
    }
    return colors[element as keyof typeof colors] || '#9E9E9E'
  }

  const getCountryFlag = (countryCode?: string) => {
    const flags: { [key: string]: string } = {
      'US': '🇺🇸', 'UK': '🇬🇧', 'CA': '🇨🇦', 'AU': '🇦🇺',
      'DE': '🇩🇪', 'FR': '🇫🇷', 'MY': '🇲🇾', 'SG': '🇸🇬',
      'IN': '🇮🇳', 'JP': '🇯🇵', 'CN': '🇨🇳', 'KR': '🇰🇷',
      'TH': '🇹🇭', 'VN': '🇻🇳', 'ID': '🇮🇩', 'PH': '🇵🇭'
    }
    return flags[countryCode || ''] || '🌍'
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      try {
        const { error } = await supabase
          .from('kd_users')
          .delete()
          .eq('id', userId)
        
        if (error) {
          console.error('Error deleting user:', error)
          alert('Error deleting user. Please try again.')
        } else {
          alert('User deleted successfully!')
          fetchUsers() // Refresh the user list
        }
      } catch (error) {
        console.error('Delete user error:', error)
        alert('Error deleting user. Please try again.')
      }
    }
  }

  const handleFilterChange = (filterType: keyof UserFilters, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }))
    setPage(0) // Reset to first page when filters change
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        alignItems: 'center', 
        mb: 3,
      }}>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={() => {/* Export functionality */}}
          size={isMobile ? 'small' : 'medium'}
          sx={{ 
            bgcolor: theme.palette.primary.main,
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
            }
          }}
        >
          Export {!isMobile && 'Users'}
        </Button>
      </Box>

      {/* Filters Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  ),
                  sx: {
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : 'rgba(0, 0, 0, 0.04)',
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.08)' 
                        : 'rgba(0, 0, 0, 0.06)',
                    }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="medium">
                <InputLabel>User Type</InputLabel>
                <Select
                  value={filters.user_type}
                  onChange={(e) => handleFilterChange('user_type', e.target.value)}
                  label="User Type"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="Public">Public</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="medium">
                <InputLabel>Gender</InputLabel>
                <Select
                  value={filters.gender}
                  onChange={(e) => handleFilterChange('gender', e.target.value)}
                  label="Gender"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="medium">
                <InputLabel>Country</InputLabel>
                <Select
                  value={filters.country}
                  onChange={(e) => handleFilterChange('country', e.target.value)}
                  label="Country"
                >
                  <MenuItem value="">All</MenuItem>
                  {availableCountries.map((country) => (
                    <MenuItem key={country} value={country}>
                      {country}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Table/List */}
      {isMobile ? (
        // Mobile view - Cards
        <Box>
          {loading ? (
            // Loading skeletons for mobile
            Array.from({ length: 5 }).map((_, index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Skeleton variant="circular" width={40} height={40} />
                      <Box>
                        <Skeleton width={120} height={20} />
                        <Skeleton width={80} height={20} sx={{ mt: 0.5 }} />
                      </Box>
                    </Box>
                    <Skeleton variant="circular" width={32} height={32} />
                  </Box>
                  <Skeleton width="100%" height={60} />
                </CardContent>
              </Card>
            ))
          ) : users.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="body1" color="text.secondary">
                  No users found matching your criteria
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <>
              {users.map((user) => (
                <UserMobileCard
                  key={user.id}
                  user={user}
                  onView={handleViewUser}
                  getElementColor={getElementColor}
                />
              ))}
              
              {/* Mobile Pagination */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination 
                  count={Math.ceil(totalCount / rowsPerPage)}
                  page={page + 1}
                  onChange={(e, value) => setPage(value - 1)}
                  color="primary"
                  size="large"
                />
              </Box>
            </>
          )}
        </Box>
      ) : (
        // Desktop view - Table
        <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>User Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Gender</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Identities</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Country</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Joined</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Delete</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                // Loading skeletons
                Array.from({ length: rowsPerPage }).map((_, index) => (
                  <TableRowSkeleton key={index} />
                ))
              ) : users.length === 0 ? (
                // Empty state
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Typography variant="body1" color="text.secondary">
                      No users found matching your criteria
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                // User rows
                users.map((user) => (
                  <TableRow 
                    key={user.id} 
                    hover
                    onClick={() => handleViewUser(user)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.03)' 
                          : 'rgba(0, 0, 0, 0.02)'
                      }
                    }}
                  >
                    <TableCell>
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
                          <Typography variant="body1" fontWeight={500}>
                            {user.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {user.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.user_type === 5 ? 'Admin' : 'Public'}
                        size="small"
                        color={user.user_type === 5 ? 'error' : 'default'}
                        variant="outlined"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" textTransform="capitalize">
                        {user.gender || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${user.identity_count || 0} identities`}
                        size="small"
                        variant="outlined"
                        color={(user.identity_count || 0) > 0 ? 'success' : 'default'}
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" sx={{ fontSize: '1.5rem' }}>
                          {getCountryFlag(user.country)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {user.country || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(user.created_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Delete User">
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteUser(user.id, user.name)
                          }}
                          sx={{
                            color: theme.palette.error.main,
                            '&:hover': {
                              bgcolor: alpha(theme.palette.error.main, 0.1)
                            }
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            borderTop: `1px solid ${theme.palette.divider}`,
            '.MuiTablePagination-toolbar': {
              minHeight: 64
            }
          }}
        />
      </Card>
      )}

      {/* User Detail Modal */}
      <Dialog 
        open={openModal} 
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: theme.palette.background.paper,
            backgroundImage: 'none'
          }
        }}
      >
        {selectedUser && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" fontWeight={600}>
                  {isEditing ? 'Edit User' : 'User Details'}
                </Typography>
                <IconButton 
                  onClick={handleCloseModal}
                  sx={{
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.text.secondary, 0.1)
                    }
                  }}
                >
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                {/* User Info Section */}
                <Grid item xs={12} md={6}>
                  <Stack spacing={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Avatar 
                        sx={{ 
                          width: 80, 
                          height: 80, 
                          bgcolor: alpha(getElementColor(editingUser?.element_number), 0.2),
                          color: getElementColor(editingUser?.element_number),
                          border: `3px solid ${alpha(getElementColor(editingUser?.element_number), 0.3)}`,
                          fontSize: '2rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {editingUser?.name?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <TextField
                          fullWidth
                          label="Name"
                          value={editingUser?.name || ''}
                          onChange={(e) => handleEditingUserChange('name', e.target.value)}
                          disabled={!isEditing}
                          sx={{ mb: 1 }}
                        />
                        <FormControl fullWidth>
                          <InputLabel>Status</InputLabel>
                          <Select
                            value={editingUser?.active ? 'active' : 'inactive'}
                            onChange={(e) => handleEditingUserChange('active', e.target.value === 'active')}
                            disabled={!isEditing}
                            label="Status"
                          >
                            <MenuItem value="active">Active</MenuItem>
                            <MenuItem value="inactive">Inactive</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </Box>

                    <Divider />

                    <TextField
                      fullWidth
                      label="Email"
                      value={editingUser?.email || ''}
                      onChange={(e) => handleEditingUserChange('email', e.target.value)}
                      disabled={!isEditing}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email sx={{ color: theme.palette.text.secondary }} />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <FormControl fullWidth>
                      <InputLabel>Gender</InputLabel>
                      <Select
                        value={editingUser?.gender || ''}
                        onChange={(e) => handleEditingUserChange('gender', e.target.value)}
                        disabled={!isEditing}
                        label="Gender"
                        startAdornment={
                          <InputAdornment position="start">
                            <Person sx={{ color: theme.palette.text.secondary }} />
                          </InputAdornment>
                        }
                      >
                        <MenuItem value="">Not specified</MenuItem>
                        <MenuItem value="male">Male</MenuItem>
                        <MenuItem value="female">Female</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth>
                      <InputLabel>Element</InputLabel>
                      <Select
                        value={editingUser?.element_number?.toString() || ''}
                        onChange={(e) => handleEditingUserChange('element_number', e.target.value ? parseInt(e.target.value) : null)}
                        disabled={!isEditing}
                        label="Element"
                      >
                        <MenuItem value="">None</MenuItem>
                        {[1,2,3,4,5,6,7,8,9].map(num => (
                          <MenuItem key={num} value={num}>Element {num}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {/* Country field removed - column doesn't exist in database */}

                    <TextField
                      fullWidth
                      label="Birth Date"
                      type="date"
                      value={editingUser?.birth_date || ''}
                      onChange={(e) => handleEditingUserChange('birth_date', e.target.value)}
                      disabled={!isEditing}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Cake sx={{ color: theme.palette.text.secondary }} />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CalendarToday sx={{ color: theme.palette.text.secondary }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Member Since</Typography>
                        <Typography variant="body1">
                          {editingUser && new Date(editingUser.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </Grid>

                {/* Element Visualization */}
                <Grid item xs={12} md={6}>
                  {editingUser?.element_number && (
                    <ElementVisualization element={editingUser.element_number} />
                  )}
                </Grid>

                {/* Identities */}
                {selectedUser?.kd_identity && selectedUser.kd_identity.length > 0 && (
                  <Grid item xs={12}>
                    <Typography 
                      variant="h6" 
                      gutterBottom 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        fontWeight: 600,
                        mb: 2
                      }}
                    >
                      <Category sx={{ color: theme.palette.primary.main }} /> 
                      User Identities ({selectedUser.kd_identity.length})
                      {totalMutualCount > 0 && (
                        <Chip
                          label={`${totalMutualCount} mutual`}
                          size="small"
                          color="secondary"
                          sx={{ ml: 1, fontSize: '0.7rem', height: 22 }}
                        />
                      )}
                    </Typography>
                    <Stack spacing={2}>
                      {selectedUser.kd_identity.map((identity: any) => (
                        <IdentityCard 
                          key={identity.id} 
                          identity={identity}
                          theme={theme}
                        />
                      ))}
                    </Stack>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, gap: 2 }}>
              <Button 
                onClick={handleCloseModal}
                variant="outlined"
                sx={{
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                  '&:hover': {
                    borderColor: theme.palette.primary.dark,
                    bgcolor: alpha(theme.palette.primary.main, 0.1)
                  }
                }}
              >
                Cancel
              </Button>
              {isEditing && (
                <Button 
                  onClick={handleSaveUser}
                  variant="contained"
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    '&:hover': {
                      bgcolor: theme.palette.primary.dark,
                    }
                  }}
                >
                  Save Changes
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  )
}
