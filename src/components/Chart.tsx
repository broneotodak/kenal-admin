'use client'

import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react'
import dynamic from 'next/dynamic'

const LineChart = dynamic(() => import('react-chartjs-2').then((mod) => ({ default: mod.Line })), {
  ssr: false,
})

interface ChartProps {
  data: any
  options: any
  onResetZoom?: () => void
}

interface ChartHandle {
  resetZoom: () => void
}

const Chart = forwardRef<ChartHandle, ChartProps>(({ data, options, onResetZoom }, ref) => {
  const chartRef = useRef<any>(null)
  const [isChartReady, setIsChartReady] = useState(false)

  // Expose resetZoom method through ref
  useImperativeHandle(ref, () => ({
    resetZoom: () => {
      if (chartRef.current) {
        chartRef.current.resetZoom()
      }
    }
  }))

  // Expose resetZoom method through callback
  const handleResetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom()
    }
    if (onResetZoom) {
      onResetZoom()
    }
  }

  useEffect(() => {
    // Dynamically import and register Chart.js components
    const registerChartJS = async () => {
      try {
        const chartModule = await import('chart.js')
        const {
          Chart: ChartJS,
          CategoryScale,
          LinearScale,
          PointElement,
          LineElement,
          Title,
          Tooltip,
          Legend,
          Filler,
        } = chartModule
        
        const zoomPlugin = await import('chartjs-plugin-zoom')

        ChartJS.register(
          CategoryScale,
          LinearScale,
          PointElement,
          LineElement,
          Title,
          Tooltip,
          Legend,
          Filler,
          zoomPlugin.default
        )

        setIsChartReady(true)
      } catch (error) {
        console.error('Error registering Chart.js:', error)
      }
    }

    registerChartJS()
  }, [])

  if (!isChartReady) {
    return (
      <div style={{ 
        height: '400px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontSize: '14px',
        color: '#666'
      }}>
        Loading chart...
      </div>
    )
  }

  return <LineChart ref={chartRef} data={data} options={options} />
})

Chart.displayName = 'Chart'

export default Chart
export type { ChartHandle } 