import React, { useState } from 'react'
import { useActiveCouponsQuery, useValidateCouponMutation } from '@/features/menu/hooks'
import { useCartStore } from '@/stores/cart'
import { Price } from '@/components/common/Price'
import { X, Tag, Ticket, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface CouponsSheetProps {
  onClose: () => void
  onApplySuccess: (code: string, discountAmount: number) => void
}

export const CouponsSheet: React.FC<CouponsSheetProps> = ({ onClose, onApplySuccess }) => {
  const subtotal = useCartStore((state) => state.getSubtotal())
  const { data: coupons, isLoading } = useActiveCouponsQuery()
  const validateMutation = useValidateCouponMutation()

  const [inputCode, setInputCode] = useState('')

  const handleApply = async (codeToApply: string) => {
    if (!codeToApply.trim()) return toast.error('Please enter a coupon code.')

    try {
      const res = await validateMutation.mutateAsync({
        code: codeToApply.trim(),
        subtotal,
      })
      if (res && res.discount >= 0) {
        onApplySuccess(res.code, res.discount)
        toast.success(`Coupon ${res.code} applied! You save ₹${res.discount}`)
        onClose()
      }
    } catch {
      // Error toast handled by hook
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in">
      <div
        className="bg-white rounded-t-card max-w-lg w-full mx-auto max-h-[80vh] flex flex-col overflow-hidden shadow-float animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-brand-primary" />
            <h3 className="font-heading text-base font-bold text-brand-text">Offers & Coupons</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          {/* Manual Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleApply(inputCode)
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                className="w-full pl-9 pr-3 py-2 border border-brand-border rounded-btn text-xs font-mono font-bold uppercase uppercase text-brand-text"
              />
            </div>
            <button
              type="submit"
              disabled={validateMutation.isPending}
              className="px-4 py-2 rounded-btn bg-brand-primary text-white font-semibold text-xs hover:bg-brand-dark transition-colors disabled:opacity-50"
            >
              Apply
            </button>
          </form>

          {/* List of Available Coupons */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-muted">Available Coupons</h4>

            {isLoading ? (
              <p className="text-xs text-brand-muted animate-pulse">Loading active coupons...</p>
            ) : !coupons || coupons.length === 0 ? (
              <p className="text-xs text-brand-muted italic">No active coupons available right now.</p>
            ) : (
              coupons.map((coupon) => {
                const isEligible = subtotal >= coupon.min_order
                return (
                  <div
                    key={coupon.id}
                    className={`border rounded-card p-3.5 space-y-2 transition-all ${
                      isEligible ? 'border-brand-primary/30 bg-brand-primary/5' : 'border-gray-200 bg-gray-50 opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs bg-brand-primary text-white px-2.5 py-0.5 rounded shadow-subtle">
                        {coupon.code}
                      </span>
                      <button
                        onClick={() => handleApply(coupon.code)}
                        disabled={!isEligible || validateMutation.isPending}
                        className={`px-3 py-1 rounded-btn text-xs font-bold transition-colors ${
                          isEligible
                            ? 'bg-brand-primary text-white hover:bg-brand-dark'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Apply
                      </button>
                    </div>

                    <p className="text-xs text-brand-text font-medium">
                      {coupon.type === 'percent'
                        ? `Get ${coupon.value}% OFF up to ₹${coupon.max_discount || coupon.value}`
                        : `Get FLAT ₹${coupon.value} OFF`}
                    </p>

                    {coupon.description && <p className="text-[11px] text-brand-muted">{coupon.description}</p>}

                    {!isEligible && (
                      <p className="text-[11px] font-semibold text-red-500">
                        Add ₹{coupon.min_order - subtotal} more items to unlock
                      </p>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
