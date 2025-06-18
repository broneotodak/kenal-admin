'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  IconButton,
  Typography,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Skeleton,
  useTheme,
  Paper,
  alpha,
  useMediaQuery,
  Pagination,
} from '@mui/material'
import {
  Search,
  Visibility,
  Edit,
  FilterList,
  Download,
  Close,
  Person,
  Email,
  CalendarToday,
  Category,
  Psychology,
  Badge,
  Cake,
} from '@mui/icons-material'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { UserMobileCard } from '@/components/UserMobileCard'

interface User {
  id: string
  name: string
  email: string
  created_at: string
  gender?: string
  element_number?: number
  active: boolean
  identity_count?: number
  birthdate?: string
  pattern_info?: string
  kd_identity?: any[]
}

interface UserFilters {
  element: string
  gender: string
  status: string
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
  const [filters, setFilters] = useState<UserFilters>({
    element: '',
    gender: '',
    status: ''
  })
  const router = useRouter()

  const fetchUsers = async () => {
    setLoading(true)
    try {
      // Build query
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
          birthdate,
          pattern_info,
          kd_identity!kd_identity_user_id_fkey(
            id,
            pattern_name,
            pattern_description,
            created_at
          )
        `, { count: 'exact' })

      // Apply search filter
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
      }

      // Apply filters
      if (filters.element) {
        query = query.eq('element_number', parseInt(filters.element))
      }
      if (filters.gender) {
        query = query.eq('gender', filters.gender)
      }
      if (filters.status === 'active') {
        query = query.eq('active', true)
      } else if (filters.status === 'inactive') {
        query = query.eq('active', false)
      }

      // Add pagination
      query = query
        .order('created_at', { ascending: false })
        .range(page * rowsPerPage, (page + 1) * rowsPerPage - 1)

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching users:', error)
        return
      }

      // Transform data to include identity count
      const transformedUsers = data?.map((user: any) => ({
        ...user,
        identity_count: user.kd_identity?.length || 0,
      })) || []

      setUsers(transformedUsers)
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, rowsPerPage, searchQuery, filters])

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setOpenModal(true)
  }

  const handleCloseModal = () => {
    setOpenModal(false)
    setSelectedUser(null)
  }

  const getElementColor = (element?: number) => {
    const colors = {
      1: '#FF6B35', 2: '#8B6914', 3: '#87CEEB',
      4: '#4682B4', 5: '#228B22', 6: '#C0C0C0',
      7: '#FFD700', 8: '#4B0082', 9: '#9370DB',
    }
    return colors[element as keyof typeof colors] || '#9E9E9E'
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
                <InputLabel>Element</InputLabel>
                <Select
                  value={filters.element}
                  onChange={(e) => handleFilterChange('element', e.target.value)}
                  label="Element"
                >
                  <MenuItem value="">All</MenuItem>
                  {[1,2,3,4,5,6,7,8,9].map(num => (
                    <MenuItem key={num} value={num.toString()}>
                      Element {num}
                    </MenuItem>
                  ))}
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
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
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
                <TableCell sx={{ fontWeight: 600 }}>Element</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Gender</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Identities</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Joined</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
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
                      {user.element_number ? (
                        <Chip
                          label={`Element ${user.element_number}`}
                          size="small"
                          sx={{ 
                            bgcolor: alpha(getElementColor(user.element_number), 0.2),
                            color: getElementColor(user.element_number),
                            border: `1px solid ${alpha(getElementColor(user.element_number), 0.3)}`,
                            fontWeight: 500
                          }}
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" textTransform="capitalize">
                        {user.gender || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${user.identity_count} identities`}
                        size="small"
                        variant="outlined"
                        color={user.identity_count > 0 ? 'success' : 'default'}
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.active ? 'Active' : 'Inactive'}
                        size="small"
                        color={user.active ? 'success' : 'error'}
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(user.created_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewUser(user)
                          }}
                          sx={{
                            color: theme.palette.primary.main,
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.1)
                            }
                          }}
                        >
                          <Visibility />
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
                <Typography variant="h5" fontWeight={600}>User Details</Typography>
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
              <Grid container spacing={4}>
                {/* User Info Section */}
                <Grid item xs={12} md={6}>
                  <Stack spacing={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Avatar 
                        sx={{ 
                          width: 80, 
                          height: 80, 
                          bgcolor: alpha(getElementColor(selectedUser.element_number), 0.2),
                          color: getElementColor(selectedUser.element_number),
                          border: `3px solid ${alpha(getElementColor(selectedUser.element_number), 0.3)}`,
                          fontSize: '2rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {selectedUser.name?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight={600}>{selectedUser.name}</Typography>
                        <Chip
                          label={selectedUser.active ? 'Active' : 'Inactive'}
                          size="small"
                          color={selectedUser.active ? 'success' : 'error'}
                          sx={{ mt: 1, fontWeight: 500 }}
                        />
                      </Box>
                    </Box>

                    <Divider />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Email sx={{ color: theme.palette.text.secondary }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Email</Typography>
                        <Typography variant="body1">{selectedUser.email}</Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Person sx={{ color: theme.palette.text.secondary }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Gender</Typography>
                        <Typography variant="body1" textTransform="capitalize">
                          {selectedUser.gender || 'Not specified'}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CalendarToday sx={{ color: theme.palette.text.secondary }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Member Since</Typography>
                        <Typography variant="body1">
                          {new Date(selectedUser.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Typography>
                      </Box>
                    </Box>

                    {selectedUser.birthdate && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Cake sx={{ color: theme.palette.text.secondary }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">Birthday</Typography>
                          <Typography variant="body1">
                            {new Date(selectedUser.birthdate).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric'
                            })}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Stack>
                </Grid>

                {/* Element Visualization */}
                <Grid item xs={12} md={6}>
                  {selectedUser.element_number && (
                    <ElementVisualization element={selectedUser.element_number} />
                  )}
                </Grid>

                {/* Pattern Information */}
                {selectedUser.pattern_info && (
                  <Grid item xs={12}>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 3, 
                        bgcolor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.03)' 
                          : 'rgba(0, 0, 0, 0.02)',
                        borderColor: theme.palette.divider
                      }}
                    >
                      <Typography 
                        variant="h6" 
                        gutterBottom 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          fontWeight: 600
                        }}
                      >
                        <Psychology sx={{ color: theme.palette.primary.main }} /> 
                        Pattern Information
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedUser.pattern_info}
                      </Typography>
                    </Paper>
                  </Grid>
                )}

                {/* Identities */}
                {selectedUser.kd_identity && selectedUser.kd_identity.length > 0 && (
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
                    </Typography>
                    <Stack spacing={2}>
                      {selectedUser.kd_identity.map((identity: any) => (
                        <Card 
                          key={identity.id} 
                          variant="outlined" 
                          sx={{ 
                            p: 2,
                            bgcolor: theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.03)' 
                              : 'rgba(0, 0, 0, 0.02)',
                            borderColor: theme.palette.divider
                          }}
                        >
                          <Typography variant="subtitle1" fontWeight={600}>
                            {identity.pattern_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {identity.pattern_description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Created: {new Date(identity.created_at).toLocaleDateString()}
                          </Typography>
                        </Card>
                      ))}
                    </Stack>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button 
                onClick={handleCloseModal}
                variant="contained"
                sx={{
                  bgcolor: theme.palette.primary.main,
                  '&:hover': {
                    bgcolor: theme.palette.primary.dark,
                  }
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  )
}