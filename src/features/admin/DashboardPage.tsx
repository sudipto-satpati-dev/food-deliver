import React, { Suspense, lazy } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useAdminOrdersQuery,
  useSettingsQuery,
  useUpdateSettingsMutation,
  useSalesSummaryQuery,
  useTopSellingItemsQuery,
} from './hooks'
import { useRestaurantRatingQuery } from '@/features/reviews/hooks'
import { Price } from '@/components/common/Price'
import {
  ShoppingBag,
  TrendingUp,
  Clock,
  UtensilsCrossed,
  //Layers,
  Tag,
  //Settings as SettingsIcon,
  ArrowRight,
  Radio,
  //Bike,
  Star,
  FileBarChart,
  ChevronRight,
  Award,
} from 'lucide-react'

// Lazy load Recharts component to optimize bundle size
const SalesChart = lazy(() => import('./components/SalesChart'))

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { data: orders, isLoading: isLoadingOrders } = useAdminOrdersQuery()
  const { data: settings } = useSettingsQuery()
  const updateSettingsMutation = useUpdateSettingsMutation()
  const { data: ratingStats, isLoading: isLoadingRating } = useRestaurantRatingQuery()

  // Dates for 7-day sales chart
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const sevenDaysAgo = new Date(Date.now() - 6 * 86400000)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

  const { data: salesSummary, isLoading: isLoadingSales } = useSalesSummaryQuery(
    sevenDaysAgoStr,
    todayStr
  )
  const { data: topItems, isLoading: isLoadingTopItems } = useTopSellingItemsQuery(5)

  // Calculated metrics matching PRD requirements
  const todayOrders = (orders || []).filter((o) => o.placed_at?.startsWith(todayStr))
  
  // Revenue (delivered)
  const todayDeliveredRevenue = todayOrders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + Number(o.total || 0), 0)

  // Pending (new) count
  const pendingOrdersCount = (orders || []).filter((o) => o.status === 'placed').length

  const handleToggleAcceptingOrders = (accepting: boolean) => {
    updateSettingsMutation.mutate({ accepting_orders: accepting })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'placed':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700 animate-pulse">NEW ORDER</span>
      case 'accepted':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-700">ACCEPTED</span>
      case 'preparing':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700">PREPARING</span>
      case 'ready':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-700">READY</span>
      case 'out_for_delivery':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-teal-100 text-teal-700">ON THE WAY</span>
      case 'delivered':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700">DELIVERED</span>
      case 'cancelled':
      case 'rejected':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-700">CANCELLED</span>
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 text-gray-700">{status}</span>
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-gradient-to-r from-brand-dark to-gray-900 text-white rounded-card shadow-soft">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            {settings?.restaurant_name || 'Dinning Zone'} Dashboard
          </h1>
          <p className="text-xs text-gray-300 mt-1">
            Realtime Restaurant Control Panel & Performance Analytics
          </p>
        </div>

        {/* Store Status Toggle */}
        <div className="flex items-center gap-3 bg-white/10 px-4 py-2.5 rounded-btn backdrop-blur-sm border border-white/15">
          <Radio
            className={`w-4 h-4 ${
              settings?.accepting_orders ? 'text-emerald-400 animate-pulse' : 'text-rose-400'
            }`}
          />
          <span className="text-xs font-bold">
            {settings?.accepting_orders ? 'KITCHEN OPEN' : 'KITCHEN CLOSED'}
          </span>
          <button
            onClick={() => handleToggleAcceptingOrders(!settings?.accepting_orders)}
            disabled={updateSettingsMutation.isPending}
            className={`px-3 py-1 text-[11px] font-extrabold rounded-full transition-all ${
              settings?.accepting_orders
                ? 'bg-rose-500 text-white hover:bg-rose-600'
                : 'bg-emerald-500 text-white hover:bg-emerald-600'
            }`}
          >
            {settings?.accepting_orders ? 'Pause Orders' : 'Start Orders'}
          </button>
        </div>
      </div>

      {/* Realtime Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Today's Revenue (Delivered) */}
        <div className="p-4 bg-white rounded-card border border-brand-border shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-brand-muted">
            <span className="text-xs font-semibold">Today's Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <Price amount={todayDeliveredRevenue} className="text-2xl font-extrabold text-emerald-600" />
          <p className="text-[10px] text-brand-muted">Delivered orders revenue today</p>
        </div>

        {/* Today's Orders */}
        <div className="p-4 bg-white rounded-card border border-brand-border shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-brand-muted">
            <span className="text-xs font-semibold">Today's Orders</span>
            <ShoppingBag className="w-4 h-4 text-brand-primary" />
          </div>
          <p className="text-2xl font-extrabold text-brand-dark">
            {isLoadingOrders ? '...' : todayOrders.length}
          </p>
          <p className="text-[10px] text-brand-muted">Total orders placed today</p>
        </div>

        {/* Pending (New) Orders */}
        <div className="p-4 bg-white rounded-card border border-brand-border shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-brand-muted">
            <span className="text-xs font-semibold">Pending New Orders</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-500">
            {isLoadingOrders ? '...' : pendingOrdersCount}
          </p>
          <p className="text-[10px] text-brand-muted">Awaiting kitchen acceptance</p>
        </div>

        {/* Average Rating */}
        <div className="p-4 bg-white rounded-card border border-brand-border shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-brand-muted">
            <span className="text-xs font-semibold">Average Rating</span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <p className="text-2xl font-extrabold text-brand-dark">
              {isLoadingRating ? '...' : (ratingStats?.averageFoodRating || 4.8)}
            </p>
            <span className="text-[11px] text-brand-muted">/ 5.0</span>
          </div>
          <p className="text-[10px] text-brand-muted">
            Based on {ratingStats?.totalReviews || 0} customer reviews
          </p>
        </div>
      </div>

      {/* 7-Day Sales Chart & Top Items Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-card border border-brand-border shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-base font-bold text-brand-dark flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-primary" />
                7-Day Sales & Revenue Summary
              </h2>
              <p className="text-xs text-brand-muted">Daily breakdown of total revenue and completed orders</p>
            </div>
            <button
              onClick={() => navigate('/admin/reports')}
              className="text-xs text-brand-primary font-bold hover:underline flex items-center gap-1"
            >
              Full Report <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <Suspense
            fallback={
              <div className="h-72 bg-gray-50 rounded-card animate-pulse flex items-center justify-center text-xs text-brand-muted">
                Loading sales chart analytics...
              </div>
            }
          >
            <SalesChart data={salesSummary} isLoading={isLoadingSales} />
          </Suspense>
        </div>

        {/* Top 5 Selling Dishes */}
        <div className="bg-white p-5 rounded-card border border-brand-border shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-base font-bold text-brand-dark flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Top 5 Dishes
            </h2>
            <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold">
              Best Sellers
            </span>
          </div>

          {isLoadingTopItems ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-btn animate-pulse" />
              ))}
            </div>
          ) : !topItems || topItems.length === 0 ? (
            <div className="text-center py-8 text-xs text-brand-muted">
              No sales recorded for menu items yet.
            </div>
          ) : (
            <div className="space-y-3">
              {topItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-btn bg-gray-50 border border-gray-100 hover:border-brand-primary/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-800'
                          : idx === 1
                          ? 'bg-gray-200 text-gray-800'
                          : idx === 2
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-brand-dark line-clamp-1">{item.item_name}</p>
                      <p className="text-[10px] text-brand-muted">{item.quantity_sold} units sold</p>
                    </div>
                  </div>
                  <Price amount={item.total_revenue} className="text-xs font-extrabold text-emerald-700" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="bg-white p-5 rounded-card border border-brand-border shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-base font-bold text-brand-dark flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-brand-primary" />
              Recent Customer Orders
            </h2>
            <p className="text-xs text-brand-muted">Latest live activity across all order statuses</p>
          </div>
          <button
            onClick={() => navigate('/admin/orders')}
            className="text-xs text-brand-primary font-bold hover:underline flex items-center gap-1"
          >
            Manage All Orders ({orders?.length || 0}) <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoadingOrders ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-btn animate-pulse" />
            ))}
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-8 text-xs text-brand-muted">
            No orders placed yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brand-border text-brand-muted bg-gray-50/50">
                  <th className="py-2 px-3 font-semibold">Order No</th>
                  <th className="py-2 px-3 font-semibold">Customer</th>
                  <th className="py-2 px-3 font-semibold">Items</th>
                  <th className="py-2 px-3 font-semibold">Total</th>
                  <th className="py-2 px-3 font-semibold">Status</th>
                  <th className="py-2 px-3 font-semibold">Time</th>
                  <th className="py-2 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-brand-dark">#{order.order_no}</td>
                    <td className="py-2.5 px-3 font-medium text-gray-800">{order.customer_name}</td>
                    <td className="py-2.5 px-3 text-brand-muted">
                      {order.order_items?.length || 0} item(s)
                    </td>
                    <td className="py-2.5 px-3 font-bold text-emerald-700">
                      <Price amount={order.total} />
                    </td>
                    <td className="py-2.5 px-3">{getStatusBadge(order.status)}</td>
                    <td className="py-2.5 px-3 text-brand-muted text-[11px]">
                      {new Date(order.placed_at).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                        className="text-brand-primary hover:text-brand-dark font-bold text-xs"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Navigation Center */}
      <div className="space-y-3">
        <h2 className="font-heading text-base font-bold text-brand-dark">Management Center</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/admin/orders')}
            className="p-3.5 bg-white rounded-card border border-brand-border shadow-subtle hover:border-brand-primary hover:shadow-soft transition-all text-left flex items-start justify-between group"
          >
            <div>
              <div className="w-8 h-8 bg-brand-primary/10 text-brand-primary rounded-btn flex items-center justify-center mb-1.5">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h3 className="font-heading text-xs font-bold text-brand-dark group-hover:text-brand-primary">
                Live Kitchen Orders
              </h3>
            </div>
            <ArrowRight className="w-4 h-4 text-brand-muted group-hover:text-brand-primary transition-all group-hover:translate-x-1" />
          </button>

          <button
            onClick={() => navigate('/admin/menu')}
            className="p-3.5 bg-white rounded-card border border-brand-border shadow-subtle hover:border-brand-primary hover:shadow-soft transition-all text-left flex items-start justify-between group"
          >
            <div>
              <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-btn flex items-center justify-center mb-1.5">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <h3 className="font-heading text-xs font-bold text-brand-dark group-hover:text-brand-primary">
                Manage Menu Items
              </h3>
            </div>
            <ArrowRight className="w-4 h-4 text-brand-muted group-hover:text-brand-primary transition-all group-hover:translate-x-1" />
          </button>

          <button
            onClick={() => navigate('/admin/reports')}
            className="p-3.5 bg-white rounded-card border border-brand-border shadow-subtle hover:border-brand-primary hover:shadow-soft transition-all text-left flex items-start justify-between group"
          >
            <div>
              <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-btn flex items-center justify-center mb-1.5">
                <FileBarChart className="w-4 h-4" />
              </div>
              <h3 className="font-heading text-xs font-bold text-brand-dark group-hover:text-brand-primary">
                Reports & Analytics
              </h3>
            </div>
            <ArrowRight className="w-4 h-4 text-brand-muted group-hover:text-brand-primary transition-all group-hover:translate-x-1" />
          </button>

          <button
            onClick={() => navigate('/admin/coupons')}
            className="p-3.5 bg-white rounded-card border border-brand-border shadow-subtle hover:border-brand-primary hover:shadow-soft transition-all text-left flex items-start justify-between group"
          >
            <div>
              <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-btn flex items-center justify-center mb-1.5">
                <Tag className="w-4 h-4" />
              </div>
              <h3 className="font-heading text-xs font-bold text-brand-dark group-hover:text-brand-primary">
                Coupons & Offers
              </h3>
            </div>
            <ArrowRight className="w-4 h-4 text-brand-muted group-hover:text-brand-primary transition-all group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  )
}
