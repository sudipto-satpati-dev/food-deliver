import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  fetchRiderOrders,
  verifyDeliveryOtp,
  toggleRiderOnlineStatus,
  startRiderDelivery,
} from './api'
import { toast } from 'sonner'
import { playOrderSound } from '@/lib/sound'

export function useRiderOrdersQuery(riderId?: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!riderId) return

    // Supabase Realtime subscription for rider's assigned orders
    const channel = supabase
      .channel(`rider-orders-${riderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `rider_id=eq.${riderId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['rider-orders', riderId] })

          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            playOrderSound('new')
            toast.info(`🔔 Assigned Order updated: Order #${(payload.new as any).order_no}`)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [riderId, queryClient])

  return useQuery({
    queryKey: ['rider-orders', riderId],
    queryFn: () => fetchRiderOrders(riderId!),
    enabled: !!riderId,
  })
}

export function useVerifyOtpMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, code }: { orderId: string; code: string }) =>
      verifyDeliveryOtp(orderId, code),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rider-orders'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] })
      toast.success('🎉 OTP Verified! Order marked as DELIVERED.')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Incorrect OTP code. Ask customer for 4-digit PIN.')
    },
  })
}

export function useToggleRiderOnlineMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ riderId, isOnline }: { riderId: string; isOnline: boolean }) =>
      toggleRiderOnlineStatus(riderId, isOnline),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profile', variables.riderId] })
      toast.success(`Duty status: ${variables.isOnline ? 'ONLINE 🟢' : 'OFFLINE 🔴'}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update online status.')
    },
  })
}

export function useStartDeliveryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: string) => startRiderDelivery(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rider-orders'] })
      toast.success('Order status updated to OUT FOR DELIVERY 🚀')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start delivery.')
    },
  })
}
