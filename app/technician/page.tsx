'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/app-shell'
import { createClient } from '@/lib/supabase/client'
import type { Issue, Asset, Profile } from '@/lib/types'
import { Wrench, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
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

export default function TechnicianDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [issues, setIssues] = useState<Issue[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!p) return
      setProfile({ ...p, email: user.email })

      const [{ data: i }, { data: a }] = await Promise.all([
        supabase.from('issues').select('*').eq('assigned_technician_id', user.id).order('created_at', { ascending: false }),
        supabase.from('assets').select('id,name,code,location,category'),
      ])
      setIssues(i ?? [])
      setAssets((a as Asset[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const activeIssues = issues.filter(i => !['Resolved', 'Closed'].includes(i.status))
  const completedIssues = issues.filter(i => ['Resolved', 'Closed'].includes(i.status))
  const criticalCount = activeIssues.filter(i => i.priority === 'Critical').length
  const displayIssues = activeTab === 'active' ? activeIssues : completedIssues

  return (
    <AppShell requireRole="technician">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Tasks</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {profile ? `Welcome, ${profile.name}` : 'Technician Dashboard'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Wrench className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold">{activeIssues.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Active</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-2xl font-bold">{criticalCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Critical</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold">{completedIssues.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Completed</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-muted rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
              activeTab === 'active' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Active ({activeIssues.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
              activeTab === 'completed' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Completed ({completedIssues.length})
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : displayIssues.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">No {activeTab} issues</p>
            <p className="text-sm text-muted-foreground mt-1">
              {activeTab === 'active' ? 'You have no active tasks assigned to you.' : 'No completed tasks yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayIssues.map(issue => {
              const asset = assets.find(a => a.id === issue.asset_id)
              return (
                <Link
                  key={issue.id}
                  href={`/technician/issues/${issue.id}`}
                  className="block bg-card border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm group-hover:text-primary transition truncate">{issue.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {asset?.name ?? 'Unknown Asset'}
                        {asset?.location ? ` · ${asset.location}` : ''}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">{issue.issue_number}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${PRIORITY_COLORS[issue.priority]}`}>
                        {issue.priority}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${STATUS_COLORS[issue.status]}`}>
                        {issue.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Reported {new Date(issue.created_at).toLocaleDateString()}
                    {issue.resolved_at ? ` · Resolved ${new Date(issue.resolved_at).toLocaleDateString()}` : ''}
                  </p>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
