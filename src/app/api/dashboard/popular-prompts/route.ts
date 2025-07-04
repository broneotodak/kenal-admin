import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required'
      }, { status: 400 })
    }

    console.log('📊 Fetching popular prompts for user:', userId)

    // First, check if the prompt_usage table exists
    const { error: tableCheckError } = await supabaseAdmin
      .from('admin_prompt_usage')
      .select('prompt')
      .limit(1)

    if (tableCheckError) {
      if (tableCheckError.message.includes('relation') || tableCheckError.code === '42P01') {
        console.log('⚠️ Prompt usage table does not exist yet')
        
        // Create the table
        const { error: createError } = await supabaseAdmin.rpc('execute_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS public.admin_prompt_usage (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              user_id UUID NOT NULL,
              prompt TEXT NOT NULL,
              prompt_type VARCHAR(50),
              chart_type VARCHAR(50),
              success BOOLEAN DEFAULT true,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
              metadata JSONB
            );

            -- Create indexes for performance
            CREATE INDEX IF NOT EXISTS idx_admin_prompt_usage_user_id ON public.admin_prompt_usage(user_id);
            CREATE INDEX IF NOT EXISTS idx_admin_prompt_usage_created_at ON public.admin_prompt_usage(created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_admin_prompt_usage_prompt ON public.admin_prompt_usage(prompt);

            -- Enable RLS
            ALTER TABLE public.admin_prompt_usage ENABLE ROW LEVEL SECURITY;

            -- Create RLS policies
            CREATE POLICY "Users can view their own prompt usage" ON public.admin_prompt_usage
              FOR SELECT USING (auth.uid() = user_id);

            CREATE POLICY "Service role can manage all prompt usage" ON public.admin_prompt_usage
              FOR ALL USING (true);
          `
        })

        if (createError) {
          console.error('Failed to create prompt usage table:', createError)
          return NextResponse.json({
            success: false,
            message: 'Failed to create prompt usage tracking',
            error: createError.message
          }, { status: 500 })
        }

        console.log('✅ Created admin_prompt_usage table')
        
        // Return empty array for now
        return NextResponse.json({
          success: true,
          data: [],
          message: 'Prompt tracking initialized'
        })
      }

      console.error('Error checking prompt usage table:', tableCheckError)
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch popular prompts',
        error: tableCheckError.message
      }, { status: 500 })
    }

    // Fetch popular prompts - aggregate by prompt text, count usage
    const { data: popularPrompts, error: fetchError } = await supabaseAdmin
      .from('admin_prompt_usage')
      .select('prompt, chart_type')
      .eq('user_id', userId)
      .eq('success', true)
      .order('created_at', { ascending: false })
      .limit(100) // Get last 100 successful prompts

    if (fetchError) {
      console.error('Error fetching prompts:', fetchError)
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch popular prompts',
        error: fetchError.message
      }, { status: 500 })
    }

    // Aggregate and count prompts
    const promptCounts = new Map<string, { count: number, chart_type: string | null }>()
    
    popularPrompts?.forEach(item => {
      const key = item.prompt.toLowerCase().trim()
      const existing = promptCounts.get(key)
      
      if (existing) {
        existing.count++
        // Keep the most recent chart type
        if (item.chart_type) {
          existing.chart_type = item.chart_type
        }
      } else {
        promptCounts.set(key, {
          count: 1,
          chart_type: item.chart_type
        })
      }
    })

    // Convert to array and sort by usage count
    const sortedPrompts = Array.from(promptCounts.entries())
      .map(([prompt, data]) => ({
        prompt: prompt,
        usage_count: data.count,
        chart_type: data.chart_type,
        // Generate a label from the prompt
        label: prompt
          .split(' ')
          .slice(0, 4)
          .join(' ')
          .replace(/[^\w\s]/g, '')
          .trim()
          + (prompt.split(' ').length > 4 ? '...' : '')
      }))
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 10) // Return top 10

    console.log(`📊 Found ${sortedPrompts.length} popular prompts`)

    return NextResponse.json({
      success: true,
      data: sortedPrompts
    })

  } catch (error) {
    console.error('Popular prompts error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 