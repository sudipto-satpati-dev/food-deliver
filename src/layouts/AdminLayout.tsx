import React from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, ShoppingBag, Utensils, Ticket, Bike, Star, BarChart3, Settings, MoreHorizontal, Bell } from 'lucide-react'
import { BRAND_CONFIG } from '@/config/brand'

export const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row text-brand-text font-body">
      {/* Sidebar for Desktop ≥1024px */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 sticky top-0 h-screen p-4 space-y-6">
        <div className="flex items-center gap-3 px-2 py-1">
          <img src={BRAND_CONFIG.logos.main} alt="Admin Logo" className="h-8 object-contain" />
          <span className="text-xs font-bold uppercase tracking-wider bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded">Admin</span>
        </div>

        <nav className="flex-1 space-y-1">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-primary text-white shadow-subtle' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/admin/orders"
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 rounded-btn text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-primary text-white shadow-subtle' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-4 h-4" />
              <span>Live Orders</span>
            </div>
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">New</span>
          </NavLink>
          <NavLink
            to="/admin/menu"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-primary text-white shadow-subtle' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <Utensils className="w-4 h-4" />
            <span>Menu & Items</span>
          </NavLink>
          <NavLink
            to="/admin/coupons"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-primary text-white shadow-subtle' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <Ticket className="w-4 h-4" />
            <span>Coupons</span>
          </NavLink>
          <NavLink
            to="/admin/riders"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-primary text-white shadow-subtle' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <Bike className="w-4 h-4" />
            <span>Riders</span>
          </NavLink>
          <NavLink
            to="/admin/reviews"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-primary text-white shadow-subtle' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <Star className="w-4 h-4" />
            <span>Reviews</span>
          </NavLink>
          <NavLink
            to="/admin/reports"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-primary text-white shadow-subtle' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <BarChart3 className="w-4 h-4" />
            <span>Reports</span>
          </NavLink>
          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-primary text-white shadow-subtle' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </NavLink>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2 lg:hidden">
            <img src={BRAND_CONFIG.logos.main} alt="Logo" className="h-7 object-contain" />
            <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded">Admin</span>
          </div>
          <div className="hidden lg:block text-sm font-medium text-gray-500">
            Restaurant Management Console
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-green-100 text-green-800 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
              Accepting Orders
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="p-4 lg:p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation (<1024px) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex items-center justify-around py-2 shadow-card">
        <NavLink
          to="/admin/orders"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
              isActive ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-900'
            }`
          }
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Orders</span>
        </NavLink>
        <NavLink
          to="/admin/menu"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
              isActive ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-900'
            }`
          }
        >
          <Utensils className="w-5 h-5" />
          <span>Menu</span>
        </NavLink>
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
              isActive ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-900'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink
          to="/admin/settings"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
              isActive ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-900'
            }`
          }
        >
          <MoreHorizontal className="w-5 h-5" />
          <span>More</span>
        </NavLink>
      </nav>
    </div>
  )
}
