'use client'

import { useState } from 'react'
import { Button } from '@mui/material'
import { Refresh as RefreshIcon } from '@mui/icons-material'

export default function CacheClearButton() {
  const [isClearing, setIsClearing] = useState(false)

  const clearCacheAndReload = async () => {
    setIsClearing(true)
    
    try {
      // Clear all browser storage
      localStorage.clear()
      sessionStorage.clear()
      
      // Clear IndexedDB (Supabase uses this)
      if ('indexedDB' in window) {
        const databases = ['supabase-js-cache', 'keyval-store']
        for (const dbName of databases) {
          try {
            const deleteReq = indexedDB.deleteDatabase(dbName)
            deleteReq.onsuccess = () => console.log(`🗑️ Cleared ${dbName}`)
          } catch (e) {
            console.log(`⚠️ Could not clear ${dbName}:`, e)
          }
        }
      }
      
      // Clear service worker cache if available
      if ('serviceWorker' in navigator && 'caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.map(cacheName => {
            console.log(`🗑️ Clearing cache: ${cacheName}`)
            return caches.delete(cacheName)
          })
        )
      }
      
      console.log('✅ Cache cleared successfully!')
      
      // Force hard reload after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
    } catch (error) {
      console.error('❌ Error clearing cache:', error)
      // Fallback: just reload
      window.location.reload()
    }
  }

  return (
    <Button
      variant="outlined"
      startIcon={<RefreshIcon />}
      onClick={clearCacheAndReload}
      disabled={isClearing}
      sx={{
        color: 'orange',
        borderColor: 'orange',
        '&:hover': {
          borderColor: 'darkorange',
          backgroundColor: 'rgba(255, 165, 0, 0.04)'
        }
      }}
    >
      {isClearing ? 'Clearing Cache...' : 'Clear Cache & Reload'}
    </Button>
  )
} 