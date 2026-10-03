import React from 'react'
import { OrderStatus } from '@/types/database'
import { Clock, CheckCircle2, CookingPot, PackageCheck, Bike, Ban, XCircle } from 'lucide-react'

interface StatusBadgeProps {
  status: OrderStatus
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'pending_payment':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 ${className}`}>
          <Clock className="w-3.5 h-3.5" /> Pending Payment
        </span>
      )
    case 'placed':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ${className}`}>
          <Clock className="w-3.5 h-3.5" /> Placed
        </span>
      )
    case 'accepted':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 ${className}`}>
          <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
        </span>
      )
    case 'preparing':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 ${className}`}>
          <CookingPot className="w-3.5 h-3.5" /> Preparing
        </span>
      )
    case 'ready':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 ${className}`}>
          <PackageCheck className="w-3.5 h-3.5" /> Ready for Pickup
        </span>
      )
    case 'out_for_delivery':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-accent/20 text-amber-900 font-semibold animate-pulse ${className}`}>
          <Bike className="w-3.5 h-3.5" /> Out for Delivery
        </span>
      )
    case 'delivered':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 ${className}`}>
          <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
        </span>
      )
    case 'cancelled':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 ${className}`}>
          <Ban className="w-3.5 h-3.5" /> Cancelled
        </span>
      )
    case 'rejected':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 ${className}`}>
          <XCircle className="w-3.5 h-3.5" /> Rejected
        </span>
      )
    default:
      return <span className={`px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded ${className}`}>{status}</span>
  }
}
