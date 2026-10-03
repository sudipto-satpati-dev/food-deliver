import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  useOrderDetail,
  useDeliveryOtp,
  useOrderRiderInfo,
  useCancelOrderMutation,
} from './hooks'
import { useSettingsQuery } from '@/features/admin/hooks'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Price } from '@/components/common/Price'
import { formatDateTime } from '@/lib/format'
import { DetailSkeleton } from '@/components/common/Skeletons'
import { ErrorState } from '@/components/common/ErrorState'
import {
  ArrowLeft,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  KeyRound,
  Bike,
  HelpCircle,
  RotateCcw,
  Star,
  CreditCard,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCartStore } from '@/stores/cart'
import { useCreateRazorpayOrderMutation, useVerifyRazorpayPaymentMutation } from '@/features/checkout/hooks'
import { loadRazorpayScript } from '@/lib/razorpay'
import { useAuth } from '@/features/auth/hooks'

export const OrderDetailPage: React.FC = () => {
  const { id: orderId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addItem, clearCart } = useCartStore()

  const { data: order, isLoading, isError, refetch } = useOrderDetail(orderId)
  const { data: settings } = useSettingsQuery()
  const cancelMutation = useCancelOrderMutation()

  const isOutForDelivery =
    order?.status === 'out_for_delivery' || order?.status === 'ready'
  const { data: otpCode } = useDeliveryOtp(orderId, isOutForDelivery)

  const hasRider = Boolean(order?.rider_id)
  const { data: riderInfo } = useOrderRiderInfo(orderId, hasRider)

  const { user } = useAuth()
  const createRzpMutation = useCreateRazorpayOrderMutation()
  const verifyRzpMutation = useVerifyRazorpayPaymentMutation()

  if (isLoading) {
    return (
      <div className="py-4 space-y-4 max-w-xl mx-auto">
        <DetailSkeleton />
      </div>
    )
  }

  if (isError || !order) {
    return (
      <div className="py-8 max-w-xl mx-auto">
        <ErrorState
          title="Order not found"
          message="Could not load the requested order details."
          onRetry={refetch}
        />
      </div>
    )
  }

  const isCancelable = order.status === 'placed' || order.status === 'pending_payment'
  const addressObj = typeof order.delivery_address === 'object' ? (order.delivery_address as any) : null

  const steps = [
    { key: 'placed', label: 'Order Placed' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'preparing', label: 'Preparing Food' },
    { key: 'out_for_delivery', label: 'Out for Delivery' },
    { key: 'delivered', label: 'Delivered' },
  ]

  const statusOrderIndexMap: Record<string, number> = {
    pending_payment: 0,
    placed: 1,
    accepted: 2,
    preparing: 3,
    ready: 3,
    out_for_delivery: 4,
    delivered: 5,
    cancelled: -1,
    rejected: -1,
  }

  const currentStepIndex = statusOrderIndexMap[order.status] ?? 1
  const isCancelledOrRejected = order.status === 'cancelled' || order.status === 'rejected'

  const handleCancel = () => {
    if (confirm(`Are you sure you want to cancel Order #${order.order_no}?`)) {
      cancelMutation.mutate({ orderId: order.id, reason: 'Cancelled by user' })
    }
  }

  const handleReorder = () => {
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

  const handlePayNow = async () => {
    if (!order || !user) return
    try {
      const rzpData = await createRzpMutation.mutateAsync(order.id)
      const hasScript = await loadRazorpayScript()

      const rawPhone = order.customer_phone || user.user_metadata?.phone || ''
      const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10) || '9876543210'

      const options = {
        key: rzpData.key_id,
        amount: Math.round(Number(order.total) * 100),
        currency: 'INR',
        name: settings?.restaurant_name || 'Dinning Zone',
        description: `Order #${order.order_no} Payment`,
        order_id: rzpData.razorpay_order_id?.startsWith('order_dev') ? undefined : rzpData.razorpay_order_id,
        prefill: {
          name: order.customer_name || user.email || 'Customer',
          contact: cleanPhone,
          email: user.email || '',
        },
        theme: { color: '#D94F30' },
        config: {
          display: {
            blocks: {
              banks: {
                name: 'Pay via UPI / QR / Google Pay / PhonePe',
                instruments: [
                  {
                    method: 'upi',
                  },
                ],
              },
            },
            sequence: ['block.banks'],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        handler: async function (response: any) {
          await verifyRzpMutation.mutateAsync({
            razorpay_order_id: response.razorpay_order_id || rzpData.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature || 'mock_sig',
            order_id: order.id,
          })
          refetch()
          toast.success('Payment verified successfully!')
        },
        modal: {
          ondismiss: function () {
            toast.info('Payment window closed.')
          },
        },
      }

      if (hasScript && window.Razorpay) {
        const rzp = new window.Razorpay(options)
        rzp.open()
      } else {
        toast.info('Simulating payment completion (Dev mode)...')
        await verifyRzpMutation.mutateAsync({
          razorpay_order_id: rzpData.razorpay_order_id,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: 'mock_sig',
          order_id: order.id,
        })
        refetch()
        toast.success('Payment completed!')
      }
    } catch (err: any) {
      toast.error('Could not open payment gateway.')
    }
  }

  return (
    <div className="space-y-5 pb-12 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/orders')}
            className="p-2 -ml-2 text-brand-dark hover:bg-brand-surface rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-heading text-lg font-bold text-brand-dark">
              Order #{order.order_no}
            </h1>
            <p className="text-xs text-brand-muted flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDateTime(order.placed_at)}
            </p>
          </div>
        </div>

        <StatusBadge status={order.status} />
      </div>

      {/* Pending Payment Pay Now Banner */}
      {order.status === 'pending_payment' && order.payment_method === 'online' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-card flex items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-amber-600" />
              Payment Pending
            </p>
            <p className="text-amber-700 mt-0.5">
              Complete your online payment to send order to the kitchen.
            </p>
          </div>
          <button
            onClick={handlePayNow}
            disabled={createRzpMutation.isPending || verifyRzpMutation.isPending}
            className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-btn shadow-soft hover:bg-brand-primary/95 transition-all shrink-0 flex items-center gap-1"
          >
            {createRzpMutation.isPending || verifyRzpMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CreditCard className="w-3.5 h-3.5" />
            )}
            <span>Pay Now</span>
          </button>
        </div>
      )}

      {/* Cancelled / Rejected Warning Banner */}
      {isCancelledOrRejected && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-card text-xs text-rose-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">
              Order {order.status === 'cancelled' ? 'Cancelled' : 'Rejected by Kitchen'}
            </p>
            <p className="mt-1 text-rose-700">
              {order.notes ? `Reason: ${order.notes}` : 'This order will not be fulfilled.'}
            </p>
          </div>
        </div>
      )}

      {/* Progress Stepper (Only for active orders) */}
      {!isCancelledOrRejected && (
        <div className="p-4 bg-white rounded-card border border-brand-border space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-dark uppercase tracking-wider">
              Live Order Progress
            </span>
            {order.estimated_minutes && order.status !== 'delivered' && (
              <span className="text-xs font-bold text-brand-primary flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Est. ~{order.estimated_minutes} mins
              </span>
            )}
          </div>

          <div className="relative flex items-center justify-between">
            {/* Background Line */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-brand-surface -z-0" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand-primary transition-all duration-500 -z-0"
              style={{
                width: `${Math.min(100, (currentStepIndex - 1) * 25)}%`,
              }}
            />

            {steps.map((step, idx) => {
              const stepNum = idx + 1
              const isDone = currentStepIndex > stepNum
              const isCurrent = currentStepIndex === stepNum

              return (
                <div key={step.key} className="flex flex-col items-center z-10">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isDone
                        ? 'bg-brand-primary text-white'
                        : isCurrent
                        ? 'bg-brand-primary text-white ring-4 ring-brand-primary/20 scale-110 animate-pulse'
                        : 'bg-white border-2 border-brand-border text-brand-muted'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : stepNum}
                  </div>
                  <span
                    className={`text-[10px] font-semibold mt-1 text-center max-w-[60px] leading-tight ${
                      isCurrent
                        ? 'text-brand-primary font-bold'
                        : isDone
                        ? 'text-brand-dark'
                        : 'text-brand-muted'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Delivery Verification OTP Card (CRITICAL SECURITY RULE) */}
      {(order.status === 'out_for_delivery' || order.status === 'ready') && otpCode && (
        <div className="p-4 bg-gradient-to-r from-brand-primary to-brand-accent text-white rounded-card shadow-soft space-y-2">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-300 animate-bounce" />
            <span className="text-xs font-extrabold uppercase tracking-wider">
              Delivery Verification OTP
            </span>
          </div>

          <div className="flex justify-center gap-3 py-2">
            {otpCode.split('').map((digit, index) => (
              <span
                key={index}
                className="w-11 h-12 bg-white text-brand-dark font-heading text-2xl font-black rounded-lg flex items-center justify-center shadow-md border-2 border-white"
              >
                {digit}
              </span>
            ))}
          </div>

          <p className="text-center text-[11px] font-medium text-white/90">
            🔒 Share this 4-digit PIN with your rider when food is handed over to you.
          </p>
        </div>
      )}

      {/* Assigned Rider Info Card */}
      {riderInfo && (
        <div className="p-4 bg-white rounded-card border border-brand-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-surface rounded-full flex items-center justify-center text-brand-primary border border-brand-border">
              {riderInfo.avatar_url ? (
                <img
                  src={riderInfo.avatar_url}
                  alt={riderInfo.full_name || 'Rider'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <Bike className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-brand-dark">
                {riderInfo.full_name || 'Assigned Rider'}
              </p>
              <p className="text-[11px] text-brand-muted">Your Delivery Executive</p>
            </div>
          </div>

          {riderInfo.phone && (
            <a
              href={`tel:${riderInfo.phone}`}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-btn border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Rider</span>
            </a>
          )}
        </div>
      )}

      {/* Items Breakdown Table */}
      <div className="p-4 bg-white rounded-card border border-brand-border space-y-3">
        <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider">
          Ordered Items
        </h3>

        <div className="space-y-2 divide-y divide-brand-border/60">
          {order.order_items?.map((item) => (
            <div key={item.id} className="pt-2 first:pt-0 flex justify-between items-start text-xs">
              <div className="flex-1 pr-2">
                <p className="font-bold text-brand-dark">
                  <span className="text-brand-primary mr-1">{item.qty}x</span>
                  {item.name}
                  {item.variant_name && (
                    <span className="text-brand-muted font-normal ml-1">
                      ({item.variant_name})
                    </span>
                  )}
                </p>

                {/* Addons */}
                {Array.isArray(item.addons) && item.addons.length > 0 && (
                  <p className="text-[11px] text-brand-muted mt-0.5">
                    + {(item.addons as any[]).map((a) => a.name).join(', ')}
                  </p>
                )}

                {item.notes && (
                  <p className="text-[11px] text-brand-muted italic mt-0.5">
                    Note: "{item.notes}"
                  </p>
                )}
              </div>

              <Price amount={item.line_total} className="font-bold text-brand-dark shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Bill & Cost Breakdown */}
      <div className="p-4 bg-white rounded-card border border-brand-border space-y-2 text-xs">
        <h3 className="font-bold text-brand-dark uppercase tracking-wider text-[11px] mb-2">
          Bill Details
        </h3>

        <div className="space-y-1.5 text-brand-muted">
          <div className="flex justify-between">
            <span>Item Subtotal</span>
            <Price amount={order.subtotal} className="text-brand-dark font-medium" />
          </div>

          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Coupon Discount ({order.coupon_code})</span>
              <span>-<Price amount={order.discount} /></span>
            </div>
          )}

          <div className="flex justify-between">
            <span>Delivery Fee</span>
            {order.delivery_fee === 0 ? (
              <span className="text-emerald-600 font-bold">FREE</span>
            ) : (
              <Price amount={order.delivery_fee} className="text-brand-dark font-medium" />
            )}
          </div>

          <div className="flex justify-between">
            <span>Packaging Fee</span>
            <Price amount={order.packaging_fee} className="text-brand-dark font-medium" />
          </div>

          <div className="flex justify-between">
            <span>Taxes & GST</span>
            <Price amount={order.tax} className="text-brand-dark font-medium" />
          </div>
        </div>

        <div className="pt-2 border-t border-brand-border flex justify-between items-center text-sm font-bold text-brand-dark">
          <span>Total Paid</span>
          <Price amount={order.total} className="text-base text-brand-primary" />
        </div>
      </div>

      {/* Delivery Address & Payment Info */}
      <div className="p-4 bg-white rounded-card border border-brand-border space-y-3 text-xs">
        <div className="flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-brand-dark">Delivery Location</p>
            <p className="text-brand-muted mt-0.5">
              {addressObj?.line1}
              {addressObj?.line2 ? `, ${addressObj.line2}` : ''}
            </p>
            <p className="text-brand-muted text-[11px] mt-0.5">
              Contact: {order.customer_name} ({order.customer_phone})
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-brand-border/60 pt-2.5">
          <span className="text-brand-muted">Payment Method:</span>
          <span className="font-bold text-brand-dark uppercase">
            {order.payment_method === 'cod' ? '💵 Cash on Delivery' : '💳 Online Payment'} (
            {order.payment_status})
          </span>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        {isCancelable && (
          <button
            onClick={handleCancel}
            disabled={cancelMutation.isPending}
            className="flex-1 py-2.5 px-4 border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold rounded-btn hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5"
          >
            <XCircle className="w-4 h-4" />
            <span>Cancel Order</span>
          </button>
        )}

        {order.status === 'delivered' && (
          <>
            <button
              onClick={() => navigate(`/orders/${order.id}/rate`)}
              className="flex-1 py-2.5 px-4 bg-amber-500 text-white text-xs font-bold rounded-btn shadow-soft hover:bg-amber-600 transition-colors flex items-center justify-center gap-1.5"
            >
              <Star className="w-4 h-4" />
              <span>Rate Order</span>
            </button>

            <button
              onClick={handleReorder}
              className="flex-1 py-2.5 px-4 bg-brand-surface text-brand-dark text-xs font-bold rounded-btn border border-brand-border hover:bg-brand-surface/80 transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reorder Items</span>
            </button>
          </>
        )}

        {settings?.support_phone && (
          <a
            href={`tel:${settings.support_phone}`}
            className="py-2.5 px-4 border border-brand-border bg-white text-brand-dark text-xs font-bold rounded-btn hover:bg-brand-surface transition-colors flex items-center justify-center gap-1.5"
          >
            <HelpCircle className="w-4 h-4 text-brand-muted" />
            <span>Support</span>
          </a>
        )}
      </div>
    </div>
  )
}
