import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSettingsQuery } from '@/features/admin/hooks'
import { MenuItemWithDetails } from '@/features/menu/api'
import { usePublicCategoriesQuery, usePublicMenuItemsQuery, useActiveCouponsQuery } from '@/features/menu/hooks'
import { ItemBottomSheet } from '@/features/menu/ItemBottomSheet'
import { Skeletons } from '@/components/common/Skeletons'
import { ErrorState } from '@/components/common/ErrorState'
import { VegDot } from '@/components/common/VegDot'
import { Price } from '@/components/common/Price'
import { BRAND_CONFIG } from '@/config/brand'
import { MapPin, Bell, Search, Sparkles, AlertCircle } from 'lucide-react'

export const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const { data: settings } = useSettingsQuery()
  const { data: categories, isLoading: isCatLoading } = usePublicCategoriesQuery()
  const { data: menuItems, isLoading: isItemsLoading, isError, refetch } = usePublicMenuItemsQuery()
  const { data: coupons } = useActiveCouponsQuery()

  const [selectedItemForSheet, setSelectedItemForSheet] = useState<MenuItemWithDetails | null>(null)

  const isOpen = settings?.is_open && settings?.accepting_orders
  const bestsellers = (menuItems || []).filter((item) => item.is_bestseller)

  return (
    <div className="space-y-6 pb-6">
      {/* 1. Location & Bell Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-brand-border shadow-subtle">
          <MapPin className="w-4 h-4 text-brand-primary shrink-0" />
          <span className="text-xs font-semibold text-brand-text truncate max-w-[200px]">
            Delivering within {settings?.delivery_radius_km || BRAND_CONFIG.deliveryRadiusKm} km
          </span>
        </div>
        <Link
          to="/notifications"
          className="p-2 text-brand-muted hover:text-brand-primary rounded-full hover:bg-white transition-colors border border-transparent hover:border-brand-border"
        >
          <Bell className="w-5 h-5" />
        </Link>
      </div>

      {/* 2. Restaurant Open / Closed Status Banner */}
      {isOpen ? (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-card p-3 flex items-center justify-between text-xs text-emerald-900 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold">Open now · Delivery in {settings?.prep_time_minutes || 30}–40 min</span>
          </div>
          <span className="text-[11px] text-emerald-700">₹{settings?.min_order_amount || 0} min order</span>
        </div>
      ) : (
        <div className="bg-red-500/10 border border-red-500/20 rounded-card p-3 flex items-center justify-between text-xs text-red-900 font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-semibold">Currently Closed · Opens at {settings?.opening_time || '10:00 AM'}</span>
          </div>
          <span className="text-[11px] text-red-700">Browsing only</span>
        </div>
      )}

      {/* 3. Search Bar Button */}
      <div
        onClick={() => navigate('/search')}
        className="flex items-center gap-3 bg-white border border-brand-border p-3 rounded-btn text-brand-muted text-sm shadow-subtle cursor-pointer hover:border-brand-primary/50 transition-colors"
      >
        <Search className="w-4 h-4 text-gray-400" />
        <span>Search biryani, pizza, paneer, drinks...</span>
      </div>

      {/* 4. Active Offers Strip */}
      {coupons && coupons.length > 0 && (
        <div className="space-y-2">
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className="shrink-0 w-64 bg-gradient-to-r from-brand-primary to-amber-500 text-white rounded-card p-3.5 shadow-subtle relative overflow-hidden flex flex-col justify-between"
              >
                <div className="relative z-10 space-y-1">
                  <span className="bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block">
                    Offer
                  </span>
                  <h4 className="font-heading text-sm font-bold leading-tight">
                    {coupon.type === 'percent'
                      ? `${coupon.value}% OFF up to ₹${coupon.max_discount || coupon.value}`
                      : `FLAT ₹${coupon.value} OFF`}
                  </h4>
                  <p className="text-[11px] text-white/90">Use code: <span className="font-mono font-bold bg-black/20 px-1.5 py-0.5 rounded">{coupon.code}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Category Chips */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-base font-bold text-brand-text">Categories</h3>
          <Link to="/menu" className="text-xs font-semibold text-brand-primary hover:underline">
            View menu &rarr;
          </Link>
        </div>

        {isCatLoading ? (
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-24 h-8 bg-gray-200 rounded-full animate-pulse shrink-0" />
            ))}
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => navigate(`/menu?category=${cat.id}`)}
                className="px-4 py-2 rounded-full bg-white border border-brand-border text-xs font-medium text-brand-text whitespace-nowrap shadow-subtle hover:border-brand-primary hover:text-brand-primary transition-colors"
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 6. Bestsellers Section */}
      {bestsellers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
            <h3 className="font-heading text-base font-bold text-brand-text">Bestsellers</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {bestsellers.slice(0, 4).map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItemForSheet(item)}
                className="bg-white rounded-card border border-brand-border overflow-hidden shadow-subtle flex flex-col justify-between cursor-pointer hover:shadow-card transition-all"
              >
                <div className="relative aspect-[4/3] bg-gray-100">
                  <img
                    src={item.image_url || '/banners/default-food-placeholder.webp'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <VegDot isVeg={item.is_veg} size="sm" />
                  </div>
                </div>

                <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-heading text-xs font-bold text-brand-text line-clamp-1">{item.name}</h4>
                    <p className="text-[11px] text-brand-muted line-clamp-1 mt-0.5">{item.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Price amount={item.price} className="text-xs font-bold text-brand-primary" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedItemForSheet(item)
                      }}
                      className="px-3 py-1 rounded-btn bg-brand-primary/10 text-brand-primary font-bold text-xs hover:bg-brand-primary hover:text-white transition-colors"
                    >
                      ADD
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Menu Item List Preview */}
      <div className="space-y-3">
        <h3 className="font-heading text-base font-bold text-brand-text">Our Menu</h3>

        {isItemsLoading ? (
          <Skeletons count={3} />
        ) : isError ? (
          <ErrorState message="Failed to load menu items." onRetry={() => refetch()} />
        ) : (
          <div className="bg-white rounded-card border border-brand-border divide-y divide-gray-100 shadow-subtle overflow-hidden">
            {menuItems?.slice(0, 8).map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItemForSheet(item)}
                className="p-3 flex items-center justify-between gap-3 hover:bg-gray-50/60 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <VegDot isVeg={item.is_veg} size="sm" className="mt-1 shrink-0" />
                  <div className="space-y-1 min-w-0">
                    <h4 className="font-heading text-xs font-bold text-brand-text truncate">{item.name}</h4>
                    <p className="text-[11px] text-brand-muted line-clamp-1">{item.description}</p>
                    <Price amount={item.price} className="text-xs font-bold text-brand-primary block" />
                  </div>
                </div>

                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                  <img
                    src={item.image_url || '/banners/default-food-placeholder.webp'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedItemForSheet(item)
                    }}
                    className="absolute bottom-1 right-1 px-2.5 py-1 rounded bg-white text-brand-primary text-[10px] font-bold shadow-subtle border border-brand-primary/20 hover:bg-brand-primary hover:text-white transition-colors"
                  >
                    ADD
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Item Customization Bottom Sheet */}
      <ItemBottomSheet
        item={selectedItemForSheet}
        onClose={() => setSelectedItemForSheet(null)}
      />
    </div>
  )
}
