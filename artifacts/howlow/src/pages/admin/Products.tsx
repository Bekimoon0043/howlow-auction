import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { formatETB, productImageUrl } from '@/lib/format'
import { Upload, X, Image as ImageIcon, Link as LinkIcon, AlertCircle, CheckCircle } from 'lucide-react'

const BUCKET = 'product-images'

type StepStatus = 'idle' | 'saving' | 'uploading' | 'done' | 'error'

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([])
  const [form, setForm] = useState({
    title_am: '',
    title_en: '',
    description_am: '',
    description_en: '',
    shipping_cost: '0'
  })
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [urlInput, setUrlInput] = useState('')
  const [step, setStep] = useState<StepStatus>('idle')
  const [stepMsg, setStepMsg] = useState('')
  const [errorDetail, setErrorDetail] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(*)')
      .order('created_at', { ascending: false })
    if (error) setErrorDetail(`Load error: ${error.message}`)
    setProducts(data || [])
  }

  useEffect(() => { load() }, [])

  const onFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    const images = selected.filter(f => f.type.startsWith('image/'))
    if (images.length === 0) { setErrorDetail('Select JPG, PNG or WebP files only'); return }
    setFiles(prev => [...prev, ...images].slice(0, 8))
    const urls = images.map(f => URL.createObjectURL(f))
    setPreviews(prev => [...prev, ...urls].slice(0, 8))
    if (inputRef.current) inputRef.current.value = ''
    setErrorDetail('')
  }

  const removePreview = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
    setPreviews(prev => { URL.revokeObjectURL(prev[idx]); return prev.filter((_, i) => i !== idx) })
  }

  const addImageUrl = () => {
    const url = urlInput.trim()
    if (!url) return
    if (!/^https?:\/\/.+/i.test(url)) { setErrorDetail('URL must start with http:// or https://'); return }
    if (imageUrls.length + files.length >= 8) { setErrorDetail('Maximum 8 images per product'); return }
    setImageUrls(prev => [...prev, url])
    setUrlInput('')
    setErrorDetail('')
  }

  const removeImageUrl = (idx: number) => setImageUrls(prev => prev.filter((_, i) => i !== idx))

  const uploadImages = async (productId: string): Promise<{ saved: number; failed: string[] }> => {
    const rows: { product_id: string; storage_path: string; is_primary: boolean; sort_order: number }[] = []
    const failed: string[] = []
    let order = 0

    // Upload files to Supabase Storage
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${productId}/${Date.now()}-${i}.${ext}`

      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

      if (upErr) {
        // Bucket might not exist — give a specific hint
        const hint = upErr.message.toLowerCase().includes('not found') || upErr.message.toLowerCase().includes('bucket')
          ? ' — the "product-images" storage bucket may not exist yet. Run the storage SQL in Supabase.'
          : ''
        failed.push(`${file.name}: ${upErr.message}${hint}`)
        continue
      }

      rows.push({ product_id: productId, storage_path: path, is_primary: order === 0, sort_order: order })
      order++
    }

    // Save external URLs directly to product_images
    for (const url of imageUrls) {
      rows.push({ product_id: productId, storage_path: url, is_primary: order === 0, sort_order: order })
      order++
    }

    if (rows.length > 0) {
      const { error } = await supabase.from('product_images').insert(rows)
      if (error) {
        const hint = error.message.toLowerCase().includes('rls') || error.message.toLowerCase().includes('policy')
          ? ' — make sure your account is in the admins table.'
          : ''
        failed.push(`Database save: ${error.message}${hint}`)
        return { saved: 0, failed }
      }
    }

    return { saved: rows.length, failed }
  }

  const create = async () => {
    if (!form.title_am || !form.title_en) {
      setErrorDetail('Title (both Amharic & English) is required')
      return
    }
    setStep('saving')
    setStepMsg('Saving product…')
    setErrorDetail('')

    try {
      // Step 1 — insert product
      const { data: product, error } = await supabase
        .from('products')
        .insert({
          title_am: form.title_am,
          title_en: form.title_en,
          description_am: form.description_am || null,
          description_en: form.description_en || null,
          shipping_cost: parseFloat(form.shipping_cost || '0')
        })
        .select('id')
        .single()

      if (error) {
        const hint = error.message.toLowerCase().includes('rls') || error.message.toLowerCase().includes('policy') || error.code === '42501'
          ? '\n\nHint: Make sure your user account is added to the admins table in Supabase.'
          : ''
        throw new Error(`Product save failed: ${error.message}${hint}`)
      }
      if (!product) throw new Error('Product was not created (no ID returned)')

      // Step 2 — upload images (if any)
      const totalImages = files.length + imageUrls.length
      if (totalImages > 0) {
        setStep('uploading')
        setStepMsg(`Uploading ${totalImages} image(s)…`)
        const { saved, failed } = await uploadImages(product.id)

        if (failed.length > 0) {
          setStep('error')
          setStepMsg(`Product saved, but ${failed.length} image(s) failed:`)
          setErrorDetail(failed.join('\n'))
          load()
          return
        }

        setStep('done')
        setStepMsg(`Product created with ${saved} image(s) ✓`)
      } else {
        setStep('done')
        setStepMsg('Product created (no images) ✓')
      }

      // Reset form
      setForm({ title_am: '', title_en: '', description_am: '', description_en: '', shipping_cost: '0' })
      previews.forEach(u => URL.revokeObjectURL(u))
      setFiles([])
      setPreviews([])
      setImageUrls([])
      setUrlInput('')
      load()
    } catch (e: any) {
      setStep('error')
      setStepMsg('Failed to create product')
      setErrorDetail(e.message || String(e))
    }
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product and all its images?')) return
    const { data: imgs } = await supabase.from('product_images').select('storage_path').eq('product_id', id)
    const storagePaths = (imgs || []).map(i => i.storage_path).filter(p => !/^https?:\/\//i.test(p))
    if (storagePaths.length) await supabase.storage.from(BUCKET).remove(storagePaths)
    await supabase.from('products').delete().eq('id', id)
    load()
  }

  const totalQueued = files.length + imageUrls.length

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Products</h1>

      <div className="card p-4 space-y-3 max-w-lg">
        <input className="input-field" placeholder="Title (Amharic) *" value={form.title_am}
          onChange={e => setForm({ ...form, title_am: e.target.value })} />
        <input className="input-field" placeholder="Title (English) *" value={form.title_en}
          onChange={e => setForm({ ...form, title_en: e.target.value })} />
        <textarea className="input-field min-h-[70px]" placeholder="Description (Amharic)"
          value={form.description_am} onChange={e => setForm({ ...form, description_am: e.target.value })} />
        <textarea className="input-field min-h-[70px]" placeholder="Description (English)"
          value={form.description_en} onChange={e => setForm({ ...form, description_en: e.target.value })} />
        <input className="input-field" type="number" step="0.01" placeholder="Shipping Cost ETB"
          value={form.shipping_cost} onChange={e => setForm({ ...form, shipping_cost: e.target.value })} />

        {/* ── File upload ── */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Product Images
            {totalQueued > 0 && <span className="ml-2 text-brand-700 font-semibold">{totalQueued} queued</span>}
          </label>
          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-5 text-center cursor-pointer hover:border-brand-500 transition"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mx-auto text-gray-400 mb-1" size={24} />
            <p className="text-sm text-gray-500">Click to select images (JPG, PNG, WebP)</p>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/jpg"
              multiple className="hidden" onChange={onFilesSelected} />
          </div>

          {previews.length > 0 && (
            <div className="mt-2 grid grid-cols-4 gap-2">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  {i === 0 && <span className="absolute top-1 left-1 text-[9px] bg-brand-700 text-white px-1 py-0.5 rounded">Primary</span>}
                  <button type="button" onClick={e => { e.stopPropagation(); removePreview(i) }}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── URL input ── */}
        <div>
          <label className="block text-sm font-medium mb-2">Or add image by URL</label>
          <div className="flex gap-2">
            <input className="input-field flex-1" placeholder="https://example.com/photo.jpg"
              value={urlInput} onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addImageUrl() } }} />
            <button type="button" className="btn-secondary flex items-center gap-1 whitespace-nowrap" onClick={addImageUrl}>
              <LinkIcon size={15} /> Add
            </button>
          </div>

          {imageUrls.length > 0 && (
            <div className="mt-2 grid grid-cols-4 gap-2">
              {imageUrls.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img src={url} alt="" className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).style.display = 'none' }} />
                  {i === 0 && files.length === 0 && <span className="absolute top-1 left-1 text-[9px] bg-brand-700 text-white px-1 py-0.5 rounded">Primary</span>}
                  <button type="button" onClick={() => removeImageUrl(i)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="btn-primary w-full" onClick={create} disabled={step === 'saving' || step === 'uploading'}>
          {step === 'saving' ? 'Saving product…' : step === 'uploading' ? 'Uploading images…' : 'Add Product'}
        </button>

        {/* Status feedback */}
        {step !== 'idle' && (
          <div className={`rounded-lg p-3 text-sm flex gap-2 items-start ${
            step === 'done' ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
            step === 'error' ? 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
            'bg-brand-50 text-brand-800 dark:bg-brand-900/30 dark:text-brand-300'
          }`}>
            {step === 'done' ? <CheckCircle size={16} className="mt-0.5 flex-shrink-0" /> :
             step === 'error' ? <AlertCircle size={16} className="mt-0.5 flex-shrink-0" /> : null}
            <div>
              <p className="font-medium">{stepMsg}</p>
              {errorDetail && <pre className="mt-1 text-xs whitespace-pre-wrap font-mono">{errorDetail}</pre>}
            </div>
          </div>
        )}
      </div>

      {/* Product list */}
      <div className="space-y-3">
        {products.length === 0 && <p className="text-sm text-gray-500">No products yet.</p>}
        {products.map(p => {
          const primary = p.product_images?.find((img: any) => img.is_primary) || p.product_images?.[0]
          return (
            <div key={p.id} className="card p-3 flex gap-3 items-center">
              <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {primary ? (
                  <img src={productImageUrl(primary.storage_path)} alt=""
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                ) : (
                  <ImageIcon className="text-gray-400" size={22} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{p.title_en}</p>
                <p className="text-sm text-gray-500 truncate">{p.title_am}</p>
                <p className="text-xs text-gray-400">
                  {p.product_images?.length || 0} image(s)
                </p>
              </div>
              <button className="btn-secondary text-sm text-red-600 shrink-0" onClick={() => deleteProduct(p.id)}>
                Delete
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
