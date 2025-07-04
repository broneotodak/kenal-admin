import { NextResponse } from 'next/server'

// Complex test prompts to validate Smart AI capabilities
const complexTestPrompts = [
  {
    id: 'complex_1',
    category: 'Multi-dimensional Analysis',
    prompt: 'Show me a comparison between male and female users across different age groups, with their element distribution',
    expectedBehavior: 'Should create a grouped bar chart or stacked chart showing gender, age groups, and elements',
    difficulty: 'high'
  },
  {
    id: 'complex_2',
    category: 'Time-based Analytics',
    prompt: 'Create a dashboard showing weekly user registration trends for the last 3 months, broken down by country',
    expectedBehavior: 'Should create a time series chart with multiple lines for different countries',
    difficulty: 'high'
  },
  {
    id: 'complex_3',
    category: 'Correlation Analysis',
    prompt: 'Show me the relationship between user elements and their preferred app themes (if any correlation exists)',
    expectedBehavior: 'Should analyze element types vs theme preferences, possibly as a heatmap or scatter plot',
    difficulty: 'very_high'
  },
  {
    id: 'complex_4',
    category: 'Advanced Segmentation',
    prompt: 'Create a funnel chart showing user engagement stages: registered -> verified email -> active (logged in last 30 days) -> power users (logged in 10+ times)',
    expectedBehavior: 'Should create a funnel or pyramid chart with user counts at each stage',
    difficulty: 'very_high'
  },
  {
    id: 'complex_5',
    category: 'Predictive Insights',
    prompt: 'Based on current growth rate, predict how many users we will have in 6 months and show the projection',
    expectedBehavior: 'Should calculate growth rate and show a projection chart extending into the future',
    difficulty: 'extreme'
  },
  {
    id: 'complex_6',
    category: 'Custom Visualization',
    prompt: 'Create a bubble chart where bubble size represents user count, X-axis is average age, Y-axis is activity level, grouped by country',
    expectedBehavior: 'Should create a bubble chart with specific axis mappings and country groupings',
    difficulty: 'high'
  },
  {
    id: 'complex_7',
    category: 'Natural Language Understanding',
    prompt: 'I want to see which elements are most popular among young adults in Asia',
    expectedBehavior: 'Should understand "young adults" as age range 18-35, filter by Asian countries, and show element distribution',
    difficulty: 'high'
  },
  {
    id: 'complex_8',
    category: 'Complex Aggregation',
    prompt: 'Show me the top 5 most active days of the week for user registrations, with hourly breakdown for each day',
    expectedBehavior: 'Should create a heatmap or grouped chart showing day of week vs hour patterns',
    difficulty: 'very_high'
  },
  {
    id: 'complex_9',
    category: 'Mixed Chart Types',
    prompt: 'Create a combination chart showing user count as bars and average session duration as a line, grouped by month',
    expectedBehavior: 'Should create a combo chart with dual Y-axes',
    difficulty: 'high'
  },
  {
    id: 'complex_10',
    category: 'Contextual Understanding',
    prompt: 'Show me user churn rate (users who haven\'t logged in for 60+ days) compared to active users',
    expectedBehavior: 'Should calculate churn based on last login date and compare with active users',
    difficulty: 'very_high'
  }
]

export async function GET() {
  return NextResponse.json({
    success: true,
    testPrompts: complexTestPrompts,
    instructions: {
      purpose: 'These prompts test various aspects of Smart AI capabilities',
      usage: 'Copy any prompt and paste it into the AI chat to test',
      evaluation: {
        understanding: 'Does the AI understand the intent correctly?',
        visualization: 'Does it choose appropriate chart types?',
        data: 'Does it fetch and process the right data?',
        complexity: 'Can it handle multi-dimensional queries?'
      }
    }
  })
} 