import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  fetchSettings,
  updateSettings,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchMenuItems,
  fetchMenuItemById,
  toggleMenuItemAvailability,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  fetchAdminOrders,
  fetchAdminRiders,
  toggleRiderActiveStatus,
  createRiderAccount,
  updateOrderStatus,
  assignRiderToOrder,
  adminMarkDelivered,
  refundPayment,
  fetchAdminCoupons,
  fetchAdminCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponActiveStatus,
  fetchAdminReviews,
  replyToReview,
  fetchSalesSummary,
  fetchTopSellingItems,
  CreateMenuItemPayload,
} from './api'
import { Settings, Category, OrderStatus, Coupon } from '@/types/database'
import { toast } from 'sonner'
import { soundManager } from '@/lib/sound'

// ---------- SETTINGS HOOKS ----------
export function useSettingsQuery() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  })
}

export function useUpdateSettingsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (updates: Partial<Settings>) => updateSettings(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Restaurant settings updated successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update settings.')
    },
  })
}

// ---------- CATEGORIES HOOKS ----------
export function useCategoriesQuery() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })
}

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category created successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create category.')
    },
  })
}

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Category> }) => updateCategory(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category updated!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update category.')
    },
  })
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category deleted!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete category.')
    },
  })
}

// ---------- MENU ITEMS HOOKS ----------
export function useMenuItemsQuery() {
  return useQuery({
    queryKey: ['menu-items'],
    queryFn: fetchMenuItems,
  })
}

export function useMenuItemDetailQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['menu-item', id],
    queryFn: () => fetchMenuItemById(id!),
    enabled: !!id,
  })
}

export function useToggleItemAvailabilityMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, is_available }: { id: string; is_available: boolean }) =>
      toggleMenuItemAvailability(id, is_available),
    onMutate: async ({ id, is_available }) => {
      await queryClient.cancelQueries({ queryKey: ['menu-items'] })
      const previousItems = queryClient.getQueryData(['menu-items'])
      queryClient.setQueryData(['menu-items'], (old: any) => {
        if (!old) return old
        return old.map((item: any) => (item.id === id ? { ...item, is_available } : item))
      })
      return { previousItems }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(['menu-items'], context.previousItems)
      }
      toast.error('Failed to toggle item availability.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] })
    },
  })
}

export function useCreateMenuItemMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMenuItemPayload) => createMenuItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] })
      toast.success('Menu item created successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create menu item.')
    },
  })
}

export function useUpdateMenuItemMutation(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<CreateMenuItemPayload>) => updateMenuItem(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] })
      queryClient.invalidateQueries({ queryKey: ['menu-item', id] })
      toast.success('Menu item updated successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update menu item.')
    },
  })
}

export function useDeleteMenuItemMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] })
      toast.success('Menu item deleted!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete menu item.')
    },
  })
}

// ---------- ADMIN ORDERS & REALTIME HOOKS ----------
export function useAdminOrdersQuery() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('admin-all-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['admin-orders'] })

          const newRec = payload.new as any
          const oldRec = payload.old as any

          const isNewCodOrder = payload.eventType === 'INSERT' && newRec?.status === 'placed'
          const isOnlinePaidOrder =
            payload.eventType === 'UPDATE' &&
            oldRec?.status === 'pending_payment' &&
            newRec?.status === 'placed'

          if (isNewCodOrder || isOnlinePaidOrder) {
            soundManager.playNewOrderAlert()
            toast.success(`🚨 NEW ORDER #${newRec.order_no} RECEIVED!`, {
              duration: 8000,
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return useQuery({
    queryKey: ['admin-orders'],
    queryFn: fetchAdminOrders,
  })
}

export function useAdminRidersQuery() {
  return useQuery({
    queryKey: ['admin-riders'],
    queryFn: fetchAdminRiders,
  })
}

export function useToggleRiderActiveMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ riderId, isActive }: { riderId: string; isActive: boolean }) =>
      toggleRiderActiveStatus(riderId, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-riders'] })
      toast.success(`Rider status updated: ${variables.isActive ? 'Active' : 'Inactive'}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update rider status.')
    },
  })
}

export function useCreateRiderMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { full_name: string; phone: string; email: string; password: string }) =>
      createRiderAccount(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-riders'] })
      toast.success('New delivery rider account created!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create rider account.')
    },
  })
}

export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, status, reason }: { orderId: string; status: OrderStatus; reason?: string }) =>
      updateOrderStatus(orderId, status, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      toast.success(`Order status updated to ${variables.status.replace(/_/g, ' ')}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update status.')
    },
  })
}

export function useAssignRiderMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, riderId }: { orderId: string; riderId: string }) =>
      assignRiderToOrder(orderId, riderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      toast.success('Rider assigned to order!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to assign rider.')
    },
  })
}

export function useAdminMarkDeliveredMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) =>
      adminMarkDelivered(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      toast.success('Order marked as delivered (Admin Override)!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to mark as delivered.')
    },
  })
}

export function useRefundPaymentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => refundPayment(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      toast.success('Payment refund initiated successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Refund processing failed.')
    },
  })
}

// ---------- COUPONS HOOKS ----------
export function useAdminCouponsQuery() {
  return useQuery({
    queryKey: ['admin-coupons'],
    queryFn: fetchAdminCoupons,
  })
}

export function useAdminCouponDetailQuery(id: string | undefined) {
  return useQuery({
    queryKey: ['admin-coupon', id],
    queryFn: () => fetchAdminCouponById(id!),
    enabled: !!id,
  })
}

export function useCreateCouponMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Omit<Coupon, 'id' | 'created_at'>) => createCoupon(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
      queryClient.invalidateQueries({ queryKey: ['active-coupons'] })
      toast.success('Coupon created successfully! 🎟️')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create coupon.')
    },
  })
}

export function useUpdateCouponMutation(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<Coupon>) => updateCoupon(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
      queryClient.invalidateQueries({ queryKey: ['admin-coupon', id] })
      queryClient.invalidateQueries({ queryKey: ['active-coupons'] })
      toast.success('Coupon updated successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update coupon.')
    },
  })
}

export function useDeleteCouponMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
      queryClient.invalidateQueries({ queryKey: ['active-coupons'] })
      toast.success('Coupon deleted!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete coupon.')
    },
  })
}

export function useToggleCouponActiveMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleCouponActiveStatus(id, isActive),
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-coupons'] })
      const previous = queryClient.getQueryData(['admin-coupons'])
      queryClient.setQueryData(['admin-coupons'], (old: any) => {
        if (!old) return old
        return old.map((c: any) => (c.id === id ? { ...c, is_active: isActive } : c))
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['admin-coupons'], context.previous)
      }
      toast.error('Failed to update coupon status.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] })
      queryClient.invalidateQueries({ queryKey: ['active-coupons'] })
    },
  })
}

// ---------- ADMIN REVIEWS HOOKS ----------
export function useAdminReviewsQuery() {
  return useQuery({
    queryKey: ['admin-reviews'],
    queryFn: fetchAdminReviews,
  })
}

export function useReplyToReviewMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reviewId, reply }: { reviewId: string; reply: string }) =>
      replyToReview(reviewId, reply),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
      toast.success('Reply saved successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save reply.')
    },
  })
}

// ---------- SALES SUMMARY & REPORTS HOOKS ----------
export function useSalesSummaryQuery(fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: ['sales-summary', fromDate, toDate],
    queryFn: () => fetchSalesSummary(fromDate, toDate),
  })
}

export function useTopSellingItemsQuery(limit = 5, fromDate?: string, toDate?: string) {
  return useQuery({
    queryKey: ['top-selling-items', limit, fromDate, toDate],
    queryFn: () => fetchTopSellingItems(limit, fromDate, toDate),
  })
}

