import { useQuery, useMutation } from '@tanstack/react-query'
import {
  fetchPublicCategories,
  fetchPublicMenuItems,
  fetchActiveCoupons,
  validateCoupon,
} from './api'
import { toast } from 'sonner'

export function usePublicCategoriesQuery() {
  return useQuery({
    queryKey: ['public-categories'],
    queryFn: fetchPublicCategories,
  })
}

export function usePublicMenuItemsQuery() {
  return useQuery({
    queryKey: ['public-menu-items'],
    queryFn: fetchPublicMenuItems,
  })
}

export function useActiveCouponsQuery() {
  return useQuery({
    queryKey: ['active-coupons'],
    queryFn: fetchActiveCoupons,
  })
}

export function useValidateCouponMutation() {
  return useMutation({
    mutationFn: ({ code, subtotal }: { code: string; subtotal: number }) =>
      validateCoupon(code, subtotal),
    onError: (error: Error) => {
      toast.error(error.message || 'Coupon validation failed.')
    },
  })
}

export function useValidateCouponQuery(code: string | null, subtotal: number) {
  return useQuery({
    queryKey: ['coupon-validate', code, subtotal],
    queryFn: () => validateCoupon(code!, subtotal),
    enabled: Boolean(code && subtotal > 0),
  })
}
