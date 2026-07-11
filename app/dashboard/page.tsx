'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/app-shell'
import { getData } from '@/lib/store'
import type { AppData } from '@/lib/types'
import Link from 'next/link'
import {
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  ArrowRight,
  Wrench,
  AlertTriangle,
  Activity,
} from 'lucide-react'

const statusColors: Record<string, string> = {
  Operational: 'bg-green-100 text-green-700',
  'Issue Reported': 'bg-yellow-100 text-yellow-700',
  'Under Inspection': 'bg-blue-100 text-blue-700',
  'Under Maintenance': 'bg-orange-100 text-orange-700',
  'Out of Service': 'bg-red-100 text-red-700',
  Retired: 'bg-gray-100 text-gray-500',
}

const priorityColors: Record<string, string> = {
  Low: 'bg-gray-100 text-gray-600',
  Medium: 'bg-blue-100 text-blue-700',
  High: 'bg-orange-100 text-orange-700',
  Critical: 'bg-red-100 text-red-700',
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

function StatCard({ title, value, sub, icon: Icon, color }: {
  title: string; value: number | string; sub?: string; icon: React.ElementType; color: string
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-1 text-foreground">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<AppData | null>(null)

  useEffect(() => {
    setData(getData())
  }, [])

  if (!data) return null

  const { assets, issues, users, history } = data

  const openIssues = issues.filter(i => !['Resolved', 'Closed'].includes(i.status))
  const criticalIssues = issues.filter(i => i.priority === 'Critical' && !['Resolved', 'Closed'].includes(i.status))
  const resolvedThisMonth = issues.filter(i => {
    if (!i.resolvedAt) return false
    const d = new Date(i.resolvedAt)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const technicians = users.filter(u => u.role === 'technician')

  const recentHistory = [...history]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)

  const activeIssues = issues
    .filter(i => !['Resolved', 'Closed'].includes(i.status))
    .sort((a, b) => {
      const pri = { Critical: 4, High: 3, Medium: 2, Low: 1 }
      return (pri[b.priority] || 0) - (pri[a.priority] || 0)
    })
    .slice(0, 5)

  return (
    <AppShell requireRole="admin">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Operational overview of all assets and maintenance activity.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Assets" value={assets.length} sub={`${assets.filter(a => a.status === 'Operational').length} operational`} icon={Package} color="bg-primary/10 text-primary" />
          <StatCard title="Open Issues" value={openIssues.length} sub={`${criticalIssues.length} critical`} icon={AlertCircle} color="bg-orange-100 text-orange-600" />
          <StatCard title="Technicians" value={technicians.length} sub="active members" icon={Wrench} color="bg-green-100 text-green-600" />
          <StatCard title="Resolved" value={resolvedThisMonth.length} sub="this month" icon={CheckCircle} color="bg-blue-100 text-blue-600" />
        </div>

        {/* Asset status breakdown */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Asset Status Breakdown</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {(['Operational', 'Issue Reported', 'Under Inspection', 'Under Maintenance', 'Out of Service', 'Retired'] as const).map(status => {
              const count = assets.filter(a => a.status === status).length
              return (
                <div key={status} className={`rounded-lg px-3 py-3 text-center ${statusColors[status] || 'bg-muted text-muted-foreground'}`}>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs font-medium mt-0.5 leading-tight">{status}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Active issues */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Active Issues</h2>
              <Link href="/dashboard/issues" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {activeIssues.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No active issues.</p>
            ) : (
              <div className="space-y-3">
                {activeIssues.map(issue => {
                  const asset = assets.find(a => a.id === issue.assetId)
                  return (
                    <Link
                      key={issue.id}
                      href={`/dashboard/issues/${issue.id}`}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-border/50"
                    >
                      <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${issue.priority === 'Critical' ? 'text-red-500' : issue.priority === 'High' ? 'text-orange-500' : 'text-yellow-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{issue.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{asset?.name || 'Unknown Asset'}</p>
                        <div className="flex gap-1.5 mt-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${priorityColors[issue.priority]}`}>{issue.priority}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${issueStatusColors[issue.status]}`}>{issue.status}</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent Activity</h2>
              <Link href="/dashboard/history" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {recentHistory.map(entry => {
                const asset = assets.find(a => a.id === entry.assetId)
                return (
                  <div key={entry.id} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{entry.action}</p>
                      <p className="text-xs text-muted-foreground">{asset?.name} &bull; {entry.actor}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                        {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
