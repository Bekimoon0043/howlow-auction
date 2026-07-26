import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export default function AdminRoute() {
  const user = useAuthStore(s => s.user)
  const isAdmin = useAuthStore(s => s.isAdmin)
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return <Outlet />
}
