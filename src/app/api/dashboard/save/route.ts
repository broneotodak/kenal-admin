import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { action, userId, dashboardName, dashboardConfig } = await request.json()
    
    console.log('💾 Dashboard save request:', { action, userId, dashboardName })
    
    // Enhanced error handling for environment setup
    let supabase
    try {
      supabase = createSupabaseAdmin()
    } catch (envError) {
      console.error('❌ Environment configuration error:', envError)
      return NextResponse.json({
        success: false,
        error: 'Dashboard service temporarily unavailable',
        details: 'Environment configuration issue'
      }, { status: 503 })
    }
    
    if (action === 'save') {
      // Save or update dashboard
      const { data, error } = await supabase
        .from('admin_custom_dashboards')
        .upsert({
          admin_user_id: userId,
          dashboard_name: dashboardName,
          dashboard_config: dashboardConfig,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'admin_user_id,dashboard_name'
        })
        .select()
      
      if (error) {
        console.error('❌ Dashboard save error:', error)
        throw error
      }
      
      console.log('✅ Dashboard saved successfully')
      return NextResponse.json({
        success: true,
        message: 'Dashboard saved successfully',
        data
      })
      
    } else if (action === 'load') {
      // Load dashboard
      const { data, error } = await supabase
        .from('admin_custom_dashboards')
        .select('*')
        .eq('admin_user_id', userId)
        .eq('dashboard_name', dashboardName)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No dashboard found
          return NextResponse.json({
            success: false,
            message: 'Dashboard not found'
          })
        }
        console.error('❌ Dashboard load error:', error)
        throw error
      }
      
      console.log('✅ Dashboard loaded successfully')
      return NextResponse.json({
        success: true,
        data: data.dashboard_config
      })
      
    } else if (action === 'list') {
      // List all dashboards for user
      const { data, error } = await supabase
        .from('admin_custom_dashboards')
        .select('dashboard_name, created_at, updated_at, is_active')
        .eq('admin_user_id', userId)
        .order('updated_at', { ascending: false })
      
      if (error) {
        console.error('❌ Dashboard list error:', error)
        throw error
      }
      
      console.log('✅ Dashboard list retrieved')
      return NextResponse.json({
        success: true,
        data
      })
      
    } else if (action === 'delete') {
      // Delete dashboard
      const { error } = await supabase
        .from('admin_custom_dashboards')
        .delete()
        .eq('admin_user_id', userId)
        .eq('dashboard_name', dashboardName)
      
      if (error) {
        console.error('❌ Dashboard delete error:', error)
        throw error
      }
      
      console.log('✅ Dashboard deleted successfully')
      return NextResponse.json({
        success: true,
        message: 'Dashboard deleted successfully'
      })
      
    } else if (action === 'rename') {
      // ENHANCED: Add rename functionality
      const { newName } = await request.json()
      
      if (!newName || !newName.trim()) {
        return NextResponse.json({
          success: false,
          message: 'New dashboard name is required'
        }, { status: 400 })
      }
      
      const { data, error } = await supabase
        .from('admin_custom_dashboards')
        .update({ 
          dashboard_name: newName.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('admin_user_id', userId)
        .eq('dashboard_name', dashboardName)
        .select()
      
      if (error) {
        console.error('❌ Dashboard rename error:', error)
        // Check if it's a unique constraint violation
        if (error.code === '23505') {
          return NextResponse.json({
            success: false,
            message: 'A dashboard with that name already exists'
          }, { status: 409 })
        }
        throw error
      }
      
      if (!data || data.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'Dashboard not found'
        }, { status: 404 })
      }
      
      console.log('✅ Dashboard renamed successfully')
      return NextResponse.json({
        success: true,
        message: 'Dashboard renamed successfully',
        data: data[0]
      })
    }
    
    return NextResponse.json({
      success: false,
      message: 'Invalid action'
    }, { status: 400 })

  } catch (error) {
    console.error('❌ Dashboard API error:', error)
    
    // Enhanced error response with more details for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isEnvironmentError = errorMessage.includes('SUPABASE_SERVICE_ROLE_KEY')
    
    return NextResponse.json(
      { 
        success: false,
        error: isEnvironmentError 
          ? 'Dashboard service configuration error' 
          : 'Failed to process dashboard request',
        details: isEnvironmentError 
          ? 'Please check environment variables configuration'
          : errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: isEnvironmentError ? 503 : 500 }
    )
  }
} 