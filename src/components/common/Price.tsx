import React from 'react'
import { formatCurrency } from '@/lib/format'

interface PriceProps {
  amount: number
  className?: string
}

export const Price: React.FC<PriceProps> = ({ amount, className = '' }) => {
  return <span className={`font-semibold font-body ${className}`}>{formatCurrency(amount)}</span>
}
