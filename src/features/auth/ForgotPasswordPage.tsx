import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { KeyRound, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useForgotPasswordMutation } from './hooks'

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type ForgotFormValues = z.infer<typeof forgotSchema>

export const ForgotPasswordPage: React.FC = () => {
  const [isSent, setIsSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')
  const navigate = useNavigate()
  const forgotMutation = useForgotPasswordMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
  })

  const onSubmit = async (values: ForgotFormValues) => {
    try {
      await forgotMutation.mutateAsync(values.email)
      setSentEmail(values.email)
      setIsSent(true)
    } catch {
      // Error handled by hook toast
    }
  }

  if (isSent) {
    return (
      <div className="max-w-md mx-auto py-10 px-4 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-bold">Reset link sent</h2>
          <p className="text-sm text-brand-muted">
            We sent instructions to <span className="font-semibold text-brand-text">{sentEmail}</span>. Check your inbox and click the link to update your password.
          </p>
        </div>
        <div className="pt-4 flex flex-col gap-3">
          <Link
            to="/login"
            className="w-full py-3 rounded-btn bg-brand-primary text-white font-semibold text-sm hover:bg-brand-dark transition-colors shadow-subtle"
          >
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto py-6 px-4 space-y-6">
      <button
        onClick={() => navigate('/login')}
        className="p-2 -ml-2 text-brand-muted hover:text-brand-text rounded-full hover:bg-brand-bg transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="text-center space-y-3">
        <div className="w-14 h-14 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mx-auto">
          <KeyRound className="w-7 h-7" />
        </div>
        <h2 className="font-heading text-2xl font-bold text-brand-text">Reset your password</h2>
        <p className="text-sm text-brand-muted max-w-xs mx-auto">
          Enter your registered email address and we'll send you a password reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-brand-text block">Email address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-brand-muted absolute left-3.5 top-3.5" />
            <input
              type="email"
              placeholder="name@example.com"
              {...register('email')}
              className={`w-full pl-10 pr-4 py-2.5 rounded-btn border text-sm font-body focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all ${
                errors.email ? 'border-brand-error' : 'border-brand-border bg-white'
              }`}
            />
          </div>
          {errors.email && <p className="text-xs text-brand-error">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={forgotMutation.isPending}
          className="w-full py-3.5 rounded-btn bg-brand-primary text-white font-semibold text-sm hover:bg-brand-dark transition-all shadow-subtle flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {forgotMutation.isPending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Send reset link'
          )}
        </button>
      </form>

      <p className="text-center text-xs text-brand-muted pt-4">
        Remembered your password?{' '}
        <Link to="/login" className="font-semibold text-brand-primary hover:underline">
          Back to Login
        </Link>
      </p>
    </div>
  )
}
