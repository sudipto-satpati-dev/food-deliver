import React from 'react'

export const ItemCardSkeleton: React.FC = () => {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-card shadow-subtle animate-pulse">
      <div className="flex-1 pr-4 space-y-2">
        <div className="w-5 h-5 bg-gray-200 rounded" />
        <div className="w-3/4 h-4 bg-gray-200 rounded" />
        <div className="w-1/4 h-4 bg-gray-200 rounded" />
        <div className="w-full h-3 bg-gray-100 rounded" />
      </div>
      <div className="w-24 h-24 bg-gray-200 rounded-lg shrink-0" />
    </div>
  )
}

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <ItemCardSkeleton key={i} />
      ))}
    </div>
  )
}
