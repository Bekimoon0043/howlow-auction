import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import AppLayout from '@/components/layout/AppLayout'
import AdminLayout from '@/components/layout/AdminLayout'
import HomePage from '@/pages/HomePage'
import AuctionsPage from '@/pages/AuctionsPage'
import AuctionDetailPage from '@/pages/AuctionDetailPage'
import WalletPage from '@/pages/WalletPage'
import MyBidsPage from '@/pages/MyBidsPage'
import WinnersPage from '@/pages/WinnersPage'
import MyOrdersPage from '@/pages/MyOrdersPage'
import ProfilePage from '@/pages/ProfilePage'
import HelpPage from '@/pages/HelpPage'
import LoginPage from '@/pages/auth/LoginPage'
import SignupPage from '@/pages/auth/SignupPage'
import AdminDashboard from '@/pages/admin/Dashboard'
import AdminProducts from '@/pages/admin/Products'
import AdminAuctions from '@/pages/admin/Auctions'
import AdminUsers from '@/pages/admin/Users'
import AdminWallet from '@/pages/admin/Wallet'
import AdminSettings from '@/pages/admin/Settings'
import ProtectedRoute from '@/components/ProtectedRoute'
import AdminRoute from '@/components/AdminRoute'

export default function App() {
  const initialize = useAuthStore(s => s.initialize)
  const loading = useAuthStore(s => s.loading)
  const initTheme = useThemeStore(s => s.init)

  useEffect(() => {
    initialize()
    initTheme()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse text-brand-700 text-xl font-semibold">HowLow</div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/auctions" element={<AuctionsPage />} />
          <Route path="/auctions/:id" element={<AuctionDetailPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/my-bids" element={<MyBidsPage />} />
          <Route path="/winners" element={<WinnersPage />} />
          <Route path="/my-orders" element={<MyOrdersPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/help" element={<HelpPage />} />
        </Route>
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="auctions" element={<AdminAuctions />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="wallet" element={<AdminWallet />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
