import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks'
import { useCartStore } from '@/stores/cart'
import { useUserAddresses } from '@/features/address/hooks'
import { useSettingsQuery } from '@/features/admin/hooks'
import { useValidateCouponQuery } from '@/features/menu/hooks'
import {
  usePlaceOrderMutation,
  useCreateRazorpayOrderMutation,
  useVerifyRazorpayPaymentMutation,
} from './hooks'
import { calculateHaversineDistanceKm } from '@/lib/geo'
import { Price } from '@/components/common/Price'
import {
  MapPin,
  Plus,
  CheckCircle2,
  CreditCard,
  Banknote,
  ChevronRight,
  ShieldCheck,
  FileText,
  Loader2,
  ShoppingBag,
  Home,
  Briefcase,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

declare global {
  interface Window {
    Razorpay: any
  }
}

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { items, couponCode, getSubtotal } = useCartStore()

  const { data: addresses, isLoading: isLoadingAddresses } = useUserAddresses(user?.id)
  const { data: settings } = useSettingsQuery()

  const subtotal = getSubtotal()
  const { data: couponData } = useValidateCouponQuery(couponCode, subtotal)

  const placeOrderMutation = usePlaceOrderMutation()
  const createRzpMutation = useCreateRazorpayOrderMutation()
  const verifyRzpMutation = useVerifyRazorpayPaymentMutation()

  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod')
  const [deliveryNotes, setDeliveryNotes] = useState<string>('')

  const restLat = settings?.lat ?? 22.5726
  const restLng = settings?.lng ?? 88.3639
  const radiusKm = settings?.delivery_radius_km ?? 5.0
  const packagingFee = settings?.packaging_fee ?? 10
  const taxPercent = settings?.tax_percent ?? 5

  // Auto-select default or first address when loaded
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a) => a.is_default) || addresses[0]
      setSelectedAddressId(defaultAddr.id)
    }
  }, [addresses, selectedAddressId])

  // Select selected address object
  const selectedAddress = addresses?.find((a) => a.id === selectedAddressId)

  // Calculate distance for selected address
  const selectedDistanceKm = selectedAddress
    ? calculateHaversineDistanceKm(restLat, restLng, selectedAddress.lat, selectedAddress.lng)
    : 0

  const isDeliverable = selectedDistanceKm <= radiusKm

  // Calculate delivery fee
  let deliveryFee = 30 // fallback
  if (settings?.delivery_fee_tiers && Array.isArray(settings.delivery_fee_tiers)) {
    const tiers = settings.delivery_fee_tiers as Array<{ upto_km: number; fee: number }>
    const matchedTier = tiers
      .slice()
      .sort((a, b) => a.upto_km - b.upto_km)
      .find((t) => selectedDistanceKm <= t.upto_km)

    if (matchedTier) {
      deliveryFee = matchedTier.fee
    }
  }

  // Free delivery threshold
  const discount = couponData?.discount ?? 0
  if (settings?.free_delivery_above && subtotal - discount >= settings.free_delivery_above) {
    deliveryFee = 0
  }

  const taxableAmount = Math.max(0, subtotal - discount)
  const taxAmount = Math.round((taxableAmount * taxPercent) / 100)
  const grandTotal = Math.max(0, taxableAmount + deliveryFee + packagingFee + taxAmount)

  // Redirect if cart is empty
  if (items.length === 0) {
    return (
      <div className="py-12 px-4 text-center space-y-4">
        <ShoppingBag className="w-12 h-12 mx-auto text-brand-muted" />
        <h2 className="font-heading text-lg font-bold text-brand-dark">Your cart is empty</h2>
        <p className="text-xs text-brand-muted">
          Add items from our delicious menu before proceeding to checkout.
        </p>
        <button
          onClick={() => navigate('/menu')}
          className="px-6 py-2.5 bg-brand-primary text-white rounded-btn text-xs font-bold shadow-soft"
        >
          Explore Menu
        </button>
      </div>
    )
  }

  // If user is not logged in
  if (!user) {
    return (
      <div className="py-12 px-4 text-center space-y-4">
        <MapPin className="w-12 h-12 mx-auto text-brand-muted" />
        <h2 className="font-heading text-lg font-bold text-brand-dark">Please log in to checkout</h2>
        <p className="text-xs text-brand-muted">
          You need an account to save delivery addresses and track your live order.
        </p>
        <button
          onClick={() => navigate('/login?redirect=/checkout')}
          className="px-6 py-2.5 bg-brand-primary text-white rounded-btn text-xs font-bold shadow-soft"
        >
          Log In or Sign Up
        </button>
      </div>
    )
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address.')
      return
    }

    if (!isDeliverable) {
      toast.error(`Selected address is ${selectedDistanceKm} km away. Maximum delivery radius is ${radiusKm} km.`)
      return
    }

    if (settings?.min_order_amount && subtotal < settings.min_order_amount) {
      toast.error(`Minimum order amount is ₹${settings.min_order_amount}`)
      return
    }

    try {
      const orderItems = items.map((i) => ({
        item_id: i.itemId,
        variant_id: i.variantId || undefined,
        qty: i.qty,
        addon_ids: i.addons.map((a) => a.id),
        notes: i.notes || undefined,
      }))

      const res = await placeOrderMutation.mutateAsync({
        items: orderItems,
        address_id: selectedAddress.id,
        payment_method: paymentMethod,
        coupon_code: couponCode || undefined,
        notes: deliveryNotes || undefined,
      })

      if (paymentMethod === 'cod') {
        navigate(`/orders/${res.order_id}`)
      } else {
        // Online payment via Razorpay Checkout
        handleRazorpayPayment(res.order_id, res.total, res.order_no)
      }
    } catch (err: any) {
      // Error handled by mutation onError
    }
  }

  const handleRazorpayPayment = async (orderId: string, amount: number, orderNo: number) => {
    try {
      const rzpData = await createRzpMutation.mutateAsync(orderId)

      const options = {
        key: rzpData.key_id,
        amount: Math.round(amount * 100), // in paise
        currency: 'INR',
        name: settings?.restaurant_name || 'Dinning Zone',
        description: `Order #${orderNo} Payment`,
        order_id: rzpData.razorpay_order_id.startsWith('order_dev') ? undefined : rzpData.razorpay_order_id,
        prefill: {
          name: selectedAddress?.contact_name || user.email,
          contact: selectedAddress?.phone || '',
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
            navigate(`/orders/${orderId}`)
          } catch {
            navigate(`/orders/${orderId}`)
          }
        },
        modal: {
          ondismiss: function () {
            toast.info('Payment cancelled. Your order is pending payment in Orders section.')
            navigate(`/orders/${orderId}`)
          },
        },
      }

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options)
        rzp.open()
      } else {
        // Mock fallback if script didn't load or adblocker blocked
        toast.success('Simulating successful payment...')
        await verifyRzpMutation.mutateAsync({
          razorpay_order_id: rzpData.razorpay_order_id,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: 'mock_sig',
          order_id: orderId,
        })
        navigate(`/orders/${orderId}`)
      }
    } catch (err: any) {
      toast.error('Could not launch payment gateway. Redirecting to order details...')
      navigate(`/orders/${orderId}`)
    }
  }

  const isSubmitting =
    placeOrderMutation.isPending ||
    createRzpMutation.isPending ||
    verifyRzpMutation.isPending

  const getLabelIcon = (label: string) => {
    const l = label.toLowerCase()
    if (l.includes('home')) return <Home className="w-3.5 h-3.5" />
    if (l.includes('work') || l.includes('office')) return <Briefcase className="w-3.5 h-3.5" />
    return <MapPin className="w-3.5 h-3.5" />
  }

  return (
    <div className="space-y-5 pb-24 max-w-xl mx-auto">
      {/* Title Header */}
      <div>
        <h1 className="font-heading text-xl font-bold text-brand-dark">Checkout</h1>
        <p className="text-xs text-brand-muted">Confirm delivery address & payment method</p>
      </div>

      {/* 1. Delivery Address Selector */}
      <div className="p-4 bg-white rounded-card border border-brand-border space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-brand-dark flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-brand-primary" />
            1. Select Delivery Address
          </label>
          <button
            onClick={() => navigate('/addresses/new?redirect=/checkout')}
            className="text-xs font-bold text-brand-primary flex items-center gap-1 hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            Add New
          </button>
        </div>

        {isLoadingAddresses ? (
          <div className="h-16 bg-brand-surface animate-pulse rounded-btn" />
        ) : !addresses || addresses.length === 0 ? (
          <div className="p-4 bg-brand-surface rounded-btn text-center space-y-2">
            <p className="text-xs text-brand-muted">No saved addresses found.</p>
            <button
              onClick={() => navigate('/addresses/new?redirect=/checkout')}
              className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-btn shadow-soft"
            >
              + Add Delivery Address
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {addresses.map((addr) => {
              const dist = calculateHaversineDistanceKm(restLat, restLng, addr.lat, addr.lng)
              const addrDeliverable = dist <= radiusKm
              const isSelected = selectedAddressId === addr.id

              return (
                <div
                  key={addr.id}
                  onClick={() => setSelectedAddressId(addr.id)}
                  className={`p-3 rounded-btn border cursor-pointer transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-brand-primary/5 border-brand-primary ring-1 ring-brand-primary'
                      : 'bg-white border-brand-border hover:bg-brand-surface/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="delivery_address"
                    checked={isSelected}
                    onChange={() => setSelectedAddressId(addr.id)}
                    className="mt-1 accent-brand-primary"
                  />
                  <div className="flex-1 min-w-0 text-xs">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-brand-dark">
                        {getLabelIcon(addr.label)}
                        <span>{addr.label}</span>
                        {addr.is_default && (
                          <span className="text-[9px] bg-brand-primary text-white px-1.5 py-0.2 rounded font-extrabold">
                            DEFAULT
                          </span>
                        )}
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          addrDeliverable
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {dist} km · {addrDeliverable ? 'Deliverable' : 'Outside limit'}
                      </span>
                    </div>

                    <p className="text-brand-dark font-medium truncate">
                      {addr.line1}
                      {addr.line2 ? `, ${addr.line2}` : ''}
                    </p>
                    <p className="text-brand-muted text-[11px]">
                      Contact: {addr.contact_name} ({addr.phone})
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!isDeliverable && selectedAddress && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-btn text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              Selected address is {selectedDistanceKm} km away. We only deliver up to {radiusKm} km.
            </span>
          </div>
        )}
      </div>

      {/* 2. Payment Method Selector */}
      <div className="p-4 bg-white rounded-card border border-brand-border space-y-3">
        <label className="text-xs font-bold text-brand-dark flex items-center gap-1.5">
          <CreditCard className="w-4 h-4 text-brand-primary" />
          2. Select Payment Method
        </label>

        <div className="grid grid-cols-2 gap-3">
          {/* COD */}
          <button
            type="button"
            onClick={() => setPaymentMethod('cod')}
            disabled={settings?.cod_enabled === false}
            className={`p-3 rounded-btn border text-left transition-all flex flex-col justify-between gap-2 ${
              paymentMethod === 'cod'
                ? 'bg-brand-primary/5 border-brand-primary ring-1 ring-brand-primary'
                : 'bg-white border-brand-border hover:bg-brand-surface'
            } ${settings?.cod_enabled === false ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center justify-between">
              <Banknote className="w-5 h-5 text-emerald-600" />
              {paymentMethod === 'cod' && (
                <CheckCircle2 className="w-4 h-4 text-brand-primary" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-brand-dark">Cash on Delivery</p>
              <p className="text-[10px] text-brand-muted">Pay cash when food arrives</p>
            </div>
          </button>

          {/* Online Payment */}
          <button
            type="button"
            onClick={() => setPaymentMethod('online')}
            disabled={settings?.online_enabled === false}
            className={`p-3 rounded-btn border text-left transition-all flex flex-col justify-between gap-2 ${
              paymentMethod === 'online'
                ? 'bg-brand-primary/5 border-brand-primary ring-1 ring-brand-primary'
                : 'bg-white border-brand-border hover:bg-brand-surface'
            } ${settings?.online_enabled === false ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center justify-between">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              {paymentMethod === 'online' && (
                <CheckCircle2 className="w-4 h-4 text-brand-primary" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-brand-dark">Razorpay Online</p>
              <p className="text-[10px] text-brand-muted">UPI / Cards / NetBanking</p>
            </div>
          </button>
        </div>
      </div>

      {/* 3. Delivery Instructions / Notes */}
      <div className="p-4 bg-white rounded-card border border-brand-border space-y-2">
        <label className="text-xs font-bold text-brand-dark flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-brand-primary" />
          3. Delivery & Cooking Instructions (Optional)
        </label>
        <textarea
          rows={2}
          value={deliveryNotes}
          onChange={(e) => setDeliveryNotes(e.target.value)}
          placeholder="e.g. Ring bell twice, leave food at reception, extra spicy..."
          className="w-full px-3 py-2 text-xs border border-brand-border rounded-btn focus:outline-none focus:border-brand-primary"
        />
      </div>

      {/* 4. Order Summary & Bill */}
      <div className="p-4 bg-white rounded-card border border-brand-border space-y-3">
        <h3 className="text-xs font-bold text-brand-dark uppercase tracking-wider">
          Bill Details
        </h3>

        <div className="space-y-2 text-xs divide-y divide-brand-border/60">
          {/* Items Summary */}
          <div className="pb-2 space-y-1.5">
            {items.map((item) => (
              <div key={item.lineKey} className="flex justify-between items-start text-brand-dark">
                <span className="flex-1 pr-2">
                  <span className="font-bold text-brand-primary mr-1">{item.qty}x</span>
                  <span>{item.name}</span>
                  {item.variantName && (
                    <span className="text-[11px] text-brand-muted ml-1">
                      ({item.variantName})
                    </span>
                  )}
                </span>
                <Price amount={item.unitPrice * item.qty} className="font-bold" />
              </div>
            ))}
          </div>

          <div className="pt-2 space-y-1.5 text-brand-muted">
            <div className="flex justify-between">
              <span>Item Subtotal</span>
              <Price amount={subtotal} className="text-brand-dark font-medium" />
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Coupon Discount ({couponCode})</span>
                <span>-<Price amount={discount} /></span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Delivery Fee ({selectedDistanceKm} km)</span>
              {deliveryFee === 0 ? (
                <span className="text-emerald-600 font-bold">FREE</span>
              ) : (
                <Price amount={deliveryFee} className="text-brand-dark font-medium" />
              )}
            </div>

            <div className="flex justify-between">
              <span>Packaging Fee</span>
              <Price amount={packagingFee} className="text-brand-dark font-medium" />
            </div>

            <div className="flex justify-between">
              <span>Taxes & GST ({taxPercent}%)</span>
              <Price amount={taxAmount} className="text-brand-dark font-medium" />
            </div>
          </div>

          <div className="pt-2.5 flex justify-between items-center text-sm font-bold text-brand-dark">
            <span>To Pay</span>
            <Price amount={grandTotal} className="text-base text-brand-primary" />
          </div>
        </div>

        {/* Safety Badge */}
        <div className="flex items-center gap-2 pt-2 text-[11px] text-brand-muted">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Strict hygiene standards & temperature checks enforced.</span>
        </div>
      </div>

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-brand-border shadow-float z-30">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-brand-muted block uppercase font-bold">
              Total Amount
            </span>
            <Price amount={grandTotal} className="text-lg font-extrabold text-brand-dark" />
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={isSubmitting || !selectedAddress || !isDeliverable}
            className="flex-1 py-3 px-4 bg-brand-primary text-white text-sm font-bold rounded-btn shadow-soft hover:bg-brand-primary/95 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Order...</span>
              </>
            ) : (
              <>
                <span>{paymentMethod === 'cod' ? 'Place Order (COD)' : 'Proceed to Pay'}</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
