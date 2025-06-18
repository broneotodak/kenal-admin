'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestPage() {
  useEffect(() => {
    // Clear any corrupted cookies/storage
    if (typeof window !== 'undefined') {
      // Clear all Supabase related items from localStorage
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('supabase') || key.includes('auth'))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      console.log('Cleared localStorage')
    }

    // Test Supabase connection
    const testConnection = async () => {
      try {
        console.log('Testing Supabase connection...')
        
        // Test basic query
        const { data, error } = await supabase
          .from('kd_users')
          .select('id')
          .limit(1)
        
        if (error) {
          console.error('Connection error:', error)
        } else {
          console.log('✅ Supabase connection successful!', data)
        }

        // Test auth
        const { data: session } = await supabase.auth.getSession()
        console.log('Current session:', session)
        
      } catch (e) {
        console.error('Test failed:', e)
      }
    }

    testConnection()
  }, [])

  return (
    <div style={{ padding: '20px' }}>
      <h1>Supabase Connection Test</h1>
      <p>Check the browser console for results</p>
      <button 
        onClick={() => window.location.href = '/login'}
        style={{
          padding: '10px 20px',
          backgroundColor: '#2B5CE6',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Go to Login
      </button>
    </div>
  )
}