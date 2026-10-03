import React, { useState, useEffect } from 'react'
import { MenuItemWithDetails } from './api'
import { useCartStore } from '@/stores/cart'
import { VegDot } from '@/components/common/VegDot'
import { Price } from '@/components/common/Price'
import { X, Minus, Plus, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface ItemBottomSheetProps {
  item: MenuItemWithDetails | null
  onClose: () => void
}

export const ItemBottomSheet: React.FC<ItemBottomSheetProps> = ({ item, onClose }) => {
  const addItem = useCartStore((state) => state.addItem)

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([])
  const [qty, setQty] = useState(1)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (item) {
      // Default to first variant if available
      if (item.item_variants && item.item_variants.length > 0) {
        setSelectedVariantId(item.item_variants[0].id)
      } else {
        setSelectedVariantId(null)
      }
      setSelectedAddonIds([])
      setQty(1)
      setNotes('')
    }
  }, [item])

  if (!item) return null

  // Calculate unit price based on selected variant
  const selectedVariant = item.item_variants?.find((v) => v.id === selectedVariantId)
  const baseUnitPrice = selectedVariant ? selectedVariant.price : item.price

  // Calculate total addons price
  const selectedAddons = (item.item_addons || []).filter((a) => selectedAddonIds.includes(a.id))
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0)

  const lineUnitPrice = baseUnitPrice + addonsTotal
  const totalAmount = lineUnitPrice * qty

  const handleToggleAddon = (addonId: string) => {
    if (selectedAddonIds.includes(addonId)) {
      setSelectedAddonIds(selectedAddonIds.filter((id) => id !== addonId))
    } else {
      setSelectedAddonIds([...selectedAddonIds, addonId])
    }
  }

  const handleAddToCart = () => {
    addItem({
      itemId: item.id,
      name: item.name,
      imageUrl: item.image_url,
      isVeg: item.is_veg,
      variantId: selectedVariant ? selectedVariant.id : null,
      variantName: selectedVariant ? selectedVariant.name : null,
      unitPrice: lineUnitPrice,
      addons: selectedAddons.map((a) => ({ id: a.id, name: a.name, price: a.price })),
      qty,
      notes: notes.trim() || null,
    })

    toast.success(`Added ${qty} × ${item.name} to cart!`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in">
      <div
        className="bg-white rounded-t-card max-w-lg w-full mx-auto max-h-[85vh] flex flex-col overflow-hidden shadow-float animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Photo & Close Button */}
        <div className="relative h-48 bg-gray-100 shrink-0">
          <img
            src={item.image_url || '/banners/default-food-placeholder.webp'}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Details & Options Scroll Area */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {/* Header Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <VegDot isVeg={item.is_veg} />
              <h2 className="font-heading text-xl font-bold text-brand-text">{item.name}</h2>
              {item.is_bestseller && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" /> Bestseller
                </span>
              )}
            </div>
            {item.description && <p className="text-xs text-brand-muted leading-relaxed">{item.description}</p>}
            <Price amount={baseUnitPrice} className="text-lg font-bold text-brand-primary block pt-1" />
          </div>

          {/* Variants Radio Section */}
          {item.item_variants && item.item_variants.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-sm font-bold text-brand-text">Choose Portion / Size</h3>
                <span className="text-[10px] font-semibold uppercase text-brand-muted bg-gray-100 px-2 py-0.5 rounded">
                  Required
                </span>
              </div>
              <div className="space-y-2">
                {item.item_variants.map((v) => (
                  <label
                    key={v.id}
                    className={`flex items-center justify-between p-3 rounded-btn border cursor-pointer transition-all ${
                      selectedVariantId === v.id
                        ? 'border-brand-primary bg-brand-primary/5 font-semibold'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs text-brand-text">
                      <input
                        type="radio"
                        name="variant"
                        checked={selectedVariantId === v.id}
                        onChange={() => setSelectedVariantId(v.id)}
                        className="text-brand-primary focus:ring-brand-primary"
                      />
                      <span>{v.name}</span>
                    </div>
                    <Price amount={v.price} className="text-xs font-bold text-brand-primary" />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Addons Checkbox Section */}
          {item.item_addons && item.item_addons.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-sm font-bold text-brand-text">Add-ons (Optional)</h3>
                <span className="text-[10px] font-semibold uppercase text-brand-muted bg-gray-100 px-2 py-0.5 rounded">
                  Optional
                </span>
              </div>
              <div className="space-y-2">
                {item.item_addons.map((a) => {
                  const isChecked = selectedAddonIds.includes(a.id)
                  return (
                    <label
                      key={a.id}
                      className={`flex items-center justify-between p-3 rounded-btn border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-brand-primary bg-brand-primary/5 font-semibold'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-xs text-brand-text">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleAddon(a.id)}
                          className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                        />
                        <span>{a.name}</span>
                      </div>
                      <span className="text-xs font-bold text-brand-primary">+<Price amount={a.price} /></span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div className="space-y-1.5 pt-2 border-t border-gray-100">
            <label className="text-xs font-semibold text-brand-text block">Special Instructions</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. less spicy, extra raita, no onion"
              className="w-full p-2.5 rounded-btn border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
            />
          </div>
        </div>

        {/* Footer Bar: Quantity Stepper & Add Button */}
        <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-4 shrink-0 shadow-card">
          <div className="flex items-center border border-gray-300 rounded-btn bg-gray-50">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="p-2.5 text-brand-text hover:bg-gray-200 rounded-l-btn transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-sm font-bold text-brand-text">{qty}</span>
            <button
              onClick={() => setQty(qty + 1)}
              className="p-2.5 text-brand-text hover:bg-gray-200 rounded-r-btn transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            className="flex-1 py-3.5 rounded-btn bg-brand-primary text-white font-semibold text-sm hover:bg-brand-dark transition-all shadow-subtle flex items-center justify-between px-5 active:scale-[0.99]"
          >
            <span>Add item</span>
            <Price amount={totalAmount} className="text-white font-bold" />
          </button>
        </div>
      </div>
    </div>
  )
}
