import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react'

export const PaymentResultPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const status = searchParams.get('status')
  const orderId = searchParams.get('order_id')
  const isSuccess = status !== 'failed'

  return (
    <div className="py-12 px-4 text-center max-w-md mx-auto space-y-5">
      {isSuccess ? (
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-soft">
          <CheckCircle2 className="w-10 h-10" />
        </div>
      ) : (
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-soft">
          <XCircle className="w-10 h-10" />
        </div>
      )}

      <div>
        <h1 className="font-heading text-xl font-bold text-brand-dark">
          {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
        </h1>
        <p className="text-xs text-brand-muted mt-1">
          {isSuccess
            ? 'Your payment was processed and order sent to restaurant kitchen.'
            : 'We could not process your payment. You can try again from order details.'}
        </p>
      </div>

      <div className="pt-4 flex justify-center gap-3">
        {orderId ? (
          <button
            onClick={() => navigate(`/orders/${orderId}`)}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-btn shadow-soft hover:bg-brand-primary/95 transition-all"
          >
            <span>View Order Details</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-btn shadow-soft"
          >
            <span>My Orders</span>
          </button>
        )}
      </div>
    </div>
  )
}
