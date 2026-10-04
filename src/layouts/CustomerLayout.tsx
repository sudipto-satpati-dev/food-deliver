import React, { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Home, UtensilsCrossed, ShoppingBag, User, ShoppingCart, X } from 'lucide-react'
import { BRAND_CONFIG } from '@/config/brand'
import { useCartStore } from '@/stores/cart'
import { Price } from '@/components/common/Price'
import { ConfirmModal } from '@/components/common/ConfirmModal'

export const CustomerLayout: React.FC = () => {
  const itemCount = useCartStore((state) => state.getItemCount())
  const subtotal = useCartStore((state) => state.getSubtotal())
  const clearCart = useCartStore((state) => state.clearCart)
  const location = useLocation()

  const [isClearModalOpen, setIsClearModalOpen] = useState(false)

  // Hide top header & bottom nav on standalone auth/welcome pages
  const isStandalonePage = [
    '/welcome',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
  ].includes(location.pathname)

  // Hide sticky bottom cart bar on cart/checkout pages
  const isCartPage = location.pathname === '/cart' || location.pathname === '/checkout'

  if (isStandalonePage) {
    return (
      <div className="min-h-screen bg-[#fcf9f8] font-body text-brand-text">
        <Outlet />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col pb-20 font-body text-brand-text">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-brand-border px-4 py-3 flex items-center justify-between shadow-subtle">
        <NavLink to="/" className="flex items-center gap-2">
          <img src={BRAND_CONFIG.logos.main} alt={BRAND_CONFIG.name} className="h-8 object-contain" />
        </NavLink>
        <div className="flex items-center gap-2">
          {/* Search Icon */}
          <NavLink
            to="/search"
            className="p-2 text-brand-muted hover:text-brand-primary rounded-full hover:bg-brand-bg transition-colors"
            aria-label="Search Menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </NavLink>

          {/* Top Navbar Cart Icon */}
          <NavLink
            to="/cart"
            className="relative p-2 text-brand-muted hover:text-brand-primary rounded-full hover:bg-brand-bg transition-colors"
            aria-label="View Cart"
          >
            <ShoppingCart className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-brand-primary text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border border-white shadow-subtle">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </NavLink>
        </div>
      </header>

      {/* Main Page Area */}
      <main className="flex-1 max-w-lg w-full mx-auto p-4">
        <Outlet />
      </main>

      {/* Sticky Floating View Cart Bar */}
      {!isCartPage && itemCount > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-30 p-4 max-w-lg mx-auto pointer-events-none">
          <div className="pointer-events-auto flex items-center justify-between bg-brand-primary text-white p-3.5 rounded-btn shadow-float hover:bg-brand-dark transition-all">
            <NavLink to="/cart" className="flex items-center justify-between flex-1 gap-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="bg-white/20 px-2.5 py-0.5 rounded-full font-bold">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </span>
                <span>View cart</span>
              </div>
              <Price amount={subtotal} className="text-white text-base font-bold" />
            </NavLink>

            {/* Cross Button to Remove / Clear Cart with Confirmation Modal */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsClearModalOpen(true)
              }}
              className="ml-3 p-1.5 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors shrink-0"
              aria-label="Clear Cart"
              title="Clear Cart"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Generic Confirmation Modal to Clear Cart */}
      <ConfirmModal
        isOpen={isClearModalOpen}
        title="Clear Cart?"
        description="Are you sure you want to remove all items from your cart?"
        confirmText="Clear Cart"
        cancelText="Cancel"
        variant="danger"
        onConfirm={clearCart}
        onClose={() => setIsClearModalOpen(false)}
      />

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-brand-border max-w-lg mx-auto flex items-center justify-around py-2 shadow-card">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
              isActive ? 'text-brand-primary' : 'text-brand-muted hover:text-brand-text'
            }`
          }
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </NavLink>
        <NavLink
          to="/menu"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
              isActive ? 'text-brand-primary' : 'text-brand-muted hover:text-brand-text'
            }`
          }
        >
          <UtensilsCrossed className="w-5 h-5" />
          <span>Menu</span>
        </NavLink>
        <NavLink
          to="/orders"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
              isActive ? 'text-brand-primary' : 'text-brand-muted hover:text-brand-text'
            }`
          }
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Orders</span>
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
              isActive ? 'text-brand-primary' : 'text-brand-muted hover:text-brand-text'
            }`
          }
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  )
}
