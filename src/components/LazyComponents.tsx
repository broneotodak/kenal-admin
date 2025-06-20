'use client'

import React, { Suspense, lazy, memo } from 'react'
import { Box, CircularProgress, Typography, Skeleton } from '@mui/material'

// Loading fallback components
const PageLoadingFallback = memo(() => (
  <Box 
    sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '60vh',
      gap: 2
    }}
  >
    <CircularProgress size={48} />
    <Typography variant="body1" color="text.secondary">
      Loading...
    </Typography>
  </Box>
))

const TableLoadingFallback = memo(() => (
  <Box sx={{ p: 2 }}>
    <Skeleton variant="rectangular" height={48} sx={{ mb: 2 }} />
    {Array.from({ length: 5 }).map((_, index) => (
      <Skeleton 
        key={index} 
        variant="rectangular" 
        height={56} 
        sx={{ mb: 1 }} 
      />
    ))}
  </Box>
))

const ChartLoadingFallback = memo(() => (
  <Box sx={{ p: 2 }}>
    <Skeleton variant="text" width="60%" height={40} sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" height={300} />
  </Box>
))

// Lazy loaded components
export const LazyUsersPage = lazy(() => 
  import('../app/(protected)/users/page').then(module => ({
    default: module.default
  }))
)

export const LazyAnalyticsPage = lazy(() => 
  import('../app/(protected)/analytics/page').then(module => ({
    default: module.default
  }))
)

export const LazyDashboardPage = lazy(() => 
  import('../app/(protected)/dashboard/page').then(module => ({
    default: module.default
  }))
)

export const LazyChart = lazy(() => 
  import('./Chart').then(module => ({
    default: module.default
  }))
)

// Wrapper components with proper loading states
export const UsersPageWithSuspense = memo(() => (
  <Suspense fallback={<PageLoadingFallback />}>
    <LazyUsersPage />
  </Suspense>
))

export const AnalyticsPageWithSuspense = memo(() => (
  <Suspense fallback={<PageLoadingFallback />}>
    <LazyAnalyticsPage />
  </Suspense>
))

export const DashboardPageWithSuspense = memo(() => (
  <Suspense fallback={<PageLoadingFallback />}>
    <LazyDashboardPage />
  </Suspense>
))

export const ChartWithSuspense = memo((props: any) => (
  <Suspense fallback={<ChartLoadingFallback />}>
    <LazyChart {...props} />
  </Suspense>
))

// HOC for adding lazy loading to any component
export const withLazyLoading = <T extends React.ComponentType<any>>(
  Component: T,
  LoadingComponent: React.ComponentType = PageLoadingFallback
) => {
  const LazyComponent = lazy(() => 
    Promise.resolve({ default: Component })
  )
  
  return memo((props: React.ComponentProps<T>) => (
    <Suspense fallback={<LoadingComponent />}>
      <LazyComponent {...props} />
    </Suspense>
  ))
}

// Performance monitoring wrapper
export const withPerformanceMonitoring = <T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  componentName: string
) => {
  return memo((props: T) => {
    React.useEffect(() => {
      const startTime = performance.now()
      
      return () => {
        const endTime = performance.now()
        console.log(`${componentName} render time: ${endTime - startTime}ms`)
      }
    }, [])
    
    return <Component {...props} />
  })
}

PageLoadingFallback.displayName = 'PageLoadingFallback'
TableLoadingFallback.displayName = 'TableLoadingFallback'
ChartLoadingFallback.displayName = 'ChartLoadingFallback'
UsersPageWithSuspense.displayName = 'UsersPageWithSuspense'
AnalyticsPageWithSuspense.displayName = 'AnalyticsPageWithSuspense'
DashboardPageWithSuspense.displayName = 'DashboardPageWithSuspense'
ChartWithSuspense.displayName = 'ChartWithSuspense' 