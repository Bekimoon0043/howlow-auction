import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'

export default function SignupPage() {
  const { t } = useTranslation()
  const signUp = useAuthStore(s => s.signUp)
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await signUp(phone, password, displayName || undefined)
    setLoading(false)
    if (res.error) setError(res.error)
    else navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-brand-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="card w-full max-w-md p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-brand-700">{t('app_name')}</h1>
          <p className="text-gray-500 mt-1">{t('signup')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('phone')}</label>
            <input
              type="tel"
              className="input-field"
              placeholder="+2519xxxxxxxx"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('display_name')}</label>
            <input
              type="text"
              className="input-field"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('password')}</label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{t(error) || error}</p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? t('loading') : t('signup')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          <Link to="/login" className="text-brand-700 font-medium">
            {t('login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
