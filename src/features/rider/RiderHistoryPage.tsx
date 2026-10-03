import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks'
import { useRiderOrdersQuery } from './hooks'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Price } from '@/components/common/Price'
import { formatDateTime } from '@/lib/format'
import { EmptyState } from '@/components/common/EmptyState'
import { ListSkeleton } from '@/components/common/Skeletons'
import { ErrorState } from '@/components/common/ErrorState'
import { Bike, Clock, MapPin, CheckCircle2, ArrowLeft } from 'lucide-react'

export const RiderHistoryPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: orders, isLoading, isError, refetch } = useRiderOrdersQuery(user?.id)

  if (!user) {
    return (
      <div className="py-12 px-4 text-center space-y-4 max-w-md mx-auto">
        <Bike className="w-12 h-12 mx-auto text-brand-muted" />
        <h2 className="font-heading text-lg font-bold text-brand-dark">Rider Login Required</h2>
        <button
          onClick={() => navigate('/login?redirect=/rider/history')}
          className="px-6 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-btn shadow-soft"
        >
          Go to Login
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="py-4 space-y-4 max-w-xl mx-auto">
        <ListSkeleton count={4} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="py-6 max-w-xl mx-auto">
        <ErrorState
          title="Could not load history"
          message="Failed to fetch your delivery history."
          onRetry={refetch}
        />
      </div>
    )
  }

  const completedOrders = (orders || []).filter((o) => o.status === 'delivered')
  const totalKm = completedOrders.reduce((sum, o) => sum + (o.distance_km || 0), 0)

  return (
    <div className="space-y-5 max-w-xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/rider')}
          className="p-2 -ml-2 text-brand-dark hover:bg-brand-surface rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-heading text-xl font-bold text-brand-dark">Delivery History</h1>
          <p className="text-xs text-brand-muted">Past completed food deliveries</p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-4 bg-white rounded-card border border-brand-border space-y-1">
          <span className="text-brand-muted font-medium">Total Delivered</span>
          <p className="text-2xl font-extrabold text-emerald-600">{completedOrders.length}</p>
        </div>
        <div className="p-4 bg-white rounded-card border border-brand-border space-y-1">
          <span className="text-brand-muted font-medium">Total Distance</span>
          <p className="text-2xl font-extrabold text-brand-dark">{totalKm.toFixed(1)} km</p>
        </div>
      </div>

      {/* Delivered List */}
      {completedOrders.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="w-10 h-10 text-brand-muted" />}
          title="No completed deliveries yet"
          message="Your completed deliveries will appear here."
        />
      ) : (
        <div className="space-y-3">
          {completedOrders.map((order) => {
            const addressObj = typeof order.delivery_address === 'object' ? (order.delivery_address as any) : null

            return (
              <div
                key={order.id}
                className="p-4 bg-white rounded-card border border-brand-border space-y-2 text-xs shadow-subtle"
              >
                <div className="flex items-center justify-between border-b border-brand-border/60 pb-2">
                  <span className="font-heading font-bold text-sm text-brand-dark">
                    Order #{order.order_no}
                  </span>
                  <StatusBadge status={order.status} />
                </div>

                <div className="space-y-1 text-brand-dark">
                  <p className="font-semibold">{order.customer_name}</p>
                  {addressObj && (
                    <p className="text-brand-muted flex items-center gap-1 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-brand-muted shrink-0" />
                      <span>
                        {addressObj.label}: {addressObj.line1} ({order.distance_km} km)
                      </span>
                    </p>
                  )}
                  <p className="text-brand-muted flex items-center gap-1 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-brand-muted shrink-0" />
                    <span>{formatDateTime(order.placed_at)}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-brand-border/40 font-bold">
                  <span className="text-brand-muted text-[11px]">Order Value</span>
                  <Price amount={order.total} className="text-brand-dark" />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
