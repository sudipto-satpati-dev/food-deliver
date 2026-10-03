import React from 'react'
import { BRAND_CONFIG } from '@/config/brand'

export const HomePage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Restaurant Open Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-card p-3 flex items-center justify-between text-xs text-emerald-800 font-medium shadow-subtle">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Open now · Delivery in 30–40 min</span>
        </div>
        <span className="text-gray-500">5 km radius</span>
      </div>

      {/* Hero Banner */}
      <div className="relative rounded-card overflow-hidden shadow-card aspect-[2/1] bg-brand-primary text-white p-5 flex flex-col justify-center">
        <img
          src={BRAND_CONFIG.banners.hero}
          alt="Food Spread"
          className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay"
        />
        <div className="relative z-10 max-w-[65%] space-y-1">
          <span className="bg-amber-400 text-brand-text text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">
            Special Offer
          </span>
          <h2 className="font-heading text-lg font-bold leading-snug">Delicious Meals Delivered Fast</h2>
          <p className="text-xs text-white/90">Fresh food straight from our kitchen to your doorstep</p>
        </div>
      </div>

      {/* Category Chips Preview */}
      <div className="space-y-2">
        <h3 className="font-heading text-base font-semibold text-brand-text">Categories</h3>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {['Biryani', 'Pizza', 'Burgers', 'Chinese', 'Desserts', 'Drinks'].map((cat) => (
            <button
              key={cat}
              className="px-4 py-2 rounded-full bg-white border border-brand-border text-xs font-medium whitespace-nowrap shadow-subtle hover:border-brand-primary transition-colors"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Popular Items Placeholder */}
      <div className="space-y-2">
        <h3 className="font-heading text-base font-semibold text-brand-text">Bestsellers</h3>
        <div className="bg-white rounded-card p-4 border border-brand-border shadow-subtle text-center text-sm text-brand-muted">
          Customer home screen ready. Add items to cart to preview order workflow.
        </div>
      </div>
    </div>
  )
}
