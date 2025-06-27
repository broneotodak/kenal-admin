'use client'

import React, { useState, useEffect } from 'react'
import { 
  Box, 
  Typography, 
  Card, 
  CardContent,
  Chip,
  Avatar,
  Tooltip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  alpha,
  Paper,
  Grid
} from '@mui/material'
import { supabase } from '@/lib/supabase'

interface NetworkUser {
  user_id: string
  user_name: string
  email: string
  element_number: number
  total_identities: number
  connections_count: number
}

interface MutualConnection {
  user_a: string
  user_b: string
  mutual_identities_count: number
  shared_identity_names: string[]
  shared_elements: number[]
}

const getElementColor = (elementNumber: number): string => {
  const colors = {
    1: '#F44336', 2: '#E91E63', 3: '#9C27B0', 4: '#673AB7', 5: '#3F51B5',
    6: '#2196F3', 7: '#03A9F4', 8: '#00BCD4', 9: '#009688',
  }
  return colors[elementNumber as keyof typeof colors] || '#9E9E9E'
}

const getConnectionStrengthColor = (strength: number): string => {
  if (strength >= 5) return '#4CAF50'
  if (strength >= 3) return '#FF9800'
  return '#9E9E9E'
}

interface SimpleNetworkGraphProps {
  isDarkMode?: boolean
}

export default function SimpleNetworkGraph({ isDarkMode = false }: SimpleNetworkGraphProps) {
  const [loading, setLoading] = useState(true)
  const [minConnectionStrength, setMinConnectionStrength] = useState(1)
  const [networkData, setNetworkData] = useState<{
    users: NetworkUser[]
    connections: MutualConnection[]
  }>({ users: [], connections: [] })

  useEffect(() => {
    const loadRealNetworkData = async () => {
      try {
        setLoading(true)

        console.log('🔍 Loading REAL mutual identity data from database...')

        // STEP 1: Get all identities with their user information
        const { data: allIdentities, error: identitiesError } = await supabase
          .from('kd_identity')
          .select(`
            id,
            user_id,
            name,
            gender,
            birthdate,
            element_number,
            created_at
          `)
          .limit(50000)

        if (identitiesError) {
          console.error('Error fetching identities:', identitiesError)
          return
        }

        console.log(`📊 Found ${allIdentities?.length || 0} total identities`)

        // STEP 2: Find mutual identities using EXACT matching criteria
        const mutualConnections: MutualConnection[] = []
        const connectionMap = new Map<string, MutualConnection>()

        if (allIdentities) {
          console.log('🔍 Analyzing mutual identities...')
          
          for (let i = 0; i < allIdentities.length; i++) {
            for (let j = i + 1; j < allIdentities.length; j++) {
              const identity1 = allIdentities[i]
              const identity2 = allIdentities[j]
              
              // ✅ EXACT MATCHING CRITERIA:
              const samePersonCriteria = 
                identity1.user_id !== identity2.user_id &&           // Different users
                identity1.name?.trim().toLowerCase() === identity2.name?.trim().toLowerCase() &&  // EXACT same name (case insensitive)
                identity1.gender === identity2.gender &&             // Same gender
                identity1.birthdate === identity2.birthdate         // EXACT same birthdate
              
              if (samePersonCriteria) {
                const key = [identity1.user_id, identity2.user_id].sort().join('-')
                
                if (connectionMap.has(key)) {
                  // Add to existing connection
                  const existing = connectionMap.get(key)!
                  existing.mutual_identities_count++
                  existing.shared_identity_names.push(identity1.name)
                  if (identity1.element_number && !existing.shared_elements.includes(identity1.element_number)) {
                    existing.shared_elements.push(identity1.element_number)
                  }
                } else {
                  // Create new connection
                  connectionMap.set(key, {
                    user_a: identity1.user_id,
                    user_b: identity2.user_id,
                    mutual_identities_count: 1,
                    shared_identity_names: [identity1.name],
                    shared_elements: identity1.element_number ? [identity1.element_number] : []
                  })
                }
                
                console.log(`🔗 Found match: "${identity1.name}" (${identity1.birthdate}) shared by users ${identity1.user_id.slice(0,8)} and ${identity2.user_id.slice(0,8)}`)
              }
            }
          }
        }

        const realConnections = Array.from(connectionMap.values())
        console.log(`🕸️ Found ${realConnections.length} real mutual connections`)

        // STEP 3: Get user details for connected users
        const connectedUserIds = Array.from(new Set([
          ...realConnections.map(c => c.user_a),
          ...realConnections.map(c => c.user_b)
        ]))

        console.log(`👥 Loading details for ${connectedUserIds.length} connected users`)

        const { data: users, error: usersError } = await supabase
          .from('kd_users')
          .select('id, name, email, element_number')
          .in('id', connectedUserIds)

        if (usersError) {
          console.error('Error fetching users:', usersError)
          return
        }

        // STEP 4: Count identities per user
        const identityCountMap = new Map<string, number>()
        allIdentities?.forEach(identity => {
          const count = identityCountMap.get(identity.user_id) || 0
          identityCountMap.set(identity.user_id, count + 1)
        })

        // STEP 5: Calculate connection counts per user
        const connectionCountMap = new Map<string, number>()
        realConnections.forEach(conn => {
          connectionCountMap.set(conn.user_a, (connectionCountMap.get(conn.user_a) || 0) + 1)
          connectionCountMap.set(conn.user_b, (connectionCountMap.get(conn.user_b) || 0) + 1)
        })

        // STEP 6: Build final network data
        const networkUsers: NetworkUser[] = users?.map(user => ({
          user_id: user.id,
          user_name: user.name || 'Unknown',
          email: user.email || '',
          element_number: user.element_number || 1,
          total_identities: identityCountMap.get(user.id) || 0,
          connections_count: connectionCountMap.get(user.id) || 0
        })) || []

        // Filter connections by strength
        const filteredConnections = realConnections.filter(conn => 
          conn.mutual_identities_count >= minConnectionStrength
        )

        console.log(`✅ Final network: ${networkUsers.length} users, ${filteredConnections.length} connections (min strength: ${minConnectionStrength})`)
        
        // Log some sample connections for verification
        filteredConnections.slice(0, 3).forEach(conn => {
          const userA = networkUsers.find(u => u.user_id === conn.user_a)
          const userB = networkUsers.find(u => u.user_id === conn.user_b)
          console.log(`🔗 ${userA?.user_name} ↔ ${userB?.user_name}: ${conn.mutual_identities_count} shared (${conn.shared_identity_names.join(', ')})`)
        })

        setNetworkData({
          users: networkUsers,
          connections: filteredConnections
        })

      } catch (error) {
        console.error('Error loading real network data:', error)
        
        // Fallback to demo data if real data fails
        console.log('🔄 Falling back to demo data...')
        const demoUsers: NetworkUser[] = [
          { user_id: "demo1", user_name: "Demo User A", email: "demo1@example.com", element_number: 7, total_identities: 15, connections_count: 2 },
          { user_id: "demo2", user_name: "Demo User B", email: "demo2@example.com", element_number: 4, total_identities: 12, connections_count: 2 }
        ]
        const demoConnections: MutualConnection[] = [
          { user_a: "demo1", user_b: "demo2", mutual_identities_count: 3, shared_identity_names: ["Ahmad", "Siti", "Ali"], shared_elements: [4,7] }
        ]
        
        setNetworkData({
          users: demoUsers,
          connections: demoConnections.filter(conn => conn.mutual_identities_count >= minConnectionStrength)
        })
      } finally {
        setLoading(false)
      }
    }

    loadRealNetworkData()
  }, [minConnectionStrength])

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
            <Typography>Loading simple network visualization...</Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card sx={{ minHeight: 600 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            🕸️ Simple Identity Network
          </Typography>
          
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Connection Strength</InputLabel>
            <Select
              value={minConnectionStrength}
              onChange={(e) => setMinConnectionStrength(Number(e.target.value))}
              label="Connection Strength"
            >
              <MenuItem value={1}>1+ shared identities</MenuItem>
              <MenuItem value={2}>2+ shared identities</MenuItem>
              <MenuItem value={3}>3+ shared identities</MenuItem>
              <MenuItem value={5}>5+ shared identities</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Mobile-First Layout */}
        <Stack spacing={3}>
          {/* Connections List - PRIORITY for mobile */}
          <Box>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              🔗 Identity Connections
              <Chip 
                label={`${networkData.connections.length} total`}
                size="small"
                color="primary"
              />
            </Typography>
            
            <Stack spacing={1.5}>
              {networkData.connections
                .sort((a, b) => b.mutual_identities_count - a.mutual_identities_count)
                .map((connection, index) => {
                  const userA = networkData.users.find(u => u.user_id === connection.user_a)
                  const userB = networkData.users.find(u => u.user_id === connection.user_b)
                  const strength = connection.mutual_identities_count
                  const color = getConnectionStrengthColor(strength)
                  
                  if (!userA || !userB) return null
                  
                  return (
                    <Paper 
                      key={index}
                      elevation={2}
                      sx={{ 
                        p: 2, 
                        borderLeft: `4px solid ${color}`,
                        bgcolor: alpha(color, 0.05)
                      }}
                    >
                      {/* Mobile-optimized connection display */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                          <Avatar sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: getElementColor(userA.element_number), 
                            fontSize: '0.875rem',
                            fontWeight: 'bold'
                          }}>
                            {userA.user_name.charAt(0)}
                          </Avatar>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="body2" fontWeight="bold" noWrap>
                              {userA.user_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Element {userA.element_number}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Typography sx={{ 
                          color: color, 
                          fontWeight: 'bold', 
                          fontSize: '1.2rem',
                          mx: 1
                        }}>
                          ↔
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                          <Avatar sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: getElementColor(userB.element_number), 
                            fontSize: '0.875rem',
                            fontWeight: 'bold'
                          }}>
                            {userB.user_name.charAt(0)}
                          </Avatar>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="body2" fontWeight="bold" noWrap>
                              {userB.user_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Element {userB.element_number}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Chip 
                          label={`${strength} shared`}
                          size="small"
                          sx={{ 
                            bgcolor: color, 
                            color: 'white', 
                            fontWeight: 'bold',
                            fontSize: '0.75rem'
                          }}
                        />
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                          {strength >= 5 ? '🔥 STRONG' : strength >= 3 ? '⚡ MEDIUM' : '💫 LIGHT'}
                        </Typography>
                      </Box>
                      
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        <strong>Names:</strong> {connection.shared_identity_names.slice(0, 2).join(', ')}
                        {connection.shared_identity_names.length > 2 && ` +${connection.shared_identity_names.length - 2} more`}
                      </Typography>
                    </Paper>
                  )
                })}
            </Stack>
          </Box>

          {/* Users Grid - Compact for mobile */}
          <Box>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              👥 Connected Users
              <Chip 
                label={`${networkData.users.length} users`}
                size="small"
                color="secondary"
              />
            </Typography>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',     // 2 columns on mobile
                sm: 'repeat(3, 1fr)',     // 3 columns on small tablets
                md: 'repeat(4, 1fr)',     // 4 columns on medium screens
                lg: 'repeat(5, 1fr)'      // 5 columns on large screens
              },
              gap: 1.5
            }}>
              {networkData.users.map(user => {
                const userConnections = networkData.connections.filter(
                  conn => conn.user_a === user.user_id || conn.user_b === user.user_id
                )
                const elementColor = getElementColor(user.element_number)
                
                return (
                  <Paper 
                    key={user.user_id}
                    elevation={1}
                    sx={{ 
                      p: 1.5, 
                      border: `2px solid ${elementColor}`,
                      bgcolor: alpha(elementColor, 0.08),
                      textAlign: 'center',
                      minHeight: 120
                    }}
                  >
                    <Avatar 
                      sx={{ 
                        width: 40, 
                        height: 40, 
                        bgcolor: elementColor,
                        mx: 'auto',
                        mb: 1,
                        fontSize: '1rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {user.user_name.charAt(0)}
                    </Avatar>
                    <Typography variant="caption" fontWeight="bold" display="block" noWrap>
                      {user.user_name}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      Element {user.element_number}
                    </Typography>
                    <Chip 
                      label={`${userConnections.length}`}
                      size="small"
                      sx={{ 
                        mt: 0.5,
                        bgcolor: elementColor,
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.65rem',
                        height: 18
                      }}
                    />
                  </Paper>
                )
              })}
            </Box>
          </Box>
        </Stack>

        {/* Network Summary */}
        <Divider sx={{ my: 3 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            📊 <strong>Network Summary:</strong> {networkData.users.length} users, {networkData.connections.length} connections
          </Typography>
          <Typography variant="body2" color="text.secondary">
            💪 <strong>Strongest bond:</strong> {networkData.connections.length > 0 ? Math.max(...networkData.connections.map(c => c.mutual_identities_count)) : 0} shared identities
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
} 