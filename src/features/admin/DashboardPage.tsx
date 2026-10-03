import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminOrdersQuery, useSettingsQuery, useUpdateSettingsMutation } from './hooks'
import { Price } from '@/components/common/Price'
import {
  ShoppingBag,
  TrendingUp,
  Clock,
  UtensilsCrossed,
  Layers,
  Tag,
  Settings as SettingsIcon,
  ArrowRight,
  Radio,
  Bike,
} from 'lucide-react'

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { data: orders, isLoading: isLoadingOrders } = useAdminOrdersQuery()
  const { data: settings } = useSettingsQuery()
  const updateSettingsMutation = useUpdateSettingsMutation()

  // Calculate metrics
  const todayStr = new Date().toISOString().split('T')[0]
  const todayOrders = (orders || []).filter((o) => o.placed_at?.startsWith(todayStr))
  const todayRevenue = todayOrders
    .filter((o) => o.status !== 'cancelled' && o.status !== 'rejected')
    .reduce((sum, o) => sum + o.total, 0)

  const activeOrdersCount = (orders || []).filter((o) =>
    ['placed', 'accepted', 'preparing', 'ready', 'out_for_delivery'].includes(o.status)
  ).length

  const handleToggleAcceptingOrders = (accepting: boolean) => {
    updateSettingsMutation.mutate({ accepting_orders: accepting })
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
            Realtime Restaurant Control Panel & Analytics
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
        {/* Today's Revenue */}
        <div className="p-4 bg-white rounded-card border border-brand-border shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-brand-muted">
            <span className="text-xs font-semibold">Today's Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <Price amount={todayRevenue} className="text-2xl font-extrabold text-emerald-600" />
          <p className="text-[10px] text-brand-muted">Total sales generated today</p>
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

        {/* Active Kitchen Orders */}
        <div className="p-4 bg-white rounded-card border border-brand-border shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-brand-muted">
            <span className="text-xs font-semibold">Live Kitchen Orders</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-500">
            {isLoadingOrders ? '...' : activeOrdersCount}
          </p>
          <p className="text-[10px] text-brand-muted">Currently in preparation / delivery</p>
        </div>

        {/* Delivery Radius */}
        <div className="p-4 bg-white rounded-card border border-brand-border shadow-subtle space-y-1">
          <div className="flex items-center justify-between text-brand-muted">
            <span className="text-xs font-semibold">Delivery Radius</span>
            <Bike className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-brand-dark">
            {settings?.delivery_radius_km || 5} km
          </p>
          <p className="text-[10px] text-brand-muted">Haversine radius limit</p>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="space-y-3">
        <h2 className="font-heading text-lg font-bold text-brand-dark">Management Center</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/admin/orders')}
            className="p-4 bg-white rounded-card border border-brand-border shadow-subtle hover:border-brand-primary hover:shadow-soft transition-all text-left flex items-start justify-between group"
          >
            <div>
              <div className="w-9 h-9 bg-brand-primary/10 text-brand-primary rounded-btn flex items-center justify-center mb-2">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="font-heading text-sm font-bold text-brand-dark group-hover:text-brand-primary">
                Live Kitchen Orders
              </h3>
              <p className="text-xs text-brand-muted mt-0.5">
                Accept, prepare food & assign riders
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-brand-muted group-hover:text-brand-primary transition-all group-hover:translate-x-1" />
          </button>

          <button
            onClick={() => navigate('/admin/menu')}
            className="p-4 bg-white rounded-card border border-brand-border shadow-subtle hover:border-brand-primary hover:shadow-soft transition-all text-left flex items-start justify-between group"
          >
            <div>
              <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-btn flex items-center justify-center mb-2">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <h3 className="font-heading text-sm font-bold text-brand-dark group-hover:text-brand-primary">
                Manage Menu Items
              </h3>
              <p className="text-xs text-brand-muted mt-0.5">
                Add dishes, variants, prices & stock
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-brand-muted group-hover:text-brand-primary transition-all group-hover:translate-x-1" />
          </button>

          <button
            onClick={() => navigate('/admin/categories')}
            className="p-4 bg-white rounded-card border border-brand-border shadow-subtle hover:border-brand-primary hover:shadow-soft transition-all text-left flex items-start justify-between group"
          >
            <div>
              <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-btn flex items-center justify-center mb-2">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-heading text-sm font-bold text-brand-dark group-hover:text-brand-primary">
                Categories
              </h3>
              <p className="text-xs text-brand-muted mt-0.5">
                Organize menu category ordering
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-brand-muted group-hover:text-brand-primary transition-all group-hover:translate-x-1" />
          </button>

          <button
            onClick={() => navigate('/admin/coupons')}
            className="p-4 bg-white rounded-card border border-brand-border shadow-subtle hover:border-brand-primary hover:shadow-soft transition-all text-left flex items-start justify-between group"
          >
            <div>
              <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-btn flex items-center justify-center mb-2">
                <Tag className="w-5 h-5" />
              </div>
              <h3 className="font-heading text-sm font-bold text-brand-dark group-hover:text-brand-primary">
                Coupons & Discounts
              </h3>
              <p className="text-xs text-brand-muted mt-0.5">
                Create promotional discount codes
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-brand-muted group-hover:text-brand-primary transition-all group-hover:translate-x-1" />
          </button>

          <button
            onClick={() => navigate('/admin/settings')}
            className="p-4 bg-white rounded-card border border-brand-border shadow-subtle hover:border-brand-primary hover:shadow-soft transition-all text-left flex items-start justify-between group"
          >
            <div>
              <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-btn flex items-center justify-center mb-2">
                <SettingsIcon className="w-5 h-5" />
              </div>
              <h3 className="font-heading text-sm font-bold text-brand-dark group-hover:text-brand-primary">
                Restaurant Settings
              </h3>
              <p className="text-xs text-brand-muted mt-0.5">
                Delivery fees, tax %, min order & location
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-brand-muted group-hover:text-brand-primary transition-all group-hover:translate-x-1" />
          </button>

          <button
            onClick={() => navigate('/admin/riders')}
            className="p-4 bg-white rounded-card border border-brand-border shadow-subtle hover:border-brand-primary hover:shadow-soft transition-all text-left flex items-start justify-between group"
          >
            <div>
              <div className="w-9 h-9 bg-rose-50 text-rose-600 rounded-btn flex items-center justify-center mb-2">
                <Bike className="w-5 h-5" />
              </div>
              <h3 className="font-heading text-sm font-bold text-brand-dark group-hover:text-brand-primary">
                Delivery Executives
              </h3>
              <p className="text-xs text-brand-muted mt-0.5">
                Manage riders & view online status
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-brand-muted group-hover:text-brand-primary transition-all group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  )
}
