'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { getData, updateAsset, getTechnicians, getPublicAssetUrl } from '@/lib/store'
import type { Asset, Issue, HistoryEntry, User } from '@/lib/types'
import Link from 'next/link'
import QRCode from 'qrcode'
import {
  ArrowLeft, Edit2, Save, X, QrCode, Download, Copy, ExternalLink,
  AlertCircle, Clock, Package, Printer
} from 'lucide-react'

const statusColors: Record<string, string> = {
  Operational: 'bg-green-100 text-green-700',
  'Issue Reported': 'bg-yellow-100 text-yellow-700',
  'Under Inspection': 'bg-blue-100 text-blue-700',
  'Under Maintenance': 'bg-orange-100 text-orange-700',
  'Out of Service': 'bg-red-100 text-red-700',
  Retired: 'bg-gray-100 text-gray-500',
}

const issueStatusColors: Record<string, string> = {
  Reported: 'bg-yellow-100 text-yellow-700',
  Assigned: 'bg-blue-100 text-blue-700',
  'Inspection Started': 'bg-indigo-100 text-indigo-700',
  'Maintenance In Progress': 'bg-orange-100 text-orange-700',
  'Waiting for Parts': 'bg-purple-100 text-purple-700',
  Resolved: 'bg-green-100 text-green-700',
  Closed: 'bg-gray-100 text-gray-500',
  Reopened: 'bg-red-100 text-red-700',
}

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [asset, setAsset] = useState<Asset | null>(null)
  const [issues, setIssues] = useState<Issue[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [technicians, setTechnicians] = useState<User[]>([])
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Asset>>({})
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'issues' | 'history' | 'qr'>('details')
  const labelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const data = getData()
    const found = data.assets.find(a => a.id === id)
    if (!found) { router.replace('/dashboard/assets'); return }
    setAsset(found)
    setEditForm(found)
    setIssues(data.issues.filter(i => i.assetId === id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    setHistory(data.history.filter(h => h.assetId === id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    setTechnicians(getTechnicians())

    const url = getPublicAssetUrl(found.code)
    QRCode.toDataURL(url, { width: 200, margin: 2, color: { dark: '#1e293b', light: '#ffffff' } })
      .then(setQrDataUrl)
  }, [id, router])

  function handleSave() {
    if (!asset) return
    const updated = updateAsset(asset.id, editForm)
    if (updated) { setAsset(updated); setEditing(false) }
  }

  function handleCopyLink() {
    if (!asset) return
    navigator.clipboard.writeText(getPublicAssetUrl(asset.code))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownloadQR() {
    if (!qrDataUrl) return
    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = `${asset?.code}-qr.png`
    link.click()
  }

  function handlePrintLabel() {
    if (!labelRef.current || !qrDataUrl || !asset) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>Asset Label - ${asset.code}</title>
      <style>
        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f0f0f0; }
        .label { background: white; border: 2px solid #1e293b; border-radius: 8px; padding: 20px; width: 300px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .org { font-size: 11px; font-weight: bold; color: #64748b; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; }
        .name { font-size: 16px; font-weight: bold; color: #1e293b; margin-bottom: 4px; }
        .code { font-size: 13px; font-weight: bold; color: #3b5bdb; margin-bottom: 4px; font-family: monospace; }
        .loc { font-size: 11px; color: #64748b; margin-bottom: 12px; }
        img { width: 140px; height: 140px; margin: 0 auto 10px; display: block; }
        .scan { font-size: 10px; color: #94a3b8; }
      </style></head><body>
      <div class="label">
        <p class="org">MaintainIQ</p>
        <p class="name">${asset.name}</p>
        <p class="code">${asset.code}</p>
        <p class="loc">${asset.location}</p>
        <img src="${qrDataUrl}" alt="QR Code" />
        <p class="scan">Scan to view asset details and report issues</p>
      </div>
      </body></html>
    `)
    win.document.close()
    win.print()
  }

  if (!asset) return null

  const publicUrl = getPublicAssetUrl(asset.code)
  const techs = technicians
  const assignedTech = techs.find(t => t.id === asset.assignedTechnicianId)

  const inputCls = "w-full border border-border rounded-md px-3 py-1.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
  const CATEGORIES = ['HVAC', 'Electrical', 'Plumbing', 'IT Equipment', 'Furniture', 'Vehicle', 'Generator', 'Fire Safety', 'Security', 'Other']
  const STATUSES = ['Operational', 'Issue Reported', 'Under Inspection', 'Under Maintenance', 'Out of Service', 'Retired']

  return (
    <AppShell requireRole="admin">
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Link href="/dashboard/assets" className="text-muted-foreground hover:text-foreground mt-1">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold">{asset.name}</h1>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusColors[asset.status]}`}>{asset.status}</span>
              </div>
              <p className="text-sm text-muted-foreground font-mono mt-0.5">{asset.code} &bull; {asset.category} &bull; {asset.location}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <button onClick={handleSave} className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium hover:bg-primary/90 transition">
                  <Save className="w-3.5 h-3.5" /> Save
                </button>
                <button onClick={() => { setEditing(false); setEditForm(asset) }} className="flex items-center gap-1.5 border border-border px-3 py-1.5 rounded-md text-sm font-medium hover:bg-muted transition">
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 border border-border px-3 py-1.5 rounded-md text-sm font-medium hover:bg-muted transition">
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-border">
          {(['details', 'issues', 'history', 'qr'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition -mb-px ${
                activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'qr' ? 'QR Code' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'issues' && <span className="ml-1.5 text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{issues.length}</span>}
            </button>
          ))}
        </div>

        {/* Details tab */}
        {activeTab === 'details' && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="grid sm:grid-cols-2 gap-5">
              {editing ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Asset Name</label>
                    <input className={inputCls} value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Category</label>
                    <select className={inputCls} value={editForm.category || ''} onChange={e => setEditForm(f => ({ ...f, category: e.target.value as any }))}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Location</label>
                    <input className={inputCls} value={editForm.location || ''} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Condition</label>
                    <select className={inputCls} value={editForm.condition || ''} onChange={e => setEditForm(f => ({ ...f, condition: e.target.value as any }))}>
                      {['Good', 'Fair', 'Poor', 'Critical'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Status</label>
                    <select className={inputCls} value={editForm.status || ''} onChange={e => setEditForm(f => ({ ...f, status: e.target.value as any }))}>
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Assigned Technician</label>
                    <select className={inputCls} value={editForm.assignedTechnicianId || ''} onChange={e => setEditForm(f => ({ ...f, assignedTechnicianId: e.target.value }))}>
                      <option value="">Unassigned</option>
                      {techs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Last Service Date</label>
                    <input type="date" className={inputCls} value={editForm.lastServiceDate || ''} onChange={e => setEditForm(f => ({ ...f, lastServiceDate: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Next Service Date</label>
                    <input type="date" className={inputCls} value={editForm.nextServiceDate || ''} onChange={e => setEditForm(f => ({ ...f, nextServiceDate: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Notes</label>
                    <textarea rows={3} className={inputCls} value={editForm.notes || ''} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                </>
              ) : (
                <>
                  {[
                    { label: 'Asset Code', value: asset.code },
                    { label: 'Category', value: asset.category },
                    { label: 'Location', value: asset.location },
                    { label: 'Condition', value: asset.condition },
                    { label: 'Status', value: asset.status },
                    { label: 'Model', value: asset.model || '—' },
                    { label: 'Serial Number', value: asset.serialNumber || '—' },
                    { label: 'Assigned To', value: assignedTech?.name || 'Unassigned' },
                    { label: 'Purchase Date', value: asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '—' },
                    { label: 'Last Service', value: asset.lastServiceDate ? new Date(asset.lastServiceDate).toLocaleDateString() : '—' },
                    { label: 'Next Service', value: asset.nextServiceDate ? new Date(asset.nextServiceDate).toLocaleDateString() : '—' },
                    { label: 'Registered', value: new Date(asset.createdAt).toLocaleDateString() },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
                      <p className="text-sm font-medium">{value}</p>
                    </div>
                  ))}
                  {asset.notes && (
                    <div className="sm:col-span-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm">{asset.notes}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Issues tab */}
        {activeTab === 'issues' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{issues.length} issue(s) reported against this asset</p>
            </div>
            {issues.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">No issues reported</p>
              </div>
            ) : (
              issues.map(issue => (
                <Link key={issue.id} href={`/dashboard/issues/${issue.id}`} className="block bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm">{issue.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">{issue.issueNumber}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${issueStatusColors[issue.status]}`}>{issue.status}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(issue.createdAt).toLocaleDateString()} by {issue.reporterName}</p>
                </Link>
              ))
            )}
          </div>
        )}

        {/* History tab */}
        {activeTab === 'history' && (
          <div className="bg-card border border-border rounded-xl p-5">
            {history.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No history entries yet.</p>
              </div>
            ) : (
              <div className="relative pl-5">
                <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-5">
                  {history.map(entry => (
                    <div key={entry.id} className="relative">
                      <div className="absolute -left-3.5 top-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                      <p className="text-sm font-semibold">{entry.action}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{entry.details}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {entry.actor} &bull; {new Date(entry.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* QR tab */}
        {activeTab === 'qr' && (
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">QR Code</p>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Asset QR Code" className="w-44 h-44" />
              ) : (
                <div className="w-44 h-44 bg-muted rounded animate-pulse" />
              )}
              <p className="text-xs font-mono text-muted-foreground mt-3">{asset.code}</p>
              <div className="flex gap-2 mt-4">
                <button onClick={handleDownloadQR} className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-md hover:bg-muted transition">
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <button onClick={handlePrintLabel} className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-md hover:bg-muted transition">
                  <Printer className="w-3.5 h-3.5" /> Print Label
                </button>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Public Asset Link</p>
              <div className="bg-muted rounded-lg p-3 break-all">
                <p className="text-xs font-mono text-foreground">{publicUrl}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 rounded-md hover:bg-muted transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Page
                </a>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This link is safe to share. It only exposes public asset information and the issue-reporting form. No private data, costs, or internal notes are visible.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
