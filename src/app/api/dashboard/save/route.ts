import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { action, userId, dashboardName, dashboardConfig } = await request.json()
    
    console.log('💾 Dashboard save request:', { action, userId, dashboardName })
    
    const supabase = createSupabaseAdmin()
    
    if (action === 'save') {
      // Save or update dashboard
      const { data, error } = await supabase
        .from('admin_dashboards')
        .upsert({
          user_id: userId,
          name: dashboardName,
          dashboard_config: dashboardConfig,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,name'
        })
        .select()
      
      if (error) throw error
      
      console.log('✅ Dashboard saved successfully')
      return NextResponse.json({
        success: true,
        message: 'Dashboard saved successfully',
        data
      })
      
    } else if (action === 'load') {
      // Load dashboard
      const { data, error } = await supabase
        .from('admin_dashboards')
        .select('*')
        .eq('user_id', userId)
        .eq('name', dashboardName)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No dashboard found
          return NextResponse.json({
            success: false,
            message: 'Dashboard not found'
          })
        }
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
        .from('admin_dashboards')
        .select('name, created_at, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
      
      if (error) throw error
      
      console.log('✅ Dashboard list retrieved')
      return NextResponse.json({
        success: true,
        data
      })
      
    } else if (action === 'delete') {
      // Delete dashboard
      const { error } = await supabase
        .from('admin_dashboards')
        .delete()
        .eq('user_id', userId)
        .eq('name', dashboardName)
      
      if (error) throw error
      
      console.log('✅ Dashboard deleted successfully')
      return NextResponse.json({
        success: true,
        message: 'Dashboard deleted successfully'
      })
    }
    
    return NextResponse.json({
      success: false,
      message: 'Invalid action'
    }, { status: 400 })

  } catch (error) {
    console.error('❌ Dashboard API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process dashboard request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 