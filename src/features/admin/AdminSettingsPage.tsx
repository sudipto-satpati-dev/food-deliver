import React, { useState, useEffect } from 'react'
import { useSettingsQuery, useUpdateSettingsMutation } from './hooks'
import { Skeletons } from '@/components/common/Skeletons'
import { ErrorState } from '@/components/common/ErrorState'
import { MapPin, Plus, Trash2, Save, Store, Truck, DollarSign, CreditCard, Phone, Clock } from 'lucide-react'

export const AdminSettingsPage: React.FC = () => {
  const { data: settings, isLoading, isError, refetch } = useSettingsQuery()
  const updateMutation = useUpdateSettingsMutation()

  const [isOpen, setIsOpen] = useState(true)
  const [acceptingOrders, setAcceptingOrders] = useState(true)
  const [openingTime, setOpeningTime] = useState('10:00')
  const [closingTime, setClosingTime] = useState('23:00')
  const [lat, setLat] = useState(19.076)
  const [lng, setLng] = useState(72.8777)
  const [addressText, setAddressText] = useState('')
  const [radiusKm, setRadiusKm] = useState(5.0)
  const [feeTiers, setFeeTiers] = useState<Array<{ upto_km: number; fee: number }>>([
    { upto_km: 2, fee: 20 },
    { upto_km: 4, fee: 40 },
    { upto_km: 5, fee: 60 },
  ])
  const [freeDeliveryAbove, setFreeDeliveryAbove] = useState<number | ''>('')
  const [minOrder, setMinOrder] = useState(0)
  const [packagingFee, setPackagingFee] = useState(0)
  const [taxPercent, setTaxPercent] = useState(0)
  const [codEnabled, setCodEnabled] = useState(true)
  const [onlineEnabled, setOnlineEnabled] = useState(true)
  const [supportPhone, setSupportPhone] = useState('')
  const [prepTime, setPrepTime] = useState(30)

  useEffect(() => {
    if (settings) {
      setIsOpen(settings.is_open)
      setAcceptingOrders(settings.accepting_orders)
      setOpeningTime(settings.opening_time || '10:00')
      setClosingTime(settings.closing_time || '23:00')
      setLat(settings.lat || 19.076)
      setLng(settings.lng || 72.8777)
      setAddressText(settings.address_text || '')
      setRadiusKm(settings.delivery_radius_km || 5.0)
      if (Array.isArray(settings.delivery_fee_tiers)) {
        setFeeTiers(settings.delivery_fee_tiers as Array<{ upto_km: number; fee: number }>)
      }
      setFreeDeliveryAbove(settings.free_delivery_above ?? '')
      setMinOrder(settings.min_order_amount || 0)
      setPackagingFee(settings.packaging_fee || 0)
      setTaxPercent(settings.tax_percent || 0)
      setCodEnabled(settings.cod_enabled)
      setOnlineEnabled(settings.online_enabled)
      setSupportPhone(settings.support_phone || '')
      setPrepTime(settings.prep_time_minutes || 30)
    }
  }, [settings])

  const handleAddFeeTier = () => {
    const lastKm = feeTiers.length > 0 ? feeTiers[feeTiers.length - 1].upto_km + 2 : 2
    const lastFee = feeTiers.length > 0 ? feeTiers[feeTiers.length - 1].fee + 20 : 20
    setFeeTiers([...feeTiers, { upto_km: lastKm, fee: lastFee }])
  }

  const handleRemoveFeeTier = (index: number) => {
    setFeeTiers(feeTiers.filter((_, i) => i !== index))
  }

  const handleTierChange = (index: number, field: 'upto_km' | 'fee', value: number) => {
    const updated = [...feeTiers]
    updated[index][field] = value
    setFeeTiers(updated)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateMutation.mutateAsync({
        is_open: isOpen,
        accepting_orders: acceptingOrders,
        opening_time: openingTime,
        closing_time: closingTime,
        lat,
        lng,
        address_text: addressText,
        delivery_radius_km: radiusKm,
        delivery_fee_tiers: feeTiers,
        free_delivery_above: freeDeliveryAbove === '' ? null : Number(freeDeliveryAbove),
        min_order_amount: minOrder,
        packaging_fee: packagingFee,
        tax_percent: taxPercent,
        cod_enabled: codEnabled,
        online_enabled: onlineEnabled,
        support_phone: supportPhone,
        prep_time_minutes: prepTime,
      })
    } catch {
      // Error handled by hook toast
    }
  }

  if (isLoading) {
    return <Skeletons count={3} />
  }

  if (isError) {
    return <ErrorState message="Failed to load settings." onRetry={() => refetch()} />
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-brand-text">Restaurant Settings</h2>
          <p className="text-sm text-brand-muted">Manage store status, delivery rules, fees, and operations.</p>
        </div>
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-btn bg-brand-primary text-white font-semibold text-sm hover:bg-brand-dark transition-colors shadow-subtle disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> Save Changes
        </button>
      </div>

      {/* 1. Store Status */}
      <div className="bg-white rounded-card p-5 border border-gray-200 shadow-subtle space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Store className="w-5 h-5 text-brand-primary" />
          <h3 className="font-heading text-base font-bold text-brand-text">Store Operational Status</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <span className="font-semibold text-sm text-brand-text block">Master Open Status</span>
              <span className="text-xs text-brand-muted">Is restaurant open today?</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isOpen}
                onChange={(e) => setIsOpen(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <span className="font-semibold text-sm text-brand-text block">Accepting Orders</span>
              <span className="text-xs text-brand-muted">Quick orders toggle switch</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={acceptingOrders}
                onChange={(e) => setAcceptingOrders(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
            </label>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-brand-text block">Opening Time</label>
            <input
              type="time"
              value={openingTime}
              onChange={(e) => setOpeningTime(e.target.value)}
              className="w-full p-2.5 rounded-btn border border-gray-300 text-sm bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-brand-text block">Closing Time</label>
            <input
              type="time"
              value={closingTime}
              onChange={(e) => setClosingTime(e.target.value)}
              className="w-full p-2.5 rounded-btn border border-gray-300 text-sm bg-white"
            />
          </div>
        </div>
      </div>

      {/* 2. Location & Delivery Radius */}
      <div className="bg-white rounded-card p-5 border border-gray-200 shadow-subtle space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Truck className="w-5 h-5 text-brand-primary" />
          <h3 className="font-heading text-base font-bold text-brand-text">Location & Delivery Radius</h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-brand-text block">Restaurant Address Text</label>
              <input
                type="text"
                value={addressText}
                onChange={(e) => setAddressText(e.target.value)}
                placeholder="Main Road, Sector 5, Kolkata"
                className="w-full p-2.5 rounded-btn border border-gray-300 text-sm bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-text block">Delivery Radius (km)</label>
              <input
                type="number"
                step="0.5"
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full p-2.5 rounded-btn border border-gray-300 text-sm bg-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-text block">Latitude (Pin)</label>
              <input
                type="number"
                step="0.000001"
                value={lat}
                onChange={(e) => setLat(Number(e.target.value))}
                className="w-full p-2.5 rounded-btn border border-gray-300 text-sm bg-white"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-text block">Longitude (Pin)</label>
              <input
                type="number"
                step="0.000001"
                value={lng}
                onChange={(e) => setLng(Number(e.target.value))}
                className="w-full p-2.5 rounded-btn border border-gray-300 text-sm bg-white"
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Delivery Fee Tiers */}
      <div className="bg-white rounded-card p-5 border border-gray-200 shadow-subtle space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-brand-primary" />
            <h3 className="font-heading text-base font-bold text-brand-text">Delivery Fee Tiers (by distance)</h3>
          </div>
          <button
            type="button"
            onClick={handleAddFeeTier}
            className="flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
          >
            <Plus className="w-4 h-4" /> Add Tier
          </button>
        </div>

        <div className="space-y-3">
          {feeTiers.map((tier, index) => (
            <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <span className="text-xs font-bold text-brand-muted w-16">Tier {index + 1}:</span>
              <div className="flex-1 flex items-center gap-2">
                <span className="text-xs text-brand-muted">Up to</span>
                <input
                  type="number"
                  step="0.5"
                  value={tier.upto_km}
                  onChange={(e) => handleTierChange(index, 'upto_km', Number(e.target.value))}
                  className="w-20 p-1.5 rounded border border-gray-300 text-xs bg-white font-semibold"
                />
                <span className="text-xs text-brand-muted">km &rarr; ₹</span>
                <input
                  type="number"
                  value={tier.fee}
                  onChange={(e) => handleTierChange(index, 'fee', Number(e.target.value))}
                  className="w-24 p-1.5 rounded border border-gray-300 text-xs bg-white font-semibold text-brand-primary"
                />
              </div>
              {feeTiers.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveFeeTier(index)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="pt-2">
          <label className="text-xs font-semibold text-brand-text block">Free Delivery Above (₹) (Optional)</label>
          <input
            type="number"
            value={freeDeliveryAbove}
            onChange={(e) => setFreeDeliveryAbove(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="e.g. 499 (leave blank if no free delivery threshold)"
            className="w-full p-2.5 rounded-btn border border-gray-300 text-sm bg-white mt-1"
          />
        </div>
      </div>

      {/* 4. Charges & Packaging */}
      <div className="bg-white rounded-card p-5 border border-gray-200 shadow-subtle space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <CreditCard className="w-5 h-5 text-brand-primary" />
          <h3 className="font-heading text-base font-bold text-brand-text">Charges & Tax Settings</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-brand-text block">Min Order Amount (₹)</label>
            <input
              type="number"
              value={minOrder}
              onChange={(e) => setMinOrder(Number(e.target.value))}
              className="w-full p-2.5 rounded-btn border border-gray-300 text-sm bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-brand-text block">Packaging Fee (₹)</label>
            <input
              type="number"
              value={packagingFee}
              onChange={(e) => setPackagingFee(Number(e.target.value))}
              className="w-full p-2.5 rounded-btn border border-gray-300 text-sm bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-brand-text block">Tax / GST (%)</label>
            <input
              type="number"
              step="0.1"
              value={taxPercent}
              onChange={(e) => setTaxPercent(Number(e.target.value))}
              className="w-full p-2.5 rounded-btn border border-gray-300 text-sm bg-white"
            />
          </div>
        </div>
      </div>

      {/* 5. Payments & Operations */}
      <div className="bg-white rounded-card p-5 border border-gray-200 shadow-subtle space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Clock className="w-5 h-5 text-brand-primary" />
          <h3 className="font-heading text-base font-bold text-brand-text">Payments & Support</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <span className="font-semibold text-sm text-brand-text block">Cash on Delivery (COD)</span>
              <span className="text-xs text-brand-muted">Allow cash payments on delivery</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={codEnabled}
                onChange={(e) => setCodEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <span className="font-semibold text-sm text-brand-text block">Online Payments (Razorpay)</span>
              <span className="text-xs text-brand-muted">Allow UPI & Cards online</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={onlineEnabled}
                onChange={(e) => setOnlineEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
            </label>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-brand-text block">Support Phone Number</label>
            <input
              type="text"
              value={supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full p-2.5 rounded-btn border border-gray-300 text-sm bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-brand-text block">Average Preparation Time (mins)</label>
            <input
              type="number"
              value={prepTime}
              onChange={(e) => setPrepTime(Number(e.target.value))}
              className="w-full p-2.5 rounded-btn border border-gray-300 text-sm bg-white"
            />
          </div>
        </div>
      </div>

      {/* Sticky Save Button for Mobile */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white/95 border-t border-gray-200 md:hidden z-30 shadow-card">
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="w-full py-3 rounded-btn bg-brand-primary text-white font-semibold text-sm hover:bg-brand-dark transition-colors shadow-subtle flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" /> Save Settings
        </button>
      </div>
    </form>
  )
}
