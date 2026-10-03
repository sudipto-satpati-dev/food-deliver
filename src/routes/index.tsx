import React, { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { CustomerLayout } from '@/layouts/CustomerLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { RiderLayout } from '@/layouts/RiderLayout'
import { RequireAuth, RequireRole } from '@/routes/guards'

// Customer pages (eager loaded for fast initial customer experience)
import { HomePage } from '@/features/home/HomePage'
import { MenuPage } from '@/features/menu/MenuPage'
import { SearchPage } from '@/features/menu/SearchPage'
import { CartPage } from '@/features/cart/CartPage'
import { CheckoutPage } from '@/features/checkout/CheckoutPage'
import { PaymentResultPage } from '@/features/checkout/PaymentResultPage'
import { OrdersPage } from '@/features/orders/OrdersPage'
import { OrderDetailPage } from '@/features/orders/OrderDetailPage'
import { RateOrderPage } from '@/features/reviews/RateOrderPage'
import { AddressesPage } from '@/features/address/AddressesPage'
import { AddressFormPage } from '@/features/address/AddressFormPage'
import { ProfilePage } from '@/features/auth/ProfilePage'
import { NotificationsPage } from '@/features/notifications/NotificationsPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { SignUpPage } from '@/features/auth/SignUpPage'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { VerifyEmailPage } from '@/features/auth/VerifyEmailPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

// Lazy-loaded Admin pages
const AdminDashboardPage = lazy(() => import('@/features/admin/DashboardPage').then(m => ({ default: m.DashboardPage })))
const AdminOrdersPage = lazy(() => import('@/features/admin/AdminOrdersPage').then(m => ({ default: m.AdminOrdersPage })))
const AdminOrderDetailPage = lazy(() => import('@/features/admin/AdminOrderDetailPage').then(m => ({ default: m.AdminOrderDetailPage })))
const AdminMenuPage = lazy(() => import('@/features/admin/AdminMenuPage').then(m => ({ default: m.AdminMenuPage })))
const AdminItemFormPage = lazy(() => import('@/features/admin/AdminItemFormPage').then(m => ({ default: m.AdminItemFormPage })))
const AdminCategoriesPage = lazy(() => import('@/features/admin/AdminCategoriesPage').then(m => ({ default: m.AdminCategoriesPage })))
const AdminCouponsPage = lazy(() => import('@/features/admin/AdminCouponsPage').then(m => ({ default: m.AdminCouponsPage })))
const AdminCouponFormPage = lazy(() => import('@/features/admin/AdminCouponFormPage').then(m => ({ default: m.AdminCouponFormPage })))
const AdminRidersPage = lazy(() => import('@/features/admin/AdminRidersPage').then(m => ({ default: m.AdminRidersPage })))
const AdminReviewsPage = lazy(() => import('@/features/admin/AdminReviewsPage').then(m => ({ default: m.AdminReviewsPage })))
const AdminReportsPage = lazy(() => import('@/features/admin/AdminReportsPage').then(m => ({ default: m.AdminReportsPage })))
const AdminSettingsPage = lazy(() => import('@/features/admin/AdminSettingsPage').then(m => ({ default: m.AdminSettingsPage })))

// Lazy-loaded Rider pages
const RiderHomePage = lazy(() => import('@/features/rider/RiderHomePage').then(m => ({ default: m.RiderHomePage })))
const RiderOrderDetailPage = lazy(() => import('@/features/rider/RiderOrderDetailPage').then(m => ({ default: m.RiderOrderDetailPage })))
const RiderHistoryPage = lazy(() => import('@/features/rider/RiderHistoryPage').then(m => ({ default: m.RiderHistoryPage })))

const LoadingSpinner = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
  </div>
)

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Customer Routes */}
      <Route path="/" element={<CustomerLayout />}>
        <Route index element={<HomePage />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="payment/result" element={<PaymentResultPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="orders/:id/rate" element={<RateOrderPage />} />
        <Route path="addresses" element={<AddressesPage />} />
        <Route path="addresses/new" element={<AddressFormPage />} />
        <Route path="addresses/:id" element={<AddressFormPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignUpPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />
      </Route>

      {/* Admin Panel Routes (Lazy-loaded with Admin Role guard) */}
      <Route
        path="/admin"
        element={
          <RequireRole role="admin">
            <AdminLayout />
          </RequireRole>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AdminDashboardPage />
            </Suspense>
          }
        />
        <Route
          path="orders"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AdminOrdersPage />
            </Suspense>
          }
        />
        <Route
          path="orders/:id"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AdminOrderDetailPage />
            </Suspense>
          }
        />
        <Route
          path="menu"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AdminMenuPage />
            </Suspense>
          }
        />
        <Route
          path="menu/items/new"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AdminItemFormPage />
            </Suspense>
          }
        />
        <Route
          path="menu/items/:id"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AdminItemFormPage />
            </Suspense>
          }
        />
        <Route
          path="categories"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AdminCategoriesPage />
            </Suspense>
          }
        />
        <Route
          path="coupons"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AdminCouponsPage />
            </Suspense>
          }
        />
        <Route
          path="coupons/new"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AdminCouponFormPage />
            </Suspense>
          }
        />
        <Route
          path="coupons/:id"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AdminCouponFormPage />
            </Suspense>
          }
        />
        <Route
          path="riders"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AdminRidersPage />
            </Suspense>
          }
        />
        <Route
          path="reviews"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AdminReviewsPage />
            </Suspense>
          }
        />
        <Route
          path="reports"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AdminReportsPage />
            </Suspense>
          }
        />
        <Route
          path="settings"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <AdminSettingsPage />
            </Suspense>
          }
        />
      </Route>

      {/* Rider App Routes (Lazy-loaded with Rider Role guard) */}
      <Route
        path="/rider"
        element={
          <RequireRole role="rider">
            <RiderLayout />
          </RequireRole>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <RiderHomePage />
            </Suspense>
          }
        />
        <Route
          path="orders/:id"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <RiderOrderDetailPage />
            </Suspense>
          }
        />
        <Route
          path="history"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <RiderHistoryPage />
            </Suspense>
          }
        />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
