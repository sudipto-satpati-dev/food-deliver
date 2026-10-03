import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  CreateMenuItemPayload,
} from './api'
import { Settings, Category } from '@/types/database'
import { toast } from 'sonner'

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
      // Optimistic update
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
