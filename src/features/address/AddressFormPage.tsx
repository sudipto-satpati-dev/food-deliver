import React, { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/features/auth/hooks'
import { useSettingsQuery } from '@/features/admin/hooks'
import {
  useAddressDetail,
  useCreateAddressMutation,
  useUpdateAddressMutation,
} from './hooks'
import { MapPicker } from '@/components/common/MapPicker'
import { calculateHaversineDistanceKm } from '@/lib/geo'
import {
  ArrowLeft,
  MapPin,
  Home,
  Briefcase,
  User,
  Phone,
  Building,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

const addressSchema = z.object({
  label: z.string().min(1, 'Please enter or select an address label'),
  contact_name: z.string().min(2, 'Contact name must be at least 2 characters'),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number'),
  line1: z.string().min(5, 'Flat/House no. and street address is required'),
  line2: z.string().optional(),
  landmark: z.string().optional(),
  lat: z.number({ required_error: 'Please select a pin on the map' }),
  lng: z.number({ required_error: 'Please select a pin on the map' }),
  is_default: z.boolean().default(false),
})

type AddressFormData = z.infer<typeof addressSchema>

export const AddressFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect')

  const { user, profile } = useAuth()
  const { data: settings } = useSettingsQuery()
  const { data: existingAddress, isLoading: isLoadingExisting } = useAddressDetail(id)

  const createMutation = useCreateAddressMutation()
  const updateMutation = useUpdateAddressMutation()

  const restLat = settings?.lat ?? 22.5726
  const restLng = settings?.lng ?? 88.3639
  const radiusKm = settings?.delivery_radius_km ?? 5.0

  const [distanceKm, setDistanceKm] = useState<number>(0)
  const [customLabel, setCustomLabel] = useState<string>('Home')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: 'Home',
      contact_name: profile?.full_name || '',
      phone: profile?.phone || '',
      line1: '',
      line2: '',
      landmark: '',
      lat: restLat,
      lng: restLng,
      is_default: false,
    },
  })

  const currentLat = watch('lat')
  const currentLng = watch('lng')
  const currentLabel = watch('label')

  // Set default values when editing or when profile finishes loading
  useEffect(() => {
    if (isEditing && existingAddress) {
      reset({
        label: existingAddress.label,
        contact_name: existingAddress.contact_name,
        phone: existingAddress.phone,
        line1: existingAddress.line1,
        line2: existingAddress.line2 || '',
        landmark: existingAddress.landmark || '',
        lat: existingAddress.lat,
        lng: existingAddress.lng,
        is_default: existingAddress.is_default,
      })
      setCustomLabel(existingAddress.label)
      const dist = calculateHaversineDistanceKm(
        restLat,
        restLng,
        existingAddress.lat,
        existingAddress.lng
      )
      setDistanceKm(dist)
    } else if (!isEditing && profile) {
      if (profile.full_name) setValue('contact_name', profile.full_name)
      if (profile.phone) setValue('phone', profile.phone)
      setValue('lat', restLat)
      setValue('lng', restLng)
      setDistanceKm(0)
    }
  }, [existingAddress, profile, isEditing, reset, restLat, restLng, setValue])

  // Handle map pin movement
  const handleLocationChange = (
    lat: number,
    lng: number,
    dist: number,
    geocodedAddr?: string
  ) => {
    setValue('lat', lat, { shouldValidate: true })
    setValue('lng', lng, { shouldValidate: true })
    setDistanceKm(dist)

    // Auto-fill line1 if blank and reverse geocode result returned
    if (geocodedAddr && !watch('line1')) {
      setValue('line1', geocodedAddr, { shouldValidate: true })
    }
  }

  const handleSelectChipLabel = (lbl: string) => {
    setCustomLabel(lbl)
    setValue('label', lbl, { shouldValidate: true })
  }

  const onSubmit = async (data: AddressFormData) => {
    if (!user) {
      toast.error('You must be logged in to save an address.')
      return
    }

    if (isEditing && id) {
      await updateMutation.mutateAsync({
        id,
        address: {
          label: data.label,
          contact_name: data.contact_name,
          phone: data.phone,
          line1: data.line1,
          line2: data.line2 || null,
          landmark: data.landmark || null,
          lat: data.lat,
          lng: data.lng,
          is_default: data.is_default,
        },
        userId: user.id,
      })
    } else {
      await createMutation.mutateAsync({
        user_id: user.id,
        label: data.label,
        contact_name: data.contact_name,
        phone: data.phone,
        line1: data.line1,
        line2: data.line2 || null,
        landmark: data.landmark || null,
        lat: data.lat,
        lng: data.lng,
        is_default: data.is_default,
      })
    }

    if (redirect) {
      navigate(redirect)
    } else {
      navigate('/addresses')
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending
  const isDeliverable = distanceKm <= radiusKm

  if (isEditing && isLoadingExisting) {
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-8 max-w-lg mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-brand-dark hover:bg-brand-surface rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-heading text-xl font-bold text-brand-dark">
            {isEditing ? 'Edit Address' : 'Add New Address'}
          </h1>
          <p className="text-xs text-brand-muted">
            Pin location on map & fill address details
          </p>
        </div>
      </div>

      {/* Interactive Leaflet Map Picker */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-brand-dark flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-brand-primary" />
            Drag Pin to Delivery Location
          </label>

          {/* Deliverability Badge */}
          <span
            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
              isDeliverable
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {isDeliverable ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>{distanceKm} km · Deliverable</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                <span>{distanceKm} km · Outside 5 km limit</span>
              </>
            )}
          </span>
        </div>

        <MapPicker
          restaurantLat={restLat}
          restaurantLng={restLng}
          deliveryRadiusKm={radiusKm}
          initialLat={currentLat}
          initialLng={currentLng}
          onLocationChange={handleLocationChange}
          height="240px"
        />
        <p className="text-[11px] text-brand-muted">
          💡 Tap button on map to use current GPS, or drag marker to exact house location.
        </p>
      </div>

      {/* Address Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Address Label Chips */}
        <div>
          <label className="block text-xs font-bold text-brand-dark mb-1.5">
            Address Label
          </label>
          <div className="flex items-center gap-2 mb-2">
            {[
              { id: 'Home', icon: Home },
              { id: 'Work', icon: Briefcase },
              { id: 'Other', icon: MapPin },
            ].map(({ id: labelId, icon: Icon }) => (
              <button
                key={labelId}
                type="button"
                onClick={() => handleSelectChipLabel(labelId)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-full transition-all border ${
                  currentLabel === labelId
                    ? 'bg-brand-primary text-white border-brand-primary shadow-soft'
                    : 'bg-white text-brand-dark border-brand-border hover:bg-brand-surface'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{labelId}</span>
              </button>
            ))}
          </div>

          {currentLabel !== 'Home' && currentLabel !== 'Work' && (
            <input
              type="text"
              placeholder="e.g. Friend's place, Gym"
              {...register('label')}
              className="w-full px-3 py-2 text-xs border border-brand-border rounded-btn focus:outline-none focus:border-brand-primary"
            />
          )}
          {errors.label && (
            <p className="text-[11px] text-rose-600 mt-1">{errors.label.message}</p>
          )}
        </div>

        {/* Contact Name & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-brand-dark mb-1">
              Contact Person Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-brand-muted absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                {...register('contact_name')}
                className="w-full pl-9 pr-3 py-2 text-xs border border-brand-border rounded-btn focus:outline-none focus:border-brand-primary"
              />
            </div>
            {errors.contact_name && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.contact_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-dark mb-1">
              Contact Phone Number *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-brand-muted absolute left-3 top-2.5" />
              <input
                type="tel"
                placeholder="10-digit mobile number"
                maxLength={10}
                {...register('phone')}
                className="w-full pl-9 pr-3 py-2 text-xs border border-brand-border rounded-btn focus:outline-none focus:border-brand-primary"
              />
            </div>
            {errors.phone && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.phone.message}</p>
            )}
          </div>
        </div>

        {/* Line 1 (Flat, House no., Street) */}
        <div>
          <label className="block text-xs font-bold text-brand-dark mb-1">
            Flat, House / Floor No., Building & Street *
          </label>
          <div className="relative">
            <Building className="w-4 h-4 text-brand-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="e.g. Flat 302, Sunrise Apartments, Mg Road"
              {...register('line1')}
              className="w-full pl-9 pr-3 py-2 text-xs border border-brand-border rounded-btn focus:outline-none focus:border-brand-primary"
            />
          </div>
          {errors.line1 && (
            <p className="text-[11px] text-rose-600 mt-1">{errors.line1.message}</p>
          )}
        </div>

        {/* Line 2 (Area / Sector) */}
        <div>
          <label className="block text-xs font-bold text-brand-dark mb-1">
            Area / Colony / Sector (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Sector 5, Salt Lake"
            {...register('line2')}
            className="w-full px-3 py-2 text-xs border border-brand-border rounded-btn focus:outline-none focus:border-brand-primary"
          />
        </div>

        {/* Landmark */}
        <div>
          <label className="block text-xs font-bold text-brand-dark mb-1">
            Nearby Landmark (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Near HDFC Bank ATM"
            {...register('landmark')}
            className="w-full px-3 py-2 text-xs border border-brand-border rounded-btn focus:outline-none focus:border-brand-primary"
          />
        </div>

        {/* Default Checkbox */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="is_default"
            {...register('is_default')}
            className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary accent-brand-primary"
          />
          <label htmlFor="is_default" className="text-xs font-semibold text-brand-dark cursor-pointer">
            Set as default delivery address
          </label>
        </div>

        {/* Outside Delivery Zone Notice */}
        {!isDeliverable && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-btn text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Outside standard delivery area ({distanceKm} km)</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Our kitchen only delivers up to {radiusKm} km. You can still save this address, but orders cannot be placed to locations beyond {radiusKm} km.
              </p>
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3 bg-brand-primary text-white font-bold text-sm rounded-btn shadow-soft hover:bg-brand-primary/95 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Address...</span>
            </>
          ) : (
            <span>{isEditing ? 'Update Address' : 'Save Address'}</span>
          )}
        </button>
      </form>
    </div>
  )
}
