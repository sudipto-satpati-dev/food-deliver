import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Lock, Mail, ArrowLeft } from 'lucide-react'
import { BRAND_CONFIG } from '@/config/brand'
import { useLoginMutation, useGoogleLoginMutation } from './hooks'
import { fetchProfile } from './api'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const loginMutation = useLoginMutation()
  const googleLoginMutation = useGoogleLoginMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const res = await loginMutation.mutateAsync(values)
      if (res.user) {
        // Redirect by role
        try {
          const profile = await fetchProfile(res.user.id)
          if (profile?.role === 'admin') {
            navigate('/admin', { replace: true })
            return
          }
          if (profile?.role === 'rider') {
            navigate('/rider', { replace: true })
            return
          }
        } catch {
          // Fallback redirect
        }
        navigate(from, { replace: true })
      }
    } catch {
      // Error handled by hook toast
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await googleLoginMutation.mutateAsync()
    } catch {
      // Error handled by hook toast
    }
  }

  return (
    <div className="max-w-md mx-auto py-6 px-4 space-y-6">
      {/* Top bar with back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="p-2 -ml-2 text-brand-muted hover:text-brand-text rounded-full hover:bg-brand-bg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <img src={BRAND_CONFIG.logos.main} alt="Logo" className="h-8 object-contain" />
        <div className="w-7" />
      </div>

      <div className="space-y-1 text-center">
        <h2 className="font-heading text-2xl font-bold text-brand-text">Welcome Back</h2>
        <p className="text-sm text-brand-muted">Log in to order your favourites</p>
      </div>

      {/* Login Form */}
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

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-brand-text block">Password</label>
            <Link to="/forgot-password" className="text-xs font-medium text-brand-primary hover:underline">
              Forgot password?
            </Link>
          </div>
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

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full py-3.5 rounded-btn bg-brand-primary text-white font-semibold text-sm hover:bg-brand-dark transition-all shadow-subtle flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
        >
          {loginMutation.isPending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Log in'
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center justify-center my-6">
        <div className="border-t border-brand-border w-full" />
        <span className="bg-brand-bg px-3 text-xs text-brand-muted font-medium uppercase absolute">or</span>
      </div>

      {/* Google Login */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoginMutation.isPending}
        className="w-full py-3 rounded-btn border border-brand-border bg-white text-brand-text font-medium text-sm hover:bg-gray-50 transition-colors shadow-subtle flex items-center justify-center gap-3"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Continue with Google</span>
      </button>

      {/* Footer link */}
      <p className="text-center text-xs text-brand-muted pt-4">
        New here?{' '}
        <Link to="/signup" className="font-semibold text-brand-primary hover:underline">
          Create account
        </Link>
      </p>
    </div>
  )
}
