import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  useAdminOrdersQuery,
  useAdminRidersQuery,
  useUpdateOrderStatusMutation,
  useAssignRiderMutation,
  useAdminMarkDeliveredMutation,
} from './hooks'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Price } from '@/components/common/Price'
import { formatDateTime } from '@/lib/format'
import { DetailSkeleton } from '@/components/common/Skeletons'
import { ErrorState } from '@/components/common/ErrorState'
import { OrderStatus } from '@/types/database'
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Clock,
  Bike,
  CheckCircle2,
  XCircle,
  ChefHat,
  ShieldAlert,
} from 'lucide-react'
import { toast } from 'sonner'

export const AdminOrderDetailPage: React.FC = () => {
  const { id: orderId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: orders, isLoading, isError, refetch } = useAdminOrdersQuery()
  const { data: riders } = useAdminRidersQuery()

  const updateStatusMutation = useUpdateOrderStatusMutation()
  const assignRiderMutation = useAssignRiderMutation()
  const adminMarkDeliveredMutation = useAdminMarkDeliveredMutation()

  const order = orders?.find((o) => o.id === orderId)

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <DetailSkeleton />
      </div>
    )
  }

  if (isError || !order) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <ErrorState
          title="Order not found"
          message="Could not load details for this order."
          onRetry={refetch}
        />
      </div>
    )
  }

  const addressObj = typeof order.delivery_address === 'object' ? (order.delivery_address as any) : null

  const handleStatusChange = (newStatus: OrderStatus) => {
    updateStatusMutation.mutate({ orderId: order.id, status: newStatus })
  }

  const handleRiderAssign = (riderId: string) => {
    if (!riderId) return
    assignRiderMutation.mutate({ orderId: order.id, riderId })
  }

  const handleAdminOverrideDelivered = () => {
    if (confirm(`Mark Order #${order.order_no} as DELIVERED (Admin Override)?`)) {
      adminMarkDeliveredMutation.mutate({ orderId: order.id })
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/orders')}
            className="p-2 -ml-2 text-brand-dark hover:bg-brand-surface rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-heading text-xl font-bold text-brand-dark">
              Admin View: Order #{order.order_no}
            </h1>
            <p className="text-xs text-brand-muted flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDateTime(order.placed_at)}
            </p>
          </div>
        </div>

        <StatusBadge status={order.status} />
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Items & Billing */}
        <div className="md:col-span-2 space-y-4">
          {/* Order Items */}
          <div className="p-4 bg-white rounded-card border border-brand-border space-y-3">
            <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider">
              Ordered Items
            </h3>
            <div className="space-y-2 divide-y divide-brand-border/60 text-xs">
              {order.order_items?.map((item) => (
                <div key={item.id} className="pt-2 first:pt-0 flex justify-between items-start">
                  <div>
                    <p className="font-bold text-brand-dark">
                      <span className="text-brand-primary mr-1">{item.qty}x</span>
                      {item.name}
                      {item.variant_name && (
                        <span className="text-brand-muted font-normal ml-1">
                          ({item.variant_name})
                        </span>
                      )}
                    </p>
                    {Array.isArray(item.addons) && item.addons.length > 0 && (
                      <p className="text-[11px] text-brand-muted mt-0.5">
                        + {(item.addons as any[]).map((a) => a.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <Price amount={item.line_total} className="font-bold text-brand-dark" />
                </div>
              ))}
            </div>
          </div>

          {/* Billing Breakdown */}
          <div className="p-4 bg-white rounded-card border border-brand-border space-y-2 text-xs">
            <h3 className="font-bold text-brand-dark uppercase tracking-wider text-[11px] mb-2">
              Financial Breakdown
            </h3>
            <div className="space-y-1.5 text-brand-muted">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <Price amount={order.subtotal} className="text-brand-dark" />
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount</span>
                  <span>-<Price amount={order.discount} /></span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <Price amount={order.delivery_fee} className="text-brand-dark" />
              </div>
              <div className="flex justify-between">
                <span>Packaging Fee</span>
                <Price amount={order.packaging_fee} className="text-brand-dark" />
              </div>
              <div className="flex justify-between">
                <span>Tax & GST</span>
                <Price amount={order.tax} className="text-brand-dark" />
              </div>
            </div>
            <div className="pt-2 border-t border-brand-border flex justify-between font-bold text-sm text-brand-dark">
              <span>Total Revenue</span>
              <Price amount={order.total} className="text-base text-brand-primary" />
            </div>
          </div>
        </div>

        {/* Right Column: Status Actions & Customer Details */}
        <div className="space-y-4">
          {/* Status Controls */}
          <div className="p-4 bg-white rounded-card border border-brand-border space-y-3">
            <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider">
              Status Management
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-brand-muted block">
                Update Order Status:
              </label>
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
                className="w-full px-3 py-2 text-xs border border-brand-border rounded-btn focus:outline-none focus:border-brand-primary"
              >
                <option value="placed">Placed</option>
                <option value="accepted">Accepted</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready for Pickup</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Rider Assignment */}
            <div className="space-y-2 pt-2 border-t border-brand-border/60">
              <label className="text-xs font-semibold text-brand-muted block flex items-center gap-1">
                <Bike className="w-3.5 h-3.5 text-brand-primary" />
                Assigned Delivery Rider:
              </label>
              <select
                value={order.rider_id || ''}
                onChange={(e) => handleRiderAssign(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-brand-border rounded-btn focus:outline-none focus:border-brand-primary"
              >
                <option value="">-- Select Rider --</option>
                {riders?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.full_name || 'Rider'} ({r.phone})
                  </option>
                ))}
              </select>
            </div>

            {/* Admin Override Delivery */}
            {order.status !== 'delivered' && (
              <button
                onClick={handleAdminOverrideDelivered}
                disabled={adminMarkDeliveredMutation.isPending}
                className="w-full mt-2 py-2 px-3 border border-purple-200 bg-purple-50 text-purple-800 text-xs font-bold rounded-btn hover:bg-purple-100 transition-colors flex items-center justify-center gap-1"
              >
                <ShieldAlert className="w-4 h-4 text-purple-600" />
                <span>Admin Override Delivered</span>
              </button>
            )}
          </div>

          {/* Customer Info */}
          <div className="p-4 bg-white rounded-card border border-brand-border space-y-2 text-xs">
            <h3 className="font-bold text-brand-dark uppercase tracking-wider text-[11px]">
              Customer Information
            </h3>
            <div className="space-y-1.5">
              <p className="flex items-center gap-1.5 font-bold text-brand-dark">
                <User className="w-3.5 h-3.5 text-brand-muted" />
                {order.customer_name}
              </p>
              <div className="flex items-center gap-3">
                <a
                  href={`tel:${order.customer_phone}`}
                  className="flex items-center gap-1.5 text-brand-primary font-bold hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {order.customer_phone}
                </a>
                <a
                  href={`https://wa.me/91${order.customer_phone}?text=${encodeURIComponent('Hello! Update regarding your Dinning Zone order #' + order.order_no)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded hover:bg-emerald-200 transition-colors"
                >
                  WhatsApp Chat 💬
                </a>
              </div>
              {addressObj && (
                <div className="pt-1 border-t border-brand-border/40 space-y-1">
                  <p className="flex items-start gap-1.5 text-brand-muted">
                    <MapPin className="w-3.5 h-3.5 text-brand-muted shrink-0 mt-0.5" />
                    <span>
                      {addressObj.label}: {addressObj.line1} ({order.distance_km} km)
                    </span>
                  </p>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${order.delivery_lat},${order.delivery_lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-primary hover:underline pt-0.5"
                  >
                    <span>Open in Google Maps</span>
                    <span>↗</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
