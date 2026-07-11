'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { getData, updateIssue, getCurrentUser, addHistoryEntry } from '@/lib/store'
import type { Issue, Asset, User, IssueStatus, MaintenanceRecord } from '@/lib/types'
import Link from 'next/link'
import { ArrowLeft, Save, CheckCircle, Sparkles, Loader2 } from 'lucide-react'

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

export default function TechIssueDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [issue, setIssue] = useState<Issue | null>(null)
  const [asset, setAsset] = useState<Asset | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [maintenance, setMaintenance] = useState<Partial<MaintenanceRecord>>({
    inspectionFindings: '', workPerformed: '', parts: '', cost: 0, timeSpent: 0, finalCondition: 'Good'
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const [aiSummary, setAiSummary] = useState('')

  function load() {
    const u = getCurrentUser()
    setCurrentUser(u)
    const data = getData()
    const found = data.issues.find(i => i.id === id)
    if (!found) { router.replace('/technician'); return }
    if (found.assignedTechnicianId !== u?.id) { router.replace('/technician'); return }
    setIssue(found)
    setAsset(data.assets.find(a => a.id === found.assetId) || null)
    if (found.maintenanceRecord) setMaintenance(found.maintenanceRecord)
    if (found.maintenanceSummary) setAiSummary(found.maintenanceSummary)
  }

  useEffect(() => { load() }, [id])

  function handleStatus(newStatus: IssueStatus) {
    if (!issue) return
    if (newStatus === 'Resolved' && !maintenance.workPerformed?.trim()) {
      setError('You must add maintenance notes before resolving.')
      return
    }
    const updated = updateIssue(issue.id, { status: newStatus, resolvedAt: newStatus === 'Resolved' ? new Date().toISOString() : undefined }, currentUser?.name)
    if (updated) setIssue(updated)
    setError('')
  }

  function handleSaveMaintenance() {
    if (!issue) return
    if (!maintenance.inspectionFindings?.trim()) { setError('Inspection findings are required.'); return }
    if (!maintenance.workPerformed?.trim()) { setError('Work performed is required.'); return }
    if ((maintenance.cost || 0) < 0) { setError('Cost cannot be negative.'); return }
    setError('')
    setSaving(true)
    const record: MaintenanceRecord = {
      inspectionFindings: maintenance.inspectionFindings || '',
      workPerformed: maintenance.workPerformed || '',
      parts: maintenance.parts || '',
      cost: maintenance.cost || 0,
      timeSpent: maintenance.timeSpent || 0,
      finalCondition: maintenance.finalCondition || 'Good',
      completedAt: new Date().toISOString(),
      technicianId: currentUser?.id || '',
    }
    updateIssue(issue.id, { maintenanceRecord: record }, currentUser?.name)
    addHistoryEntry({
      assetId: issue.assetId,
      issueId: issue.id,
      actor: currentUser?.name || 'Technician',
      action: 'Maintenance Record Updated',
      details: `Work performed: ${record.workPerformed.substring(0, 80)}`,
    })
    load()
    setSaving(false)
  }

  async function handleGenerateSummary() {
    if (!issue || !asset || !maintenance.inspectionFindings) return
    setGeneratingSummary(true)
    await new Promise(r => setTimeout(r, 1500))
    const summary = `Maintenance completed for ${asset.name} (${asset.code}). Issue reported: "${issue.title}". Findings: ${maintenance.inspectionFindings}. Work done: ${maintenance.workPerformed}. ${maintenance.parts ? `Parts: ${maintenance.parts}.` : ''} Duration: ${maintenance.timeSpent}h. Post-maintenance condition: ${maintenance.finalCondition}. Technician: ${currentUser?.name}.`
    setAiSummary(summary)
    updateIssue(issue.id, { maintenanceSummary: summary }, currentUser?.name)
    setGeneratingSummary(false)
  }

  if (!issue || !asset) return null

  const transitions = TRANSITIONS[issue.status] || []
  const inputCls = "w-full border border-border rounded-md px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"

  return (
    <AppShell requireRole="technician">
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-start gap-3">
          <Link href="/technician" className="text-muted-foreground hover:text-foreground mt-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{issue.title}</h1>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusColors[issue.status]}`}>{issue.status}</span>
            </div>
            <p className="text-sm text-muted-foreground font-mono mt-0.5">{issue.issueNumber} &bull; {asset.name} &bull; {asset.location}</p>
          </div>
        </div>

        {/* Issue info */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold">Issue Details</h2>
          <p className="text-sm">{issue.description}</p>
          {issue.possibleCauses && issue.possibleCauses.length > 0 && (
            <div className="bg-muted rounded-lg p-3 space-y-2">
              <p className="text-xs font-semibold">AI Suggested Causes</p>
              <ul className="space-y-1">
                {issue.possibleCauses.map((c, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-1.5"><span className="text-primary">•</span>{c}</li>
                ))}
              </ul>
              {issue.initialChecks && (
                <>
                  <p className="text-xs font-semibold mt-2">Initial Checks</p>
                  <ul className="space-y-1">
                    {issue.initialChecks.map((c, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-1.5"><span className="text-chart-2">✓</span>{c}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>

        {/* Maintenance record */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold">Maintenance Record</h2>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Inspection Findings <span className="text-destructive">*</span></label>
            <textarea rows={3} value={maintenance.inspectionFindings || ''} onChange={e => setMaintenance(m => ({ ...m, inspectionFindings: e.target.value }))} placeholder="Describe what you found..." className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Work Performed <span className="text-destructive">*</span></label>
            <textarea rows={3} value={maintenance.workPerformed || ''} onChange={e => setMaintenance(m => ({ ...m, workPerformed: e.target.value }))} placeholder="What did you do to fix the issue?" className={inputCls} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Parts Used</label>
              <input type="text" value={maintenance.parts || ''} onChange={e => setMaintenance(m => ({ ...m, parts: e.target.value }))} placeholder="e.g. Bearing set" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Cost (PKR)</label>
              <input type="number" min={0} value={maintenance.cost || 0} onChange={e => setMaintenance(m => ({ ...m, cost: parseFloat(e.target.value) || 0 }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Hours</label>
              <input type="number" min={0} step={0.5} value={maintenance.timeSpent || 0} onChange={e => setMaintenance(m => ({ ...m, timeSpent: parseFloat(e.target.value) || 0 }))} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Final Condition</label>
            <select value={maintenance.finalCondition || 'Good'} onChange={e => setMaintenance(m => ({ ...m, finalCondition: e.target.value as any }))} className={inputCls}>
              {['Good', 'Fair', 'Poor', 'Critical'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {error && <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md px-3 py-2">{error}</div>}

          <div className="flex gap-2 flex-wrap">
            <button onClick={handleSaveMaintenance} disabled={saving} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Record'}
            </button>
            <button
              onClick={handleGenerateSummary}
              disabled={generatingSummary || !maintenance.inspectionFindings}
              className="flex items-center gap-2 border border-border px-4 py-2 rounded-md text-sm font-medium hover:bg-muted transition disabled:opacity-60"
            >
              {generatingSummary ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              AI Summary
            </button>
          </div>

          {aiSummary && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mt-2">
              <p className="text-xs font-semibold text-primary mb-1">AI Generated Summary</p>
              <p className="text-xs leading-relaxed">{aiSummary}</p>
            </div>
          )}
        </div>

        {/* Status actions */}
        {transitions.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Update Status</p>
            <div className="flex flex-wrap gap-2">
              {transitions.map(t => (
                <button
                  key={t}
                  onClick={() => handleStatus(t)}
                  className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-md font-medium transition border ${
                    t === 'Resolved' ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100' :
                    'bg-primary/5 border-primary/30 text-primary hover:bg-primary/10'
                  }`}
                >
                  {t === 'Resolved' && <CheckCircle className="w-3.5 h-3.5" />}
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
