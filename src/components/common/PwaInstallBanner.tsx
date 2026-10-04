import React, { useState, useEffect } from 'react'
import { Download, X, Share } from 'lucide-react'

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showIOSHint, setShowIOSHint] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Check if user already dismissed
    if (localStorage.getItem('pwa-prompt-dismissed') === 'true') {
      setIsDismissed(true)
      return
    }

    // Check if already in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone
    if (isStandalone) return

    // Android / Chrome Install Prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // iOS Detection
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
    if (isIOS && !isStandalone) {
      setShowIOSHint(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem('pwa-prompt-dismissed', 'true')
  }

  if (isDismissed) return null

  // Android Native Install Banner
  if (deferredPrompt) {
    return (
      <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-40 bg-gradient-to-r from-gray-900 to-brand-dark text-white p-4 rounded-card shadow-soft border border-white/20 flex items-center justify-between gap-3 animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-primary/20 rounded-btn flex items-center justify-center shrink-0">
            <img src="/brand/icon-192.png" alt="Dinning Zone Icon" className="w-7 h-7 rounded-md" />
          </div>
          <div>
            <h4 className="font-heading text-xs font-bold text-white">Install Dinning Zone</h4>
            <p className="text-[11px] text-gray-300">Fast 1-tap ordering & live alerts</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-brand-primary hover:bg-brand-dark text-white text-xs font-extrabold rounded-btn shadow-subtle flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-gray-400 hover:text-white transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // iOS Safari Installation Banner Hint
  if (showIOSHint) {
    return (
      <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-40 bg-gray-900 text-white p-4 rounded-card shadow-soft border border-white/20 space-y-2 animate-slide-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/brand/icon-192.png" alt="Dinning Zone Icon" className="w-6 h-6 rounded-md" />
            <span className="font-heading text-xs font-bold">Install Dinning Zone on iOS</span>
          </div>
          <button onClick={handleDismiss} className="p-1 text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[11px] text-gray-300 leading-relaxed flex items-center gap-1">
          Tap the <Share className="w-3.5 h-3.5 text-blue-400 inline mx-0.5" /> Share icon in Safari and select <strong className="text-white">"Add to Home Screen"</strong> for full PWA experience.
        </p>
      </div>
    )
  }

  return null
}
