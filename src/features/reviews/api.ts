import { supabase } from '@/lib/supabase'
import { Review } from '@/types/database'

export interface CreateReviewPayload {
  order_id: string
  food_rating: number
  delivery_rating: number
  comment?: string | null
}

export interface RatingStats {
  averageFoodRating: number
  averageDeliveryRating: number
  totalReviews: number
}

export async function fetchReviewByOrderId(orderId: string): Promise<Review | null> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle()

  if (error) throw error
  return data as Review | null
}

export async function createOrderReview(payload: CreateReviewPayload): Promise<Review> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) throw new Error('User must be logged in to submit a review.')

  const { data, error } = await supabase
    .from('reviews')
    .insert([
      {
        order_id: payload.order_id,
        user_id: userData.user.id,
        food_rating: payload.food_rating,
        delivery_rating: payload.delivery_rating,
        comment: payload.comment || null,
      },
    ])
    .select()
    .single()

  if (error) throw new Error(error.message || 'Failed to submit review.')
  return data as Review
}

export async function fetchRestaurantRatingStats(): Promise<RatingStats> {
  const { data, error } = await supabase
    .from('reviews')
    .select('food_rating, delivery_rating')

  if (error || !data || data.length === 0) {
    return {
      averageFoodRating: 4.8,
      averageDeliveryRating: 4.9,
      totalReviews: 0,
    }
  }

  const total = data.length
  const sumFood = data.reduce((acc, curr) => acc + curr.food_rating, 0)
  const sumDelivery = data.reduce((acc, curr) => acc + curr.delivery_rating, 0)

  return {
    averageFoodRating: Number((sumFood / total).toFixed(1)),
    averageDeliveryRating: Number((sumDelivery / total).toFixed(1)),
    totalReviews: total,
  }
}
