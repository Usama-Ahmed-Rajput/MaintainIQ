'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { createClient } from '@/lib/supabase/client'
import {
  getIssueById, getAssetById, updateIssue, addHistoryEntry,
  generateMaintenanceSummary,
} from '@/lib/actions'
import type { Issue, Asset, Profile, IssueStatus } from '@/lib/types'
import Link from 'next/link'
import { ArrowLeft, Save, CheckCircle, Sparkles, Loader2, Clock, MapPin, Tag } from 'lucide-react'

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

const TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  Assigned: ['Inspection Started'],
  'Inspection Started': ['Maintenance In Progress', 'Waiting for Parts'],
  'Maintenance In Progress': ['Resolved', 'Waiting for Parts'],
  'Waiting for Parts': ['Maintenance In Progress'],
  Resolved: [],
  Closed: [],
  Reported: [],
  Reopened: ['Inspection Started'],
}

const inputCls = "w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"

export default function TechIssueDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [issue, setIssue] = useState<Issue | null>(null)
  const [asset, setAsset] = useState<Asset | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const [inspectionFindings, setInspectionFindings] = useState('')
  const [workPerformed, setWorkPerformed] = useState('')
  const [partsUsed, setPartsUsed] = useState('')
  const [cost, setCost] = useState<number>(0)
  const [timeSpent, setTimeSpent] = useState<number>(0)
  const [finalCondition, setFinalCondition] = useState('Good')

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const [aiSummary, setAiSummary] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/'); return }

    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!p) { router.replace('/'); return }
    const prof: Profile = { ...p, email: user.email }
    setProfile(prof)

    const found = await getIssueById(id)
    if (!found) { router.replace('/technician'); return }

    // Technicians can only see issues assigned to them
    if (found.assigned_technician_id && found.assigned_technician_id !== user.id) {
      router.replace('/technician')
      return
    }

    const a = await getAssetById(found.asset_id)
    setIssue(found)
    setAsset(a)

    // Populate maintenance fields from saved data
    setInspectionFindings(found.inspection_findings ?? '')
    setWorkPerformed(found.work_performed ?? '')
    setPartsUsed(found.parts_used ?? '')
    setCost(found.cost ?? 0)
    setTimeSpent(found.time_spent ?? 0)
    setFinalCondition(found.final_condition ?? 'Good')
    if (found.maintenance_summary) setAiSummary(found.maintenance_summary)

    setLoading(false)
  }, [id, router])

  useEffect(() => { load() }, [load])

  async function handleSaveMaintenance() {
    if (!issue || !profile) return
    if (!inspectionFindings.trim()) { setError('Inspection findings are required.'); return }
    if (!workPerformed.trim()) { setError('Work performed is required.'); return }
    if (cost < 0) { setError('Cost cannot be negative.'); return }
    setError('')
    setSaving(true)
    setSavedOk(false)

    const updates: Partial<Issue> = {
      inspection_findings: inspectionFindings,
      work_performed: workPerformed,
      parts_used: partsUsed,
      cost,
      time_spent: timeSpent,
      final_condition: finalCondition,
      completed_at: new Date().toISOString(),
    }

    const { error: err } = await updateIssue(issue.id, updates)
    if (err) {
      setError(err)
      setSaving(false)
      return
    }

    await addHistoryEntry({
      asset_id: issue.asset_id,
      issue_id: issue.id,
      actor: profile.name,
      action: 'Maintenance Record Updated',
      details: `Work: ${workPerformed.substring(0, 100)}`,
    })

    setSaving(false)
    setSavedOk(true)
    await load()
    setTimeout(() => setSavedOk(false), 3000)
  }

  async function handleStatus(newStatus: IssueStatus) {
    if (!issue || !profile) return
    if (newStatus === 'Resolved' && !workPerformed.trim()) {
      setError('You must save maintenance notes before resolving.')
      return
    }
    setError('')
    setUpdatingStatus(newStatus)
    const { error: err } = await updateIssue(issue.id, { status: newStatus }, profile.name)
    if (err) setError(err)
    else await load()
    setUpdatingStatus('')
  }

  async function handleGenerateSummary() {
    if (!issue || !asset || !profile) return
    if (!inspectionFindings.trim()) { setError('Fill in inspection findings before generating summary.'); return }
    setError('')
    setGeneratingSummary(true)

    // Simulate AI processing
    await new Promise(r => setTimeout(r, 1400))

    const issueWithMaintenance: Issue = {
      ...issue,
      inspection_findings: inspectionFindings,
      work_performed: workPerformed,
      parts_used: partsUsed,
      cost,
      time_spent: timeSpent,
      final_condition: finalCondition,
    }

    const summary = generateMaintenanceSummary(issueWithMaintenance, asset, profile.name)
    setAiSummary(summary)

    await updateIssue(issue.id, { maintenance_summary: summary })
    setGeneratingSummary(false)
  }

  if (loading) {
    return (
      <AppShell requireRole="technician">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </AppShell>
    )
  }

  if (!issue || !asset) return null

  const transitions = TRANSITIONS[issue.status] ?? []
  const isResolved = ['Resolved', 'Closed'].includes(issue.status)

  return (
    <AppShell requireRole="technician">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Link href="/technician" className="text-muted-foreground hover:text-foreground mt-1 flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold leading-tight">{issue.title}</h1>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${statusColors[issue.status]}`}>
                {issue.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground font-mono mt-0.5">
              {issue.issue_number}
            </p>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />{asset.name}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />{asset.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />{new Date(issue.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Issue details */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold">Issue Details</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{issue.description}</p>

          {issue.possible_causes && issue.possible_causes.length > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
              <p className="text-xs font-semibold text-primary">AI Triage Suggestions</p>
              <div>
                <p className="text-xs font-medium mb-1.5">Possible Causes</p>
                <ul className="space-y-1">
                  {issue.possible_causes.map((c, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-2">
                      <span className="text-primary flex-shrink-0">•</span>{c}
                    </li>
                  ))}
                </ul>
              </div>
              {issue.initial_checks && issue.initial_checks.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-1.5">Initial Checks</p>
                  <ul className="space-y-1">
                    {issue.initial_checks.map((c, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-2">
                        <span className="text-green-600 flex-shrink-0">✓</span>{c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {issue.recurring_warning && (
                <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2 mt-1">
                  {issue.recurring_warning}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Maintenance record form */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold">
            Maintenance Record
            {isResolved && <span className="ml-2 text-xs text-muted-foreground font-normal">(read-only — issue resolved)</span>}
          </h2>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Inspection Findings <span className="text-destructive">*</span>
            </label>
            <textarea
              rows={3}
              value={inspectionFindings}
              onChange={e => setInspectionFindings(e.target.value)}
              placeholder="Describe what you found during inspection..."
              className={inputCls}
              disabled={isResolved}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Work Performed <span className="text-destructive">*</span>
            </label>
            <textarea
              rows={3}
              value={workPerformed}
              onChange={e => setWorkPerformed(e.target.value)}
              placeholder="Describe the work done to resolve the issue..."
              className={inputCls}
              disabled={isResolved}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Parts Used</label>
              <input
                type="text"
                value={partsUsed}
                onChange={e => setPartsUsed(e.target.value)}
                placeholder="e.g. Bearing set, Belt"
                className={inputCls}
                disabled={isResolved}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Cost (PKR)</label>
              <input
                type="number"
                min={0}
                value={cost}
                onChange={e => setCost(parseFloat(e.target.value) || 0)}
                className={inputCls}
                disabled={isResolved}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Hours Spent</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={timeSpent}
                onChange={e => setTimeSpent(parseFloat(e.target.value) || 0)}
                className={inputCls}
                disabled={isResolved}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Final Condition</label>
            <select
              value={finalCondition}
              onChange={e => setFinalCondition(e.target.value)}
              className={inputCls}
              disabled={isResolved}
            >
              {['Good', 'Fair', 'Poor', 'Critical'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          {savedOk && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-3 py-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Record saved successfully.
            </div>
          )}

          {!isResolved && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleSaveMaintenance}
                disabled={saving}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Record'}
              </button>
              <button
                onClick={handleGenerateSummary}
                disabled={generatingSummary || !inspectionFindings.trim()}
                className="flex items-center gap-2 border border-border px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-muted transition disabled:opacity-50"
              >
                {generatingSummary ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generatingSummary ? 'Generating...' : 'AI Summary'}
              </button>
            </div>
          )}

          {aiSummary && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-2">
              <p className="text-xs font-semibold text-primary mb-1.5">AI Generated Maintenance Summary</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{aiSummary}</p>
            </div>
          )}
        </div>

        {/* Status workflow */}
        {transitions.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Advance Status
            </p>
            <div className="flex flex-wrap gap-2">
              {transitions.map(t => (
                <button
                  key={t}
                  onClick={() => handleStatus(t)}
                  disabled={!!updatingStatus}
                  className={`flex items-center gap-1.5 text-sm px-4 py-2.5 rounded-lg font-semibold transition border disabled:opacity-60 ${
                    t === 'Resolved'
                      ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
                      : 'bg-primary/5 border-primary/30 text-primary hover:bg-primary/10'
                  }`}
                >
                  {updatingStatus === t
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : t === 'Resolved'
                    ? <CheckCircle className="w-3.5 h-3.5" />
                    : null
                  }
                  {t}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Current status: <strong>{issue.status}</strong>
            </p>
          </div>
        )}

        {isResolved && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-700">Issue Resolved</p>
              <p className="text-xs text-green-600 mt-0.5">
                This issue was marked as {issue.status.toLowerCase()} on{' '}
                {new Date(issue.resolved_at ?? issue.updated_at).toLocaleDateString()}.
              </p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
