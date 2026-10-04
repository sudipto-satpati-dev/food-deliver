import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { UtensilsCrossed, Star, Zap, Bike, Flame, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useSettingsQuery } from '@/features/admin/hooks'
import { toast } from 'sonner'

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate()
  const { data: settings } = useSettingsQuery()

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      })
      if (error) throw error
    } catch (err: any) {
      toast.error(err.message || 'Google login failed')
    }
  }

  return (
    <div className="min-h-screen bg-[#fcf9f8] flex flex-col justify-between max-w-md mx-auto relative pb-8 text-brand-dark">
      {/* Hero Culinary Visual Section */}
      <div className="relative w-full overflow-hidden rounded-b-[28px] shadow-md bg-gray-100">
        <div className="relative w-full aspect-[4/3] max-h-[340px] overflow-hidden">
          <img
            src="/banners/welcome.webp"
            alt="Delicious Gourmet Food Display"
            className="w-full h-full object-cover object-center"
            loading="eager"
          />

          {/* Floating Badges Layer */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
            {/* Brand Chip */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md shadow-sm border border-white/40">
              <UtensilsCrossed className="w-4 h-4 text-brand-primary" />
              <span className="font-heading text-xs font-bold text-brand-dark tracking-tight">
                Dinning Zone
              </span>
            </div>

            {/* Rating & Social Proof Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md shadow-sm border border-white/40">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs font-bold text-brand-dark">4.9</span>
              <span className="text-gray-400 text-[10px]">•</span>
              <span className="text-[11px] text-gray-600 font-medium">15k+ orders</span>
            </div>
          </div>

          {/* Warm Scrim Fade into Screen Ground */}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#fcf9f8] via-[#fcf9f8]/60 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Content Section */}
      <div className="px-5 pt-3 flex flex-col w-full space-y-4">
        {/* Brand Micro-tag */}
        <div className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-brand-primary fill-brand-primary" />
          <span className="text-[11px] font-extrabold text-brand-primary uppercase tracking-wider">
            CRAFTED WITH PASSION
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="font-heading text-2xl font-bold text-brand-dark leading-tight">
          Hungry? We deliver within {settings?.delivery_radius_km || 5} km
        </h1>

        {/* Explanatory Subtext */}
        <p className="text-xs text-gray-600 leading-relaxed">
          Explore handcrafted gourmet biryani, stone-fired artisan pizzas, and chef specials delivered steaming hot to your doorstep.
        </p>

        {/* Operational Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gray-100/80 border border-gray-200 w-fit">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                settings?.accepting_orders !== false ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                settings?.accepting_orders !== false ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
          </span>
          <span className="text-xs font-bold text-brand-dark">
            {settings?.accepting_orders !== false ? 'Kitchen open now' : 'Kitchen closed now'}
            <span className="text-gray-400 mx-1.5">•</span> Avg. {settings?.prep_time_minutes || 25} mins
          </span>
        </div>

        {/* Quick Value Perks */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-white border border-gray-100 shadow-subtle flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">
              <Bike className="w-5 h-5 text-brand-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-brand-dark truncate">Free Delivery</p>
              <p className="text-[10px] text-brand-muted truncate">On first 3 orders</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white border border-gray-100 shadow-subtle flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-amber-600 fill-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-brand-dark truncate">Fresh & Hot</p>
              <p className="text-[10px] text-brand-muted truncate">Chef sealed pack</p>
            </div>
          </div>
        </div>

        {/* Action Buttons Stack */}
        <div className="w-full flex flex-col gap-3 pt-2">
          {/* Primary Action: Create Account */}
          <button
            onClick={() => navigate('/signup')}
            className="w-full h-[50px] bg-brand-primary hover:bg-brand-dark active:scale-[0.99] text-white font-extrabold text-xs rounded-xl shadow-soft flex items-center justify-center gap-2 transition-all cursor-pointer"
            type="button"
          >
            <span>Create account</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Secondary Action: Log In */}
          <button
            onClick={() => navigate('/login')}
            className="w-full h-[50px] bg-gray-100 hover:bg-gray-200 active:scale-[0.99] text-brand-dark font-extrabold text-xs rounded-xl flex items-center justify-center transition-all cursor-pointer"
            type="button"
          >
            <span>Log in</span>
          </button>

          {/* Social Login: Google */}
          <button
            onClick={handleGoogleLogin}
            className="w-full h-[48px] bg-white border border-gray-200 hover:bg-gray-50 active:scale-[0.99] text-brand-dark font-bold text-xs rounded-xl flex items-center justify-center gap-3 shadow-subtle transition-all cursor-pointer"
            type="button"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Guest Access Link */}
          <button
            onClick={() => navigate('/menu')}
            className="w-full py-2 text-center text-xs font-bold text-brand-muted hover:text-brand-dark underline underline-offset-4 decoration-gray-300 transition-colors cursor-pointer"
            type="button"
          >
            Browse menu as guest
          </button>
        </div>

        {/* Legal Micro-footer */}
        <div className="text-center pt-1">
          <p className="text-[10px] text-gray-400">
            By continuing, you agree to our{' '}
            <Link to="/terms" className="text-gray-600 underline">
              Terms
            </Link>{' '}
            &{' '}
            <Link to="/privacy" className="text-gray-600 underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
