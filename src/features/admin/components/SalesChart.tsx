import React from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { SalesSummaryItem } from '../api'

interface SalesChartProps {
  data?: SalesSummaryItem[]
  isLoading?: boolean
}

export const SalesChart: React.FC<SalesChartProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="h-64 bg-gray-50 rounded-card border border-brand-border animate-pulse flex items-center justify-center text-xs text-brand-muted">
        Loading sales chart analytics...
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 bg-gray-50 rounded-card border border-brand-border flex items-center justify-center text-xs text-brand-muted">
        No sales data recorded for this time frame.
      </div>
    )
  }

  const formattedData = data.map((item) => {
    const d = new Date(item.sales_date)
    const label = isNaN(d.getTime())
      ? item.sales_date
      : d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
    return {
      ...item,
      label,
    }
  })

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => `₹${val}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              borderColor: '#374151',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '12px',
            }}
            formatter={(value: any, name: any) => {
              if (name === 'Revenue') return [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']
              if (name === 'Delivered Orders') return [value, 'Delivered Orders']
              return [value, name]
            }}
          />
          <Area
            type="monotone"
            dataKey="total_revenue"
            name="Revenue"
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRevenue)"
          />
          <Area
            type="monotone"
            dataKey="delivered_count"
            name="Delivered Orders"
            stroke="#f59e0b"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorOrders)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default SalesChart
