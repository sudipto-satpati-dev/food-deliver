import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react'
import { useResetPasswordMutation } from './hooks'

const resetSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ResetFormValues = z.infer<typeof resetSchema>

export const ResetPasswordPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const navigate = useNavigate()
  const resetMutation = useResetPasswordMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
  })

  const onSubmit = async (values: ResetFormValues) => {
    try {
      await resetMutation.mutateAsync(values.password)
      setIsSuccess(true)
    } catch {
      // Error handled by hook toast
    }
  }

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto py-10 px-4 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-bold">Password updated</h2>
          <p className="text-sm text-brand-muted">Your password has been reset successfully. You can now log in with your new password.</p>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="w-full py-3.5 rounded-btn bg-brand-primary text-white font-semibold text-sm hover:bg-brand-dark transition-colors shadow-subtle"
        >
          Go to Login
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto py-8 px-4 space-y-6">
      <div className="text-center space-y-1">
        <h2 className="font-heading text-2xl font-bold text-brand-text">Set new password</h2>
        <p className="text-sm text-brand-muted">Create a strong password for your account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-brand-text block">New Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-brand-muted absolute left-3.5 top-3.5" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password')}
              className={`w-full pl-10 pr-10 py-2.5 rounded-btn border text-sm font-body focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all ${
                errors.password ? 'border-brand-error' : 'border-brand-border bg-white'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3.5 text-brand-muted hover:text-brand-text"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-brand-error">{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-brand-text block">Confirm New Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-brand-muted absolute left-3.5 top-3.5" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('confirmPassword')}
              className={`w-full pl-10 pr-10 py-2.5 rounded-btn border text-sm font-body focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all ${
                errors.confirmPassword ? 'border-brand-error' : 'border-brand-border bg-white'
              }`}
            />
          </div>
          {errors.confirmPassword && <p className="text-xs text-brand-error">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={resetMutation.isPending}
          className="w-full py-3.5 rounded-btn bg-brand-primary text-white font-semibold text-sm hover:bg-brand-dark transition-all shadow-subtle flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {resetMutation.isPending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Update password'
          )}
        </button>
      </form>
    </div>
  )
}
