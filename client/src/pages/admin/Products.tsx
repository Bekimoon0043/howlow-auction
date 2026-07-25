import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { formatETB } from '@/lib/format'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

const BUCKET = 'product-images'

function publicUrl(path: string) {
  const base = import.meta.env.VITE_SUPABASE_URL
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`
}

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([])
  const [form, setForm] = useState({
    title_am: '',
    title_en: '',
    description_am: '',
    description_en: '',
    retail_price: '',
    shipping_cost: '0'
  })
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, product_images(*)')
      .order('created_at', { ascending: false })
    setProducts(data || [])
  }

  useEffect(() => {
    load()
  }, [])

  const onFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    const images = selected.filter(f => f.type.startsWith('image/'))
    if (images.length === 0) {
      setMsg('Please select image files only (jpg, png, webp)')
      return
    }
    setFiles(prev => [...prev, ...images].slice(0, 8))
    const urls = images.map(f => URL.createObjectURL(f))
    setPreviews(prev => [...prev, ...urls].slice(0, 8))
    if (inputRef.current) inputRef.current.value = ''
  }

  const removePreview = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
    setPreviews(prev => {
      URL.revokeObjectURL(prev[idx])
      return prev.filter((_, i) => i !== idx)
    })
  }

  const uploadImages = async (productId: string) => {
    const rows: { product_id: string; storage_path: string; is_primary: boolean; sort_order: number }[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${productId}/${Date.now()}-${i}.${ext}`

      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

      if (upErr) throw new Error(`Upload failed: ${upErr.message}`)

      rows.push({
        product_id: productId,
        storage_path: path,
        is_primary: i === 0,
        sort_order: i
      })
    }

    if (rows.length > 0) {
      const { error } = await supabase.from('product_images').insert(rows)
      if (error) throw new Error(error.message)
    }
  }

  const create = async () => {
    if (!form.title_am || !form.title_en || !form.retail_price) {
      setMsg('Title (both languages) and retail price are required')
      return
    }
    setLoading(true)
    setMsg('')

    try {
      const { data: product, error } = await supabase
        .from('products')
        .insert({
          title_am: form.title_am,
          title_en: form.title_en,
          description_am: form.description_am || null,
          description_en: form.description_en || null,
          retail_price: parseFloat(form.retail_price),
          shipping_cost: parseFloat(form.shipping_cost || '0')
        })
        .select('id')
        .single()

      if (error) throw new Error(error.message)
      if (!product) throw new Error('Product not created')

      if (files.length > 0) {
        await uploadImages(product.id)
      }

      setMsg(`Product created${files.length ? ` with ${files.length} image(s)` : ''}`)
      setForm({
        title_am: '',
        title_en: '',
        description_am: '',
        description_en: '',
        retail_price: '',
        shipping_cost: '0'
      })
      previews.forEach(u => URL.revokeObjectURL(u))
      setFiles([])
      setPreviews([])
      load()
    } catch (e: any) {
      setMsg(e.message || 'Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product and its images?')) return
    // Remove storage files
    const { data: imgs } = await supabase.from('product_images').select('storage_path').eq('product_id', id)
    if (imgs?.length) {
      await supabase.storage.from(BUCKET).remove(imgs.map(i => i.storage_path))
    }
    await supabase.from('products').delete().eq('id', id)
    load()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Products</h1>

      <div className="card p-4 space-y-3 max-w-lg">
        <input
          className="input-field"
          placeholder="Title (Amharic) *"
          value={form.title_am}
          onChange={e => setForm({ ...form, title_am: e.target.value })}
        />
        <input
          className="input-field"
          placeholder="Title (English) *"
          value={form.title_en}
          onChange={e => setForm({ ...form, title_en: e.target.value })}
        />
        <textarea
          className="input-field min-h-[80px]"
          placeholder="Description (Amharic)"
          value={form.description_am}
          onChange={e => setForm({ ...form, description_am: e.target.value })}
        />
        <textarea
          className="input-field min-h-[80px]"
          placeholder="Description (English)"
          value={form.description_en}
          onChange={e => setForm({ ...form, description_en: e.target.value })}
        />
        <input
          className="input-field"
          type="number"
          step="0.01"
          placeholder="Retail Price ETB *"
          value={form.retail_price}
          onChange={e => setForm({ ...form, retail_price: e.target.value })}
        />
        <input
          className="input-field"
          type="number"
          step="0.01"
          placeholder="Shipping Cost ETB"
          value={form.shipping_cost}
          onChange={e => setForm({ ...form, shipping_cost: e.target.value })}
        />

        {/* Image upload */}
        <div>
          <label className="block text-sm font-medium mb-2">Product Images (up to 8)</label>
          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-brand-500 transition"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mx-auto text-gray-400 mb-2" size={28} />
            <p className="text-sm text-gray-500">Click to select images (JPG, PNG, WebP)</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              multiple
              className="hidden"
              onChange={onFilesSelected}
            />
          </div>

          {previews.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  {i === 0 && (
                    <span className="absolute top-1 left-1 text-[10px] bg-brand-700 text-white px-1.5 py-0.5 rounded">
                      Primary
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      removePreview(i)
                    }}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="btn-primary w-full" onClick={create} disabled={loading}>
          {loading ? 'Uploading…' : 'Add Product'}
        </button>
        {msg && <p className="text-sm text-center">{msg}</p>}
      </div>

      {/* Product list */}
      <div className="space-y-3">
        {products.map(p => {
          const primary = p.product_images?.find((img: any) => img.is_primary) || p.product_images?.[0]
          return (
            <div key={p.id} className="card p-3 flex gap-3 items-center">
              <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {primary ? (
                  <img src={publicUrl(primary.storage_path)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="text-gray-400" size={24} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{p.title_en}</p>
                <p className="text-sm text-gray-500 truncate">{p.title_am}</p>
                <p className="text-xs text-gray-400">
                  {p.product_images?.length || 0} image(s) · {formatETB(p.retail_price)}
                </p>
              </div>
              <button className="btn-secondary text-sm text-red-600" onClick={() => deleteProduct(p.id)}>
                Delete
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
