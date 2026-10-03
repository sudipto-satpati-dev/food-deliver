import React, { useState } from 'react'
import {
  useAdminRidersQuery,
  useToggleRiderActiveMutation,
  useCreateRiderMutation,
} from './hooks'
import { ListSkeleton } from '@/components/common/Skeletons'
import { ErrorState } from '@/components/common/ErrorState'
import {
  Bike,
  Plus,
  Phone,
  Mail,
  User,
  CheckCircle2,
  XCircle,
  Radio,
  Loader2,
  Lock,
} from 'lucide-react'

export const AdminRidersPage: React.FC = () => {
  const { data: riders, isLoading, isError, refetch } = useAdminRidersQuery()
  const toggleActiveMutation = useToggleRiderActiveMutation()
  const createRiderMutation = useCreateRiderMutation()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: '',
  })

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-brand-surface rounded animate-pulse" />
        <ListSkeleton count={4} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <ErrorState
          title="Could not load riders"
          message="Failed to fetch rider profiles."
          onRetry={refetch}
        />
      </div>
    )
  }

  const handleCreateRiderSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createRiderMutation.mutate(formData, {
      onSuccess: () => {
        setIsModalOpen(false)
        setFormData({ full_name: '', phone: '', email: '', password: '' })
      },
    })
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-dark">
            Delivery Executives & Riders
          </h1>
          <p className="text-xs text-brand-muted">
            Manage delivery rider accounts, duty status, and activity
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-btn shadow-soft hover:bg-brand-primary/95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Rider</span>
        </button>
      </div>

      {/* Riders Grid */}
      {!riders || riders.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-card border border-brand-border space-y-3">
          <Bike className="w-10 h-10 mx-auto text-brand-muted" />
          <h3 className="font-heading text-sm font-bold text-brand-dark">No riders registered yet</h3>
          <p className="text-xs text-brand-muted">Add a rider account to start assigning orders.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-btn shadow-soft"
          >
            + Register First Rider
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {riders.map((rider) => (
            <div
              key={rider.id}
              className={`p-4 bg-white rounded-card border space-y-3 shadow-subtle transition-all ${
                rider.is_active ? 'border-brand-border' : 'border-rose-200 bg-rose-50/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-surface rounded-full flex items-center justify-center text-brand-primary border border-brand-border">
                    {rider.avatar_url ? (
                      <img
                        src={rider.avatar_url}
                        alt={rider.full_name || 'Rider'}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <Bike className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-brand-dark">
                      {rider.full_name || 'Rider'}
                    </h3>
                    <span
                      className={`text-[10px] font-bold flex items-center gap-1 mt-0.5 ${
                        rider.is_online ? 'text-emerald-600' : 'text-brand-muted'
                      }`}
                    >
                      <Radio className="w-3 h-3" />
                      {rider.is_online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    rider.is_active
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {rider.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                </span>
              </div>

              {rider.phone && (
                <div className="text-xs text-brand-muted flex items-center gap-1.5 pt-1 border-t border-brand-border/40">
                  <Phone className="w-3.5 h-3.5" />
                  <a href={`tel:${rider.phone}`} className="hover:underline font-medium text-brand-dark">
                    {rider.phone}
                  </a>
                </div>
              )}

              {/* Action Toggle */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() =>
                    toggleActiveMutation.mutate({ riderId: rider.id, isActive: !rider.is_active })
                  }
                  disabled={toggleActiveMutation.isPending}
                  className={`px-3 py-1 text-xs font-bold rounded-btn transition-colors flex items-center gap-1 ${
                    rider.is_active
                      ? 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                      : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                  }`}
                >
                  {rider.is_active ? (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Deactivate Account</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Activate Account</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Rider Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-card max-w-md w-full p-5 space-y-4 shadow-float border border-brand-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bike className="w-5 h-5 text-brand-primary" />
                <h3 className="font-heading font-bold text-base text-brand-dark">
                  Add Delivery Rider Account
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-brand-muted hover:text-brand-dark text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleCreateRiderSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-brand-dark mb-1">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-brand-muted absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Singh"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-brand-border rounded-btn focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-brand-dark mb-1">Phone Number *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-brand-muted absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-brand-border rounded-btn focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-brand-dark mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-brand-muted absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="rider@dinningzone.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-brand-border rounded-btn focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-brand-dark mb-1">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-brand-muted absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-brand-border rounded-btn focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={createRiderMutation.isPending}
                className="w-full py-2.5 bg-brand-primary text-white font-bold rounded-btn shadow-soft hover:bg-brand-primary/95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-2"
              >
                {createRiderMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <span>Register Rider Account</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
