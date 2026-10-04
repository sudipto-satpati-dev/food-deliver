import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useAdminCouponsQuery,
  useToggleCouponActiveMutation,
  useDeleteCouponMutation,
} from './hooks'
import { Price } from '@/components/common/Price'
import { ListSkeleton } from '@/components/common/Skeletons'
import { ErrorState } from '@/components/common/ErrorState'
import {
  Plus,
  Ticket,
  Calendar,
  Edit2,
  Trash2,
  Sparkles,
  Percent,
  Tag,
} from 'lucide-react'
import { Coupon } from '@/types/database'

export const AdminCouponsPage: React.FC = () => {
  const navigate = useNavigate()
  const { data: coupons, isLoading, isError, refetch } = useAdminCouponsQuery()
  const toggleActiveMutation = useToggleCouponActiveMutation()
  const deleteMutation = useDeleteCouponMutation()

  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all')

  if (isLoading) {
    return (
      <div className="py-6 max-w-5xl mx-auto">
        <ListSkeleton />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="py-8 max-w-5xl mx-auto">
        <ErrorState
          title="Could not load coupons"
          message="Failed to fetch promotional coupons. Please try again."
          onRetry={refetch}
        />
      </div>
    )
  }

  const filteredCoupons = (coupons || []).filter((coupon) => {
    if (activeTab === 'active') return coupon.is_active
    if (activeTab === 'inactive') return !coupon.is_active
    return true
  })

  const handleDelete = (coupon: Coupon) => {
    if (confirm(`Are you sure you want to delete coupon "${coupon.code}"?`)) {
      deleteMutation.mutate(coupon.id)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-dark flex items-center gap-2">
            <Ticket className="w-6 h-6 text-brand-primary" />
            <span>Discount Coupons & Offers</span>
          </h1>
          <p className="text-xs text-brand-muted">
            Create and manage promotional discount codes and cart rules
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/coupons/new')}
          className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-btn shadow-soft hover:bg-brand-primary/95 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-brand-border gap-2 pb-1">
        {[
          { id: 'all', label: 'All Coupons', count: coupons?.length || 0 },
          { id: 'active', label: 'Active', count: coupons?.filter((c) => c.is_active).length || 0 },
          { id: 'inactive', label: 'Inactive / Expired', count: coupons?.filter((c) => !c.is_active).length || 0 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-xs font-bold rounded-btn transition-colors flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-brand-primary text-white shadow-soft'
                : 'bg-white border border-brand-border text-brand-muted hover:text-brand-dark'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-brand-surface text-brand-dark'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Coupons List Grid */}
      {filteredCoupons.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-card border border-brand-border space-y-3">
          <Ticket className="w-12 h-12 text-brand-muted/40 mx-auto" />
          <h3 className="text-sm font-bold text-brand-dark">No coupons found</h3>
          <p className="text-xs text-brand-muted max-w-sm mx-auto">
            {activeTab === 'all'
              ? 'No promotional coupons created yet. Click "Create Coupon" to add your first offer!'
              : `No ${activeTab} coupons found.`}
          </p>
          <button
            onClick={() => navigate('/admin/coupons/new')}
            className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-btn shadow-soft"
          >
            + Create New Coupon
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCoupons.map((coupon) => {
            const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date()

            return (
              <div
                key={coupon.id}
                className={`p-4 bg-white rounded-card border transition-all space-y-3 relative ${
                  coupon.is_active && !isExpired
                    ? 'border-brand-primary/30 shadow-soft'
                    : 'border-brand-border bg-gray-50/50 opacity-80'
                }`}
              >
                {/* Top Row: Code Badge & Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-brand-primary text-white font-mono text-sm font-extrabold rounded shadow-subtle flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      {coupon.code}
                    </span>
                    {isExpired && (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded">
                        EXPIRED
                      </span>
                    )}
                  </div>

                  {/* Toggle Active Switch */}
                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={coupon.is_active}
                        onChange={(e) =>
                          toggleActiveMutation.mutate({
                            id: coupon.id,
                            isActive: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>

                    <button
                      type="button"
                      onClick={() => navigate(`/admin/coupons/${coupon.id}`)}
                      className="p-1.5 text-brand-muted hover:text-brand-dark hover:bg-brand-surface rounded transition-colors"
                      title="Edit Coupon"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(coupon)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                      title="Delete Coupon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Offer Summary Title */}
                <div>
                  <h3 className="font-bold text-sm text-brand-dark flex items-center gap-1.5">
                    {coupon.type === 'percent' ? (
                      <>
                        <Percent className="w-4 h-4 text-brand-primary" />
                        <span>
                          {coupon.value}% OFF
                          {coupon.max_discount ? ` (up to ₹${coupon.max_discount})` : ''}
                        </span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>FLAT ₹{coupon.value} OFF</span>
                      </>
                    )}
                  </h3>
                  {coupon.description && (
                    <p className="text-xs text-brand-muted mt-0.5">{coupon.description}</p>
                  )}
                </div>

                {/* Rules & Limits Info */}
                <div className="pt-2 border-t border-brand-border/60 grid grid-cols-2 gap-2 text-[11px] text-brand-muted">
                  <div>
                    <span className="font-semibold text-brand-dark">Min Order: </span>
                    <Price amount={coupon.min_order} />
                  </div>

                  <div>
                    <span className="font-semibold text-brand-dark">Per-user limit: </span>
                    {coupon.per_user_limit ? `${coupon.per_user_limit} order(s)` : 'Unlimited'}
                  </div>

                  {coupon.usage_limit && (
                    <div>
                      <span className="font-semibold text-brand-dark">Total limit: </span>
                      {coupon.usage_limit} total uses
                    </div>
                  )}

                  {coupon.expires_at && (
                    <div className="flex items-center gap-1 col-span-2">
                      <Calendar className="w-3 h-3 text-brand-muted" />
                      <span>Expires: {new Date(coupon.expires_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
