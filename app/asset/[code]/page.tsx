'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createIssue, runAiTriage } from '@/lib/actions'
import type { Asset, IssueCategory, IssuePriority } from '@/lib/types'
import {
  ShieldCheck, MapPin, Tag, Activity, Calendar, AlertTriangle,
  CheckCircle, Sparkles, ChevronDown, ChevronUp, Loader2, RotateCcw,
} from 'lucide-react'

const statusColors: Record<string, string> = {
  Operational: 'bg-green-100 text-green-700 border-green-200',
  'Issue Reported': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Under Inspection': 'bg-blue-100 text-blue-700 border-blue-200',
  'Under Maintenance': 'bg-orange-100 text-orange-700 border-orange-200',
  'Out of Service': 'bg-red-100 text-red-700 border-red-200',
  Retired: 'bg-gray-100 text-gray-500 border-gray-200',
}

const CATEGORIES: IssueCategory[] = [
  'Mechanical', 'Electrical', 'Plumbing', 'Leakage',
  'Performance', 'Safety', 'Connectivity', 'Structural', 'Other',
]

export default function PublicAssetPage() {
  const { code } = useParams<{ code: string }>()
  const [asset, setAsset] = useState<Asset | null | 'loading'>('loading')
  const [step, setStep] = useState<'view' | 'report' | 'triage' | 'submitted'>('view')

  // Report form
  const [complaint, setComplaint] = useState('')
  const [reporterName, setReporterName] = useState('')
  const [reporterContact, setReporterContact] = useState('')
  const [triaging, setTriaging] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<ReturnType<typeof runAiTriage> | null>(null)
  const [issueTitle, setIssueTitle] = useState('')
  const [issueCategory, setIssueCategory] = useState<IssueCategory>('Other')
  const [issuePriority, setIssuePriority] = useState<IssuePriority>('Medium')
  const [editedByUser, setEditedByUser] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submittedIssueNumber, setSubmittedIssueNumber] = useState('')
  const [showCauses, setShowCauses] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('assets').select('*').eq('code', code).single().then(({ data }) => {
      setAsset(data ?? null)
    })
  }, [code])

  async function handleTriage() {
    if (!complaint.trim() || !reporterName.trim() || !asset || typeof asset === 'string') return
    setTriaging(true)
    try {
      // Call Gemini API for real triage
      const response = await fetch('/api/ai/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetName: asset.name,
          assetCategory: asset.category,
          description: complaint,
        }),
      })
      
      if (!response.ok) throw new Error('Triage failed')
      
      const triageData = await response.json()
      
      // Map API response to suggestion format
      const suggestion = {
        title: triageData.maintenanceSummary,
        category: triageData.category,
        priority: triageData.priority,
        possibleCauses: triageData.possibleCauses,
        initialChecks: triageData.initialChecks,
      }
      
      setAiSuggestion(suggestion)
      setIssueTitle(suggestion.title)
      setIssueCategory(suggestion.category as IssueCategory)
      setIssuePriority(suggestion.priority as IssuePriority)
      setEditedByUser(false)
      setStep('triage')
    } catch (error) {
      console.error('[v0] Triage error:', error)
      // Fallback if API fails
      const suggestion = runAiTriage(complaint, asset)
      setAiSuggestion(suggestion)
      setIssueTitle(suggestion.title)
      setIssueCategory(suggestion.category)
      setIssuePriority(suggestion.priority)
      setEditedByUser(false)
      setStep('triage')
    } finally {
      setTriaging(false)
    }
  }

  async function handleSubmitIssue() {
    if (!asset || typeof asset === 'string') return
    setSubmitting(true)
    const { data } = await createIssue({
      asset_id: asset.id,
      title: issueTitle,
      description: complaint,
      category: issueCategory,
      priority: issuePriority,
      reporter_name: reporterName,
      reporter_contact: reporterContact,
      ai_suggested: true,
      ai_edited_by_user: editedByUser,
      possible_causes: aiSuggestion?.possibleCauses,
      initial_checks: aiSuggestion?.initialChecks,
    })
    if (data) setSubmittedIssueNumber(data.issue_number)
    setStep('submitted')
    setSubmitting(false)
  }

  if (asset === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-bold">Asset Not Found</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            The asset with code <code className="font-mono bg-muted px-1 rounded">{code}</code> does not exist.
          </p>
        </div>
      </div>
    )
  }

  const inputCls = "w-full border border-border rounded-md px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-sidebar text-sidebar-foreground px-4 py-3 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-primary" />
        <span className="font-bold text-sm">MaintainIQ</span>
        <span className="text-sidebar-foreground/40 text-sm mx-1">/</span>
        <span className="text-sm text-sidebar-foreground/70">Public Asset Page</span>
      </header>

      <div className="max-w-lg mx-auto p-5 space-y-5">
        {/* Asset card */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h1 className="text-xl font-bold leading-tight">{asset.name}</h1>
              <p className="text-sm font-mono text-muted-foreground mt-0.5">{asset.code}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-semibold border flex-shrink-0 ${statusColors[asset.status]}`}>
              {asset.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <Tag className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Category</p>
                <p className="text-sm font-medium">{asset.category}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Location</p>
                <p className="text-sm font-medium">{asset.location}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Activity className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Condition</p>
                <p className="text-sm font-medium">{asset.condition}</p>
              </div>
            </div>
            {asset.last_service_date && (
              <div className="flex items-start gap-2">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Last Service</p>
                  <p className="text-sm font-medium">{new Date(asset.last_service_date).toLocaleDateString()}</p>
                </div>
              </div>
            )}
            {asset.next_service_date && (
              <div className="flex items-start gap-2 col-span-2">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Next Service Due</p>
                  <p className="text-sm font-medium">{new Date(asset.next_service_date).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submitted success */}
        {step === 'submitted' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-green-800">Issue Submitted</h2>
            <p className="text-sm text-green-700 mt-1">Your issue has been recorded and will be reviewed by our maintenance team.</p>
            <div className="mt-4 bg-white rounded-lg p-3 border border-green-200 inline-block">
              <p className="text-xs text-green-600 font-semibold uppercase tracking-wider">Issue Number</p>
              <p className="text-xl font-bold font-mono text-green-800 mt-0.5">{submittedIssueNumber}</p>
            </div>
            <p className="text-xs text-green-600 mt-4">Keep this number to track your issue status.</p>
            <button
              onClick={() => { setStep('view'); setComplaint(''); setReporterName(''); setReporterContact(''); setAiSuggestion(null) }}
              className="mt-4 flex items-center gap-1.5 text-sm text-green-700 hover:text-green-800 mx-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Report another issue
            </button>
          </div>
        )}

        {/* Report issue button */}
        {step === 'view' && asset.status !== 'Retired' && (
          <button
            onClick={() => setStep('report')}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary/90 transition"
          >
            <AlertTriangle className="w-4 h-4" />
            Report an Issue
          </button>
        )}

        {asset.status === 'Retired' && (
          <div className="bg-muted border border-border rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground">This asset has been retired. Issue reporting is disabled.</p>
          </div>
        )}

        {/* Report form */}
        {step === 'report' && (
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <h2 className="text-lg font-bold">Report an Issue</h2>
            <p className="text-sm text-muted-foreground">Describe the problem and our AI will help structure it for faster resolution.</p>

            <div>
              <label className="block text-sm font-medium mb-1.5">Your Name <span className="text-destructive">*</span></label>
              <input type="text" value={reporterName} onChange={e => setReporterName(e.target.value)} placeholder="e.g. Ahmed Khan" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Contact (phone or email)</label>
              <input type="text" value={reporterContact} onChange={e => setReporterContact(e.target.value)} placeholder="e.g. 03001234567 or email" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Describe the Problem <span className="text-destructive">*</span></label>
              <textarea
                value={complaint}
                onChange={e => setComplaint(e.target.value)}
                placeholder="e.g. The projector display is flickering and sometimes does not detect HDMI..."
                rows={4}
                className={inputCls}
              />
              <p className="text-xs text-muted-foreground mt-1">Be as descriptive as possible. Our AI will analyze and categorize the issue.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleTriage}
                disabled={triaging || !complaint.trim() || !reporterName.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-md font-semibold text-sm hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {triaging ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing with AI...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Analyze with AI</>
                )}
              </button>
              <button onClick={() => setStep('view')} className="px-4 py-2.5 rounded-md text-sm border border-border hover:bg-muted transition">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* AI Triage result */}
        {step === 'triage' && aiSuggestion && (
          <div className="space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-primary">AI Triage Result</p>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold ml-auto">Review & Edit</span>
              </div>
              <p className="text-xs text-muted-foreground">The AI has analyzed your complaint. Review the suggestions below and edit any field before submitting.</p>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Issue Title</label>
                <input
                  type="text"
                  value={issueTitle}
                  onChange={e => { setIssueTitle(e.target.value); setEditedByUser(true) }}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Category</label>
                  <select value={issueCategory} onChange={e => { setIssueCategory(e.target.value as IssueCategory); setEditedByUser(true) }} className={inputCls}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Priority</label>
                  <select
                    value={issuePriority}
                    onChange={e => { setIssuePriority(e.target.value as IssuePriority); setEditedByUser(true) }}
                    className={`${inputCls} ${issuePriority === 'Critical' ? 'border-red-400 text-red-600' : issuePriority === 'High' ? 'border-orange-400' : ''}`}
                  >
                    {['Low', 'Medium', 'High', 'Critical'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Possible causes collapsible */}
              <div className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowCauses(s => !s)}
                  className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/60 transition text-sm font-medium"
                >
                  <span>AI Analysis Details</span>
                  {showCauses ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showCauses && (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Possible Causes</p>
                      <ul className="space-y-1.5">
                        {aiSuggestion.possibleCauses.map((c, i) => (
                          <li key={i} className="text-xs flex items-start gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Initial Checks</p>
                      <ul className="space-y-1.5">
                        {aiSuggestion.initialChecks.map((c, i) => (
                          <li key={i} className="text-xs flex items-start gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSubmitIssue}
                  disabled={submitting || !issueTitle.trim()}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-md font-semibold text-sm hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Submit Issue
                </button>
                <button onClick={() => setStep('report')} className="px-4 py-2.5 rounded-md text-sm border border-border hover:bg-muted transition">
                  Back
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
