'use client'

import DashboardLayout from '@/components/DashboardLayout'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Auth check is now handled in each page
  return <DashboardLayout>{children}</DashboardLayout>
}