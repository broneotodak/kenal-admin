import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing database connection and table structure...')
    
    const supabase = createSupabaseAdmin()
    
    // Test 1: Basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(1)
    
    if (connectionError) {
      throw new Error(`Connection test failed: ${connectionError.message}`)
    }
    
    // Test 2: Check if admin_custom_dashboards table exists
    const { data: tableExists, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'admin_custom_dashboards')
      .single()
    
    // Test 3: Try to query the table structure
    let tableStructure = null
    let tableStructureError = null
    
    if (!tableError && tableExists) {
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', 'admin_custom_dashboards')
        .order('ordinal_position')
      
      tableStructure = columns
      tableStructureError = columnsError
    }
    
    // Test 4: Try a simple select (to test RLS)
    let accessTest = null
    let accessError = null
    
    if (!tableError && tableExists) {
      const { data, error } = await supabase
        .from('admin_custom_dashboards')
        .select('id, dashboard_name')
        .limit(1)
      
      accessTest = { recordCount: data?.length || 0, hasData: !!data }
      accessError = error
    }
    
    // Test 5: Get current user context
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tests: {
        connection: {
          success: !connectionError,
          error: connectionError?.message || null
        },
        tableExists: {
          exists: !tableError && !!tableExists,
          error: tableError ? (tableError as any).message || String(tableError) : null
        },
        tableStructure: {
          columns: tableStructure,
          error: tableStructureError ? String(tableStructureError) : null
        },
        tableAccess: {
          canRead: !accessError,
          result: accessTest,
          error: accessError ? String(accessError) : null
        },
        currentUser: {
          hasUser: !!user,
          userId: user?.id || null,
          email: user?.email || null,
          error: userError?.message || null
        }
      }
    })
    
  } catch (error) {
    console.error('❌ Database debug error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 