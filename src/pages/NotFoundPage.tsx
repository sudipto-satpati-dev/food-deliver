import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UtensilsCrossed, Home, ArrowLeft } from 'lucide-react'

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-6 text-center space-y-6">
      {/* Visual Food Illustration / Brand Icon */}
      <div className="relative">
        <div className="w-28 h-28 bg-brand-primary/10 rounded-full flex items-center justify-center border border-brand-primary/20 animate-pulse">
          <UtensilsCrossed className="w-14 h-14 text-brand-primary" />
        </div>
        <span className="absolute -bottom-2 -right-2 px-3 py-1 bg-brand-primary text-white font-extrabold text-xs rounded-full shadow-subtle">
          404 ERROR
        </span>
      </div>

      {/* Main Text */}
      <div className="space-y-2 max-w-sm">
        <h1 className="font-heading text-2xl font-bold text-brand-dark">
          Oops! Recipe Not Found
        </h1>
        <p className="text-xs text-brand-muted leading-relaxed">
          The page or dish you're looking for doesn't exist, has been renamed, or is currently off the menu.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
        <button
          onClick={() => navigate(-1)}
          className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-brand-dark font-bold text-xs rounded-btn transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>

        <Link
          to="/"
          className="w-full py-2.5 px-4 bg-brand-primary hover:bg-brand-dark text-white font-extrabold text-xs rounded-btn shadow-subtle transition-all flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  )
}
