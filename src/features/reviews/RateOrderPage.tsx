import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useOrderDetail } from '@/features/orders/hooks'
import { useOrderReviewQuery, useCreateReviewMutation } from './hooks'
import { DetailSkeleton } from '@/components/common/Skeletons'
import { ErrorState } from '@/components/common/ErrorState'
import {
  ArrowLeft,
  Star,
  UtensilsCrossed,
  Bike,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { formatDateTime } from '@/lib/format'
import { toast } from 'sonner'

export const RateOrderPage: React.FC = () => {
  const { id: orderId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: order, isLoading: isLoadingOrder, isError: isOrderError } = useOrderDetail(orderId)
  const { data: existingReview, isLoading: isLoadingReview } = useOrderReviewQuery(orderId)
  const createReviewMutation = useCreateReviewMutation(orderId || '')

  const [foodRating, setFoodRating] = useState<number>(5)
  const [foodHover, setFoodHover] = useState<number>(0)

  const [deliveryRating, setDeliveryRating] = useState<number>(5)
  const [deliveryHover, setDeliveryHover] = useState<number>(0)

  const [comment, setComment] = useState<string>('')

  if (isLoadingOrder || isLoadingReview) {
    return (
      <div className="py-6 max-w-xl mx-auto space-y-4">
        <DetailSkeleton />
      </div>
    )
  }

  if (isOrderError || !order) {
    return (
      <div className="py-8 max-w-xl mx-auto">
        <ErrorState
          title="Order not found"
          message="Could not load the requested order details."
        />
      </div>
    )
  }

  const isDelivered = order.status === 'delivered'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderId) return

    if (foodRating < 1 || deliveryRating < 1) {
      return toast.error('Please select star ratings for both food and delivery.')
    }

    try {
      await createReviewMutation.mutateAsync({
        order_id: orderId,
        food_rating: foodRating,
        delivery_rating: deliveryRating,
        comment: comment.trim() || null,
      })
      navigate(`/orders/${orderId}`)
    } catch {
      // Error handled by mutation toast
    }
  }

  return (
    <div className="space-y-5 max-w-xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(`/orders/${order.id}`)}
          className="p-2 -ml-2 text-brand-dark hover:bg-brand-surface rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-heading text-lg font-bold text-brand-dark">
            Rate Order #{order.order_no}
          </h1>
          <p className="text-xs text-brand-muted flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Delivered on {formatDateTime(order.placed_at)}
          </p>
        </div>
      </div>

      {/* Order Items Summary Card */}
      <div className="p-4 bg-white rounded-card border border-brand-border space-y-2 text-xs">
        <p className="font-bold text-brand-dark uppercase tracking-wider text-[11px]">
          Order Summary
        </p>
        <div className="flex flex-wrap gap-1 text-brand-muted">
          {order.order_items?.map((item, idx) => (
            <span key={item.id}>
              {item.qty}x {item.name}
              {idx < (order.order_items?.length || 0) - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
      </div>

      {/* Check: Not Delivered Banner */}
      {!isDelivered && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-card text-xs text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">Rating Unavailable</p>
            <p className="mt-0.5 text-amber-700">
              Only delivered orders can be rated. Current order status: <strong>{order.status}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Check: Already Rated Display Card */}
      {existingReview ? (
        <div className="p-5 bg-white rounded-card border border-emerald-200 shadow-soft space-y-4">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>You have already submitted a review for this order</span>
          </div>

          <div className="space-y-3 pt-2 border-t border-brand-border text-xs">
            <div className="flex items-center justify-between">
              <span className="text-brand-muted flex items-center gap-1">
                <UtensilsCrossed className="w-4 h-4 text-brand-primary" />
                Food Quality:
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= existingReview.food_rating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-200'
                    }`}
                  />
                ))}
                <span className="font-bold ml-1 text-brand-dark">
                  {existingReview.food_rating}/5
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-brand-muted flex items-center gap-1">
                <Bike className="w-4 h-4 text-brand-primary" />
                Delivery Executive:
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= existingReview.delivery_rating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-200'
                    }`}
                  />
                ))}
                <span className="font-bold ml-1 text-brand-dark">
                  {existingReview.delivery_rating}/5
                </span>
              </div>
            </div>

            {existingReview.comment && (
              <div className="pt-2">
                <p className="text-[11px] text-brand-muted font-bold">Your Comment:</p>
                <p className="text-xs text-brand-dark mt-0.5 bg-brand-surface p-2.5 rounded-btn italic">
                  "{existingReview.comment}"
                </p>
              </div>
            )}

            {/* Admin Reply Card */}
            {existingReview.admin_reply && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-btn space-y-1">
                <p className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Response from Kitchen:
                </p>
                <p className="text-xs text-amber-800">{existingReview.admin_reply}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Rating Form */
        isDelivered && (
          <form
            onSubmit={handleSubmit}
            className="p-5 bg-white rounded-card border border-brand-border space-y-6 shadow-soft"
          >
            <div className="text-center space-y-1">
              <h3 className="font-heading text-lg font-bold text-brand-dark">How was your meal?</h3>
              <p className="text-xs text-brand-muted">
                Your feedback helps us continuously improve our food quality & service.
              </p>
            </div>

            {/* 1. Food Rating Stars */}
            <div className="space-y-2 flex flex-col items-center p-4 bg-brand-surface rounded-card border border-brand-border/60">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
                <UtensilsCrossed className="w-4 h-4 text-brand-primary" />
                <span>Rate Food Quality</span>
              </label>

              <div className="flex items-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFoodRating(star)}
                    onMouseEnter={() => setFoodHover(star)}
                    onMouseLeave={() => setFoodHover(0)}
                    className="p-1 hover:scale-125 transition-transform outline-none"
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        star <= (foodHover || foodRating)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <span className="text-xs font-bold text-amber-600">
                {['', 'Poor 😞', 'Fair 😐', 'Good 😊', 'Very Good 😃', 'Excellent! 🌟'][
                  foodHover || foodRating
                ]}
              </span>
            </div>

            {/* 2. Delivery Rating Stars */}
            <div className="space-y-2 flex flex-col items-center p-4 bg-brand-surface rounded-card border border-brand-border/60">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
                <Bike className="w-4 h-4 text-brand-primary" />
                <span>Rate Delivery Experience</span>
              </label>

              <div className="flex items-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setDeliveryRating(star)}
                    onMouseEnter={() => setDeliveryHover(star)}
                    onMouseLeave={() => setDeliveryHover(0)}
                    className="p-1 hover:scale-125 transition-transform outline-none"
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        star <= (deliveryHover || deliveryRating)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <span className="text-xs font-bold text-amber-600">
                {['', 'Slow / Damaged 😞', 'Okay 😐', 'Fast & Polite 😊', 'Great Service 😃', 'Super Fast! ⚡'][
                  deliveryHover || deliveryRating
                ]}
              </span>
            </div>

            {/* 3. Optional Comment */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-brand-muted" />
                <span>Comments / Suggestions (Optional)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Tell us what you liked about the food, packaging, or delivery..."
                className="w-full p-3 border border-brand-border rounded-btn text-xs font-medium text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={createReviewMutation.isPending}
              className="w-full py-3 bg-brand-primary text-white text-xs font-bold rounded-btn shadow-soft hover:bg-brand-primary/95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {createReviewMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Submit Review</span>
            </button>
          </form>
        )
      )}
    </div>
  )
}
