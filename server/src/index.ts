import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { createClient } from '@supabase/supabase-js'

const app = express()
const PORT = process.env.PORT || 3001

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

app.use(helmet())
app.use(cors({ origin: true, credentials: true }))
app.use(morgan('combined'))
app.use(express.json())

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many requests, try again later' }
})

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', currency: 'ETB', time: new Date().toISOString() })
})

/** Admin-only: reset user password by phone */
app.post('/api/admin/reset-password', authLimiter, async (req, res) => {
  try {
    const { phone, newPassword, adminUserId } = req.body
    if (!phone || !newPassword || !adminUserId) {
      return res.status(400).json({ error: 'Missing fields' })
    }

    // Verify caller is admin
    const { data: admin } = await supabase.from('admins').select('user_id').eq('user_id', adminUserId).maybeSingle()
    if (!admin) return res.status(403).json({ error: 'Unauthorized' })

    const { data: profile } = await supabase.from('profiles').select('id').eq('phone_number', phone).maybeSingle()
    if (!profile) return res.status(404).json({ error: 'User not found' })

    const { error } = await supabase.auth.admin.updateUserById(profile.id, { password: newPassword })
    if (error) return res.status(500).json({ error: error.message })

    await supabase.from('activity_logs').insert({
      actor_id: adminUserId,
      action: 'password_reset',
      entity_type: 'user',
      entity_id: profile.id
    })

    res.json({ success: true })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

app.listen(PORT, () => {
  console.log(`HowLow server running on :${PORT}`)
})
