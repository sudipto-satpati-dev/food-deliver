import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCartStore } from '@/stores/cart'
import { useSettingsQuery } from '@/features/admin/hooks'
import { CouponsSheet } from './CouponsSheet'
import { EmptyState } from '@/components/common/EmptyState'
import { VegDot } from '@/components/common/VegDot'
import { Price } from '@/components/common/Price'
import { BRAND_CONFIG } from '@/config/brand'
import { Plus, Minus, Trash2, Tag, Check, ArrowRight, ShieldCheck } from 'lucide-react'

export const CartPage: React.FC = () => {
  const navigate = useNavigate()
  const items = useCartStore((state) => state.items)
  const updateQty = useCartStore((state) => state.updateQty)
  const removeItem = useCartStore((state) => state.removeItem)
  const getSubtotal = useCartStore((state) => state.getSubtotal)
  const couponCode = useCartStore((state) => state.couponCode)
  const setCouponCode = useCartStore((state) => state.setCouponCode)

  const { data: settings } = useSettingsQuery()

  const [appliedDiscount, setAppliedDiscount] = useState<number>(0)
  const [isCouponsSheetOpen, setIsCouponsSheetOpen] = useState(false)
  const [orderNotes, setOrderNotes] = useState('')

  const subtotal = getSubtotal()

  // Bill calculations preview
  const discount = couponCode ? appliedDiscount : 0
  const packagingFee = settings?.packaging_fee || 0
  const taxPercent = settings?.tax_percent || 0
  const taxAmount = Math.round((subtotal - discount) * (taxPercent / 100) * 100) / 100
  const estimatedDeliveryFee = settings?.delivery_fee_tiers && Array.isArray(settings.delivery_fee_tiers) && settings.delivery_fee_tiers.length > 0
    ? (settings.delivery_fee_tiers[0] as { fee: number }).fee
    : 20

  const total = Math.max(0, subtotal - discount + packagingFee + taxAmount + estimatedDeliveryFee)

  const handleApplyCouponSuccess = (code: string, discountAmount: number) => {
    setCouponCode(code)
    setAppliedDiscount(discountAmount)
  }

  const handleRemoveCoupon = () => {
    setCouponCode(null)
    setAppliedDiscount(0)
  }

  if (items.length === 0) {
    return (
      <div className="py-8">
        <EmptyState
          title="Your cart is empty"
          description="Looks like you haven't added any delicious dishes yet."
          imageSrc="/banners/cart-img.png"
          actionLabel="Browse Menu"
          onAction={() => navigate('/menu')}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-brand-text">Your Cart</h2>
          <p className="text-xs text-brand-muted">{BRAND_CONFIG.name}</p>
        </div>
        <Link to="/menu" className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Add more items
        </Link>
      </div>

      {/* Cart Items List */}
      <div className="bg-white rounded-card border border-brand-border divide-y divide-gray-100 shadow-subtle overflow-hidden">
        {items.map((item) => (
          <div key={item.lineKey} className="p-4 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 flex-1 min-w-0">
              <VegDot isVeg={item.isVeg} size="sm" className="mt-1 shrink-0" />
              <div className="space-y-1 min-w-0">
                <h4 className="font-heading text-xs font-bold text-brand-text truncate">{item.name}</h4>
                {item.variantName && (
                  <span className="text-[11px] text-brand-muted block font-medium">Option: {item.variantName}</span>
                )}
                {item.addons && item.addons.length > 0 && (
                  <span className="text-[11px] text-brand-muted block">
                    Addons: {item.addons.map((a) => a.name).join(', ')}
                  </span>
                )}
                {item.notes && <span className="text-[11px] text-amber-800 italic block">Note: "{item.notes}"</span>}
                <Price amount={item.unitPrice * item.qty} className="text-xs font-bold text-brand-primary block pt-0.5" />
              </div>
            </div>

            {/* Qty Stepper & Remove */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center border border-gray-300 rounded-btn bg-gray-50">
                <button
                  onClick={() => updateQty(item.lineKey, -1)}
                  className="p-1.5 text-brand-text hover:bg-gray-200 rounded-l-btn transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center text-xs font-bold text-brand-text">{item.qty}</span>
                <button
                  onClick={() => updateQty(item.lineKey, 1)}
                  className="p-1.5 text-brand-text hover:bg-gray-200 rounded-r-btn transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => removeItem(item.lineKey)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Special Instructions Note */}
      <div className="bg-white rounded-card p-4 border border-brand-border shadow-subtle space-y-2">
        <label className="text-xs font-semibold text-brand-text block">Cooking Instructions / Order Notes</label>
        <input
          type="text"
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          placeholder="e.g. Please deliver at back door, less spicy"
          className="w-full p-2.5 rounded-btn border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
        />
      </div>

      {/* Coupon Strip */}
      <div className="bg-white rounded-card p-4 border border-brand-border shadow-subtle flex items-center justify-between">
        {couponCode ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <span className="font-mono font-bold text-xs text-emerald-800">{couponCode} applied</span>
                <span className="text-xs text-emerald-600 block font-semibold">You save ₹{appliedDiscount}</span>
              </div>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-xs font-semibold text-red-500 hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-brand-primary" />
              <span className="text-xs font-semibold text-brand-text">Apply Coupon Code</span>
            </div>
            <button
              onClick={() => setIsCouponsSheetOpen(true)}
              className="px-3.5 py-1.5 rounded-btn bg-brand-primary/10 text-brand-primary font-bold text-xs hover:bg-brand-primary hover:text-white transition-colors"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Bill Details Card */}
      <div className="bg-white rounded-card p-4 border border-brand-border shadow-subtle space-y-3">
        <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-brand-muted border-b border-gray-100 pb-2">
          Bill Details
        </h3>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between text-brand-text">
            <span>Item Subtotal</span>
            <Price amount={subtotal} />
          </div>

          {couponCode && (
            <div className="flex items-center justify-between text-emerald-600 font-medium">
              <span>Coupon Discount</span>
              <span>-₹{appliedDiscount}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-brand-text">
            <span>Estimated Delivery Fee</span>
            <Price amount={estimatedDeliveryFee} />
          </div>

          {packagingFee > 0 && (
            <div className="flex items-center justify-between text-brand-text">
              <span>Packaging Charge</span>
              <Price amount={packagingFee} />
            </div>
          )}

          {taxPercent > 0 && (
            <div className="flex items-center justify-between text-brand-text">
              <span>Taxes & GST ({taxPercent}%)</span>
              <Price amount={taxAmount} />
            </div>
          )}

          <div className="flex items-center justify-between text-sm font-bold text-brand-text border-t border-gray-200 pt-2.5">
            <span>Grand Total</span>
            <Price amount={total} className="text-brand-primary text-base font-bold" />
          </div>
        </div>
      </div>

      {/* Guarantee Note */}
      <div className="flex items-center gap-2 text-[11px] text-brand-muted justify-center">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Fresh food prepared to order & delivered hot within 5 km</span>
      </div>

      {/* Floating Sticky Checkout Bar */}
      <div className="fixed bottom-16 left-0 right-0 z-30 p-4 max-w-lg mx-auto bg-white/95 border-t border-brand-border shadow-card">
        <button
          onClick={() => navigate('/checkout')}
          className="w-full py-3.5 rounded-btn bg-brand-primary text-white font-semibold text-sm hover:bg-brand-dark transition-all shadow-subtle flex items-center justify-between px-5 active:scale-[0.99]"
        >
          <div className="flex items-center gap-2">
            <span>Proceed to checkout</span>
            <ArrowRight className="w-4 h-4" />
          </div>
          <Price amount={total} className="text-white font-bold text-base" />
        </button>
      </div>

      {/* Coupons Bottom Sheet Modal */}
      {isCouponsSheetOpen && (
        <CouponsSheet
          onClose={() => setIsCouponsSheetOpen(false)}
          onApplySuccess={handleApplyCouponSuccess}
        />
      )}
    </div>
  )
}
