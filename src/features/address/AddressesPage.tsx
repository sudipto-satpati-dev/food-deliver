import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks'
import {
  useUserAddresses,
  useSetDefaultAddressMutation,
  useDeleteAddressMutation,
} from './hooks'
import { useSettingsQuery } from '@/features/admin/hooks'
import { calculateHaversineDistanceKm } from '@/lib/geo'
import { EmptyState } from '@/components/common/EmptyState'
import { ListSkeleton } from '@/components/common/Skeletons'
import { ErrorState } from '@/components/common/ErrorState'
import {
  Plus,
  MapPin,
  Home,
  Briefcase,
  Star,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Phone,
  User,
} from 'lucide-react'
import { toast } from 'sonner'

export const AddressesPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: addresses, isLoading, isError, refetch } = useUserAddresses(user?.id)
  const { data: settings } = useSettingsQuery()

  const setDefaultMutation = useSetDefaultAddressMutation()
  const deleteMutation = useDeleteAddressMutation()

  const restLat = settings?.lat ?? 22.5726
  const restLng = settings?.lng ?? 88.3639
  const radiusKm = settings?.delivery_radius_km ?? 5.0

  if (!user) {
    return (
      <div className="py-12 px-4 text-center space-y-4">
        <MapPin className="w-12 h-12 mx-auto text-brand-muted" />
        <h2 className="font-heading text-lg font-bold">Please log in</h2>
        <p className="text-sm text-brand-muted">
          Log in to manage your saved delivery addresses.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2.5 bg-brand-primary text-white rounded-btn text-sm font-bold shadow-soft"
        >
          Go to Login
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="py-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-7 w-40 bg-brand-surface rounded animate-pulse" />
          <div className="h-9 w-28 bg-brand-surface rounded-btn animate-pulse" />
        </div>
        <ListSkeleton count={3} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="py-6">
        <ErrorState
          title="Could not load addresses"
          message="Failed to fetch your saved addresses. Please try again."
          onRetry={refetch}
        />
      </div>
    )
  }

  const handleDelete = (id: string, label: string) => {
    if (confirm(`Are you sure you want to delete "${label}" address?`)) {
      deleteMutation.mutate({ id, userId: user.id })
    }
  }

  const handleSetDefault = (addressId: string) => {
    setDefaultMutation.mutate({ userId: user.id, addressId })
  }

  const getLabelIcon = (label: string) => {
    const l = label.toLowerCase()
    if (l.includes('home')) return <Home className="w-4 h-4" />
    if (l.includes('work') || l.includes('office')) return <Briefcase className="w-4 h-4" />
    return <MapPin className="w-4 h-4" />
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-brand-dark">Saved Addresses</h1>
          <p className="text-xs text-brand-muted">Deliveries within {radiusKm} km radius</p>
        </div>
        <button
          onClick={() => navigate('/addresses/new')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-primary text-white text-xs font-bold rounded-btn shadow-soft hover:bg-brand-primary/95 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New</span>
        </button>
      </div>

      {/* Addresses List */}
      {!addresses || addresses.length === 0 ? (
        <EmptyState
          icon={<MapPin className="w-10 h-10 text-brand-muted" />}
          title="No addresses saved yet"
          message="Add your delivery address to quickly place food orders."
          actionLabel="Add Address"
          onAction={() => navigate('/addresses/new')}
        />
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => {
            const distance = calculateHaversineDistanceKm(restLat, restLng, addr.lat, addr.lng)
            const isDeliverable = distance <= radiusKm

            return (
              <div
                key={addr.id}
                className={`p-4 rounded-card border transition-all ${
                  addr.is_default
                    ? 'bg-brand-primary/5 border-brand-primary/40 shadow-subtle'
                    : 'bg-white border-brand-border'
                }`}
              >
                {/* Header Row: Label, Default Badge & Distance */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-brand-surface rounded-full text-brand-dark">
                      {getLabelIcon(addr.label)}
                      {addr.label}
                    </span>

                    {addr.is_default && (
                      <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 bg-brand-primary text-white rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        DEFAULT
                      </span>
                    )}
                  </div>

                  {/* Distance badge */}
                  <div
                    className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                      isDeliverable
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {isDeliverable ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{distance} km · Deliverable</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 text-rose-500" />
                        <span>{distance} km · Outside area</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Contact Name & Phone */}
                <div className="text-xs text-brand-muted flex flex-wrap items-center gap-3 mb-1.5">
                  <span className="flex items-center gap-1 font-semibold text-brand-dark">
                    <User className="w-3 h-3 text-brand-muted" />
                    {addr.contact_name}
                  </span>
                  <span className="flex items-center gap-1 text-brand-muted">
                    <Phone className="w-3 h-3" />
                    {addr.phone}
                  </span>
                </div>

                {/* Full Address Text */}
                <div className="text-xs text-brand-dark leading-relaxed font-medium">
                  <p>{addr.line1}</p>
                  {addr.line2 && <p className="text-brand-muted">{addr.line2}</p>}
                  {addr.landmark && (
                    <p className="text-[11px] text-brand-muted italic mt-0.5">
                      Landmark: {addr.landmark}
                    </p>
                  )}
                </div>

                {/* Action Row */}
                <div className="flex items-center justify-between border-t border-brand-border/60 mt-3 pt-2.5">
                  {!addr.is_default ? (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      disabled={setDefaultMutation.isPending}
                      className="flex items-center gap-1 text-xs font-bold text-brand-muted hover:text-brand-primary transition-colors"
                    >
                      <Star className="w-3.5 h-3.5" />
                      <span>Set as Default</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-brand-primary font-bold">Primary address</span>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/addresses/${addr.id}`)}
                      className="p-1.5 text-brand-dark hover:text-brand-primary hover:bg-brand-surface rounded-md transition-colors"
                      title="Edit address"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(addr.id, addr.label)}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 text-brand-muted hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      title="Delete address"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
