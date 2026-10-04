import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { ListSkeleton } from '@/components/common/Skeletons'
import { ErrorState } from '@/components/common/ErrorState'
import { OrderStatus } from '@/types/database'
import {
  Radio,
  CheckCircle2,
  XCircle,
  Clock,
  ChefHat,
  Bike,
  MapPin,
  Phone,
  User,
  Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/hooks'
import { PushNotificationPrompt } from '@/components/common/PushNotificationPrompt'

export const AdminOrdersPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: orders, isLoading, isError, refetch } = useAdminOrdersQuery()
  const { data: riders } = useAdminRidersQuery()

  const updateStatusMutation = useUpdateOrderStatusMutation()
  const assignRiderMutation = useAssignRiderMutation()
  const adminMarkDeliveredMutation = useAdminMarkDeliveredMutation()

  const [selectedTab, setSelectedTab] = useState<string>('all')
  const [selectedRiderMap, setSelectedRiderMap] = useState<Record<string, string>>({})

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-5xl mx-auto">
        <div className="h-8 w-48 bg-brand-surface rounded animate-pulse" />
        <ListSkeleton count={5} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <ErrorState
          title="Could not load orders"
          message="Failed to fetch orders from server."
          onRetry={refetch}
        />
      </div>
    )
  }

  const placedCount = orders?.filter((o) => o.status === 'placed').length || 0

  const filteredOrders = (orders || []).filter((o) => {
    if (selectedTab === 'all') return o.status !== 'pending_payment'
    if (selectedTab === 'placed') return o.status === 'placed'
    if (selectedTab === 'accepted') return o.status === 'accepted'
    if (selectedTab === 'preparing') return o.status === 'preparing'
    if (selectedTab === 'ready') return o.status === 'ready'
    if (selectedTab === 'out_for_delivery') return o.status === 'out_for_delivery'
    if (selectedTab === 'completed')
      return o.status === 'delivered' || o.status === 'cancelled' || o.status === 'rejected'
    if (selectedTab === 'pending_payment') return o.status === 'pending_payment'
    return true
  })

  const handleUpdateStatus = (orderId: string, status: OrderStatus) => {
    updateStatusMutation.mutate({ orderId, status })
  }

  const handleReject = (orderId: string, orderNo: number) => {
    const reason = prompt(`Enter reason for rejecting Order #${orderNo}:`, 'Kitchen busy / Item out of stock')
    if (reason !== null) {
      updateStatusMutation.mutate({ orderId, status: 'rejected', reason })
    }
  }

  const handleSendOutForDelivery = (orderId: string) => {
    const riderId = selectedRiderMap[orderId]
    if (!riderId) {
      toast.error('Please select a rider to assign.')
      return
    }

    assignRiderMutation.mutate(
      { orderId, riderId },
      {
        onSuccess: () => {
          updateStatusMutation.mutate({ orderId, status: 'out_for_delivery' })
        },
      }
    )
  }

  const handleAdminOverrideDelivered = (orderId: string, orderNo: number) => {
    if (confirm(`Override and mark Order #${orderNo} as DELIVERED?`)) {
      adminMarkDeliveredMutation.mutate({ orderId, reason: 'Admin override' })
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-dark">Live Orders Kitchen</h1>
          <p className="text-xs text-brand-muted">
            Manage incoming orders, kitchen preparation & rider assignments
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 text-xs font-bold shadow-soft">
          <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span>REALTIME AUDIO ALERTS ACTIVE</span>
        </div>
      </div>

      <PushNotificationPrompt userId={user?.id} />

      {/* Tabs Bar */}
      <div className="flex overflow-x-auto no-scrollbar border-b border-brand-border gap-2 pb-1">
        {[
          { id: 'all', label: 'Kitchen Orders', count: orders?.filter((o) => o.status !== 'pending_payment').length },
          { id: 'placed', label: 'New / Placed', count: placedCount, highlight: placedCount > 0 },
          { id: 'accepted', label: 'Accepted', count: orders?.filter((o) => o.status === 'accepted').length },
          { id: 'preparing', label: 'Preparing', count: orders?.filter((o) => o.status === 'preparing').length },
          { id: 'ready', label: 'Ready for Pickup', count: orders?.filter((o) => o.status === 'ready').length },
          { id: 'out_for_delivery', label: 'Out for Delivery', count: orders?.filter((o) => o.status === 'out_for_delivery').length },
          { id: 'completed', label: 'Completed / Cancelled' },
          { id: 'pending_payment', label: 'Unpaid Attempts', count: orders?.filter((o) => o.status === 'pending_payment').length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-btn whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 ${
              selectedTab === tab.id
                ? 'border-brand-primary text-brand-primary bg-brand-primary/5'
                : 'border-transparent text-brand-muted hover:text-brand-dark'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-1.5 py-0.2 text-[10px] rounded-full ${
                  tab.highlight
                    ? 'bg-rose-500 text-white font-black animate-pulse'
                    : 'bg-brand-surface text-brand-dark font-semibold'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-card border border-brand-border space-y-2">
          <ChefHat className="w-10 h-10 mx-auto text-brand-muted" />
          <h3 className="font-heading text-sm font-bold text-brand-dark">No orders in this tab</h3>
          <p className="text-xs text-brand-muted">Orders will automatically appear here live.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map((order) => {
            const addressObj = typeof order.delivery_address === 'object' ? (order.delivery_address as any) : null
            const isNewPlaced = order.status === 'placed'

            return (
              <div
                key={order.id}
                className={`p-4 rounded-card border bg-white space-y-3 shadow-subtle transition-all ${
                  isNewPlaced
                    ? 'border-amber-400 ring-2 ring-amber-400/30 bg-amber-50/20'
                    : 'border-brand-border'
                }`}
              >
                {/* Order Top Bar */}
                <div className="flex items-center justify-between border-b border-brand-border/60 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-black text-base text-brand-dark">
                        Order #{order.order_no}
                      </span>
                      {isNewPlaced && (
                        <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded-full animate-bounce">
                          NEW
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-brand-muted flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(order.placed_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={order.status} />
                    <button
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                      className="p-1.5 text-brand-muted hover:text-brand-primary rounded-btn hover:bg-brand-surface transition-colors"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="text-xs text-brand-dark space-y-1">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-brand-muted" />
                      {order.customer_name}
                    </span>
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://wa.me/91${order.customer_phone}?text=${encodeURIComponent('Hello! Update regarding your Dinning Zone order #' + order.order_no)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded hover:bg-emerald-200 transition-colors"
                      >
                        WhatsApp
                      </a>
                      <a
                        href={`tel:${order.customer_phone}`}
                        className="flex items-center gap-1 text-brand-primary font-bold hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {order.customer_phone}
                      </a>
                    </div>
                  </div>

                  {addressObj && (
                    <div className="flex items-center justify-between text-[11px] text-brand-muted">
                      <p className="flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-brand-muted shrink-0" />
                        <span className="truncate">
                          {addressObj.line1} ({order.distance_km} km)
                        </span>
                      </p>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${order.delivery_lat},${order.delivery_lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-brand-primary hover:underline shrink-0 ml-2"
                      >
                        Open Maps ↗
                      </a>
                    </div>
                  )}
                </div>

                {/* Items Summary Table */}
                <div className="p-2.5 bg-brand-surface/60 rounded-btn text-xs space-y-1">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="flex justify-between font-medium">
                      <span>
                        <span className="font-bold text-brand-primary mr-1">{item.qty}x</span>
                        {item.name}
                        {item.variant_name ? ` (${item.variant_name})` : ''}
                      </span>
                      <Price amount={item.line_total} className="text-brand-dark" />
                    </div>
                  ))}
                  {order.notes && (
                    <p className="text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded font-semibold italic mt-1">
                      Kitchen Note: "{order.notes}"
                    </p>
                  )}
                </div>

                {/* Amount & Payment Method */}
                <div className="flex items-center justify-between text-xs font-bold pt-1">
                  <span className="text-brand-dark flex items-center gap-1">
                    Total: <Price amount={order.total} className="text-sm text-brand-primary" />
                  </span>
                  <span className="text-[10px] uppercase px-2 py-0.5 bg-brand-surface rounded text-brand-dark">
                    {order.payment_method === 'cod' ? '💵 COD' : '💳 Online Paid'}
                  </span>
                </div>

                {/* Status Action Controls */}
                <div className="border-t border-brand-border/60 pt-3 space-y-2">
                  {/* Step 1: Placed -> Accept or Reject */}
                  {order.status === 'placed' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'accepted')}
                        disabled={updateStatusMutation.isPending}
                        className="flex-1 py-2 bg-emerald-600 text-white text-xs font-bold rounded-btn shadow-soft hover:bg-emerald-700 transition-all flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Accept Order</span>
                      </button>

                      <button
                        onClick={() => handleReject(order.id, order.order_no)}
                        disabled={updateStatusMutation.isPending}
                        className="py-2 px-3 border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold rounded-btn hover:bg-rose-100 transition-all flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}

                  {/* Step 2: Accepted -> Start Preparing */}
                  {order.status === 'accepted' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'preparing')}
                      disabled={updateStatusMutation.isPending}
                      className="w-full py-2 bg-amber-500 text-white text-xs font-bold rounded-btn shadow-soft hover:bg-amber-600 transition-all flex items-center justify-center gap-1.5"
                    >
                      <ChefHat className="w-4 h-4" />
                      <span>Start Preparing Food</span>
                    </button>
                  )}

                  {/* Step 3: Preparing -> Mark Food Ready */}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'ready')}
                      disabled={updateStatusMutation.isPending}
                      className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-btn shadow-soft hover:bg-indigo-700 transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark Food Ready for Pickup</span>
                    </button>
                  )}

                  {/* Step 4: Ready -> Assign Rider & Send Out for Delivery */}
                  {order.status === 'ready' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Bike className="w-4 h-4 text-brand-primary shrink-0" />
                        <select
                          value={selectedRiderMap[order.id] || ''}
                          onChange={(e) =>
                            setSelectedRiderMap({ ...selectedRiderMap, [order.id]: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 text-xs border border-brand-border rounded-btn focus:outline-none focus:border-brand-primary"
                        >
                          <option value="">-- Select Active Rider --</option>
                          {riders?.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.full_name || 'Rider'} ({r.phone}) {r.is_online ? '🟢 Online' : '🔴 Offline'}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => handleSendOutForDelivery(order.id)}
                        disabled={assignRiderMutation.isPending || updateStatusMutation.isPending}
                        className="w-full py-2 bg-brand-primary text-white text-xs font-bold rounded-btn shadow-soft hover:bg-brand-primary/95 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Bike className="w-4 h-4" />
                        <span>Send Out for Delivery</span>
                      </button>
                    </div>
                  )}

                  {/* Step 5: Out for Delivery -> Admin Override Delivered */}
                  {order.status === 'out_for_delivery' && (
                    <div className="flex items-center justify-between gap-2 bg-purple-50 p-2 rounded-btn text-xs text-purple-900 border border-purple-200">
                      <span className="font-semibold flex items-center gap-1">
                        <Bike className="w-4 h-4 text-purple-600" />
                        Rider On the Way
                      </span>

                      <button
                        onClick={() => handleAdminOverrideDelivered(order.id, order.order_no)}
                        disabled={adminMarkDeliveredMutation.isPending}
                        className="px-2.5 py-1 bg-purple-600 text-white font-bold rounded text-[11px] hover:bg-purple-700 transition-colors"
                      >
                        Override Delivered
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
