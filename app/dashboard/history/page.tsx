'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/app-shell'
import { getData } from '@/lib/store'
import type { HistoryEntry, Asset } from '@/lib/types'
import { Clock, Search } from 'lucide-react'

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const data = getData()
    setHistory(data.history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    setAssets(data.assets)
  }, [])

  const filtered = history.filter(h => {
    if (!search) return true
    const asset = assets.find(a => a.id === h.assetId)
    const q = search.toLowerCase()
    return h.action.toLowerCase().includes(q) || h.actor.toLowerCase().includes(q) || (asset?.name.toLowerCase().includes(q) || false)
  })

  // Group by date
  const grouped: Record<string, HistoryEntry[]> = {}
  filtered.forEach(entry => {
    const date = new Date(entry.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(entry)
  })

  const actionColor = (action: string) => {
    if (action.includes('Resolved') || action.includes('Registered')) return 'bg-green-500'
    if (action.includes('Critical') || action.includes('Reopened') || action.includes('Out of Service')) return 'bg-red-500'
    if (action.includes('Assigned') || action.includes('Inspection')) return 'bg-blue-500'
    if (action.includes('Maintenance') || action.includes('Updated')) return 'bg-orange-500'
    return 'bg-primary'
  }

  return (
    <AppShell requireRole="admin">
      <div className="max-w-3xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Activity History</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Complete permanent timeline of all asset and maintenance activity.</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by action, actor, or asset name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">No history found</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, entries]) => (
            <div key={date}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{date}</p>
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="relative pl-5">
                  <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-5">
                    {entries.map(entry => {
                      const asset = assets.find(a => a.id === entry.assetId)
                      return (
                        <div key={entry.id} className="relative">
                          <div className={`absolute -left-3.5 top-1 w-3 h-3 rounded-full border-2 border-background ${actionColor(entry.action)}`} />
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">{entry.action}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{entry.details}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium">{asset?.name || 'Unknown Asset'}</span>
                                <span className="text-[10px] text-muted-foreground/60">{entry.actor}</span>
                              </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground/60 flex-shrink-0">
                              {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </AppShell>
  )
}
