'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/app-shell'
import AnalyticsCharts from '@/components/analytics-charts'
import { createClient } from '@/lib/supabase/client'
import type { Asset, Issue } from '@/lib/types'
import { Package, AlertTriangle, CheckCircle, Clock, TrendingUp, Activity, Wrench, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('assets').select('*'),
      supabase.from('issues').select('*').order('created_at', { ascending: false }),
    ]).then(([{ data: a }, { data: i }]) => {
      setAssets(a ?? [])
      setIssues(i ?? [])
      setLoading(false)
    })
  }, [])

  const totalAssets = assets.length
  const operationalAssets = assets.filter(a => a.status === 'Operational').length
  const openIssues = issues.filter(i => !['Resolved', 'Closed'].includes(i.status)).length
  const criticalIssues = issues.filter(i => i.priority === 'Critical' && !['Resolved', 'Closed'].includes(i.status)).length
  const resolvedThisMonth = issues.filter(i => {
    if (!['Resolved', 'Closed'].includes(i.status)) return false
    const d = new Date(i.updated_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const recentIssues = issues.slice(0, 6)

  const statusColor = (status: string) => {
    const m: Record<string, string> = {
      Operational: 'bg-green-100 text-green-700',
      'Issue Reported': 'bg-yellow-100 text-yellow-700',
      'Under Inspection': 'bg-blue-100 text-blue-700',
      'Under Maintenance': 'bg-orange-100 text-orange-700',
      'Out of Service': 'bg-red-100 text-red-700',
      Retired: 'bg-gray-100 text-gray-500',
    }
    return m[status] ?? 'bg-muted text-muted-foreground'
  }

  const priorityColor = (p: string) => {
    if (p === 'Critical') return 'text-red-600 bg-red-50 border-red-200'
    if (p === 'High') return 'text-orange-600 bg-orange-50 border-orange-200'
    if (p === 'Medium') return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-green-600 bg-green-50 border-green-200'
  }

  const assetConditionStats = {
    Good: assets.filter(a => a.condition === 'Good').length,
    Fair: assets.filter(a => a.condition === 'Fair').length,
    Poor: assets.filter(a => a.condition === 'Poor').length,
    Critical: assets.filter(a => a.condition === 'Critical').length,
  }

  return (
    <AppShell requireRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Facility asset and maintenance overview.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-3" />
                <div className="h-8 bg-muted rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">Total Assets</span>
                </div>
                <p className="text-3xl font-bold">{totalAssets}</p>
                <p className="text-xs text-muted-foreground mt-1">{operationalAssets} operational</p>
              </div>

              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">Open Issues</span>
                </div>
                <p className="text-3xl font-bold">{openIssues}</p>
                <p className="text-xs text-muted-foreground mt-1">{criticalIssues} critical</p>
              </div>

              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">Resolved</span>
                </div>
                <p className="text-3xl font-bold">{resolvedThisMonth}</p>
                <p className="text-xs text-muted-foreground mt-1">this month</p>
              </div>

              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">Health</span>
                </div>
                <p className="text-3xl font-bold">
                  {totalAssets > 0 ? Math.round((operationalAssets / totalAssets) * 100) : 0}
                  <span className="text-lg font-medium text-muted-foreground">%</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">asset uptime rate</p>
              </div>
            </div>

            {/* Asset condition breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-sm">Asset Condition</h2>
                  <BarChart3 className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="space-y-3">
                  {Object.entries(assetConditionStats).map(([condition, count]) => {
                    const colors: Record<string, string> = {
                      Good: 'bg-green-500',
                      Fair: 'bg-yellow-500',
                      Poor: 'bg-orange-500',
                      Critical: 'bg-red-500',
                    }
                    const pct = totalAssets > 0 ? Math.round((count / totalAssets) * 100) : 0
                    return (
                      <div key={condition}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">{condition}</span>
                          <span className="text-xs text-muted-foreground">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${colors[condition]}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
                <Link href="/dashboard/assets" className="mt-4 block text-xs font-semibold text-primary hover:underline">
                  View all assets &rarr;
                </Link>
              </div>

              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-sm">Asset Status</h2>
                  <Activity className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Operational', key: 'Operational', color: 'bg-green-100 text-green-700' },
                    { label: 'Issue Reported', key: 'Issue Reported', color: 'bg-yellow-100 text-yellow-700' },
                    { label: 'Under Inspection', key: 'Under Inspection', color: 'bg-blue-100 text-blue-700' },
                    { label: 'Under Maintenance', key: 'Under Maintenance', color: 'bg-orange-100 text-orange-700' },
                    { label: 'Out of Service', key: 'Out of Service', color: 'bg-red-100 text-red-700' },
                  ].map(({ label, key, color }) => {
                    const count = assets.filter(a => a.status === key).length
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${color}`}>{label}</span>
                        <span className="text-sm font-bold">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Analytics Charts */}
            <div>
              <h2 className="font-semibold text-sm mb-4">Analytics & Trends</h2>
              <AnalyticsCharts assets={assets} issues={issues} />
            </div>

            {/* Recent issues */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-sm">Recent Issues</h2>
                <Link href="/dashboard/issues" className="text-xs font-semibold text-primary hover:underline">
                  View all &rarr;
                </Link>
              </div>
              {recentIssues.length === 0 ? (
                <div className="text-center py-8">
                  <Wrench className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No issues reported yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentIssues.map(issue => {
                    const asset = assets.find(a => a.id === issue.asset_id)
                    return (
                      <Link
                        key={issue.id}
                        href={`/dashboard/issues/${issue.id}`}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition">{issue.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{asset?.name ?? 'Unknown Asset'} &middot; {new Date(issue.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${priorityColor(issue.priority)}`}>
                            {issue.priority}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${statusColor(issue.status)}`}>
                            {issue.status}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
