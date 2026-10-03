import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  fetchUserOrders,
  fetchOrderById,
  fetchDeliveryOtp,
  fetchOrderRiderInfo,
  cancelUserOrder,
} from './api'
import { toast } from 'sonner'
import { playOrderSound } from '@/lib/sound'

export function useUserOrders(userId?: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    // Supabase Realtime channel for customer's orders
    const channel = supabase
      .channel(`user-orders-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['orders', userId] })

          // Play notification sound on status change
          if (payload.eventType === 'UPDATE' && payload.new) {
            playOrderSound('status')
            toast.info(`Order #${(payload.new as any).order_no} updated: ${(payload.new as any).status.replace(/_/g, ' ')}`)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, queryClient])

  return useQuery({
    queryKey: ['orders', userId],
    queryFn: () => fetchUserOrders(userId!),
    enabled: !!userId,
  })
}

export function useOrderDetail(orderId?: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!orderId) return

    // Realtime channel for specific order updates
    const channel = supabase
      .channel(`order-detail-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['order', orderId] })
          queryClient.invalidateQueries({ queryKey: ['order-otp', orderId] })
          queryClient.invalidateQueries({ queryKey: ['order-rider', orderId] })

          if (payload.eventType === 'UPDATE' && payload.new) {
            playOrderSound('status')
            toast.info(`Order status updated to: ${(payload.new as any).status.replace(/_/g, ' ')}`)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId, queryClient])

  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrderById(orderId!),
    enabled: !!orderId,
  })
}

export function useDeliveryOtp(orderId?: string, isOutForDelivery?: boolean) {
  return useQuery({
    queryKey: ['order-otp', orderId],
    queryFn: () => fetchDeliveryOtp(orderId!),
    enabled: !!orderId && Boolean(isOutForDelivery),
  })
}

export function useOrderRiderInfo(orderId?: string, hasRider?: boolean) {
  return useQuery({
    queryKey: ['order-rider', orderId],
    queryFn: () => fetchOrderRiderInfo(orderId!),
    enabled: !!orderId && Boolean(hasRider),
  })
}

export function useCancelOrderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) =>
      cancelUserOrder(orderId, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success('Order cancelled successfully.')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Could not cancel order.')
    },
  })
}
