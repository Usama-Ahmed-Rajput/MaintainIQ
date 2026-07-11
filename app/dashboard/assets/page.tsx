'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/app-shell'
import { getData } from '@/lib/store'
import type { Asset, AssetCategory, AssetStatus } from '@/lib/types'
import Link from 'next/link'
import { Plus, Search, Package, Filter, ChevronRight } from 'lucide-react'

const statusColors: Record<string, string> = {
  Operational: 'bg-green-100 text-green-700',
  'Issue Reported': 'bg-yellow-100 text-yellow-700',
  'Under Inspection': 'bg-blue-100 text-blue-700',
  'Under Maintenance': 'bg-orange-100 text-orange-700',
  'Out of Service': 'bg-red-100 text-red-700',
  Retired: 'bg-gray-100 text-gray-500',
}

const conditionColors: Record<string, string> = {
  Good: 'text-green-600',
  Fair: 'text-yellow-600',
  Poor: 'text-orange-600',
  Critical: 'text-red-600',
}

const CATEGORIES: AssetCategory[] = ['HVAC', 'Electrical', 'Plumbing', 'IT Equipment', 'Furniture', 'Vehicle', 'Generator', 'Fire Safety', 'Security', 'Other']
const STATUSES: AssetStatus[] = ['Operational', 'Issue Reported', 'Under Inspection', 'Under Maintenance', 'Out of Service', 'Retired']

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  useEffect(() => {
    const data = getData()
    setAssets(data.assets)
  }, [])

  const filtered = assets.filter(a => {
    const q = search.toLowerCase()
    const matchSearch = !q || a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q) || a.location.toLowerCase().includes(q)
    const matchStatus = !filterStatus || a.status === filterStatus
    const matchCategory = !filterCategory || a.category === filterCategory
    return matchSearch && matchStatus && matchCategory
  })

  return (
    <AppShell requireRole="admin">
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Assets</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{assets.length} total assets registered</p>
          </div>
          <Link
            href="/dashboard/assets/new"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold hover:bg-primary/90 transition"
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
              className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="border border-border rounded-md px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Asset grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">No assets found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(asset => (
              <Link
                key={asset.id}
                href={`/dashboard/assets/${asset.id}`}
                className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Package className="w-4 h-4 text-primary" />
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusColors[asset.status] || 'bg-muted text-muted-foreground'}`}>
                    {asset.status}
                  </span>
                </div>
                <p className="font-semibold text-sm leading-tight">{asset.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{asset.code}</p>
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{asset.category}</p>
                    <p className="text-xs text-muted-foreground">{asset.location}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-semibold ${conditionColors[asset.condition]}`}>{asset.condition}</p>
                    {asset.nextServiceDate && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Next: {new Date(asset.nextServiceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 text-[10px] text-primary font-medium group-hover:gap-2 transition-all">
                  View details <ChevronRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
