import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/routes/guards'
import { useProfileQuery, useUpdateProfileMutation, useSignOutMutation } from './hooks'
import { BRAND_CONFIG } from '@/config/brand'
import { ShoppingBag, MapPin, PhoneCall, LogOut, Edit2, ShieldAlert, Download, User as UserIcon } from 'lucide-react'

export const ProfilePage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const userId = user?.id

  const { data: profile, isLoading } = useProfileQuery(userId)
  const updateMutation = useUpdateProfileMutation(userId || '')
  const signOutMutation = useSignOutMutation()

  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')

  const handleEditClick = () => {
    if (profile) {
      setFullName(profile.full_name || '')
      setPhone(profile.phone || '')
      setIsEditing(true)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateMutation.mutateAsync({ full_name: fullName, phone })
      setIsEditing(false)
    } catch {
      // Error handled by hook toast
    }
  }

  const handleSignOut = async () => {
    try {
      await signOutMutation.mutateAsync()
      navigate('/login', { replace: true })
    } catch {
      // Error handled by hook toast
    }
  }

  if (!user) {
    return (
      <div className="py-10 text-center space-y-4 max-w-sm mx-auto">
        <div className="w-16 h-16 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mx-auto">
          <UserIcon className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="font-heading text-xl font-bold">Welcome to Dinning Zone</h3>
          <p className="text-sm text-brand-muted">Log in to view profile, manage saved addresses, and track orders.</p>
        </div>
        <div className="pt-2 flex flex-col gap-2">
          <Link
            to="/login"
            className="w-full py-3 rounded-btn bg-brand-primary text-white font-semibold text-sm hover:bg-brand-dark transition-colors shadow-subtle"
          >
            Log in / Sign up
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Profile Header Card */}
      <div className="bg-white rounded-card p-5 border border-brand-border shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-brand-primary text-white font-heading font-bold text-xl flex items-center justify-center shadow-subtle">
              {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-brand-text">
                {profile?.full_name || 'Valued Customer'}
              </h3>
              <p className="text-xs text-brand-muted">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full">
                  {profile?.role || 'Customer'}
                </span>
                {profile?.phone && <span className="text-xs text-brand-muted">+91 {profile.phone}</span>}
              </div>
            </div>
          </div>
          <button
            onClick={handleEditClick}
            className="p-2 text-brand-primary hover:bg-brand-primary/10 rounded-full transition-colors"
            title="Edit Profile"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>

        {/* Inline Edit Form */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} className="pt-4 border-t border-brand-border space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-text block">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-brand-border rounded-btn text-sm bg-white"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-text block">Phone Number (+91)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={10}
                className="w-full px-3 py-2 border border-brand-border rounded-btn text-sm bg-white"
                placeholder="9876543210"
                required
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1 py-2 rounded-btn bg-brand-primary text-white text-xs font-semibold hover:bg-brand-dark transition-colors"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-btn border border-brand-border text-xs font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Role Navigation Cards */}
      {profile?.role === 'admin' && (
        <Link
          to="/admin"
          className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-4 rounded-card text-emerald-900 shadow-subtle hover:bg-emerald-100/70 transition-colors"
        >
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-emerald-700" />
            <div>
              <h4 className="font-heading text-sm font-bold">Switch to Admin Panel</h4>
              <p className="text-xs text-emerald-700">Manage restaurant live orders, menu, and riders</p>
            </div>
          </div>
          <span className="text-xs font-bold bg-emerald-700 text-white px-2.5 py-1 rounded-full">Open</span>
        </Link>
      )}

      {profile?.role === 'rider' && (
        <Link
          to="/rider"
          className="flex items-center justify-between bg-amber-50 border border-amber-200 p-4 rounded-card text-amber-900 shadow-subtle hover:bg-amber-100/70 transition-colors"
        >
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700" />
            <div>
              <h4 className="font-heading text-sm font-bold">Switch to Rider App</h4>
              <p className="text-xs text-amber-700">View assigned deliveries & OTP verification</p>
            </div>
          </div>
          <span className="text-xs font-bold bg-amber-700 text-white px-2.5 py-1 rounded-full">Open</span>
        </Link>
      )}

      {/* Action Menu List */}
      <div className="bg-white rounded-card border border-brand-border divide-y divide-brand-border shadow-subtle overflow-hidden">
        <Link to="/orders" className="flex items-center justify-between p-4 hover:bg-brand-bg/50 transition-colors">
          <div className="flex items-center gap-3 text-brand-text">
            <ShoppingBag className="w-5 h-5 text-brand-primary" />
            <span className="text-sm font-medium">My Orders</span>
          </div>
          <span className="text-xs text-brand-muted font-bold">&rarr;</span>
        </Link>

        <Link to="/addresses" className="flex items-center justify-between p-4 hover:bg-brand-bg/50 transition-colors">
          <div className="flex items-center gap-3 text-brand-text">
            <MapPin className="w-5 h-5 text-brand-primary" />
            <span className="text-sm font-medium">Saved Addresses</span>
          </div>
          <span className="text-xs text-brand-muted font-bold">&rarr;</span>
        </Link>

        <a
          href={`tel:${BRAND_CONFIG.supportPhone}`}
          className="flex items-center justify-between p-4 hover:bg-brand-bg/50 transition-colors"
        >
          <div className="flex items-center gap-3 text-brand-text">
            <PhoneCall className="w-5 h-5 text-brand-primary" />
            <span className="text-sm font-medium">Call Support ({BRAND_CONFIG.supportPhone})</span>
          </div>
          <span className="text-xs text-brand-muted font-bold">&rarr;</span>
        </a>
      </div>

      {/* PWA Install Hint Card */}
      <div className="bg-white rounded-card p-4 border border-brand-border shadow-subtle flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Download className="w-5 h-5 text-brand-primary" />
          <div>
            <h4 className="font-heading text-xs font-bold text-brand-text">Install Dinning Zone App</h4>
            <p className="text-[11px] text-brand-muted">Add to home screen for faster ordering</p>
          </div>
        </div>
        <button
          onClick={() => alert('Tap your browser options menu and select "Add to Home Screen".')}
          className="px-3 py-1.5 rounded-btn bg-brand-bg text-brand-primary border border-brand-border text-xs font-semibold hover:bg-brand-primary hover:text-white transition-colors"
        >
          Install
        </button>
      </div>

      {/* Sign Out Button */}
      <button
        onClick={handleSignOut}
        disabled={signOutMutation.isPending}
        className="w-full py-3.5 rounded-btn border border-red-200 bg-red-50 text-brand-error font-semibold text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2 shadow-subtle"
      >
        <LogOut className="w-4 h-4" />
        <span>Log out</span>
      </button>
    </div>
  )
}
