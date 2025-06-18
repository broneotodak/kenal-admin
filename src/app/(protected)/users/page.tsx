'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Card,
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
} from '@mui/icons-material'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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
      bgcolor: `${info.color}20`,
      borderRadius: 2,
      border: `2px solid ${info.color}`
    }}>
      <Typography variant="h1" sx={{ fontSize: '4rem', mb: 1 }}>
        {info.symbol}
      </Typography>
      <Typography variant="h6" sx={{ color: info.color, fontWeight: 'bold' }}>
        Element {element}: {info.name}
      </Typography>
    </Box>
  )
}

export default function UsersPage() {
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Users Management</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => {/* Export functionality */}}
          >
            Export
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
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
            <Grid item xs={12} md={2}>
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
            <Grid item xs={12} md={2}>
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
        </Box>
      </Card>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Element</TableCell>
                <TableCell>Gender</TableCell>
                <TableCell>Identities</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: getElementColor(user.element_number) }}>
                        {user.name?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {user.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
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
                        sx={{ bgcolor: getElementColor(user.element_number), color: 'white' }}
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
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.active ? 'Active' : 'Inactive'}
                      size="small"
                      color={user.active ? 'success' : 'error'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(user.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton size="small" onClick={() => handleViewUser(user)}>
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
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
        />
      </Card>

      {/* User Detail Modal */}
      <Dialog 
        open={openModal} 
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        {selectedUser && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5">User Details</Typography>
                <IconButton onClick={handleCloseModal}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                {/* User Info Section */}
                <Grid item xs={12} md={6}>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar 
                        sx={{ 
                          width: 80, 
                          height: 80, 
                          bgcolor: getElementColor(selectedUser.element_number),
                          fontSize: '2rem'
                        }}
                      >
                        {selectedUser.name?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">{selectedUser.name}</Typography>
                        <Chip
                          label={selectedUser.active ? 'Active' : 'Inactive'}
                          size="small"
                          color={selectedUser.active ? 'success' : 'error'}
                        />
                      </Box>
                    </Box>

                    <Divider />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Email color="action" />
                      <Typography>{selectedUser.email}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person color="action" />
                      <Typography textTransform="capitalize">
                        {selectedUser.gender || 'Not specified'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarToday color="action" />
                      <Typography>
                        Joined: {new Date(selectedUser.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>

                    {selectedUser.birthdate && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarToday color="action" />
                        <Typography>
                          Birthday: {new Date(selectedUser.birthdate).toLocaleDateString()}
                        </Typography>
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
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Psychology /> Pattern Information
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedUser.pattern_info}
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {/* Identities */}
                {selectedUser.kd_identity && selectedUser.kd_identity.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Category /> User Identities ({selectedUser.kd_identity.length})
                    </Typography>
                    <Stack spacing={1}>
                      {selectedUser.kd_identity.map((identity: any) => (
                        <Card key={identity.id} variant="outlined" sx={{ p: 2 }}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {identity.pattern_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {identity.pattern_description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Created: {new Date(identity.created_at).toLocaleDateString()}
                          </Typography>
                        </Card>
                      ))}
                    </Stack>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseModal}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  )
}