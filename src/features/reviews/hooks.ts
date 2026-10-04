import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchReviewByOrderId,
  createOrderReview,
  fetchRestaurantRatingStats,
  CreateReviewPayload,
} from './api'
import { toast } from 'sonner'

export function useOrderReviewQuery(orderId: string | undefined) {
  return useQuery({
    queryKey: ['order-review', orderId],
    queryFn: () => fetchReviewByOrderId(orderId!),
    enabled: !!orderId,
  })
}

export function useRestaurantRatingQuery() {
  return useQuery({
    queryKey: ['restaurant-rating-stats'],
    queryFn: fetchRestaurantRatingStats,
    staleTime: 1000 * 60 * 5, // 5 mins
  })
}

export function useCreateReviewMutation(orderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateReviewPayload) => createOrderReview(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-review', orderId] })
      queryClient.invalidateQueries({ queryKey: ['restaurant-rating-stats'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] })
      toast.success('Thank you for your review! ⭐')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit review.')
    },
  })
}
