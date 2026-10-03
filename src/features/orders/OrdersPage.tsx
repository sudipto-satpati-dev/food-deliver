import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks'
import { useUserOrders, useCancelOrderMutation } from './hooks'
import { useCartStore } from '@/stores/cart'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Price } from '@/components/common/Price'
import { formatDateTime } from '@/lib/format'
import { EmptyState } from '@/components/common/EmptyState'
import { ListSkeleton } from '@/components/common/Skeletons'
import { ErrorState } from '@/components/common/ErrorState'
import {
  ShoppingBag,
  ArrowRight,
  RotateCcw,
  XCircle,
  Star,
  MapPin,
  Clock,
  Radio,
} from 'lucide-react'
import { toast } from 'sonner'

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: orders, isLoading, isError, refetch } = useUserOrders(user?.id)
  const { addItem, clearCart } = useCartStore()
  const cancelMutation = useCancelOrderMutation()

  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active')

  if (!user) {
    return (
      <div className="py-12 px-4 text-center space-y-4">
        <ShoppingBag className="w-12 h-12 mx-auto text-brand-muted" />
        <h2 className="font-heading text-lg font-bold text-brand-dark">Log in to view orders</h2>
        <p className="text-xs text-brand-muted">
          Access your past orders and track current live delivery status.
        </p>
        <button
          onClick={() => navigate('/login?redirect=/orders')}
          className="px-6 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-btn shadow-soft"
        >
          Go to Login
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="py-4 space-y-4">
        <div className="h-8 w-44 bg-brand-surface rounded animate-pulse" />
        <ListSkeleton count={4} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="py-6">
        <ErrorState
          title="Could not load orders"
          message="Failed to fetch your orders. Please check your connection and try again."
          onRetry={refetch}
        />
      </div>
    )
  }

  const activeOrdersList = orders?.filter((o) =>
    ['pending_payment', 'placed', 'accepted', 'preparing', 'ready', 'out_for_delivery'].includes(
      o.status
    )
  ) || []

  const pastOrdersList = orders?.filter((o) =>
    ['delivered', 'cancelled', 'rejected'].includes(o.status)
  ) || []

  const displayedOrders = activeTab === 'active' ? activeOrdersList : pastOrdersList

  const handleCancel = (orderId: string, orderNo: number) => {
    if (confirm(`Are you sure you want to cancel Order #${orderNo}?`)) {
      cancelMutation.mutate({ orderId, reason: 'Cancelled by user' })
    }
  }

  const handleReorder = (order: typeof orders[0]) => {
    if (!order.order_items || order.order_items.length === 0) return
    clearCart()
    order.order_items.forEach((item) => {
      addItem({
        itemId: item.item_id || '',
        name: item.name,
        imageUrl: null,
        isVeg: true,
        variantId: null,
        variantName: item.variant_name,
        unitPrice: item.unit_price,
        addons: Array.isArray(item.addons) ? (item.addons as any) : [],
        qty: item.qty,
        notes: item.notes,
      })
    })
    toast.success('Items added to cart!')
    navigate('/cart')
  }

  return (
    <div className="space-y-4 pb-8 max-w-xl mx-auto">
      {/* Header & Live Indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-brand-dark">My Orders</h1>
          <p className="text-xs text-brand-muted">Track active deliveries & view history</p>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 text-[11px] font-bold">
          <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
          <span>REALTIME SYNC</span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-brand-border">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-all ${
            activeTab === 'active'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-brand-muted hover:text-brand-dark'
          }`}
        >
          Active Orders ({activeOrdersList.length})
        </button>

        <button
          onClick={() => setActiveTab('past')}
          className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-all ${
            activeTab === 'past'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-brand-muted hover:text-brand-dark'
          }`}
        >
          Past Orders ({pastOrdersList.length})
        </button>
      </div>

      {/* Orders List */}
      {displayedOrders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-10 h-10 text-brand-muted" />}
          title={activeTab === 'active' ? 'No active orders' : 'No past orders'}
          message={
            activeTab === 'active'
              ? 'You do not have any active food deliveries right now.'
              : 'Your past order history will appear here.'
          }
          actionLabel="Explore Menu"
          onAction={() => navigate('/menu')}
        />
      ) : (
        <div className="space-y-3">
          {displayedOrders.map((order) => {
            const isCancelable = order.status === 'placed' || order.status === 'pending_payment'
            const addressObj = typeof order.delivery_address === 'object' ? (order.delivery_address as any) : null

            return (
              <div
                key={order.id}
                className="p-4 bg-white rounded-card border border-brand-border space-y-3 shadow-subtle hover:border-brand-border/80 transition-all"
              >
                {/* Header: Order No & Status */}
                <div className="flex items-center justify-between gap-2 border-b border-brand-border/60 pb-2.5">
                  <div>
                    <span className="font-heading font-extrabold text-sm text-brand-dark">
                      Order #{order.order_no}
                    </span>
                    <span className="text-[11px] text-brand-muted flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(order.placed_at)}
                    </span>
                  </div>

                  <StatusBadge status={order.status} />
                </div>

                {/* Items Summary */}
                <div className="text-xs text-brand-dark space-y-1">
                  <p className="font-medium line-clamp-2">
                    {order.order_items
                      ?.map((i) => `${i.qty}x ${i.name}${i.variant_name ? ` (${i.variant_name})` : ''}`)
                      .join(', ')}
                  </p>

                  {addressObj && (
                    <p className="text-[11px] text-brand-muted flex items-center gap-1 pt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-brand-muted shrink-0" />
                      <span className="truncate">
                        {addressObj.label}: {addressObj.line1}
                      </span>
                    </p>
                  )}
                </div>

                {/* Amount & Payment Info */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-brand-border/40">
                  <div className="flex items-center gap-2">
                    <span className="text-brand-muted">Total:</span>
                    <Price amount={order.total} className="font-extrabold text-sm text-brand-dark" />
                  </div>

                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-brand-surface rounded text-brand-dark">
                    {order.payment_method === 'cod' ? '💵 Cash on Delivery' : '💳 Paid Online'}
                  </span>
                </div>

                {/* Actions Row */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  {isCancelable && (
                    <button
                      onClick={() => handleCancel(order.id, order.order_no)}
                      disabled={cancelMutation.isPending}
                      className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-btn transition-colors flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  )}

                  {order.status === 'delivered' && (
                    <>
                      <button
                        onClick={() => navigate(`/orders/${order.id}/rate`)}
                        className="px-3 py-1.5 text-xs font-bold text-amber-600 hover:bg-amber-50 rounded-btn transition-colors flex items-center gap-1"
                      >
                        <Star className="w-3.5 h-3.5" />
                        <span>Rate</span>
                      </button>

                      <button
                        onClick={() => handleReorder(order)}
                        className="px-3 py-1.5 text-xs font-bold text-brand-muted hover:text-brand-dark hover:bg-brand-surface rounded-btn transition-colors flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reorder</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="px-3.5 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-btn shadow-soft hover:bg-brand-primary/95 flex items-center gap-1 transition-all"
                  >
                    <span>Track Order</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
