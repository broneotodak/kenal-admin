import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'
import fs from 'fs'
import path from 'path'

export async function GET(req: NextRequest) {
  try {
    console.log('🚀 Starting dashboard migration...')
    
    // Create admin Supabase client
    const supabase = createSupabaseAdmin()
    
    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), 'dashboard-save-table.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')
    
    console.log('📄 Migration SQL loaded, executing...')
    
    // Execute the migration
    const { data, error } = await supabase
      .from('admin_dashboards')
      .select('count')
      .limit(1)
    
    // If table doesn't exist, run the migration
    if (error && error.code === '42P01') {
      console.log('📊 Table does not exist, creating...')
      
      // Execute the SQL directly using RPC
      const { error: migrationError } = await supabase.rpc('exec_sql', {
        sql: migrationSQL
      }).single()
      
      if (migrationError) {
        // If RPC doesn't exist, we'll return instructions
        console.log('⚠️ Cannot auto-migrate, manual migration needed')
        return NextResponse.json({
          success: false,
          message: 'Manual migration required',
          instructions: 'Please run the dashboard-save-table.sql file in your Supabase SQL editor',
          sql: migrationSQL
        })
      }
      
      return NextResponse.json({
        success: true,
        message: 'Dashboard migration completed successfully!'
      })
    } else if (!error) {
      return NextResponse.json({
        success: true,
        message: 'Dashboard table already exists!'
      })
    } else {
      throw error
    }
    
  } catch (error: any) {
    console.error('❌ Migration error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        details: 'Please run the dashboard-save-table.sql migration manually in Supabase'
      },
      { status: 500 }
    )
  }
} 