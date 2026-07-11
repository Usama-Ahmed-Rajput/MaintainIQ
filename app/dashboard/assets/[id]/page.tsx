'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { createClient } from '@/lib/supabase/client'
import { updateAsset } from '@/lib/actions'
import type { Asset, Issue, HistoryEntry, Profile, AssetStatus, AssetCondition, AssetCategory } from '@/lib/types'
import { ArrowLeft, Package, MapPin, Tag, Wrench, Calendar, Activity, QrCode, Copy, Check, Edit2, Save, X, ExternalLink, Loader2 } from 'lucide-react'
import Link from 'next/link'
import QrCodeDisplay from '@/components/qr-code-display'

const STATUS_COLORS: Record<string, string> = {
  Operational: 'bg-green-100 text-green-700 border-green-200',
  'Issue Reported': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Under Inspection': 'bg-blue-100 text-blue-700 border-blue-200',
  'Under Maintenance': 'bg-orange-100 text-orange-700 border-orange-200',
  'Out of Service': 'bg-red-100 text-red-700 border-red-200',
  Retired: 'bg-gray-100 text-gray-500 border-gray-200',
}

const PRIORITY_COLORS: Record<string, string> = {
  Critical: 'bg-red-100 text-red-700',
  High: 'bg-orange-100 text-orange-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Low: 'bg-green-100 text-green-700',
}

const CATEGORIES: AssetCategory[] = [
  'HVAC', 'Electrical', 'Plumbing', 'IT Equipment',
  'Furniture', 'Vehicle', 'Generator', 'Fire Safety', 'Security', 'Other',
]
const CONDITIONS: AssetCondition[] = ['Good', 'Fair', 'Poor', 'Critical']
const STATUSES: AssetStatus[] = ['Operational', 'Issue Reported', 'Under Inspection', 'Under Maintenance', 'Out of Service', 'Retired']

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [asset, setAsset] = useState<Asset | null>(null)
  const [issues, setIssues] = useState<Issue[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [technicians, setTechnicians] = useState<Profile[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const [editForm, setEditForm] = useState<Partial<Asset>>({})

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const [{ data: a }, { data: i }, { data: h }, { data: t }, { data: { user } }] = await Promise.all([
        supabase.from('assets').select('*').eq('id', id).single(),
        supabase.from('issues').select('*').eq('asset_id', id).order('created_at', { ascending: false }),
        supabase.from('history_entries').select('*').eq('asset_id', id).order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').eq('role', 'technician'),
        supabase.auth.getUser(),
      ])
      if (!a) { router.replace('/dashboard/assets'); return }
      setAsset(a)
      setIssues(i ?? [])
      setHistory(h ?? [])
      setTechnicians(t ?? [])
      if (user) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (p) setProfile({ ...p, email: user.email })
      }
      setLoading(false)
    }
    load()
  }, [id, router])

  function startEdit() {
    if (!asset) return
    setEditForm({ ...asset })
    setEditing(true)
  }

  async function saveEdit() {
    if (!asset || !editForm) return
    setSaving(true)
    const { name, category, location, model, serial_number, condition, status, purchase_date, last_service_date, next_service_date, notes } = editForm
    const { data } = await updateAsset(asset.id, {
      name, category, location, model, serial_number, condition, status,
      purchase_date: purchase_date || undefined,
      last_service_date: last_service_date || undefined,
      next_service_date: next_service_date || undefined,
      notes,
    }, profile?.name ?? 'Admin')
    if (data) {
      setAsset(data)
      // Reload history
      const supabase = createClient()
      const { data: h } = await supabase.from('history_entries').select('*').eq('asset_id', id).order('created_at', { ascending: false })
      setHistory(h ?? [])
    }
    setSaving(false)
    setEditing(false)
  }

  function copyUrl() {
    if (!asset) return
    navigator.clipboard.writeText(`${window.location.origin}/asset/${asset.code}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading || !asset) {
    return (
      <AppShell requireRole="admin">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    )
  }

  const openIssues = issues.filter(i => !['Resolved', 'Closed'].includes(i.status))

  const inputCls = "w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"

  return (
    <AppShell requireRole="admin">
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Link href="/dashboard/assets" className="p-1.5 rounded-lg hover:bg-muted transition text-muted-foreground mt-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold truncate">{asset.name}</h1>
                <p className="text-sm font-mono text-muted-foreground mt-0.5">{asset.code}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${STATUS_COLORS[asset.status]}`}>
                  {asset.status}
                </span>
                {!editing && (
                  <button onClick={startEdit} className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-lg hover:bg-muted transition font-medium">
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Asset details card */}
        <div className="bg-card border border-border rounded-xl p-5">
          {editing ? (
            <div className="space-y-4">
              <h2 className="font-semibold">Edit Asset</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wider">Name</label>
                  <input type="text" value={editForm.name ?? ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wider">Category</label>
                  <select value={editForm.category ?? ''} onChange={e => setEditForm(f => ({ ...f, category: e.target.value as AssetCategory }))} className={inputCls}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wider">Location</label>
                  <input type="text" value={editForm.location ?? ''} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wider">Condition</label>
                  <select value={editForm.condition ?? ''} onChange={e => setEditForm(f => ({ ...f, condition: e.target.value as AssetCondition }))} className={inputCls}>
                    {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wider">Status</label>
                  <select value={editForm.status ?? ''} onChange={e => setEditForm(f => ({ ...f, status: e.target.value as AssetStatus }))} className={inputCls}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wider">Model</label>
                  <input type="text" value={editForm.model ?? ''} onChange={e => setEditForm(f => ({ ...f, model: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wider">Serial Number</label>
                  <input type="text" value={editForm.serial_number ?? ''} onChange={e => setEditForm(f => ({ ...f, serial_number: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wider">Purchase Date</label>
                  <input type="date" value={editForm.purchase_date ?? ''} onChange={e => setEditForm(f => ({ ...f, purchase_date: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wider">Last Service</label>
                  <input type="date" value={editForm.last_service_date ?? ''} onChange={e => setEditForm(f => ({ ...f, last_service_date: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wider">Next Service Due</label>
                  <input type="date" value={editForm.next_service_date ?? ''} onChange={e => setEditForm(f => ({ ...f, next_service_date: e.target.value }))} className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wider">Notes</label>
                  <textarea rows={3} value={editForm.notes ?? ''} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={saveEdit} disabled={saving} className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
                </button>
                <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 border border-border px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition">
                  <X className="w-4 h-4" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { icon: Tag, label: 'Category', value: asset.category },
                  { icon: MapPin, label: 'Location', value: asset.location },
                  { icon: Activity, label: 'Condition', value: asset.condition },
                  { icon: Wrench, label: 'Model', value: asset.model || '—' },
                  { icon: Package, label: 'Serial Number', value: asset.serial_number || '—' },
                  { icon: Calendar, label: 'Purchase Date', value: asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '—' },
                  { icon: Calendar, label: 'Last Service', value: asset.last_service_date ? new Date(asset.last_service_date).toLocaleDateString() : '—' },
                  { icon: Calendar, label: 'Next Service', value: asset.next_service_date ? new Date(asset.next_service_date).toLocaleDateString() : '—' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-2">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</p>
                      <p className="text-sm font-medium">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
              {asset.notes && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground">{asset.notes}</p>
                </div>
              )}

              {/* Public link + QR */}
              <div className="mt-4 pt-4 border-t border-border space-y-4">
                <div className="flex items-center gap-3">
                  <QrCode className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">Public Report URL</p>
                    <p className="text-xs font-mono text-primary truncate">{typeof window !== 'undefined' ? `${window.location.origin}/asset/${asset.code}` : `/asset/${asset.code}`}</p>
                  </div>
                  <Link href={`/asset/${asset.code}`} target="_blank" className="p-1.5 hover:bg-muted rounded transition">
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </Link>
                  <button onClick={copyUrl} className="p-1.5 hover:bg-muted rounded transition">
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>

                {/* QR Code */}
                <div className="flex justify-center pt-2">
                  <QrCodeDisplay assetCode={asset.code} assetName={asset.name} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Open issues */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Issues ({issues.length})</h2>
            <Link href="/dashboard/issues" className="text-xs font-semibold text-primary hover:underline">View all &rarr;</Link>
          </div>
          {issues.length === 0 ? (
            <p className="text-sm text-muted-foreground">No issues recorded for this asset.</p>
          ) : (
            <div className="space-y-2">
              {issues.slice(0, 5).map(issue => (
                <Link key={issue.id} href={`/dashboard/issues/${issue.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition">{issue.title}</p>
                    <p className="text-xs text-muted-foreground">{issue.issue_number} &middot; {new Date(issue.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${PRIORITY_COLORS[issue.priority]}`}>{issue.priority}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">{issue.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* History */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-4">History ({history.length})</h2>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history entries yet.</p>
          ) : (
            <div className="relative pl-5">
              <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-4">
                {history.slice(0, 10).map(entry => (
                  <div key={entry.id} className="relative">
                    <div className="absolute -left-3.5 top-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{entry.action}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{entry.details}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">{entry.actor}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground/60 flex-shrink-0">
                        {new Date(entry.created_at).toLocaleDateString()} {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
