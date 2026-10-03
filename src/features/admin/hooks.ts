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
  updateOrderStatus,
  assignRiderToOrder,
  adminMarkDelivered,
  CreateMenuItemPayload,
} from './api'
import { Settings, Category, OrderStatus } from '@/types/database'
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
    // Admin Realtime channel listening to ALL order changes
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

          if (payload.eventType === 'INSERT') {
            soundManager.playNewOrderAlert()
            toast.success(`🚨 NEW ORDER #${(payload.new as any).order_no} RECEIVED!`, {
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
