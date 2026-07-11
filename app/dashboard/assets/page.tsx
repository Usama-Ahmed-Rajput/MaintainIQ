'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/app-shell'
import { createClient } from '@/lib/supabase/client'
import type { Asset, AssetStatus, AssetCategory } from '@/lib/types'
import { Package, Plus, Search, QrCode, Filter, Copy, Check } from 'lucide-react'
import Link from 'next/link'

const STATUS_COLORS: Record<string, string> = {
  Operational: 'bg-green-100 text-green-700 border-green-200',
  'Issue Reported': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Under Inspection': 'bg-blue-100 text-blue-700 border-blue-200',
  'Under Maintenance': 'bg-orange-100 text-orange-700 border-orange-200',
  'Out of Service': 'bg-red-100 text-red-700 border-red-200',
  Retired: 'bg-gray-100 text-gray-500 border-gray-200',
}

const CONDITION_COLORS: Record<string, string> = {
  Good: 'text-green-600',
  Fair: 'text-yellow-600',
  Poor: 'text-orange-600',
  Critical: 'text-red-600',
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<AssetStatus | 'All'>('All')
  const [filterCategory, setFilterCategory] = useState<AssetCategory | 'All'>('All')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('assets').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setAssets(data ?? [])
      setLoading(false)
    })
  }, [])

  function copyUrl(code: string, id: string) {
    navigator.clipboard.writeText(`${window.location.origin}/asset/${code}`)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const categories = ['All', ...Array.from(new Set(assets.map(a => a.category)))] as (AssetCategory | 'All')[]
  const statuses: (AssetStatus | 'All')[] = ['All', 'Operational', 'Issue Reported', 'Under Inspection', 'Under Maintenance', 'Out of Service', 'Retired']

  const filtered = assets.filter(a => {
    const q = search.toLowerCase()
    const matchSearch = !search || a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q) || a.location.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'All' || a.status === filterStatus
    const matchCat = filterCategory === 'All' || a.category === filterCategory
    return matchSearch && matchStatus && matchCat
  })

  return (
    <AppShell requireRole="admin">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Assets</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{assets.length} assets registered</p>
          </div>
          <Link
            href="/dashboard/assets/new"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Asset
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, code, or location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as AssetStatus | 'All')}
              className="text-sm border border-border rounded-lg px-2.5 py-2 bg-card focus:outline-none"
            >
              {statuses.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
            </select>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value as AssetCategory | 'All')}
              className="text-sm border border-border rounded-lg px-2.5 py-2 bg-card focus:outline-none"
            >
              {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">No assets found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {assets.length === 0 ? 'Register your first asset to get started.' : 'Try adjusting your search or filters.'}
            </p>
            {assets.length === 0 && (
              <Link href="/dashboard/assets/new" className="inline-flex items-center gap-2 mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition">
                <Plus className="w-4 h-4" /> Register Asset
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-3 px-4 py-3 border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span>Asset</span>
              <span>Category</span>
              <span>Location</span>
              <span>Condition</span>
              <span>Status</span>
              <span>Link</span>
            </div>
            <div className="divide-y divide-border">
              {filtered.map(asset => (
                <div key={asset.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto_auto_auto] gap-3 px-4 py-3.5 items-center hover:bg-muted/20 transition">
                  <div>
                    <Link href={`/dashboard/assets/${asset.id}`} className="font-semibold text-sm hover:text-primary transition leading-tight">
                      {asset.name}
                    </Link>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">{asset.code}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{asset.category}</span>
                  <span className="text-xs text-muted-foreground max-w-[120px] truncate">{asset.location}</span>
                  <span className={`text-xs font-semibold ${CONDITION_COLORS[asset.condition]}`}>{asset.condition}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${STATUS_COLORS[asset.status]}`}>
                    {asset.status}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Link href={`/asset/${asset.code}`} target="_blank" className="p-1.5 rounded-md hover:bg-muted transition text-muted-foreground hover:text-foreground">
                      <QrCode className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => copyUrl(asset.code, asset.id)}
                      className="p-1.5 rounded-md hover:bg-muted transition text-muted-foreground hover:text-foreground"
                      title="Copy public link"
                    >
                      {copiedId === asset.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
