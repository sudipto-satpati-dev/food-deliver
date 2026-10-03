import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks'
import {
  useRiderOrdersQuery,
  useToggleRiderOnlineMutation,
  useStartDeliveryMutation,
  useVerifyOtpMutation,
} from './hooks'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Price } from '@/components/common/Price'
import { formatDateTime } from '@/lib/format'
import { ListSkeleton } from '@/components/common/Skeletons'
import { ErrorState } from '@/components/common/ErrorState'
import {
  Bike,
  Radio,
  MapPin,
  Phone,
  User,
  KeyRound,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Navigation,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

export const RiderHomePage: React.FC = () => {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { data: orders, isLoading, isError, refetch } = useRiderOrdersQuery(user?.id)

  const toggleOnlineMutation = useToggleRiderOnlineMutation()
  const startDeliveryMutation = useStartDeliveryMutation()
  const verifyOtpMutation = useVerifyOtpMutation()

  const [activeOtpOrderId, setActiveOtpOrderId] = useState<string | null>(null)
  const [otpInput, setOtpInput] = useState<string>('')

  if (!user) {
    return (
      <div className="py-12 px-4 text-center space-y-4 max-w-md mx-auto">
        <Bike className="w-12 h-12 mx-auto text-brand-muted" />
        <h2 className="font-heading text-lg font-bold text-brand-dark">Rider Login Required</h2>
        <p className="text-xs text-brand-muted">
          Log in with your rider account to view assigned deliveries.
        </p>
        <button
          onClick={() => navigate('/login?redirect=/rider')}
          className="px-6 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-btn shadow-soft"
        >
          Rider Login
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="py-4 space-y-4 max-w-xl mx-auto">
        <div className="h-10 w-full bg-brand-surface rounded-card animate-pulse" />
        <ListSkeleton count={3} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="py-6 max-w-xl mx-auto">
        <ErrorState
          title="Could not load deliveries"
          message="Failed to fetch your assigned orders."
          onRetry={refetch}
        />
      </div>
    )
  }

  const isOnline = (profile as any)?.is_online ?? true

  const activeDeliveries = (orders || []).filter(
    (o) => o.status === 'ready' || o.status === 'out_for_delivery'
  )

  const completedDeliveries = (orders || []).filter((o) => o.status === 'delivered')

  const handleToggleDuty = () => {
    toggleOnlineMutation.mutate({ riderId: user.id, isOnline: !isOnline })
  }

  const handleVerifyOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeOtpOrderId) return
    if (otpInput.length !== 4) {
      toast.error('Please enter the full 4-digit PIN.')
      return
    }

    verifyOtpMutation.mutate(
      { orderId: activeOtpOrderId, code: otpInput },
      {
        onSuccess: () => {
          setActiveOtpOrderId(null)
          setOtpInput('')
        },
      }
    )
  }

  return (
    <div className="space-y-5 max-w-xl mx-auto pb-16">
      {/* Rider Header & Duty Toggle */}
      <div className="p-4 bg-gradient-to-r from-brand-dark to-gray-900 text-white rounded-card shadow-soft flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
            <Bike className="w-6 h-6 text-brand-primary" />
          </div>
          <div>
            <h1 className="font-heading text-base font-bold">
              {profile?.full_name || 'Rider Executive'}
            </h1>
            <p className="text-[11px] text-gray-300 flex items-center gap-1">
              <Radio
                className={`w-3 h-3 ${isOnline ? 'text-emerald-400 animate-pulse' : 'text-rose-400'}`}
              />
              <span>{isOnline ? 'On Duty · Online' : 'Off Duty · Offline'}</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleDuty}
          disabled={toggleOnlineMutation.isPending}
          className={`px-3.5 py-1.5 text-xs font-extrabold rounded-full transition-all border ${
            isOnline
              ? 'bg-emerald-500 text-white border-emerald-400 shadow-soft'
              : 'bg-white/10 text-white border-white/20'
          }`}
        >
          {isOnline ? 'GO OFFLINE' : 'GO ONLINE'}
        </button>
      </div>

      {/* Stats Quick Summary */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-3 bg-white rounded-card border border-brand-border">
          <span className="text-brand-muted font-medium">Active Deliveries</span>
          <p className="text-xl font-extrabold text-amber-500 mt-0.5">
            {activeDeliveries.length}
          </p>
        </div>
        <div className="p-3 bg-white rounded-card border border-brand-border">
          <span className="text-brand-muted font-medium">Completed Today</span>
          <p className="text-xl font-extrabold text-emerald-600 mt-0.5">
            {completedDeliveries.length}
          </p>
        </div>
      </div>

      {/* Active Assigned Deliveries */}
      <div className="space-y-3">
        <h2 className="font-heading text-sm font-bold text-brand-dark flex items-center justify-between">
          <span>Active Assigned Orders ({activeDeliveries.length})</span>
          <span className="text-[11px] text-brand-muted font-normal">Realtime updates</span>
        </h2>

        {activeDeliveries.length === 0 ? (
          <div className="p-6 bg-white rounded-card border border-brand-border text-center space-y-2">
            <Bike className="w-8 h-8 text-brand-muted mx-auto" />
            <p className="text-xs font-bold text-brand-dark">No active deliveries assigned</p>
            <p className="text-[11px] text-brand-muted">
              {isOnline
                ? 'Stay online. Kitchen will assign new ready orders to you.'
                : 'Turn on duty switch above to start receiving deliveries.'}
            </p>
          </div>
        ) : (
          activeDeliveries.map((order) => {
            const addressObj = typeof order.delivery_address === 'object' ? (order.delivery_address as any) : null

            return (
              <div
                key={order.id}
                className="p-4 bg-white rounded-card border border-brand-border space-y-3 shadow-subtle hover:border-brand-primary transition-all"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-brand-border/60 pb-2">
                  <span className="font-heading font-extrabold text-sm text-brand-dark">
                    Order #{order.order_no}
                  </span>
                  <StatusBadge status={order.status} />
                </div>

                {/* Customer Info */}
                <div className="text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-brand-dark">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-brand-muted" />
                      {order.customer_name}
                    </span>
                    <a
                      href={`tel:${order.customer_phone}`}
                      className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-btn border border-emerald-200 text-[11px] hover:bg-emerald-100 transition-colors"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Call Customer</span>
                    </a>
                  </div>

                  {addressObj && (
                    <div className="p-2.5 bg-brand-surface rounded-btn text-[11px] text-brand-dark space-y-0.5">
                      <p className="font-bold flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                        {addressObj.label}: {addressObj.line1}
                      </p>
                      {addressObj.landmark && (
                        <p className="text-brand-muted italic">
                          Landmark: {addressObj.landmark}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-1 border-t border-brand-border/40 mt-1">
                        <span className="text-brand-muted font-medium">
                          Distance: {order.distance_km} km
                        </span>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${order.delivery_lat},${order.delivery_lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-brand-primary hover:underline flex items-center gap-1"
                        >
                          <span>Open Maps</span>
                          <span>↗</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment & Amount */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-brand-muted font-medium">
                    Collect: <Price amount={order.total} className="font-bold text-brand-dark" />
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-surface rounded text-brand-dark uppercase">
                    {order.payment_method === 'cod' ? '💵 Collect Cash' : '💳 Already Paid Online'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-brand-border/60">
                  {order.status === 'ready' && (
                    <button
                      onClick={() => startDeliveryMutation.mutate(order.id)}
                      disabled={startDeliveryMutation.isPending}
                      className="w-full py-2.5 bg-brand-primary text-white text-xs font-bold rounded-btn shadow-soft hover:bg-brand-primary/95 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Start Delivery (Pickup Food)</span>
                    </button>
                  )}

                  {order.status === 'out_for_delivery' && (
                    <>
                      <button
                        onClick={() => {
                          setActiveOtpOrderId(order.id)
                          setOtpInput('')
                        }}
                        className="flex-1 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-btn shadow-soft hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5"
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>Enter Customer OTP</span>
                      </button>

                      <button
                        onClick={() => navigate(`/rider/orders/${order.id}`)}
                        className="px-3 py-2.5 border border-brand-border text-brand-dark text-xs font-bold rounded-btn hover:bg-brand-surface"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Delivery OTP Keypad Modal (CRITICAL REQUIREMENT) */}
      {activeOtpOrderId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-card max-w-sm w-full p-5 space-y-4 shadow-float border border-brand-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-brand-primary" />
                <h3 className="font-heading font-bold text-base text-brand-dark">
                  Enter 4-Digit Delivery OTP
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveOtpOrderId(null)}
                className="text-brand-muted hover:text-brand-dark text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-brand-muted">
              Ask customer for the 4-digit verification code shown on their order tracking screen.
            </p>

            <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
              <input
                type="tel"
                maxLength={4}
                autoFocus
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
                    <span>Verifying OTP...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify OTP & Mark Delivered</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
