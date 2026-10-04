import React, { useState, useEffect } from 'react'
import {
  getNotificationPermission,
  isIOS,
  isPWAInstalled,
  subscribeUserToPush,
} from '@/lib/push'
import { Bell, Share, PlusSquare, X } from 'lucide-react'
import { toast } from 'sonner'

interface PushNotificationPromptProps {
  userId?: string
  className?: string
}

export const PushNotificationPrompt: React.FC<PushNotificationPromptProps> = ({
  userId,
  className = '',
}) => {
  const [permission, setPermission] = useState<string>('default')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const showIOSHint = isIOS() && !isPWAInstalled()

  useEffect(() => {
    const perm = getNotificationPermission()
    setPermission(perm)
  }, [])

  if (!userId || dismissed || permission === 'granted' || permission === 'unsupported') {
    return null
  }

  const handleEnable = async () => {
    setIsSubmitting(true)
    const res = await subscribeUserToPush(userId)
    setIsSubmitting(false)

    if (res.success) {
      setPermission('granted')
      toast.success('Push notifications enabled! You will get live order alerts. 🎉')
    } else {
      if (Notification.permission === 'denied') {
        setPermission('denied')
        toast.error('Notification permission was blocked in browser settings.')
      } else {
        toast.error(res.error || 'Could not enable notifications.')
      }
    }
  }

  return (
    <div
      className={`p-4 bg-gradient-to-r from-brand-surface to-amber-50 border border-brand-primary/20 rounded-card shadow-soft space-y-3 relative transition-all ${className}`}
    >
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-brand-muted hover:text-brand-dark p-1"
        aria-label="Dismiss notification prompt"
      >
        <X className="w-4 h-4" />
      </button>

      {/* iOS Installation Hint Banner */}
      {showIOSHint ? (
        <div className="space-y-2 pr-6 text-xs text-brand-dark">
          <div className="flex items-center gap-2 text-brand-primary font-bold">
            <Share className="w-4 h-4" />
            <span>Enable Push Notifications on iPhone</span>
          </div>
          <p className="text-brand-muted text-[11px] leading-relaxed">
            iOS requires adding this app to your Home Screen first:
            <br />
            1. Tap the <strong className="text-brand-dark">Share button</strong> <Share className="w-3 h-3 inline mx-0.5" /> in Safari.
            <br />
            2. Tap <strong className="text-brand-dark">Add to Home Screen</strong> <PlusSquare className="w-3 h-3 inline mx-0.5" />.
          </p>
        </div>
      ) : (
        /* Standard Permission Prompt Card */
        <div className="flex items-start gap-3 pr-6">
          <div className="w-9 h-9 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center shrink-0 mt-0.5">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>

          <div className="flex-1 space-y-2 text-xs">
            <div>
              <h4 className="font-bold text-brand-dark text-sm">Get Realtime Order Alerts</h4>
              <p className="text-brand-muted mt-0.5">
                Receive instant notifications when your food is being cooked, out for delivery, and delivered!
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleEnable}
                disabled={isSubmitting}
                className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-btn shadow-soft hover:bg-brand-primary/95 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Enabling...</span>
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5" />
                    <span>Enable Notifications</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="px-3 py-2 bg-transparent text-brand-muted hover:text-brand-dark font-medium text-xs rounded-btn"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
