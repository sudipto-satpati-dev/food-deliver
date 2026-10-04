import React, { useEffect, useState } from 'react'
import { Utensils, Zap, Clock } from 'lucide-react'
import { BRAND_CONFIG } from '@/config/brand'

interface SplashScreenProps {
  onFinish?: () => void
  durationMs?: number
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  durationMs = 2200,
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const [isFadingOut, setIsFadingOut] = useState(false)

  useEffect(() => {
    // Start fade out transition before removing
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true)
    }, durationMs - 500)

    const removeTimer = setTimeout(() => {
      setIsVisible(false)
      if (onFinish) onFinish()
    }, durationMs)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(removeTimer)
    }
  }, [durationMs, onFinish])

  if (!isVisible) return null

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col justify-between items-center px-6 py-10 select-none overflow-hidden bg-gradient-to-br from-[#6b1400] via-[#ab2e12] to-[#d94f30] text-white transition-opacity duration-500 ease-in-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Decorative Spinning Radial Lines & Glow Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="absolute w-[440px] h-[440px] rounded-full bg-orange-500/30 blur-3xl -top-24 -left-20 animate-pulse" />
        <div className="absolute w-[360px] h-[360px] rounded-full bg-amber-400/20 blur-2xl bottom-10 -right-20" />

        {/* Rotating Geometric Plate Outline */}
        <svg
          className="absolute w-[560px] h-[560px] opacity-15 text-white animate-[spin_120s_linear_infinite]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 400 400"
        >
          <circle cx="200" cy="200" r="180" strokeDasharray="4 8" strokeWidth="1.5" />
          <circle cx="200" cy="200" r="140" strokeWidth="1" />
          <circle cx="200" cy="200" r="95" strokeDasharray="2 6" strokeWidth="1.5" />
          <path
            d="M200 10 L200 30 M200 370 L200 390 M10 200 L30 200 M370 200 L390 200"
            strokeLinecap="round"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Top Header Badge Row */}
      <div className="relative z-10 w-full flex justify-between items-center pt-2 opacity-90 max-w-md">
        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 shadow-sm">
          <Utensils className="w-3.5 h-3.5 text-amber-300" />
          <span className="font-extrabold tracking-wide uppercase text-[10px] text-white/90">
            Culinary Express
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/15">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold text-white text-[10px]">Live Kitchens</span>
        </div>
      </div>

      {/* Center Hero Icon & Brand Tagline */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto w-full max-w-xs text-center px-4 space-y-5">
        {/* Cloche Plate Glowing Icon */}
        <div className="relative flex items-center justify-center">
          <div className="absolute -inset-4 bg-white/10 rounded-full blur-xl animate-pulse" />
          <div className="relative bg-white/15 backdrop-blur-md p-5 rounded-full shadow-2xl border border-white/20 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-xl relative">
              <div className="absolute inset-1.5 rounded-full bg-[#ab2e12]/10 flex items-center justify-center">
                <Utensils className="w-12 h-12 text-[#ab2e12]" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-amber-950 shadow-md border-2 border-white">
                <Zap className="w-4 h-4 fill-amber-950" />
              </span>
            </div>
          </div>
        </div>

        {/* Brand Logo & Name */}
        <div className="w-full flex flex-col items-center justify-center space-y-1">
          <img
            src={BRAND_CONFIG.logos.white || BRAND_CONFIG.logos.main}
            alt={BRAND_CONFIG.name}
            className="h-14 w-auto object-contain filter drop-shadow-md"
            onError={(e) => {
              // Fallback to text if image fails to load
              e.currentTarget.style.display = 'none'
            }}
          />
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-white drop-shadow-md">
            {BRAND_CONFIG.name}
          </h1>
        </div>

        {/* Tagline */}
        <p className="font-body text-sm font-medium tracking-wide text-amber-100/90 text-center">
          {BRAND_CONFIG.tagline}
        </p>

        {/* Delivery Guarantee Pill */}
        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-sm text-xs font-semibold text-white">
          <Clock className="w-3.5 h-3.5 text-amber-300" />
          <span>20-30 mins <span className="text-white/50 mx-1">•</span> 100% Contactless</span>
        </div>
      </div>

      {/* Bottom Bouncing Loader & Tagline */}
      <div className="relative z-10 w-full flex flex-col items-center gap-3 text-center pt-4 max-w-md">
        <div aria-label="Loading Dinning Zone Application" className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-200 animate-bounce" />
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="font-semibold tracking-[0.2em] uppercase text-amber-200/80 text-[10px]">
            Fast & Fresh Dining Experience
          </span>
          <div className="w-12 h-0.5 rounded-full bg-white/30 mt-1" />
        </div>
      </div>
    </div>
  )
}
