const PRODUCT_IMAGES_BUCKET = 'product-images'

/**
 * Resolves a product image reference into a displayable URL.
 * Supports two kinds of values stored in product_images.storage_path:
 *  - a full external URL (e.g. "https://...") pasted by the admin
 *  - a Supabase Storage path (e.g. "<productId>/169...-0.jpg") from a file upload
 */
export function productImageUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return ''
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  const base = import.meta.env.VITE_SUPABASE_URL
  return `${base}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${pathOrUrl}`
}

export function formatETB(amount: number | string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-ET', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n) + ' ETB'
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 8) return phone
  return phone.slice(0, 5) + '****' + phone.slice(-3)
}

export function formatCountdown(endTime: string | Date): string {
  const end = new Date(endTime).getTime()
  const now = Date.now()
  const diff = Math.max(0, end - now)
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  if (h > 24) {
    const d = Math.floor(h / 24)
    return `${d}d ${h % 24}h`
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
