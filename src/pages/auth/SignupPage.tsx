import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { Eye, EyeOff } from 'lucide-react'

export default function SignupPage() {
  const { t } = useTranslation()
  const signUp = useAuthStore(s => s.signUp)
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await signUp(phone, password, displayName || undefined)
    setLoading(false)
    if (res.error) {
      setError(typeof res.error === 'string' ? res.error : 'Something went wrong')
    } else {
      const isAdmin = useAuthStore.getState().isAdmin
      navigate(isAdmin ? '/admin' : '/', { replace: true })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden
                    bg-gradient-to-br from-slate-950 via-gray-900 to-brand-950">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
                      w-[500px] h-[500px] rounded-full
                      bg-brand-500/10 blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tight
                         bg-gradient-to-r from-brand-400 to-brand-300 bg-clip-text text-transparent">
            {t('app_name')}
          </h1>
          <p className="mt-1 text-gray-400 text-sm">ሃውሎ · Lowest Unique Bid</p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-7 shadow-2xl">
          <p className="text-white font-semibold text-lg mb-5">{t('signup')}</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">{t('display_name')}</label>
              <input
                type="text"
                className="w-full rounded-xl bg-white/8 border border-white/10 px-4 py-3 text-white
                           placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50
                           focus:border-brand-500/50 transition text-sm"
                placeholder="Your name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">{t('phone')}</label>
              <input
                type="tel"
                className="w-full rounded-xl bg-white/8 border border-white/10 px-4 py-3 text-white
                           placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50
                           focus:border-brand-500/50 transition text-sm"
                placeholder="+2519xxxxxxxx"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                autoComplete="tel"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">{t('password')}</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="w-full rounded-xl bg-white/8 border border-white/10 px-4 py-3 pr-12 text-white
                             placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50
                             focus:border-brand-500/50 transition text-sm"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button type="submit"
              className="w-full mt-1 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400
                         text-white font-semibold py-3.5 rounded-xl transition-all active:scale-[0.98]
                         shadow-lg shadow-brand-700/30 disabled:opacity-50 disabled:pointer-events-none"
              disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('loading')}
                </span>
              ) : t('signup')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition">
              {t('login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
