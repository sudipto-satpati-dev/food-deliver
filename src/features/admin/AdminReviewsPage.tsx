import React, { useState } from 'react'
import { useAdminReviewsQuery, useReplyToReviewMutation } from './hooks'
import { ListSkeleton } from '@/components/common/Skeletons'
import { ErrorState } from '@/components/common/ErrorState'
import {
  Star,
  MessageSquare,
  UtensilsCrossed,
  Bike,
  AlertTriangle,
  CheckCircle2,
  Send,
  Sparkles,
  User,
  Clock,
  Filter,
} from 'lucide-react'
import { formatDateTime } from '@/lib/format'
import { toast } from 'sonner'
import { AdminReviewItem } from './api'

export const AdminReviewsPage: React.FC = () => {
  const { data: reviews, isLoading, isError, refetch } = useAdminReviewsQuery()
  const replyMutation = useReplyToReviewMutation()

  const [activeTab, setActiveTab] = useState<'all' | 'low' | 'five' | 'pending' | 'replied'>('all')
  const [replyInputMap, setReplyInputMap] = useState<Record<string, string>>({})

  if (isLoading) {
    return (
      <div className="py-6 max-w-5xl mx-auto space-y-4">
        <ListSkeleton />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="py-8 max-w-5xl mx-auto">
        <ErrorState
          title="Could not load reviews"
          message="Failed to fetch customer reviews and ratings. Please try again."
          onRetry={refetch}
        />
      </div>
    )
  }

  const reviewList = reviews || []
  const totalCount = reviewList.length

  const avgFood = totalCount
    ? (reviewList.reduce((acc, r) => acc + r.food_rating, 0) / totalCount).toFixed(1)
    : '0.0'

  const avgDelivery = totalCount
    ? (reviewList.reduce((acc, r) => acc + r.delivery_rating, 0) / totalCount).toFixed(1)
    : '0.0'

  const lowRatingCount = reviewList.filter(
    (r) => r.food_rating <= 2 || r.delivery_rating <= 2
  ).length

  const pendingReplyCount = reviewList.filter((r) => !r.admin_reply).length

  const filteredReviews = reviewList.filter((review) => {
    if (activeTab === 'low') return review.food_rating <= 2 || review.delivery_rating <= 2
    if (activeTab === 'five') return review.food_rating === 5 && review.delivery_rating === 5
    if (activeTab === 'pending') return !review.admin_reply
    if (activeTab === 'replied') return Boolean(review.admin_reply)
    return true
  })

  const handleSaveReply = (reviewId: string) => {
    const text = replyInputMap[reviewId] ?? ''
    if (!text.trim()) return toast.error('Please enter a response before saving.')

    replyMutation.mutate({ reviewId, reply: text })
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-dark flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
            <span>Customer Reviews & Feedback</span>
          </h1>
          <p className="text-xs text-brand-muted">
            Monitor food quality ratings, delivery feedback, and respond to customers
          </p>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-card border border-brand-border space-y-1 shadow-soft">
          <span className="text-[11px] font-bold text-brand-muted uppercase">Avg Food Rating</span>
          <div className="flex items-center gap-2">
            <span className="font-heading text-2xl font-black text-brand-dark">{avgFood}</span>
            <div className="flex text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${
                    s <= Math.round(Number(avgFood)) ? 'fill-amber-400' : 'text-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-card border border-brand-border space-y-1 shadow-soft">
          <span className="text-[11px] font-bold text-brand-muted uppercase">
            Avg Delivery Rating
          </span>
          <div className="flex items-center gap-2">
            <span className="font-heading text-2xl font-black text-brand-dark">{avgDelivery}</span>
            <div className="flex text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${
                    s <= Math.round(Number(avgDelivery)) ? 'fill-amber-400' : 'text-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-card border border-brand-border space-y-1 shadow-soft">
          <span className="text-[11px] font-bold text-brand-muted uppercase">Total Reviews</span>
          <p className="font-heading text-2xl font-black text-brand-dark">{totalCount}</p>
        </div>

        <div className="p-4 bg-rose-50 border border-rose-200 rounded-card space-y-1 shadow-soft">
          <span className="text-[11px] font-bold text-rose-800 uppercase flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Low Ratings (1-2★)
          </span>
          <p className="font-heading text-2xl font-black text-rose-700">{lowRatingCount}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto no-scrollbar border-b border-brand-border gap-2 pb-1">
        {[
          { id: 'all', label: 'All Reviews', count: totalCount },
          { id: 'low', label: 'Low Ratings (1-2★)', count: lowRatingCount, alert: lowRatingCount > 0 },
          { id: 'pending', label: 'Pending Reply', count: pendingReplyCount },
          { id: 'replied', label: 'Replied' },
          { id: 'five', label: '5 Stars (★★★★★)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-xs font-bold rounded-btn transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === tab.id
                ? 'bg-brand-primary text-white shadow-soft'
                : tab.alert
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : 'bg-white border border-brand-border text-brand-muted hover:text-brand-dark'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : tab.alert
                    ? 'bg-rose-200 text-rose-900'
                    : 'bg-brand-surface text-brand-dark'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-card border border-brand-border space-y-3">
          <MessageSquare className="w-12 h-12 text-brand-muted/40 mx-auto" />
          <h3 className="text-sm font-bold text-brand-dark">No reviews found</h3>
          <p className="text-xs text-brand-muted">
            {activeTab === 'all'
              ? 'No customer reviews submitted yet.'
              : `No reviews matching filter "${activeTab}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => {
            const isLowRating = review.food_rating <= 2 || review.delivery_rating <= 2
            const currentReplyText =
              replyInputMap[review.id] !== undefined
                ? replyInputMap[review.id]
                : review.admin_reply || ''

            return (
              <div
                key={review.id}
                className={`p-4 bg-white rounded-card border transition-all space-y-3 ${
                  isLowRating
                    ? 'border-rose-300 bg-rose-50/30 shadow-soft'
                    : 'border-brand-border'
                }`}
              >
                {/* Header: Order info & Low Rating Tag */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-brand-dark">
                      Order #{review.orders?.order_no || 'N/A'}
                    </span>
                    <span className="text-brand-muted">•</span>
                    <span className="text-xs text-brand-muted flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {review.orders?.customer_name || 'Customer'}
                    </span>
                    {review.orders?.customer_phone && (
                      <span className="text-[11px] text-brand-muted">
                        ({review.orders.customer_phone})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isLowRating && (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold rounded flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        LOW RATING ALERT
                      </span>
                    )}
                    <span className="text-[11px] text-brand-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(review.created_at)}
                    </span>
                  </div>
                </div>

                {/* Ratings Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-brand-surface rounded-btn border border-brand-border/40">
                    <span className="font-bold text-brand-dark flex items-center gap-1.5">
                      <UtensilsCrossed className="w-4 h-4 text-brand-primary" />
                      Food Quality:
                    </span>
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= review.food_rating ? 'fill-amber-400' : 'text-gray-200'
                          }`}
                        />
                      ))}
                      <span className="font-bold text-brand-dark ml-1">{review.food_rating}/5</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-brand-surface rounded-btn border border-brand-border/40">
                    <span className="font-bold text-brand-dark flex items-center gap-1.5">
                      <Bike className="w-4 h-4 text-brand-primary" />
                      Delivery Exec:
                    </span>
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= review.delivery_rating ? 'fill-amber-400' : 'text-gray-200'
                          }`}
                        />
                      ))}
                      <span className="font-bold text-brand-dark ml-1">
                        {review.delivery_rating}/5
                      </span>
                    </div>
                  </div>
                </div>

                {/* Comment */}
                {review.comment && (
                  <div className="p-3 bg-gray-50 rounded-btn text-xs text-brand-dark italic border border-gray-100">
                    "{review.comment}"
                  </div>
                )}

                {/* Admin Reply Form / Card */}
                <div className="pt-2 border-t border-brand-border/60 space-y-2">
                  <label className="text-[11px] font-bold text-brand-dark uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Kitchen Response / Reply
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentReplyText}
                      onChange={(e) =>
                        setReplyInputMap({
                          ...replyInputMap,
                          [review.id]: e.target.value,
                        })
                      }
                      placeholder="Write an official response to the customer..."
                      className="flex-1 px-3 py-1.5 border border-brand-border rounded-btn text-xs font-medium text-brand-dark focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none"
                    />

                    <button
                      type="button"
                      onClick={() => handleSaveReply(review.id)}
                      disabled={replyMutation.isPending}
                      className="px-4 py-1.5 bg-brand-primary text-white text-xs font-bold rounded-btn shadow-soft hover:bg-brand-primary/95 transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{review.admin_reply ? 'Update' : 'Reply'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
