import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  useAdminCouponDetailQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
} from './hooks'
import { DetailSkeleton } from '@/components/common/Skeletons'
import { ErrorState } from '@/components/common/ErrorState'
import {
  ArrowLeft,
  Save,
  Calendar,
  Tag,
  Loader2,
} from 'lucide-react'

const couponSchema = z.object({
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(20, 'Code max 20 characters')
    .regex(/^[A-Z0-9_-]+$/, 'Code can only contain letters, numbers, hyphens and underscores'),
  description: z.string().optional().nullable(),
  type: z.enum(['percent', 'flat']),
  value: z.number().min(1, 'Discount value must be greater than 0'),
  max_discount: z.number().min(0).optional().nullable(),
  min_order: z.number().min(0, 'Minimum order cannot be negative'),
  expires_at: z.string().optional().nullable(),
  usage_limit: z.number().min(1).optional().nullable(),
  per_user_limit: z.number().min(1, 'Per user limit must be at least 1').optional().nullable(),
  is_active: z.boolean().default(true),
})

type CouponFormData = z.infer<typeof couponSchema>

export const AdminCouponFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = Boolean(id && id !== 'new')

  const { data: existingCoupon, isLoading, isError } = useAdminCouponDetailQuery(
    isEditing ? id : undefined
  )

  const createMutation = useCreateCouponMutation()
  const updateMutation = useUpdateCouponMutation(id || '')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: '',
      description: '',
      type: 'percent',
      value: 10,
      max_discount: 100,
      min_order: 199,
      per_user_limit: 1,
      is_active: true,
    },
  })

  // Watch form fields for Live Preview Card
  const watchedCode = watch('code') || 'YOURCODE'
  const watchedType = watch('type')
  const watchedValue = watch('value') || 0
  const watchedMaxDiscount = watch('max_discount')
  const watchedMinOrder = watch('min_order') || 0
  const watchedDescription = watch('description')

  useEffect(() => {
    if (existingCoupon) {
      reset({
        code: existingCoupon.code,
        description: existingCoupon.description || '',
        type: existingCoupon.type,
        value: Number(existingCoupon.value),
        max_discount: existingCoupon.max_discount ? Number(existingCoupon.max_discount) : null,
        min_order: Number(existingCoupon.min_order),
        expires_at: existingCoupon.expires_at ? existingCoupon.expires_at.slice(0, 16) : '',
        usage_limit: existingCoupon.usage_limit ? Number(existingCoupon.usage_limit) : null,
        per_user_limit: existingCoupon.per_user_limit ? Number(existingCoupon.per_user_limit) : 1,
        is_active: existingCoupon.is_active,
      })
    }
  }, [existingCoupon, reset])

  if (isEditing && isLoading) {
    return (
      <div className="py-6 max-w-2xl mx-auto">
        <DetailSkeleton />
      </div>
    )
  }

  if (isEditing && isError) {
    return (
      <div className="py-8 max-w-2xl mx-auto">
        <ErrorState
          title="Coupon not found"
          message="Could not load the requested coupon details."
        />
      </div>
    )
  }

  const onSubmit = async (data: CouponFormData) => {
    const payload = {
      code: data.code.toUpperCase().trim(),
      description: data.description || null,
      type: data.type,
      value: Number(data.value),
      max_discount: data.type === 'percent' && data.max_discount ? Number(data.max_discount) : null,
      min_order: Number(data.min_order || 0),
      expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : null,
      usage_limit: data.usage_limit ? Number(data.usage_limit) : null,
      per_user_limit: data.per_user_limit ? Number(data.per_user_limit) : 1,
      is_active: data.is_active,
    }

    try {
      if (isEditing && id) {
        await updateMutation.mutateAsync(payload as any)
      } else {
        await createMutation.mutateAsync(payload as any)
      }
      navigate('/admin/coupons')
    } catch (err) {
      // Error handled by mutation
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/coupons')}
            className="p-2 -ml-2 text-brand-dark hover:bg-brand-surface rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-heading text-xl font-bold text-brand-dark">
              {isEditing ? `Edit Coupon: ${existingCoupon?.code}` : 'Create New Coupon'}
            </h1>
            <p className="text-xs text-brand-muted">
              Configure promo code rules, discount values, and customer restrictions
            </p>
          </div>
        </div>
      </div>

      {/* LIVE PREVIEW CARD */}
      <div className="p-4 bg-gradient-to-r from-brand-primary to-brand-accent text-white rounded-card shadow-soft space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-widest bg-black/20 px-2 py-0.5 rounded">
            Live Offer Preview
          </span>
          <span className="font-mono font-black text-sm bg-white text-brand-dark px-2.5 py-0.5 rounded shadow">
            {watchedCode.toUpperCase()}
          </span>
        </div>

        <div className="py-1">
          <h3 className="font-heading text-lg font-black flex items-center gap-1.5">
            {watchedType === 'percent' ? (
              <span>
                Get {watchedValue}% OFF
                {watchedMaxDiscount ? ` up to ₹${watchedMaxDiscount}` : ''}
              </span>
            ) : (
              <span>Get FLAT ₹{watchedValue} OFF</span>
            )}
          </h3>
          <p className="text-xs text-white/90 font-medium">
            Valid on orders above ₹{watchedMinOrder}
            {watchedDescription ? ` • "${watchedDescription}"` : ''}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit(onSubmit)} className="p-5 bg-white rounded-card border border-brand-border space-y-5">
        {/* Code & Active Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">
              Coupon Code <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-brand-muted absolute left-3 top-3" />
              <input
                type="text"
                {...register('code')}
                onChange={(e) => setValue('code', e.target.value.toUpperCase().replace(/\s+/g, ''))}
                placeholder="e.g. WELCOME50"
                className="w-full pl-9 pr-3 py-2 border border-brand-border rounded-btn text-sm font-mono font-bold uppercase focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
              />
            </div>
            {errors.code && <p className="text-[11px] text-rose-500">{errors.code.message}</p>}
          </div>

          <div className="space-y-1.5 flex flex-col justify-end">
            <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">
              Status
            </label>
            <div className="flex items-center gap-2 h-10 px-3 bg-brand-surface rounded-btn border border-brand-border">
              <input
                type="checkbox"
                id="is_active"
                {...register('is_active')}
                className="w-4 h-4 text-brand-primary rounded border-brand-border focus:ring-brand-primary"
              />
              <label htmlFor="is_active" className="text-xs font-bold text-brand-dark cursor-pointer">
                Active & Live
              </label>
            </div>
          </div>
        </div>

        {/* Discount Type & Value */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">
              Discount Type
            </label>
            <select
              {...register('type')}
              className="w-full px-3 py-2 border border-brand-border rounded-btn text-xs font-bold text-brand-dark bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
            >
              <option value="percent">Percentage (%)</option>
              <option value="flat">Flat Amount (₹)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">
              {watchedType === 'percent' ? 'Discount Percent (%)' : 'Flat Discount Amount (₹)'}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="any"
              {...register('value', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-brand-border rounded-btn text-sm font-bold text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
            />
            {errors.value && <p className="text-[11px] text-rose-500">{errors.value.message}</p>}
          </div>

          {watchedType === 'percent' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">
                Max Discount Cap (₹)
              </label>
              <input
                type="number"
                step="any"
                {...register('max_discount', {
                  setValueAs: (v) => (v === '' || isNaN(v) ? null : Number(v)),
                })}
                placeholder="e.g. 100 (Optional)"
                className="w-full px-3 py-2 border border-brand-border rounded-btn text-sm font-bold text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
              />
            </div>
          )}
        </div>

        {/* Min Order & Limits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">
              Min Order Subtotal (₹)
            </label>
            <input
              type="number"
              step="any"
              {...register('min_order', { valueAsNumber: true })}
              placeholder="e.g. 199"
              className="w-full px-3 py-2 border border-brand-border rounded-btn text-sm font-bold text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">
              Per-User Limit
            </label>
            <input
              type="number"
              {...register('per_user_limit', {
                setValueAs: (v) => (v === '' || isNaN(v) ? 1 : Number(v)),
              })}
              placeholder="1"
              className="w-full px-3 py-2 border border-brand-border rounded-btn text-sm font-bold text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">
              Total Overall Limit
            </label>
            <input
              type="number"
              {...register('usage_limit', {
                setValueAs: (v) => (v === '' || isNaN(v) ? null : Number(v)),
              })}
              placeholder="Unlimited"
              className="w-full px-3 py-2 border border-brand-border rounded-btn text-sm font-bold text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
            />
          </div>
        </div>

        {/* Expiry Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-brand-dark uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-brand-primary" />
            <span>Expiry Date & Time (Optional)</span>
          </label>
          <input
            type="datetime-local"
            {...register('expires_at')}
            className="w-full max-w-sm px-3 py-2 border border-brand-border rounded-btn text-xs font-bold text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
          />
        </div>

        {/* Description / Terms */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">
            Description / Terms (Optional)
          </label>
          <textarea
            {...register('description')}
            rows={2}
            placeholder="e.g. Valid on all main course items for dinner orders"
            className="w-full px-3 py-2 border border-brand-border rounded-btn text-xs font-medium text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-brand-border flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/coupons')}
            className="px-4 py-2 bg-brand-surface text-brand-dark text-xs font-bold rounded-btn border border-brand-border hover:bg-brand-surface/80 transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-brand-primary text-white text-xs font-bold rounded-btn shadow-soft hover:bg-brand-primary/95 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isEditing ? 'Update Coupon' : 'Create Coupon'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
