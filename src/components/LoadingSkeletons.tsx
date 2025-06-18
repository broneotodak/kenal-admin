import { Box, Card, Stack, Skeleton } from '@mui/material'

export const UsersPageSkeleton = () => {
  return (
    <Box>
      {/* Header Skeleton */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 1 }} />
      </Box>

      {/* Filters Skeleton */}
      <Card sx={{ mb: 3, p: 3 }}>
        <Stack direction="row" spacing={2}>
          <Skeleton variant="rectangular" width="50%" height={40} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width="16%" height={40} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width="16%" height={40} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width="16%" height={40} sx={{ borderRadius: 1 }} />
        </Stack>
      </Card>

      {/* Table Skeleton */}
      <Card>
        <Box sx={{ p: 2 }}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Stack key={index} direction="row" spacing={2} sx={{ mb: 2 }}>
              <Skeleton variant="circular" width={40} height={40} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="30%" height={20} />
                <Skeleton variant="text" width="40%" height={16} />
              </Box>
              <Skeleton variant="text" width="10%" height={24} />
              <Skeleton variant="text" width="10%" height={24} />
              <Skeleton variant="text" width="10%" height={24} />
              <Skeleton variant="text" width="10%" height={24} />
              <Skeleton variant="circular" width={32} height={32} />
            </Stack>
          ))}
        </Box>
      </Card>
    </Box>
  )
}

export const TableLoadingSkeleton = () => (
  <Stack spacing={2} sx={{ p: 2 }}>
    {Array.from({ length: 5 }).map((_, index) => (
      <Stack key={index} direction="row" spacing={2} alignItems="center">
        <Skeleton variant="circular" width={40} height={40} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="30%" height={20} />
          <Skeleton variant="text" width="40%" height={16} />
        </Box>
        <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={90} height={24} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={80} height={20} />
        <Skeleton variant="circular" width={32} height={32} />
      </Stack>
    ))}
  </Stack>
)
