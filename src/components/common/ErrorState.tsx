import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'We encountered an error loading this data. Please try again.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center space-y-4 bg-red-50/50 border border-red-100 rounded-card ${className}`}>
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h4 className="font-heading font-semibold text-brand-text">{title}</h4>
        <p className="text-sm text-brand-muted max-w-sm">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-btn bg-white border border-gray-300 text-sm font-medium text-brand-text hover:bg-gray-50 transition-colors shadow-subtle"
        >
          <RefreshCw className="w-4 h-4" /> Try again
        </button>
      )}
    </div>
  )
}
