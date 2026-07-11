'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/app-shell'
import { getData, getCurrentUser, updateIssue } from '@/lib/store'
import type { Issue, Asset, User } from '@/lib/types'
import Link from 'next/link'
import { Wrench, AlertTriangle, CheckCircle, Clock, ArrowRight } from 'lucide-react'

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

export default function TechnicianDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [myIssues, setMyIssues] = useState<Issue[]>([])
  const [assets, setAssets] = useState<Asset[]>([])

  function load() {
    const u = getCurrentUser()
    setUser(u)
    if (!u) return
    const data = getData()
    const assigned = data.issues
      .filter(i => i.assignedTechnicianId === u.id)
      .sort((a, b) => {
        const pri = { Critical: 4, High: 3, Medium: 2, Low: 1 }
        return (pri[b.priority] || 0) - (pri[a.priority] || 0)
      })
    setMyIssues(assigned)
    setAssets(data.assets)
  }

  useEffect(() => { load() }, [])

  const open = myIssues.filter(i => !['Resolved', 'Closed'].includes(i.status))
  const resolved = myIssues.filter(i => i.status === 'Resolved' || i.status === 'Closed')

  function handleQuickStatus(issueId: string, newStatus: Issue['status']) {
    updateIssue(issueId, { status: newStatus }, user?.name)
    load()
  }

  return (
    <AppShell requireRole="technician">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Work Queue</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Welcome back, {user?.name}. You have {open.length} open issue{open.length !== 1 ? 's' : ''}.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Open', value: open.length, icon: AlertTriangle, color: 'bg-orange-100 text-orange-600' },
            { label: 'Resolved', value: resolved.length, icon: CheckCircle, color: 'bg-green-100 text-green-600' },
            { label: 'Total Assigned', value: myIssues.length, icon: Wrench, color: 'bg-primary/10 text-primary' },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{s.label}</p>
                  <p className="text-2xl font-bold mt-0.5">{s.value}</p>
                </div>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Open issues */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Open Issues</h2>
          {open.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-10 text-center">
              <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <p className="font-semibold">All caught up!</p>
              <p className="text-sm text-muted-foreground mt-1">No open issues assigned to you.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {open.map(issue => {
                const asset = assets.find(a => a.id === issue.assetId)
                return (
                  <div key={issue.id} className={`bg-card border rounded-xl p-4 ${issue.priority === 'Critical' ? 'border-red-300' : 'border-border'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{issue.title}</p>
                          {issue.priority === 'Critical' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold animate-pulse">CRITICAL</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 font-mono">{issue.issueNumber} &bull; {asset?.name} &bull; {asset?.location}</p>
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${priorityColors[issue.priority]}`}>{issue.priority}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${statusColors[issue.status]}`}>{issue.status}</span>
                        </div>
                      </div>
                      <Link
                        href={`/technician/issues/${issue.id}`}
                        className="flex items-center gap-1 text-xs text-primary font-medium hover:underline flex-shrink-0"
                      >
                        Work on this <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>

                    {/* Quick action buttons */}
                    <div className="mt-3 pt-3 border-t border-border flex gap-2 flex-wrap">
                      {issue.status === 'Assigned' && (
                        <button
                          onClick={() => handleQuickStatus(issue.id, 'Inspection Started')}
                          className="text-xs px-3 py-1.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-medium hover:bg-indigo-100 transition"
                        >
                          Start Inspection
                        </button>
                      )}
                      {issue.status === 'Inspection Started' && (
                        <button
                          onClick={() => handleQuickStatus(issue.id, 'Maintenance In Progress')}
                          className="text-xs px-3 py-1.5 rounded-md bg-orange-50 border border-orange-200 text-orange-700 font-medium hover:bg-orange-100 transition"
                        >
                          Begin Maintenance
                        </button>
                      )}
                      {issue.status === 'Maintenance In Progress' && (
                        <button
                          onClick={() => handleQuickStatus(issue.id, 'Waiting for Parts')}
                          className="text-xs px-3 py-1.5 rounded-md bg-purple-50 border border-purple-200 text-purple-700 font-medium hover:bg-purple-100 transition"
                        >
                          Waiting for Parts
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recently resolved */}
        {resolved.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Recently Resolved</h2>
            <div className="space-y-2">
              {resolved.slice(0, 3).map(issue => {
                const asset = assets.find(a => a.id === issue.assetId)
                return (
                  <div key={issue.id} className="bg-card border border-border rounded-xl p-4 opacity-75">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{issue.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{asset?.name} &bull; {issue.issueNumber}</p>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${statusColors[issue.status]}`}>{issue.status}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
