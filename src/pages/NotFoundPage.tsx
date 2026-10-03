import React from 'react'
import { Link } from 'react-router-dom'

export const NotFoundPage: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4 bg-brand-bg">
    <h1 className="font-heading text-6xl font-bold text-brand-primary">404</h1>
    <h2 className="font-heading text-xl font-semibold text-brand-text">Page Not Found</h2>
    <p className="text-sm text-brand-muted max-w-sm">
      The page you're looking for doesn't exist or has been moved.
    </p>
    <Link
      to="/"
      className="px-6 py-2.5 bg-brand-primary text-white font-medium text-sm rounded-btn shadow-subtle hover:bg-brand-dark transition-colors"
    >
      Back to Home
    </Link>
  </div>
)
