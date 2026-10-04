import React, { useState } from 'react'
import {
  useSalesSummaryQuery,
  useTopSellingItemsQuery,
  useAdminOrdersQuery,
} from './hooks'
import { Price } from '@/components/common/Price'
import {
  FileBarChart,
  Download,
  Calendar,
  CreditCard,
  Banknote,
  TrendingUp,
  ShoppingBag,
  Award,
  Filter,
} from 'lucide-react'

export const AdminReportsPage: React.FC = () => {
  // Date range states (default: last 30 days)
  const defaultToDate = new Date().toISOString().split('T')[0]
  const defaultFromDate = new Date(Date.now() - 29 * 86400000).toISOString().split('T')[0]

  const [fromDate, setFromDate] = useState(defaultFromDate)
  const [toDate, setToDate] = useState(defaultToDate)

  // Fetch sales summary and top items queries
  const { data: salesData, isLoading: isLoadingSales } = useSalesSummaryQuery(fromDate, toDate)
  const { data: topItems, isLoading: isLoadingTopItems } = useTopSellingItemsQuery(10, fromDate, toDate)
  const { data: allOrders } = useAdminOrdersQuery()

  // Filter preset handlers
  const handleSetPreset = (preset: 'today' | '7days' | '30days' | 'thisMonth') => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    if (preset === 'today') {
      setFromDate(todayStr)
      setToDate(todayStr)
    } else if (preset === '7days') {
      const past = new Date(Date.now() - 6 * 86400000)
      setFromDate(past.toISOString().split('T')[0])
      setToDate(todayStr)
    } else if (preset === '30days') {
      const past = new Date(Date.now() - 29 * 86400000)
      setFromDate(past.toISOString().split('T')[0])
      setToDate(todayStr)
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      setFromDate(firstDay.toISOString().split('T')[0])
      setToDate(todayStr)
    }
  }

  // Calculate totals across selected range
  const totalOrdersCount = (salesData || []).reduce((acc, curr) => acc + curr.order_count, 0)
  const totalDeliveredCount = (salesData || []).reduce((acc, curr) => acc + curr.delivered_count, 0)
  const totalCancelledCount = (salesData || []).reduce((acc, curr) => acc + curr.cancelled_count, 0)
  const totalRevenue = (salesData || []).reduce((acc, curr) => acc + curr.total_revenue, 0)
  const totalOnlineRevenue = (salesData || []).reduce((acc, curr) => acc + curr.online_revenue, 0)
  const totalCodRevenue = (salesData || []).reduce((acc, curr) => acc + curr.cod_revenue, 0)

  const averageOrderValue = totalDeliveredCount > 0 ? totalRevenue / totalDeliveredCount : 0

  // Payment method order count split from allOrders
  const filteredOrders = (allOrders || []).filter((o) => {
    const orderDate = o.placed_at.split('T')[0]
    return orderDate >= fromDate && orderDate <= toDate && o.status === 'delivered'
  })

  const onlineOrdersCount = filteredOrders.filter((o) => o.payment_method === 'online').length
  const codOrdersCount = filteredOrders.filter((o) => o.payment_method === 'cod').length

  // Client-Side CSV Export
  const handleExportCSV = () => {
    if (!salesData || salesData.length === 0) return

    const headers = [
      'Date',
      'Total Orders',
      'Delivered Orders',
      'Cancelled Orders',
      'Online Revenue (INR)',
      'COD Revenue (INR)',
      'Total Revenue (INR)',
      'Avg Order Value (INR)',
    ]

    const rows = salesData.map((d) => {
      const aov = d.delivered_count > 0 ? (d.total_revenue / d.delivered_count).toFixed(2) : '0.00'
      return [
        d.sales_date,
        d.order_count,
        d.delivered_count,
        d.cancelled_count,
        d.online_revenue.toFixed(2),
        d.cod_revenue.toFixed(2),
        d.total_revenue.toFixed(2),
        aov,
      ]
    })

    // Build CSV content string
    let csvContent = 'data:text/csv;charset=utf-8,'
    csvContent += `SALES REPORT (${fromDate} to ${toDate})\n\n`
    csvContent += headers.join(',') + '\n'
    rows.forEach((rowArray) => {
      csvContent += rowArray.join(',') + '\n'
    })

    // Add Summary & Payment Split Section
    csvContent += `\nSUMMARY METRICS\n`
    csvContent += `Total Revenue,INR ${totalRevenue.toFixed(2)}\n`
    csvContent += `Total Delivered Orders,${totalDeliveredCount}\n`
    csvContent += `Average Order Value,INR ${averageOrderValue.toFixed(2)}\n`
    csvContent += `Online Revenue,INR ${totalOnlineRevenue.toFixed(2)} (${onlineOrdersCount} orders)\n`
    csvContent += `COD Revenue,INR ${totalCodRevenue.toFixed(2)} (${codOrdersCount} orders)\n`

    if (topItems && topItems.length > 0) {
      csvContent += `\nTOP SELLING DISHES\n`
      csvContent += `Item Name,Quantity Sold,Total Sales (INR)\n`
      topItems.forEach((item) => {
        csvContent += `"${item.item_name}",${item.quantity_sold},${item.total_revenue.toFixed(2)}\n`
      })
    }

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `DinningZone_Report_${fromDate}_to_${toDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Header & Export Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white rounded-card border border-brand-border shadow-subtle">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-dark flex items-center gap-2">
            <FileBarChart className="w-6 h-6 text-brand-primary" />
            Reports & Business Analytics
          </h1>
          <p className="text-xs text-brand-muted mt-1">
            Detailed sales reports, daily breakdown, payment method analytics & top items
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={!salesData || salesData.length === 0}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-btn flex items-center gap-2 shadow-soft transition-all"
        >
          <Download className="w-4 h-4" />
          Export CSV Report
        </button>
      </div>

      {/* Date Range Selector & Presets */}
      <div className="bg-white p-4 rounded-card border border-brand-border shadow-subtle space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-brand-dark">
          <Filter className="w-4 h-4 text-brand-primary" />
          Filter Date Range:
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Custom Date Pickers */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-gray-50 border border-brand-border px-3 py-1.5 rounded-btn">
              <Calendar className="w-3.5 h-3.5 text-brand-muted" />
              <span className="text-brand-muted text-[11px]">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-transparent font-bold text-brand-dark focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-gray-50 border border-brand-border px-3 py-1.5 rounded-btn">
              <Calendar className="w-3.5 h-3.5 text-brand-muted" />
              <span className="text-brand-muted text-[11px]">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-transparent font-bold text-brand-dark focus:outline-none"
              />
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSetPreset('today')}
              className="px-3 py-1.5 text-xs font-semibold rounded-btn bg-gray-100 hover:bg-brand-primary hover:text-white transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => handleSetPreset('7days')}
              className="px-3 py-1.5 text-xs font-semibold rounded-btn bg-gray-100 hover:bg-brand-primary hover:text-white transition-colors"
            >
              7 Days
            </button>
            <button
              onClick={() => handleSetPreset('30days')}
              className="px-3 py-1.5 text-xs font-semibold rounded-btn bg-gray-100 hover:bg-brand-primary hover:text-white transition-colors"
            >
              30 Days
            </button>
            <button
              onClick={() => handleSetPreset('thisMonth')}
              className="px-3 py-1.5 text-xs font-semibold rounded-btn bg-gray-100 hover:bg-brand-primary hover:text-white transition-colors"
            >
              This Month
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-4 bg-white rounded-card border border-brand-border shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-brand-muted">
            <span className="text-xs font-semibold">Total Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <Price amount={totalRevenue} className="text-2xl font-extrabold text-emerald-600" />
          <p className="text-[10px] text-brand-muted">{totalDeliveredCount} delivered orders</p>
        </div>

        {/* Total Orders */}
        <div className="p-4 bg-white rounded-card border border-brand-border shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-brand-muted">
            <span className="text-xs font-semibold">Total Orders</span>
            <ShoppingBag className="w-4 h-4 text-brand-primary" />
          </div>
          <p className="text-2xl font-extrabold text-brand-dark">{totalOrdersCount}</p>
          <p className="text-[10px] text-brand-muted">{totalCancelledCount} cancelled/rejected</p>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="p-4 bg-white rounded-card border border-brand-border shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-brand-muted">
            <span className="text-xs font-semibold">Avg Order Value (AOV)</span>
            <FileBarChart className="w-4 h-4 text-indigo-600" />
          </div>
          <Price amount={averageOrderValue} className="text-2xl font-extrabold text-indigo-600" />
          <p className="text-[10px] text-brand-muted">Revenue / Delivered orders</p>
        </div>

        {/* Online Split % */}
        <div className="p-4 bg-white rounded-card border border-brand-border shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-brand-muted">
            <span className="text-xs font-semibold">Online Payment Share</span>
            <CreditCard className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-extrabold text-teal-600">
            {totalRevenue > 0
              ? `${Math.round((totalOnlineRevenue / totalRevenue) * 100)}%`
              : '0%'}
          </p>
          <p className="text-[10px] text-brand-muted">Razorpay vs Cash on Delivery</p>
        </div>
      </div>

      {/* Payment Split & Top Items Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Method Split Card */}
        <div className="bg-white p-5 rounded-card border border-brand-border shadow-subtle space-y-4">
          <h2 className="font-heading text-base font-bold text-brand-dark flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-brand-primary" />
            Payment Method Split
          </h2>

          <div className="space-y-4">
            {/* Online Payments Bar */}
            <div className="space-y-1.5 p-3 rounded-card bg-teal-50/50 border border-teal-100">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-bold text-teal-900">
                  <CreditCard className="w-4 h-4 text-teal-600" />
                  Razorpay Online Payment
                </div>
                <span className="font-extrabold text-teal-900">
                  <Price amount={totalOnlineRevenue} /> ({onlineOrdersCount} orders)
                </span>
              </div>
              <div className="w-full bg-teal-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-teal-600 h-full transition-all"
                  style={{
                    width: `${totalRevenue > 0 ? (totalOnlineRevenue / totalRevenue) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Cash on Delivery Bar */}
            <div className="space-y-1.5 p-3 rounded-card bg-amber-50/50 border border-amber-100">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <Banknote className="w-4 h-4 text-amber-600" />
                  Cash on Delivery (COD)
                </div>
                <span className="font-extrabold text-amber-900">
                  <Price amount={totalCodRevenue} /> ({codOrdersCount} orders)
                </span>
              </div>
              <div className="w-full bg-amber-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full transition-all"
                  style={{
                    width: `${totalRevenue > 0 ? (totalCodRevenue / totalRevenue) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top Selling Items Table */}
        <div className="bg-white p-5 rounded-card border border-brand-border shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-base font-bold text-brand-dark flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Top Items in Date Range
            </h2>
            <span className="text-[10px] text-brand-muted">Delivered orders only</span>
          </div>

          {isLoadingTopItems ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-gray-100 rounded-btn animate-pulse" />
              ))}
            </div>
          ) : !topItems || topItems.length === 0 ? (
            <div className="text-center py-6 text-xs text-brand-muted">
              No top items recorded for this date range.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-brand-border text-brand-muted bg-gray-50/50">
                    <th className="py-2 px-2 font-semibold">Rank</th>
                    <th className="py-2 px-2 font-semibold">Dish Name</th>
                    <th className="py-2 px-2 font-semibold text-center">Qty Sold</th>
                    <th className="py-2 px-2 font-semibold text-right">Sales Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/80">
                      <td className="py-2 px-2 font-bold text-brand-muted">#{idx + 1}</td>
                      <td className="py-2 px-2 font-bold text-brand-dark">{item.item_name}</td>
                      <td className="py-2 px-2 font-medium text-center">{item.quantity_sold}</td>
                      <td className="py-2 px-2 font-bold text-emerald-700 text-right">
                        <Price amount={item.total_revenue} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Daily Sales Breakdown Table */}
      <div className="bg-white p-5 rounded-card border border-brand-border shadow-subtle space-y-4">
        <div>
          <h2 className="font-heading text-base font-bold text-brand-dark">
            Daily Breakdown Table
          </h2>
          <p className="text-xs text-brand-muted">
            Detailed day-by-day sales performance from {fromDate} to {toDate}
          </p>
        </div>

        {isLoadingSales ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-gray-100 rounded-btn animate-pulse" />
            ))}
          </div>
        ) : !salesData || salesData.length === 0 ? (
          <div className="text-center py-8 text-xs text-brand-muted">
            No sales data available for selected date range.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brand-border text-brand-muted bg-gray-50/50">
                  <th className="py-2.5 px-3 font-semibold">Date</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Total Orders</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Delivered</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Cancelled</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Online (₹)</th>
                  <th className="py-2.5 px-3 font-semibold text-right">COD (₹)</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Total Rev (₹)</th>
                  <th className="py-2.5 px-3 font-semibold text-right">AOV (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {salesData.map((row) => {
                  const aov = row.delivered_count > 0 ? row.total_revenue / row.delivered_count : 0
                  return (
                    <tr key={row.sales_date} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-brand-dark">{row.sales_date}</td>
                      <td className="py-2.5 px-3 text-center">{row.order_count}</td>
                      <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">
                        {row.delivered_count}
                      </td>
                      <td className="py-2.5 px-3 text-center text-rose-600 font-bold">
                        {row.cancelled_count}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Price amount={row.online_revenue} />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Price amount={row.cod_revenue} />
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-emerald-700">
                        <Price amount={row.total_revenue} />
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-indigo-600">
                        <Price amount={aov} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
