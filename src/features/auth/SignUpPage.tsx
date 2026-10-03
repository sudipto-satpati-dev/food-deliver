import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Lock, Mail, User, Phone, ArrowLeft, MailCheck } from 'lucide-react'
import { BRAND_CONFIG } from '@/config/brand'
import { useSignUpMutation, useGoogleLoginMutation } from './hooks'

const signUpSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  agreeTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the Terms & Privacy Policy' }),
  }),
})

type SignUpFormValues = z.infer<typeof signUpSchema>

export const SignUpPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const navigate = useNavigate()

  const signUpMutation = useSignUpMutation()
  const googleLoginMutation = useGoogleLoginMutation()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      agreeTerms: true,
    },
  })

  const passwordValue = watch('password') || ''

  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return { label: '', score: 0, color: 'bg-gray-200' }
    if (pass.length < 6) return { label: 'Weak', score: 1, color: 'bg-red-500' }
    if (pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass)) {
      return { label: 'Strong', score: 3, color: 'bg-emerald-500' }
    }
    return { label: 'Medium', score: 2, color: 'bg-amber-500' }
  }

  const strength = calculatePasswordStrength(passwordValue)

  const onSubmit = async (values: SignUpFormValues) => {
    try {
      const res = await signUpMutation.mutateAsync({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        phone: values.phone,
      })

      if (res?.session) {
        // Email confirmation is disabled; user is immediately logged in
        navigate('/', { replace: true })
      } else if (res?.user) {
        // Email confirmation is enabled
        setRegisteredEmail(values.email)
        setIsSuccess(true)
      }
    } catch {
      // Error handled by hook toast
    }
  }

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto py-10 px-4 text-center space-y-6">
        <div className="w-16 h-16 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mx-auto">
          <MailCheck className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-bold">Check your email</h2>
          <p className="text-sm text-brand-muted">
            We sent a verification link to <span className="font-semibold text-brand-text">{registeredEmail}</span>.
            Please verify your email to activate your account.
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
      {/* Top bar */}
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
        <h2 className="font-heading text-2xl font-bold text-brand-text">Create your account</h2>
        <p className="text-sm text-brand-muted">Order fresh food directly with zero commission</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-brand-text block">Full Name</label>
          <div className="relative">
            <User className="w-4 h-4 text-brand-muted absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Ramesh Kumar"
              {...register('fullName')}
              className={`w-full pl-10 pr-4 py-2.5 rounded-btn border text-sm font-body focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all ${
                errors.fullName ? 'border-brand-error' : 'border-brand-border bg-white'
              }`}
            />
          </div>
          {errors.fullName && <p className="text-xs text-brand-error">{errors.fullName.message}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-brand-text block">Phone Number</label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-xs font-bold text-brand-muted flex items-center gap-1 border-r border-gray-200 pr-2 h-5">
              <Phone className="w-3.5 h-3.5" /> +91
            </span>
            <input
              type="tel"
              placeholder="9876543210"
              maxLength={10}
              {...register('phone')}
              className={`w-full pl-20 pr-4 py-2.5 rounded-btn border text-sm font-body focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all ${
                errors.phone ? 'border-brand-error' : 'border-brand-border bg-white'
              }`}
            />
          </div>
          {errors.phone && <p className="text-xs text-brand-error">{errors.phone.message}</p>}
        </div>

        {/* Email */}
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

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-brand-text block">Password</label>
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
          {passwordValue && (
            <div className="flex items-center gap-2 pt-1">
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${strength.color}`}
                  style={{ width: `${(strength.score / 3) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold text-brand-muted">{strength.label}</span>
            </div>
          )}
          {errors.password && <p className="text-xs text-brand-error">{errors.password.message}</p>}
        </div>

        {/* Terms Checkbox */}
        <div className="flex items-start gap-2 pt-1">
          <input
            type="checkbox"
            id="terms"
            {...register('agreeTerms')}
            className="mt-1 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
          />
          <label htmlFor="terms" className="text-xs text-brand-muted leading-tight">
            I agree to the <span className="font-semibold text-brand-text underline">Terms of Service</span> and{' '}
            <span className="font-semibold text-brand-text underline">Privacy Policy</span>.
          </label>
        </div>
        {errors.agreeTerms && <p className="text-xs text-brand-error">{errors.agreeTerms.message}</p>}

        <button
          type="submit"
          disabled={signUpMutation.isPending}
          className="w-full py-3.5 rounded-btn bg-brand-primary text-white font-semibold text-sm hover:bg-brand-dark transition-all shadow-subtle flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
        >
          {signUpMutation.isPending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Create account'
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
        onClick={() => googleLoginMutation.mutate()}
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
      <p className="text-center text-xs text-brand-muted pt-2">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}
