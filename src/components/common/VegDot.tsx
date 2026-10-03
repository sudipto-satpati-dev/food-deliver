import React from 'react'

interface VegDotProps {
  isVeg: boolean
  className?: string
  size?: 'sm' | 'md'
}

export const VegDot: React.FC<VegDotProps> = ({ isVeg, className = '', size = 'md' }) => {
  const containerSize = size === 'sm' ? 'w-3.5 h-3.5 border' : 'w-4 h-4 border-2'
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'
  const borderColor = isVeg ? 'border-green-600' : 'border-red-600'
  const dotColor = isVeg ? 'bg-green-600' : 'bg-red-600'

  return (
    <div
      className={`inline-flex items-center justify-center rounded-[3px] p-0.5 ${containerSize} ${borderColor} ${className}`}
      title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
    >
      <div className={`rounded-full ${dotSize} ${dotColor}`} />
    </div>
  )
}
