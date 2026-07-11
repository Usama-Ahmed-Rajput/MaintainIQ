'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/app-shell'
import { createClient } from '@/lib/supabase/client'
import type { Issue, Asset, IssueStatus, IssuePriority } from '@/lib/types'
import { AlertTriangle, Search, Filter } from 'lucide-react'
import Link from 'next/link'

const PRIORITY_COLORS: Record<string, string> = {
  Critical: 'bg-red-100 text-red-700 border-red-200',
  High: 'bg-orange-100 text-orange-700 border-orange-200',
  Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Low: 'bg-green-100 text-green-700 border-green-200',
}

const STATUS_COLORS: Record<string, string> = {
  Reported: 'bg-yellow-100 text-yellow-700',
  Assigned: 'bg-blue-100 text-blue-700',
  'Inspection Started': 'bg-indigo-100 text-indigo-700',
  'Maintenance In Progress': 'bg-orange-100 text-orange-700',
  'Waiting for Parts': 'bg-purple-100 text-purple-700',
  Resolved: 'bg-green-100 text-green-700',
  Closed: 'bg-gray-100 text-gray-500',
  Reopened: 'bg-red-100 text-red-700',
}

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<IssueStatus | 'All' | 'Open'>('All')
  const [filterPriority, setFilterPriority] = useState<IssuePriority | 'All'>('All')

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('issues').select('*').order('created_at', { ascending: false }),
      supabase.from('assets').select('id,name,code'),
    ]).then(([{ data: i }, { data: a }]) => {
      setIssues(i ?? [])
      setAssets((a as Asset[]) ?? [])
      setLoading(false)
    })
  }, [])

  const statuses = ['All', 'Open', 'Reported', 'Assigned', 'Inspection Started', 'Maintenance In Progress', 'Waiting for Parts', 'Resolved', 'Closed', 'Reopened']
  const priorities: (IssuePriority | 'All')[] = ['All', 'Critical', 'High', 'Medium', 'Low']

  const filtered = issues.filter(issue => {
    const asset = assets.find(a => a.id === issue.asset_id)
    const q = search.toLowerCase()
    const matchSearch = !search
      || issue.title.toLowerCase().includes(q)
      || issue.issue_number.toLowerCase().includes(q)
      || (asset?.name.toLowerCase().includes(q) ?? false)
      || issue.reporter_name.toLowerCase().includes(q)

    const matchStatus = filterStatus === 'All'
      ? true
      : filterStatus === 'Open'
      ? !['Resolved', 'Closed'].includes(issue.status)
      : issue.status === filterStatus

    const matchPriority = filterPriority === 'All' || issue.priority === filterPriority
    return matchSearch && matchStatus && matchPriority
  })

  const openCount = issues.filter(i => !['Resolved', 'Closed'].includes(i.status)).length
  const criticalCount = issues.filter(i => i.priority === 'Critical' && !['Resolved', 'Closed'].includes(i.status)).length

  return (
    <AppShell requireRole="admin">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Issues</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {openCount} open &middot; {criticalCount} critical
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title, issue #, asset, or reporter..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as IssueStatus | 'All' | 'Open')}
              className="text-sm border border-border rounded-lg px-2.5 py-2 bg-card focus:outline-none"
            >
              {statuses.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
            </select>
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value as IssuePriority | 'All')}
              className="text-sm border border-border rounded-lg px-2.5 py-2 bg-card focus:outline-none"
            >
              {priorities.map(p => <option key={p} value={p}>{p === 'All' ? 'All Priorities' : p}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <AlertTriangle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">No issues found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {issues.length === 0 ? 'No issues have been reported yet.' : 'Try adjusting your search or filters.'}
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="hidden md:grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 px-4 py-3 border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span>#</span>
              <span>Issue</span>
              <span>Asset</span>
              <span>Reporter</span>
              <span>Priority</span>
              <span>Status</span>
            </div>
            <div className="divide-y divide-border">
              {filtered.map(issue => {
                const asset = assets.find(a => a.id === issue.asset_id)
                return (
                  <Link
                    key={issue.id}
                    href={`/dashboard/issues/${issue.id}`}
                    className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 px-4 py-3.5 items-center hover:bg-muted/20 transition group"
                  >
                    <span className="text-xs font-mono text-muted-foreground hidden md:block">{issue.issue_number}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition">{issue.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 md:hidden">{issue.issue_number} &middot; {asset?.name ?? 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 hidden md:block">{new Date(issue.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs text-muted-foreground hidden md:block truncate max-w-[120px]">{asset?.name ?? 'Unknown'}</span>
                    <span className="text-xs text-muted-foreground hidden md:block">{issue.reporter_name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold hidden md:inline-block ${PRIORITY_COLORS[issue.priority]}`}>
                      {issue.priority}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold hidden md:inline-block ${STATUS_COLORS[issue.status]}`}>
                      {issue.status}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
