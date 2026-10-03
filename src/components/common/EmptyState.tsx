import React from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  message?: string
  icon?: React.ReactNode
  imageSrc?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  message,
  icon,
  imageSrc = '/banners/cart-img.png',
  actionLabel,
  onAction,
  className = '',
}) => {
  const bodyText = description || message

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center space-y-4 ${className}`}>
      {icon ? (
        <div className="flex items-center justify-center p-3 bg-brand-surface rounded-full mb-1">
          {icon}
        </div>
      ) : (
        imageSrc && (
          <img
            src={imageSrc}
            alt={title}
            className="w-36 h-36 object-contain opacity-90 transition-opacity"
          />
        )
      )}

      <h3 className="font-heading text-lg font-semibold text-brand-dark">{title}</h3>
      {bodyText && <p className="text-xs text-brand-muted max-w-xs">{bodyText}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2.5 rounded-btn bg-brand-primary text-white font-medium text-xs hover:bg-brand-primary/95 transition-colors shadow-soft"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
