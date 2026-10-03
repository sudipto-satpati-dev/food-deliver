import React from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  imageSrc?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  imageSrc = '/banners/cart-img.png',
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center space-y-4 ${className}`}>
      {imageSrc && (
        <img
          src={imageSrc}
          alt={title}
          className="w-36 h-36 object-contain opacity-90 transition-opacity"
        />
      )}
      <h3 className="font-heading text-lg font-semibold text-brand-text">{title}</h3>
      {description && <p className="text-sm text-brand-muted max-w-xs">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2.5 rounded-btn bg-brand-primary text-white font-medium text-sm hover:bg-brand-dark transition-colors shadow-subtle"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
