import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatETB } from '@/lib/format'

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([])
  const [form, setForm] = useState({ title_am: '', title_en: '', retail_price: '', shipping_cost: '0' })
  const [msg, setMsg] = useState('')

  const load = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setProducts(data || [])
  }

  useEffect(() => { load() }, [])

  const create = async () => {
    const { error } = await supabase.from('products').insert({
      title_am: form.title_am,
      title_en: form.title_en,
      retail_price: parseFloat(form.retail_price),
      shipping_cost: parseFloat(form.shipping_cost || '0')
    })
    if (error) setMsg(error.message)
    else {
      setMsg('Created')
      setForm({ title_am: '', title_en: '', retail_price: '', shipping_cost: '0' })
      load()
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Products</h1>
      <div className="card p-4 space-y-3 max-w-md">
        <input className="input-field" placeholder="Title (Amharic)" value={form.title_am} onChange={e => setForm({ ...form, title_am: e.target.value })} />
        <input className="input-field" placeholder="Title (English)" value={form.title_en} onChange={e => setForm({ ...form, title_en: e.target.value })} />
        <input className="input-field" type="number" placeholder="Retail Price ETB" value={form.retail_price} onChange={e => setForm({ ...form, retail_price: e.target.value })} />
        <input className="input-field" type="number" placeholder="Shipping Cost ETB" value={form.shipping_cost} onChange={e => setForm({ ...form, shipping_cost: e.target.value })} />
        <button className="btn-primary" onClick={create}>Add Product</button>
        {msg && <p className="text-sm">{msg}</p>}
      </div>
      <div className="space-y-2">
        {products.map(p => (
          <div key={p.id} className="card p-3 flex justify-between">
            <div>
              <p className="font-medium">{p.title_en}</p>
              <p className="text-sm text-gray-500">{p.title_am}</p>
            </div>
            <p>{formatETB(p.retail_price)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
