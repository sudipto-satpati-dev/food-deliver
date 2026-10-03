import React from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { BRAND_CONFIG } from '@/config/brand'

export const VerifyEmailPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto py-10 px-4 text-center space-y-6">
      <img src={BRAND_CONFIG.logos.main} alt="Logo" className="h-10 mx-auto object-contain" />

      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-subtle">
        <CheckCircle2 className="w-9 h-9" />
      </div>

      <div className="space-y-2">
        <h2 className="font-heading text-2xl font-bold text-brand-text">Email Verified!</h2>
        <p className="text-sm text-brand-muted max-w-sm mx-auto">
          Your email address has been successfully verified. You can now log in to your account and place orders.
        </p>
      </div>

      <div className="pt-4 flex flex-col gap-3">
        <Link
          to="/login"
          className="w-full py-3.5 rounded-btn bg-brand-primary text-white font-semibold text-sm hover:bg-brand-dark transition-all shadow-subtle flex items-center justify-center gap-2"
        >
          <span>Go to Login</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/"
          className="text-xs text-brand-muted hover:text-brand-text font-medium underline pt-1"
        >
          Back to Home Page
        </Link>
      </div>
    </div>
  )
}
