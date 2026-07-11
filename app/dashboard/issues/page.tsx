'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/app-shell'
import { getData } from '@/lib/store'
import type { Issue, Asset, User, IssueStatus, IssuePriority, IssueCategory } from '@/lib/types'
import Link from 'next/link'
import { AlertCircle, Search, Filter, AlertTriangle, ChevronRight } from 'lucide-react'

const statusColors: Record<string, string> = {
  Reported: 'bg-yellow-100 text-yellow-700',
  Assigned: 'bg-blue-100 text-blue-700',
  'Inspection Started': 'bg-indigo-100 text-indigo-700',
  'Maintenance In Progress': 'bg-orange-100 text-orange-700',
  'Waiting for Parts': 'bg-purple-100 text-purple-700',
  Resolved: 'bg-green-100 text-green-700',
  Closed: 'bg-gray-100 text-gray-500',
  Reopened: 'bg-red-100 text-red-700',
}

const priorityColors: Record<string, string> = {
  Low: 'bg-gray-100 text-gray-600',
  Medium: 'bg-blue-100 text-blue-700',
  High: 'bg-orange-100 text-orange-700',
  Critical: 'bg-red-100 text-red-700',
}

const STATUSES: IssueStatus[] = ['Reported', 'Assigned', 'Inspection Started', 'Maintenance In Progress', 'Waiting for Parts', 'Resolved', 'Closed', 'Reopened']
const PRIORITIES: IssuePriority[] = ['Low', 'Medium', 'High', 'Critical']

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')

  useEffect(() => {
    const data = getData()
    setIssues(data.issues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    setAssets(data.assets)
    setUsers(data.users)
  }, [])

  const filtered = issues.filter(i => {
    const asset = assets.find(a => a.id === i.assetId)
    const q = search.toLowerCase()
    const matchSearch = !q || i.title.toLowerCase().includes(q) || i.issueNumber.toLowerCase().includes(q) || asset?.name.toLowerCase().includes(q) || false
    const matchStatus = !filterStatus || i.status === filterStatus
    const matchPriority = !filterPriority || i.priority === filterPriority
    return matchSearch && matchStatus && matchPriority
  })

  return (
    <AppShell requireRole="admin">
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Issues</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{issues.filter(i => !['Resolved', 'Closed'].includes(i.status)).length} open &bull; {issues.length} total</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search issues by title, number, or asset..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-border rounded-md px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="border border-border rounded-md px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30">
            <option value="">All Priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Issue list */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">No issues found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(issue => {
              const asset = assets.find(a => a.id === issue.assetId)
              const tech = users.find(u => u.id === issue.assignedTechnicianId)
              return (
                <Link
                  key={issue.id}
                  href={`/dashboard/issues/${issue.id}`}
                  className="flex items-start gap-4 bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all group"
                >
                  <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                    issue.priority === 'Critical' ? 'text-red-500' :
                    issue.priority === 'High' ? 'text-orange-500' :
                    issue.priority === 'Medium' ? 'text-blue-500' : 'text-gray-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-sm">{issue.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 font-mono">{issue.issueNumber} &bull; {asset?.name || 'Unknown Asset'}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5 group-hover:text-primary transition" />
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${priorityColors[issue.priority]}`}>{issue.priority}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${statusColors[issue.status]}`}>{issue.status}</span>
                      {issue.aiSuggested && <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-purple-100 text-purple-700">AI Triaged</span>}
                      {tech && <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-muted text-muted-foreground">{tech.name}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-[10px] text-muted-foreground">{new Date(issue.createdAt).toLocaleDateString()}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">by {issue.reporterName}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
