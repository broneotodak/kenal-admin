'use client'

import { useEffect, useState, forwardRef, useImperativeHandle, useRef } from 'react'
import dynamic from 'next/dynamic'

const LineChart = dynamic(() => import('react-chartjs-2').then((mod) => ({ default: mod.Line })), {
  ssr: false,
})

interface ChartProps {
  data: any
  options: any
}

export const Chart = forwardRef<any, ChartProps>(({ data, options }, ref) => {
  const chartRef = useRef<any>(null)

  useImperativeHandle(ref, () => ({
    resetZoom: () => {
      if (chartRef.current) {
        chartRef.current.resetZoom()
      }
    }
  }), [])
  const [isChartReady, setIsChartReady] = useState(false)

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