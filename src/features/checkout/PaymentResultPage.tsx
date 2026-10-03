import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, ShoppingBag, Loader2 } from 'lucide-react'
import { useCreateRazorpayOrderMutation, useVerifyRazorpayPaymentMutation } from './hooks'
import { loadRazorpayScript } from '@/lib/razorpay'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/hooks'

export const PaymentResultPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  const status = searchParams.get('status')
  const orderId = searchParams.get('order_id')
  const isSuccess = status === 'success'

  const createRzpMutation = useCreateRazorpayOrderMutation()
  const verifyRzpMutation = useVerifyRazorpayPaymentMutation()

  const handleRetryPayment = async () => {
    if (!orderId || !user) return

    try {
      const rzpData = await createRzpMutation.mutateAsync(orderId)
      const hasScript = await loadRazorpayScript()

      const options = {
        key: rzpData.key_id,
        amount: rzpData.amount, // in paise
        currency: 'INR',
        name: 'Dinning Zone',
        description: `Order #${rzpData.order_no} Payment Retry`,
        order_id: rzpData.razorpay_order_id.startsWith('order_dev') ? undefined : rzpData.razorpay_order_id,
        prefill: {
          email: user.email,
        },
        theme: {
          color: '#D94F30',
        },
        handler: async function (response: any) {
          try {
            await verifyRzpMutation.mutateAsync({
              razorpay_order_id: response.razorpay_order_id || rzpData.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature || 'mock_sig',
              order_id: orderId,
            })
            toast.success('Payment verified!')
            navigate(`/orders/${orderId}`)
          } catch {
            navigate(`/orders/${orderId}`)
          }
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
          order_id: orderId,
        })
        navigate(`/orders/${orderId}`)
      }
    } catch (err: any) {
      toast.error('Failed to launch payment retry. Please try again.')
    }
  }

  const isPending = createRzpMutation.isPending || verifyRzpMutation.isPending

  return (
    <div className="py-12 px-4 text-center max-w-md mx-auto space-y-6">
      {isSuccess ? (
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-soft animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>
      ) : (
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-soft">
          <XCircle className="w-10 h-10" />
        </div>
      )}

      <div>
        <h1 className="font-heading text-xl font-bold text-brand-dark">
          {isSuccess ? 'Payment Successful!' : 'Payment Pending / Cancelled'}
        </h1>
        <p className="text-xs text-brand-muted mt-1.5 max-w-xs mx-auto">
          {isSuccess
            ? 'Your payment was verified successfully and your order has been sent to the kitchen.'
            : 'Your payment was not completed. You can retry paying online now or check your order tracking.'}
        </p>
      </div>

      <div className="pt-2 flex flex-col gap-2.5 max-w-xs mx-auto">
        {!isSuccess && orderId && (
          <button
            onClick={handleRetryPayment}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-3 bg-brand-primary text-white text-xs font-bold rounded-btn shadow-soft hover:bg-brand-primary/95 transition-all disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            <span>Retry Payment Now</span>
          </button>
        )}

        {orderId ? (
          <button
            onClick={() => navigate(`/orders/${orderId}`)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-surface text-brand-dark border border-brand-border text-xs font-bold rounded-btn hover:bg-brand-surface/80 transition-all"
          >
            <span>Track Order Status</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => navigate('/orders')}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-btn shadow-soft"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Go to My Orders</span>
          </button>
        )}
      </div>
    </div>
  )
}
