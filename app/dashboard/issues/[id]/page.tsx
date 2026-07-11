'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { createClient } from '@/lib/supabase/client'
import { updateIssue, assignIssue } from '@/lib/actions'
import type { Issue, Asset, Profile, IssueStatus } from '@/lib/types'
import {
  ArrowLeft, AlertTriangle, User, Wrench, Calendar, Sparkles,
  ChevronDown, ChevronUp, Loader2, CheckCircle, RotateCcw, UserCheck,
} from 'lucide-react'
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

const ALL_STATUSES: IssueStatus[] = [
  'Reported', 'Assigned', 'Inspection Started', 'Maintenance In Progress',
  'Waiting for Parts', 'Resolved', 'Closed', 'Reopened',
]

export default function IssueDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [issue, setIssue] = useState<Issue | null>(null)
  const [asset, setAsset] = useState<Asset | null>(null)
  const [technicians, setTechnicians] = useState<Profile[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCauses, setShowCauses] = useState(false)
  const [saving, setSaving] = useState(false)

  const [selectedStatus, setSelectedStatus] = useState<IssueStatus>('Reported')
  const [selectedTechId, setSelectedTechId] = useState<string>('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const [{ data: i }, { data: t }, { data: { user } }] = await Promise.all([
        supabase.from('issues').select('*').eq('id', id).single(),
        supabase.from('profiles').select('*').eq('role', 'technician'),
        supabase.auth.getUser(),
      ])
      if (!i) { router.replace('/dashboard/issues'); return }
      setIssue(i)
      setSelectedStatus(i.status)
      setSelectedTechId(i.assigned_technician_id ?? '')
      setNotes(i.work_performed ?? '')
      setTechnicians(t ?? [])
      if (user) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (p) setProfile({ ...p, email: user.email })
      }
      // Load asset
      const { data: a } = await supabase.from('assets').select('*').eq('id', i.asset_id).single()
      setAsset(a)
      setLoading(false)
    }
    load()
  }, [id, router])

  async function handleUpdateStatus() {
    if (!issue || !profile) return
    setSaving(true)

    const updates: Partial<Issue> = { status: selectedStatus }
    if (selectedTechId && selectedTechId !== issue.assigned_technician_id) {
      updates.assigned_technician_id = selectedTechId
    }
    if (notes !== issue.work_performed) {
      updates.work_performed = notes
    }

    const { data } = await updateIssue(issue.id, updates, profile.name)
    if (data) setIssue(data)
    setSaving(false)
  }

  async function handleAssign() {
    if (!issue || !profile || !selectedTechId) return
    setSaving(true)
    const tech = technicians.find(t => t.id === selectedTechId)
    const { data } = await assignIssue(issue.id, selectedTechId, tech?.name ?? '', profile.name)
    if (data) {
      setIssue(data)
      setSelectedStatus(data.status)
    }
    setSaving(false)
  }

  if (loading || !issue) {
    return (
      <AppShell requireRole="admin">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    )
  }

  const assignedTech = technicians.find(t => t.id === issue.assigned_technician_id)

  return (
    <AppShell requireRole="admin">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Link href="/dashboard/issues" className="p-1.5 rounded-lg hover:bg-muted transition text-muted-foreground mt-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="text-xs font-mono text-muted-foreground">{issue.issue_number}</p>
                <h1 className="text-xl font-bold mt-0.5 leading-tight">{issue.title}</h1>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${PRIORITY_COLORS[issue.priority]}`}>{issue.priority}</span>
                <span className={`text-xs px-2 py-1 rounded font-semibold ${STATUS_COLORS[issue.status]}`}>{issue.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main details */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Asset</p>
              <Link href={`/dashboard/assets/${asset?.id}`} className="text-sm font-medium text-primary hover:underline">
                {asset?.name ?? issue.asset_id}
              </Link>
              {asset && <p className="text-xs font-mono text-muted-foreground">{asset.code}</p>}
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Reporter</p>
              <p className="text-sm font-medium">{issue.reporter_name}</p>
              {issue.reporter_contact && <p className="text-xs text-muted-foreground">{issue.reporter_contact}</p>}
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Reported</p>
              <p className="text-sm font-medium">{new Date(issue.created_at).toLocaleDateString()}</p>
              <p className="text-xs text-muted-foreground">{new Date(issue.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Category</p>
              <p className="text-sm font-medium">{issue.category}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Assigned To</p>
              <p className="text-sm font-medium">{assignedTech?.name ?? 'Unassigned'}</p>
            </div>
            {issue.resolved_at && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Resolved</p>
                <p className="text-sm font-medium">{new Date(issue.resolved_at).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">Description</p>
            <p className="text-sm leading-relaxed">{issue.description}</p>
          </div>

          {/* AI Triage info */}
          {issue.ai_suggested && (issue.possible_causes?.length || issue.initial_checks?.length) && (
            <div className="border border-primary/20 bg-primary/5 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold text-primary">AI Triage Analysis</p>
                </div>
                <button onClick={() => setShowCauses(s => !s)} className="text-xs text-primary flex items-center gap-1">
                  {showCauses ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {showCauses ? 'Hide' : 'Show'}
                </button>
              </div>
              {showCauses && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  {issue.possible_causes && issue.possible_causes.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-1.5">Possible Causes</p>
                      <ul className="space-y-1">
                        {issue.possible_causes.map((c, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {issue.initial_checks && issue.initial_checks.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-1.5">Initial Checks</p>
                      <ul className="space-y-1">
                        {issue.initial_checks.map((c, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Work performed */}
          {issue.work_performed && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">Work Performed</p>
              <p className="text-sm leading-relaxed">{issue.work_performed}</p>
            </div>
          )}
          {issue.inspection_findings && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">Inspection Findings</p>
              <p className="text-sm leading-relaxed">{issue.inspection_findings}</p>
            </div>
          )}
        </div>

        {/* Admin actions */}
        {!['Closed', 'Resolved'].includes(issue.status) && (
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h2 className="font-semibold">Update Issue</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wider">Status</label>
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value as IssueStatus)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wider">Assign Technician</label>
                <select
                  value={selectedTechId}
                  onChange={e => setSelectedTechId(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">— Unassigned —</option>
                  {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wider">Admin Notes / Work Summary</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Add notes about work performed or resolution steps..."
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleUpdateStatus}
                disabled={saving}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Update Issue
              </button>
              {selectedTechId && selectedTechId !== issue.assigned_technician_id && (
                <button
                  onClick={handleAssign}
                  disabled={saving}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60"
                >
                  <UserCheck className="w-4 h-4" /> Assign
                </button>
              )}
            </div>
          </div>
        )}

        {/* Reopen if closed/resolved */}
        {['Closed', 'Resolved'].includes(issue.status) && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-green-800">Issue {issue.status}</p>
                {issue.resolved_at && <p className="text-sm text-green-600">Resolved on {new Date(issue.resolved_at).toLocaleDateString()}</p>}
              </div>
              <button
                onClick={async () => {
                  if (!profile) return
                  setSaving(true)
                  const { data } = await updateIssue(issue.id, { status: 'Reopened' }, profile.name)
                  if (data) { setIssue(data); setSelectedStatus('Reopened') }
                  setSaving(false)
                }}
                disabled={saving}
                className="flex items-center gap-1.5 text-sm text-green-700 hover:text-green-800 border border-green-300 px-3 py-1.5 rounded-lg hover:bg-green-100 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reopen
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
