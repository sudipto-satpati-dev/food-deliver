import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks'
import { useRiderOrdersQuery, useVerifyOtpMutation, useStartDeliveryMutation } from './hooks'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Price } from '@/components/common/Price'
import { DetailSkeleton } from '@/components/common/Skeletons'
import { ErrorState } from '@/components/common/ErrorState'
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Clock,
  KeyRound,
  ShieldCheck,
  Navigation,
  CheckSquare,
  Square,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

export const RiderOrderDetailPage: React.FC = () => {
  const { id: orderId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: orders, isLoading, isError, refetch } = useRiderOrdersQuery(user?.id)

  const verifyOtpMutation = useVerifyOtpMutation()
  const startDeliveryMutation = useStartDeliveryMutation()

  const [otpInput, setOtpInput] = useState<string>('')
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})

  const order = orders?.find((o) => o.id === orderId)

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
          message="Could not load details for this assigned delivery."
          onRetry={refetch}
        />
      </div>
    )
  }

  const addressObj = typeof order.delivery_address === 'object' ? (order.delivery_address as any) : null

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault()
    if (otpInput.length !== 4) {
      toast.error('Please enter the full 4-digit PIN.')
      return
    }

    verifyOtpMutation.mutate(
      { orderId: order.id, code: otpInput },
      {
        onSuccess: () => {
          navigate('/rider')
        },
      }
    )
  }

  const toggleCheckItem = (itemId: string) => {
    setCheckedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }))
  }

  return (
    <div className="space-y-5 max-w-xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/rider')}
            className="p-2 -ml-2 text-brand-dark hover:bg-brand-surface rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-heading text-lg font-bold text-brand-dark">
              Delivery Order #{order.order_no}
            </h1>
            <p className="text-xs text-brand-muted font-medium">
              Distance: {order.distance_km} km
            </p>
          </div>
        </div>

        <StatusBadge status={order.status} />
      </div>

      {/* Customer Contact Card */}
      <div className="p-4 bg-white rounded-card border border-brand-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm text-brand-dark">
            <User className="w-4 h-4 text-brand-primary" />
            <span>{order.customer_name}</span>
          </div>

          <a
            href={`tel:${order.customer_phone}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-btn border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span>Call Customer</span>
          </a>
        </div>

        {addressObj && (
          <div className="p-3 bg-brand-surface rounded-btn text-xs space-y-1">
            <p className="font-bold text-brand-dark flex items-center gap-1">
              <MapPin className="w-4 h-4 text-brand-primary" />
              {addressObj.label}: {addressObj.line1}
            </p>
            {addressObj.line2 && <p className="text-brand-muted">{addressObj.line2}</p>}
            {addressObj.landmark && (
              <p className="text-brand-muted italic">Landmark: {addressObj.landmark}</p>
            )}
          </div>
        )}
      </div>

      {/* Items Checklist for Rider Verification */}
      <div className="p-4 bg-white rounded-card border border-brand-border space-y-3">
        <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider flex items-center justify-between">
          <span>Package Checklist ({order.order_items?.length} Items)</span>
          <span className="text-[10px] text-brand-muted font-normal">Tap to verify</span>
        </h3>

        <div className="space-y-2 text-xs">
          {order.order_items?.map((item) => {
            const isChecked = Boolean(checkedItems[item.id])
            return (
              <div
                key={item.id}
                onClick={() => toggleCheckItem(item.id)}
                className={`p-2.5 rounded-btn border cursor-pointer transition-all flex items-start gap-2.5 ${
                  isChecked
                    ? 'bg-emerald-50/60 border-emerald-300 text-emerald-900'
                    : 'bg-white border-brand-border text-brand-dark'
                }`}
              >
                {isChecked ? (
                  <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-brand-muted shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-bold">
                    <span className="text-brand-primary mr-1">{item.qty}x</span>
                    {item.name}
                    {item.variant_name ? ` (${item.variant_name})` : ''}
                  </p>
                  {Array.isArray(item.addons) && item.addons.length > 0 && (
                    <p className="text-[11px] text-brand-muted">
                      + {(item.addons as any[]).map((a) => a.name).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Status Action & OTP Verification Form */}
      <div className="p-4 bg-white rounded-card border border-brand-border space-y-4">
        {order.status === 'ready' && (
          <button
            onClick={() => startDeliveryMutation.mutate(order.id)}
            disabled={startDeliveryMutation.isPending}
            className="w-full py-3 bg-brand-primary text-white text-sm font-bold rounded-btn shadow-soft hover:bg-brand-primary/95 transition-all flex items-center justify-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            <span>Pickup Food & Start Delivery</span>
          </button>
        )}

        {order.status === 'out_for_delivery' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-brand-primary" />
              <h3 className="font-heading font-bold text-sm text-brand-dark">
                Customer Delivery OTP Verification
              </h3>
            </div>

            <p className="text-xs text-brand-muted">
              Ask customer for their 4-digit PIN upon arrival to verify delivery handover.
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <input
                type="tel"
                maxLength={4}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                placeholder="4-digit OTP"
                className="w-full text-center text-3xl font-heading font-black tracking-[0.5em] py-3 border-2 border-brand-primary rounded-btn focus:outline-none focus:ring-4 focus:ring-brand-primary/20"
              />

              <button
                type="submit"
                disabled={verifyOtpMutation.isPending || otpInput.length !== 4}
                className="w-full py-3 bg-emerald-600 text-white font-bold text-sm rounded-btn shadow-soft hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {verifyOtpMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm Handover & Deliver</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
