'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { createAsset, getTechnicians } from '@/lib/store'
import type { AssetCategory } from '@/lib/types'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

const CATEGORIES: AssetCategory[] = ['HVAC', 'Electrical', 'Plumbing', 'IT Equipment', 'Furniture', 'Vehicle', 'Generator', 'Fire Safety', 'Security', 'Other']

export default function NewAssetPage() {
  const router = useRouter()
  const techs = getTechnicians()

  const [form, setForm] = useState({
    name: '',
    category: 'IT Equipment' as AssetCategory,
    location: '',
    model: '',
    serialNumber: '',
    condition: 'Good' as 'Good' | 'Fair' | 'Poor' | 'Critical',
    assignedTechnicianId: '',
    purchaseDate: '',
    lastServiceDate: '',
    nextServiceDate: '',
    notes: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(key: string, val: string) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) { setError('Asset name is required.'); return }
    if (!form.location.trim()) { setError('Location is required.'); return }
    if (form.nextServiceDate && form.lastServiceDate && form.nextServiceDate < form.lastServiceDate) {
      setError('Next service date cannot be before last service date.'); return
    }
    setLoading(true)
    await new Promise(r => setTimeout(r, 300))
    const asset = createAsset({
      name: form.name.trim(),
      category: form.category,
      location: form.location.trim(),
      model: form.model || undefined,
      serialNumber: form.serialNumber || undefined,
      condition: form.condition,
      status: 'Operational',
      assignedTechnicianId: form.assignedTechnicianId || undefined,
      purchaseDate: form.purchaseDate || undefined,
      lastServiceDate: form.lastServiceDate || undefined,
      nextServiceDate: form.nextServiceDate || undefined,
      notes: form.notes || undefined,
    })
    router.replace(`/dashboard/assets/${asset.id}`)
  }

  const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
    <div>
      <label className="block text-sm font-medium mb-1.5">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
    </div>
  )

  const inputCls = "w-full border border-border rounded-md px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"

  return (
    <AppShell requireRole="admin">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard/assets" className="text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Register New Asset</h1>
            <p className="text-sm text-muted-foreground mt-0.5">A unique asset code and QR will be generated automatically.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Asset Name" required>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Classroom Projector 01" className={inputCls} required />
              </Field>
            </div>
            <Field label="Category" required>
              <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Condition" required>
              <select value={form.condition} onChange={e => set('condition', e.target.value)} className={inputCls}>
                {['Good', 'Fair', 'Poor', 'Critical'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Location" required>
                <input type="text" value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Room 101, Block A" className={inputCls} required />
              </Field>
            </div>
            <Field label="Model / Make">
              <input type="text" value={form.model} onChange={e => set('model', e.target.value)} placeholder="e.g. Epson EB-S41" className={inputCls} />
            </Field>
            <Field label="Serial Number">
              <input type="text" value={form.serialNumber} onChange={e => set('serialNumber', e.target.value)} placeholder="e.g. SN-2023-001" className={inputCls} />
            </Field>
            <Field label="Assigned Technician">
              <select value={form.assignedTechnicianId} onChange={e => set('assignedTechnicianId', e.target.value)} className={inputCls}>
                <option value="">Unassigned</option>
                {techs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
            <Field label="Purchase Date">
              <input type="date" value={form.purchaseDate} onChange={e => set('purchaseDate', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Last Service Date">
              <input type="date" value={form.lastServiceDate} onChange={e => set('lastServiceDate', e.target.value)} className={inputCls} />
            </Field>
            <Field label="Next Service Date">
              <input type="date" value={form.nextServiceDate} onChange={e => set('nextServiceDate', e.target.value)} className={inputCls} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Notes">
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes..." rows={3} className={inputCls} />
              </Field>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-md text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Registering...' : 'Register Asset'}
            </button>
            <Link href="/dashboard/assets" className="px-5 py-2.5 rounded-md text-sm font-medium border border-border hover:bg-muted transition">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </AppShell>
  )
}
