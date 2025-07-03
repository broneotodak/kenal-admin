import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing database connection and table structure...')
    
    const supabase = createSupabaseAdmin()
    
    // Test 1: Basic connection using simple table query
    let connectionTest = null
    let connectionError = null
    
    try {
      const { data, error } = await supabase.from('kd_users').select('id').limit(1)
      connectionTest = { hasData: !!data }
      connectionError = error
    } catch (error) {
      connectionError = error
    }
    
    // Test 2: Check if admin_custom_dashboards table exists using direct query
    const { data: tableExists, error: tableError } = await supabase
      .from('admin_custom_dashboards')
      .select('id')
      .limit(1)
    
    // Test 3: Get table structure using direct column query
    let tableStructure = null
    let tableStructureError = null
    
    try {
      const { data: sampleData, error: sampleError } = await supabase
        .from('admin_custom_dashboards')
        .select('*')
        .limit(1)
      
      if (sampleData && sampleData.length > 0) {
        tableStructure = Object.keys(sampleData[0]).map(key => ({
          column_name: key,
          data_type: typeof sampleData[0][key],
          sample_value: sampleData[0][key]
        }))
      }
      tableStructureError = sampleError
    } catch (error) {
      tableStructureError = error
    }
    
    // Test 4: Try a simple select (to test RLS)
    let accessTest = null
    let accessError = null
    
    try {
      const { data, error } = await supabase
        .from('admin_custom_dashboards')
        .select('id, dashboard_name, admin_user_id')
        .limit(3)
      
      accessTest = { 
        recordCount: data?.length || 0, 
        hasData: !!data,
        sampleRecords: data || []
      }
      accessError = error
    } catch (error) {
      accessError = error
    }
    
    // Test 5: Get current user context
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    // Test 6: Test service role permissions
    let serviceRoleTest = null
    try {
      const { data: allTables, error: allTablesError } = await supabase
        .from('kd_users')
        .select('id, email, user_type')
        .limit(1)
      
      serviceRoleTest = {
        canAccessKdUsers: !allTablesError,
        sampleData: allTables,
        error: allTablesError?.message || null
      }
    } catch (error) {
      serviceRoleTest = { error: String(error) }
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        nodeVersion: process.version
      },
      tests: {
        connection: {
          success: !connectionError,
          result: connectionTest,
          error: connectionError ? String(connectionError) : null
        },
        tableExists: {
          exists: !tableError,
          error: tableError ? String(tableError) : null
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
        },
        serviceRoleTest: serviceRoleTest
      }
    })
    
  } catch (error) {
    console.error('❌ Database debug error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        nodeVersion: process.version
      }
    }, { status: 500 })
  }
} 