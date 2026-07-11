'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppShell from '@/components/app-shell'
import { getData, updateIssue, getTechnicians, getCurrentUser, addHistoryEntry } from '@/lib/store'
import type { Issue, Asset, User, IssueStatus, MaintenanceRecord } from '@/lib/types'
import Link from 'next/link'
import { ArrowLeft, Wrench, UserCheck, AlertTriangle, CheckCircle, ChevronDown, Save, RotateCcw, Sparkles, Loader2 } from 'lucide-react'

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

// Valid transitions per status
const TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  Reported: ['Assigned'],
  Assigned: ['Inspection Started', 'Reported'],
  'Inspection Started': ['Maintenance In Progress', 'Waiting for Parts'],
  'Maintenance In Progress': ['Resolved', 'Waiting for Parts'],
  'Waiting for Parts': ['Maintenance In Progress'],
  Resolved: ['Closed', 'Reopened'],
  Closed: ['Reopened'],
  Reopened: ['Assigned', 'Inspection Started'],
}

// AI maintenance summary generator
function generateMaintenanceSummary(issue: Issue, record: MaintenanceRecord, asset: Asset): string {
  return `Maintenance completed for ${asset.name} (${asset.code}) on ${new Date(record.completedAt || new Date()).toLocaleDateString()}. Issue: "${issue.title}". Inspection findings: ${record.inspectionFindings}. Work performed: ${record.workPerformed}. ${record.parts ? `Parts replaced/used: ${record.parts}.` : ''} Total time: ${record.timeSpent} hours. Asset condition post-maintenance: ${record.finalCondition}. ${asset.nextServiceDate ? `Next service scheduled for ${new Date(asset.nextServiceDate).toLocaleDateString()}.` : 'Next service date to be scheduled.'}`
}

export default function IssueDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [issue, setIssue] = useState<Issue | null>(null)
  const [asset, setAsset] = useState<Asset | null>(null)
  const [technicians, setTechnicians] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [assignTechId, setAssignTechId] = useState('')
  const [activeTab, setActiveTab] = useState<'details' | 'maintenance' | 'ai'>('details')
  const [maintenance, setMaintenance] = useState<Partial<MaintenanceRecord>>({
    inspectionFindings: '', workPerformed: '', parts: '', cost: 0, timeSpent: 0, finalCondition: 'Good'
  })
  const [maintenanceError, setMaintenanceError] = useState('')
  const [savingMaintenance, setSavingMaintenance] = useState(false)
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const [aiSummary, setAiSummary] = useState('')

  function loadData() {
    const data = getData()
    const found = data.issues.find(i => i.id === id)
    if (!found) { router.replace('/dashboard/issues'); return }
    setIssue(found)
    setAsset(data.assets.find(a => a.id === found.assetId) || null)
    setTechnicians(getTechnicians())
    setCurrentUser(getCurrentUser())
    setAssignTechId(found.assignedTechnicianId || '')
    if (found.maintenanceRecord) {
      setMaintenance(found.maintenanceRecord)
    }
    if (found.maintenanceSummary) setAiSummary(found.maintenanceSummary)
  }

  useEffect(() => { loadData() }, [id])

  function handleStatusChange(newStatus: IssueStatus) {
    if (!issue) return
    const updated = updateIssue(issue.id, { status: newStatus }, currentUser?.name)
    if (updated) setIssue(updated)
  }

  function handleAssign() {
    if (!issue || !assignTechId) return
    const updated = updateIssue(issue.id, { assignedTechnicianId: assignTechId, status: 'Assigned' }, currentUser?.name)
    if (updated) setIssue(updated)
  }

  function handleSaveMaintenance() {
    if (!issue) return
    if (!maintenance.inspectionFindings?.trim()) { setMaintenanceError('Inspection findings are required.'); return }
    if (!maintenance.workPerformed?.trim()) { setMaintenanceError('Work performed is required.'); return }
    if ((maintenance.cost || 0) < 0) { setMaintenanceError('Cost cannot be negative.'); return }
    setMaintenanceError('')
    setSavingMaintenance(true)

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

    const updated = updateIssue(issue.id, { maintenanceRecord: record }, currentUser?.name)
    addHistoryEntry({
      assetId: issue.assetId,
      issueId: issue.id,
      actor: currentUser?.name || 'Technician',
      action: 'Maintenance Record Updated',
      details: `Work performed: ${record.workPerformed}`,
    })
    if (updated) setIssue(updated)
    setSavingMaintenance(false)
  }

  async function handleGenerateSummary() {
    if (!issue || !asset || !maintenance.inspectionFindings) return
    setGeneratingSummary(true)
    await new Promise(r => setTimeout(r, 1500))
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
    const summary = generateMaintenanceSummary(issue, record, asset)
    setAiSummary(summary)
    const updated = updateIssue(issue.id, { maintenanceSummary: summary }, currentUser?.name)
    if (updated) setIssue(updated)
    setGeneratingSummary(false)
  }

  if (!issue || !asset) return null

  const tech = technicians.find(t => t.id === issue.assignedTechnicianId)
  const inputCls = "w-full border border-border rounded-md px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
  const transitions = TRANSITIONS[issue.status] || []
  const isClosed = issue.status === 'Closed'

  return (
    <AppShell requireRole="admin">
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Link href="/dashboard/issues" className="text-muted-foreground hover:text-foreground mt-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{issue.title}</h1>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${priorityColors[issue.priority]}`}>{issue.priority}</span>
              {issue.priority === 'Critical' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-red-100 text-red-700 border border-red-200 animate-pulse">CRITICAL</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground font-mono mt-0.5">{issue.issueNumber} &bull; {asset.name} &bull; {asset.location}</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${statusColors[issue.status]}`}>{issue.status}</span>
        </div>

        {/* Status workflow */}
        {!isClosed && transitions.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Advance Status</p>
            <div className="flex flex-wrap gap-2">
              {transitions.map(t => (
                <button
                  key={t}
                  onClick={() => handleStatusChange(t)}
                  className={`text-sm px-4 py-2 rounded-md font-medium transition border ${
                    t === 'Resolved' ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100' :
                    t === 'Closed' ? 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100' :
                    t === 'Reopened' ? 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100' :
                    'bg-primary/5 border-primary/30 text-primary hover:bg-primary/10'
                  }`}
                >
                  {t === 'Resolved' && <CheckCircle className="w-3.5 h-3.5 inline mr-1.5" />}
                  Move to: {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Assign */}
        {issue.status !== 'Closed' && (
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Assignment</p>
            <div className="flex gap-3">
              <select
                value={assignTechId}
                onChange={e => setAssignTechId(e.target.value)}
                className="flex-1 border border-border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Unassigned</option>
                {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <button
                onClick={handleAssign}
                disabled={!assignTechId}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
              >
                <UserCheck className="w-4 h-4" /> Assign
              </button>
            </div>
            {tech && <p className="text-xs text-muted-foreground mt-2">Currently assigned to <span className="font-semibold">{tech.name}</span></p>}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-0 border-b border-border">
          {(['details', 'maintenance', 'ai'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition -mb-px ${
                activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'ai' ? 'AI Summary' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Details */}
        {activeTab === 'details' && (
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: 'Reporter', value: issue.reporterName },
                { label: 'Contact', value: issue.reporterContact || '—' },
                { label: 'Category', value: issue.category },
                { label: 'Priority', value: issue.priority },
                { label: 'Reported At', value: new Date(issue.createdAt).toLocaleString() },
                { label: 'Last Updated', value: new Date(issue.updatedAt).toLocaleString() },
                { label: 'AI Triaged', value: issue.aiSuggested ? 'Yes' : 'No' },
                { label: 'User Edited AI', value: issue.aiEditedByUser ? 'Yes' : 'No' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
                  <p className="text-sm font-medium">{value}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{issue.description}</p>
            </div>

            {issue.possibleCauses && issue.possibleCauses.length > 0 && (
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold mb-2">AI Suggested Possible Causes</p>
                  <ul className="space-y-1">
                    {issue.possibleCauses.map((c, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-1.5"><span className="text-primary">•</span>{c}</li>
                    ))}
                  </ul>
                </div>
                {issue.initialChecks && (
                  <div>
                    <p className="text-xs font-semibold mb-2">Initial Checks</p>
                    <ul className="space-y-1">
                      {issue.initialChecks.map((c, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex gap-1.5"><span className="text-chart-2">✓</span>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Maintenance record */}
        {activeTab === 'maintenance' && (
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <p className="text-sm font-semibold">Maintenance Record</p>
            {isClosed ? (
              <div className="text-sm text-muted-foreground">This issue is closed and cannot be edited.</div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Inspection Findings <span className="text-destructive">*</span></label>
                  <textarea rows={3} value={maintenance.inspectionFindings || ''} onChange={e => setMaintenance(m => ({ ...m, inspectionFindings: e.target.value }))} placeholder="What did you find during inspection?" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Work Performed <span className="text-destructive">*</span></label>
                  <textarea rows={3} value={maintenance.workPerformed || ''} onChange={e => setMaintenance(m => ({ ...m, workPerformed: e.target.value }))} placeholder="What work was performed?" className={inputCls} />
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Parts Used/Replaced</label>
                    <input type="text" value={maintenance.parts || ''} onChange={e => setMaintenance(m => ({ ...m, parts: e.target.value }))} placeholder="e.g. HDMI cable" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Cost (PKR)</label>
                    <input type="number" min={0} value={maintenance.cost || 0} onChange={e => setMaintenance(m => ({ ...m, cost: parseFloat(e.target.value) || 0 }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Time (hours)</label>
                    <input type="number" min={0} step={0.5} value={maintenance.timeSpent || 0} onChange={e => setMaintenance(m => ({ ...m, timeSpent: parseFloat(e.target.value) || 0 }))} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Final Condition</label>
                  <select value={maintenance.finalCondition || 'Good'} onChange={e => setMaintenance(m => ({ ...m, finalCondition: e.target.value as any }))} className={inputCls}>
                    {['Good', 'Fair', 'Poor', 'Critical'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {maintenanceError && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md px-3 py-2">{maintenanceError}</div>
                )}
                <button
                  onClick={handleSaveMaintenance}
                  disabled={savingMaintenance}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition"
                >
                  <Save className="w-4 h-4" />
                  {savingMaintenance ? 'Saving...' : 'Save Maintenance Record'}
                </button>
              </>
            )}

            {issue.maintenanceRecord?.completedAt && (
              <div className="border-t border-border pt-4 bg-muted rounded-lg p-4 mt-4">
                <p className="text-xs font-semibold mb-2">Saved Record</p>
                <p className="text-xs text-muted-foreground">Completed at: {new Date(issue.maintenanceRecord.completedAt).toLocaleString()}</p>
              </div>
            )}
          </div>
        )}

        {/* AI Summary */}
        {activeTab === 'ai' && (
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">AI Maintenance Summary</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Auto-generates a professional service report from maintenance records.</p>
              </div>
              <button
                onClick={handleGenerateSummary}
                disabled={generatingSummary || !maintenance.inspectionFindings}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition disabled:opacity-60"
              >
                {generatingSummary ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generatingSummary ? 'Generating...' : 'Generate'}
              </button>
            </div>

            {!maintenance.inspectionFindings && (
              <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground">
                Add inspection findings in the Maintenance tab first.
              </div>
            )}

            {aiSummary && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold text-primary">Generated Summary</p>
                </div>
                <p className="text-sm leading-relaxed">{aiSummary}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
