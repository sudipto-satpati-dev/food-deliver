import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { Bike, History, UserCheck } from 'lucide-react'
import { BRAND_CONFIG } from '@/config/brand'

export const RiderLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-16 font-body text-brand-text">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-subtle">
        <div className="flex items-center gap-2">
          <img src={BRAND_CONFIG.logos.main} alt="Rider Logo" className="h-7 object-contain" />
          <span className="text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded">Rider</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-800">Online</span>
        </div>
      </header>

      {/* Main Page Area */}
      <main className="flex-1 max-w-lg w-full mx-auto p-4">
        <Outlet />
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 max-w-lg mx-auto flex items-center justify-around py-2 shadow-card">
        <NavLink
          to="/rider"
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
              isActive ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-900'
            }`
          }
        >
          <Bike className="w-5 h-5" />
          <span>Assigned Orders</span>
        </NavLink>
        <NavLink
          to="/rider/history"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
              isActive ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-900'
            }`
          }
        >
          <History className="w-5 h-5" />
          <span>History</span>
        </NavLink>
      </nav>
    </div>
  )
}
