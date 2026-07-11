'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { createAsset } from '@/lib/actions'
import type { AssetCategory, AssetCondition, AssetStatus } from '@/lib/types'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

const CATEGORIES: AssetCategory[] = [
  'HVAC', 'Electrical', 'Plumbing', 'IT Equipment',
  'Furniture', 'Vehicle', 'Generator', 'Fire Safety', 'Security', 'Other',
]
const CONDITIONS: AssetCondition[] = ['Good', 'Fair', 'Poor', 'Critical']
const STATUSES: AssetStatus[] = ['Operational', 'Issue Reported', 'Under Inspection', 'Under Maintenance', 'Out of Service', 'Retired']

export default function NewAssetPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    category: 'HVAC' as AssetCategory,
    location: '',
    model: '',
    serial_number: '',
    condition: 'Good' as AssetCondition,
    status: 'Operational' as AssetStatus,
    purchase_date: '',
    last_service_date: '',
    next_service_date: '',
    notes: '',
  })

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.location.trim()) {
      setError('Name and location are required.')
      return
    }
    setError('')
    setLoading(true)
    const { data, error: err } = await createAsset({
      name: form.name.trim(),
      category: form.category,
      location: form.location.trim(),
      model: form.model || undefined,
      serial_number: form.serial_number || undefined,
      condition: form.condition,
      status: form.status,
      purchase_date: form.purchase_date || undefined,
      last_service_date: form.last_service_date || undefined,
      next_service_date: form.next_service_date || undefined,
      notes: form.notes || undefined,
    })
    if (err || !data) {
      setError(err ?? 'Failed to create asset. Please try again.')
      setLoading(false)
      return
    }
    router.push(`/dashboard/assets/${data.id}`)
  }

  const inputCls = "w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
  const labelCls = "block text-sm font-medium mb-1.5"

  return (
    <AppShell requireRole="admin">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard/assets" className="p-1.5 rounded-lg hover:bg-muted transition text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Register New Asset</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Add a new asset to the facility registry.</p>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-3 text-sm mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Info */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-semibold mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelCls}>Asset Name <span className="text-destructive">*</span></label>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Carrier HVAC Unit A1" className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Location <span className="text-destructive">*</span></label>
                <input type="text" value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Block A, Floor 3" className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Model</label>
                <input type="text" value={form.model} onChange={e => set('model', e.target.value)} placeholder="Optional" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Serial Number</label>
                <input type="text" value={form.serial_number} onChange={e => set('serial_number', e.target.value)} placeholder="Optional" className={inputCls} />
              </div>
            </div>
          </div>

          {/* Status & Condition */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-semibold mb-4">Status & Condition</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Initial Condition</label>
                <select value={form.condition} onChange={e => set('condition', e.target.value)} className={inputCls}>
                  {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Initial Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-semibold mb-4">Dates</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Purchase Date</label>
                <input type="date" value={form.purchase_date} onChange={e => set('purchase_date', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Last Service Date</label>
                <input type="date" value={form.last_service_date} onChange={e => set('last_service_date', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Next Service Due</label>
                <input type="date" value={form.next_service_date} onChange={e => set('next_service_date', e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="font-semibold mb-4">Notes</h2>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              placeholder="Any additional notes about this asset..."
              className={inputCls}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Link href="/dashboard/assets" className="px-4 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Register Asset
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}
