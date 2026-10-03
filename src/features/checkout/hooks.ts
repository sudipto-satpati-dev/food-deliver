import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  placeOrder,
  createRazorpayOrder,
  verifyRazorpayPayment,
  PlaceOrderPayload,
} from './api'
import { toast } from 'sonner'
import { useCartStore } from '@/stores/cart'

export function usePlaceOrderMutation() {
  const queryClient = useQueryClient()
  const { clearCart } = useCartStore()

  return useMutation({
    mutationFn: (payload: PlaceOrderPayload) => placeOrder(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      clearCart()
      toast.success(`Order #${data.order_no} placed successfully! 🎉`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to place order.')
    },
  })
}

export function useCreateRazorpayOrderMutation() {
  return useMutation({
    mutationFn: (orderId: string) => createRazorpayOrder(orderId),
  })
}

export function useVerifyRazorpayPaymentMutation() {
  const queryClient = useQueryClient()
  const { clearCart } = useCartStore()

  return useMutation({
    mutationFn: (payload: {
      razorpay_order_id: string
      razorpay_payment_id: string
      razorpay_signature: string
      order_id: string
    }) => verifyRazorpayPayment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      clearCart()
      toast.success('Payment verified! Order placed successfully! 🎉')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Payment verification failed.')
    },
  })
}
