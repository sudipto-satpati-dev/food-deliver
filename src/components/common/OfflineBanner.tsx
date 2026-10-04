import React, { useState, useEffect } from 'react'
import { WifiOff, Wifi } from 'lucide-react'

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [showBackOnlineToast, setShowBackOnlineToast] = useState(false)

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true)
      setShowBackOnlineToast(false)
    }

    const handleOnline = () => {
      setIsOffline(false)
      setShowBackOnlineToast(true)
      const timer = setTimeout(() => {
        setShowBackOnlineToast(false)
      }, 4000)
      return () => clearTimeout(timer)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (showBackOnlineToast) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-emerald-600 text-white text-xs font-bold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-md animate-slide-down">
        <Wifi className="w-4 h-4" />
        <span>You are back online! Connection restored.</span>
      </div>
    )
  }

  if (!isOffline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-xs font-extrabold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-md">
      <WifiOff className="w-4 h-4 animate-bounce" />
      <span>Offline Mode: Internet connection lost. Showing cached data.</span>
    </div>
  )
}
