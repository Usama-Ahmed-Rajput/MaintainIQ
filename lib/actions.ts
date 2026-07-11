'use client'
// Client-side Supabase data helpers used by page components

import { createClient } from '@/lib/supabase/client'
import type {
  Profile, Asset, Issue, HistoryEntry,
  AssetStatus, AssetCondition, AssetCategory,
  IssuePriority, IssueCategory, IssueStatus,
} from '@/lib/types'

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function getSession() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  return data ? { ...data, email: user.email } : null
}

export async function signIn(email: string, password: string) {
  const supabase = createClient()
  return supabase.auth.signInWithPassword({ email, password })
}

// signUp goes through the API route so the server can enforce:
// - only 1 admin ever allowed
// - admin invite code verification
export async function signUp(
  name: string,
  email: string,
  password: string,
  role: 'admin' | 'technician',
  inviteCode?: string,
): Promise<{ error: string | null; message: string | null }> {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role, inviteCode }),
  })
  const json = await res.json()
  if (!res.ok) return { error: json.error ?? 'Signup failed.', message: null }
  return { error: null, message: json.message }
}

export async function signOut() {
  const supabase = createClient()
  return supabase.auth.signOut()
}

// ─── Profiles ────────────────────────────────────────────────────────────────

export async function getTechnicians(): Promise<Profile[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'technician')
    .order('name')
  return data ?? []
}

export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = createClient()
  const { data } = await supabase.from('profiles').select('*').order('name')
  return data ?? []
}

// ─── Assets ──────────────────────────────────────────────────────────────────

function generateAssetCode(category: AssetCategory): string {
  const prefix: Record<string, string> = {
    HVAC: 'HVAC', Electrical: 'ELEC', Plumbing: 'PLMB',
    'IT Equipment': 'ITE', Furniture: 'FURN', Vehicle: 'VEH',
    Generator: 'GEN', 'Fire Safety': 'FIRE', Security: 'SEC', Other: 'OTH',
  }
  const p = prefix[category] || 'AST'
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `${p}-${rand}`
}

export async function getAssets(): Promise<Asset[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('assets')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getAssetById(id: string): Promise<Asset | null> {
  const supabase = createClient()
  const { data } = await supabase.from('assets').select('*').eq('id', id).single()
  return data
}

export async function getAssetByCode(code: string): Promise<Asset | null> {
  const supabase = createClient()
  const { data } = await supabase.from('assets').select('*').eq('code', code).single()
  return data
}

export async function createAsset(input: {
  name: string
  category: AssetCategory
  location: string
  model?: string
  serial_number?: string
  condition: AssetCondition
  status?: AssetStatus
  assigned_technician_id?: string
  purchase_date?: string
  last_service_date?: string
  next_service_date?: string
  notes?: string
}): Promise<{ data: Asset | null; error: string | null }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const code = generateAssetCode(input.category)
  const { data, error } = await supabase
    .from('assets')
    .insert({
      ...input,
      code,
      status: input.status ?? 'Operational',
      created_by: user?.id,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  // Log history
  if (data) {
    const profile = await getProfile()
    await supabase.from('history_entries').insert({
      asset_id: data.id,
      actor: profile?.name ?? 'Admin',
      action: 'Asset Registered',
      details: `${data.name} (${data.code}) registered at ${data.location}`,
    })
  }

  return { data, error: null }
}

export async function updateAsset(
  id: string,
  updates: Partial<Asset>,
  actorName?: string,
): Promise<{ data: Asset | null; error: string | null }> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('assets')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  if (data && actorName) {
    await supabase.from('history_entries').insert({
      asset_id: id,
      actor: actorName,
      action: 'Asset Updated',
      details: `Details updated by ${actorName}`,
    })
  }

  return { data, error: null }
}

export function getPublicAssetUrl(code: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/asset/${code}`
  }
  return `/asset/${code}`
}

// ─── Issues ──────────────────────────────────────────────────────────────────

function generateIssueNumber(): string {
  const now = new Date()
  const yy = now.getFullYear().toString().slice(2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `IQ-${yy}${mm}-${rand}`
}

export async function getIssues(): Promise<Issue[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('issues')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getIssueById(id: string): Promise<Issue | null> {
  const supabase = createClient()
  const { data } = await supabase.from('issues').select('*').eq('id', id).single()
  return data
}

export async function getIssuesByAsset(assetId: string): Promise<Issue[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('issues')
    .select('*')
    .eq('asset_id', assetId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getIssuesByTechnician(techId: string): Promise<Issue[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('issues')
    .select('*')
    .eq('assigned_technician_id', techId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function createIssue(input: {
  asset_id: string
  title: string
  description: string
  category: IssueCategory
  priority: IssuePriority
  reporter_name: string
  reporter_contact: string
  ai_suggested?: boolean
  ai_edited_by_user?: boolean
  possible_causes?: string[]
  initial_checks?: string[]
  recurring_warning?: string
}): Promise<{ data: Issue | null; error: string | null }> {
  const supabase = createClient()
  const issue_number = generateIssueNumber()

  const { data, error } = await supabase
    .from('issues')
    .insert({
      ...input,
      issue_number,
      status: 'Reported',
      ai_suggested: input.ai_suggested ?? false,
      ai_edited_by_user: input.ai_edited_by_user ?? false,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  // Update asset status to 'Issue Reported'
  if (data) {
    await supabase
      .from('assets')
      .update({ status: 'Issue Reported' })
      .eq('id', input.asset_id)
      .eq('status', 'Operational') // only change if currently operational

    await supabase.from('history_entries').insert({
      asset_id: input.asset_id,
      issue_id: data.id,
      actor: input.reporter_name,
      action: 'Issue Reported',
      details: `"${data.title}" reported by ${input.reporter_name}. Priority: ${input.priority}.`,
    })
  }

  return { data, error: null }
}

export async function updateIssue(
  id: string,
  updates: Partial<Issue>,
  actorName?: string,
): Promise<{ data: Issue | null; error: string | null }> {
  const supabase = createClient()

  // Set resolved_at when resolving
  if (updates.status === 'Resolved' && !updates.resolved_at) {
    updates.resolved_at = new Date().toISOString()
  }
  if (updates.status === 'Closed') {
    updates.completed_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('issues')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  if (data && updates.status && actorName) {
    // Update asset status based on issue status
    const assetStatusMap: Partial<Record<IssueStatus, AssetStatus>> = {
      Assigned: 'Issue Reported',
      'Inspection Started': 'Under Inspection',
      'Maintenance In Progress': 'Under Maintenance',
      'Waiting for Parts': 'Under Maintenance',
      Resolved: 'Operational',
      Closed: 'Operational',
      Reopened: 'Issue Reported',
    }
    const newAssetStatus = assetStatusMap[updates.status]
    if (newAssetStatus) {
      await supabase
        .from('assets')
        .update({ status: newAssetStatus })
        .eq('id', data.asset_id)
    }

    await supabase.from('history_entries').insert({
      asset_id: data.asset_id,
      issue_id: id,
      actor: actorName,
      action: `Status → ${updates.status}`,
      details: `Issue "${data.title}" moved to ${updates.status} by ${actorName}`,
    })
  }

  return { data, error: null }
}

export async function assignIssue(
  id: string,
  technicianId: string,
  technicianName: string,
  actorName: string,
): Promise<{ data: Issue | null; error: string | null }> {
  return updateIssue(
    id,
    { assigned_technician_id: technicianId, status: 'Assigned' },
    actorName,
  )
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────
// Using history_entries table with action='Admin Action' for audit trail

export async function logAdminAction(
  adminName: string,
  action: string,
  details: string,
): Promise<void> {
  const supabase = createClient()
  await supabase.from('history_entries').insert({
    asset_id: '00000000-0000-0000-0000-000000000000', // dummy UUID for system events
    actor: adminName,
    action: `[AUDIT] ${action}`,
    details,
  })
}

export async function getAuditLogs(): Promise<HistoryEntry[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('history_entries')
    .select('*')
    .like('action', '%AUDIT%')
    .order('created_at', { ascending: false })
  return data ?? []
}

// ─── History ──────────────────────────────────────────────────────────────────

export async function getHistory(): Promise<HistoryEntry[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('history_entries')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getHistoryByAsset(assetId: string): Promise<HistoryEntry[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('history_entries')
    .select('*')
    .eq('asset_id', assetId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function addHistoryEntry(entry: {
  asset_id: string
  issue_id?: string
  actor: string
  action: string
  details: string
}): Promise<void> {
  const supabase = createClient()
  await supabase.from('history_entries').insert(entry)
}

// ─── AI Triage (rule-based, no API key) ─────────────────────────────────────

export interface AiSuggestion {
  title: string
  category: IssueCategory
  priority: IssuePriority
  possibleCauses: string[]
  initialChecks: string[]
  recurringWarning?: string
}

export function runAiTriage(complaint: string, asset: Asset): AiSuggestion {
  const text = complaint.toLowerCase()
  let category: IssueCategory = 'Other'
  let priority: IssuePriority = 'Medium'
  const causes: string[] = []
  const checks: string[] = []
  let title = 'Issue reported with ' + asset.name

  if (text.includes('leak') || text.includes('water') || text.includes('drip')) {
    category = 'Leakage'; priority = 'High'
    title = 'Water leakage detected on ' + asset.name
    causes.push('Blocked drain pipe', 'Loose pipe fitting', 'Corroded seal')
    checks.push('Turn off water supply if near electrical wiring', 'Inspect drainage and seals', 'Check for pipe corrosion')
  } else if (text.includes('electric') || text.includes('spark') || text.includes('shock') || text.includes('tripping') || text.includes('short')) {
    category = 'Electrical'; priority = 'Critical'
    title = 'Electrical fault reported on ' + asset.name
    causes.push('Short circuit', 'Overloaded circuit', 'Damaged wiring')
    checks.push('Do not touch exposed wiring', 'Trip the circuit breaker', 'Contact a qualified electrician immediately')
  } else if (text.includes('noise') || text.includes('sound') || text.includes('vibrat') || text.includes('grinding') || text.includes('rattl')) {
    category = 'Mechanical'; priority = 'High'
    title = 'Abnormal noise or vibration from ' + asset.name
    causes.push('Worn bearings', 'Loose components', 'Imbalanced rotor')
    checks.push('Check for loose bolts', 'Inspect bearings', 'Stop operation if noise is severe')
  } else if (text.includes('cool') || text.includes('heat') || text.includes('temperature') || text.includes('ac') || text.includes('air')) {
    category = 'Performance'; priority = 'Medium'
    title = 'HVAC performance issue on ' + asset.name
    causes.push('Dirty air filter', 'Low refrigerant', 'Blocked vents')
    checks.push('Check and replace air filter', 'Inspect vents for blockage', 'Check refrigerant level')
  } else if (text.includes('display') || text.includes('screen') || text.includes('flicker') || text.includes('hdmi') || text.includes('projector') || text.includes('monitor')) {
    category = 'Connectivity'; priority = 'Medium'
    title = 'Display or connectivity issue on ' + asset.name
    causes.push('Damaged HDMI cable', 'Faulty display port', 'Driver conflict')
    checks.push('Replace HDMI cable and test', 'Check display settings', 'Restart device and retry connection')
  } else if (text.includes('network') || text.includes('internet') || text.includes('wifi') || text.includes('connect')) {
    category = 'Connectivity'; priority = 'Medium'
    title = 'Network connectivity issue on ' + asset.name
    causes.push('Router misconfiguration', 'Damaged network cable', 'IP conflict')
    checks.push('Restart network device', 'Check cable connections', 'Verify IP configuration')
  } else if (text.includes('not start') || text.includes('power') || text.includes('dead') || text.includes('off')) {
    category = 'Electrical'; priority = 'High'
    title = 'Device not starting or power failure on ' + asset.name
    causes.push('Power supply failure', 'Blown fuse', 'Tripped breaker')
    checks.push('Check power supply connections', 'Inspect fuses', 'Check circuit breaker panel')
  } else if (text.includes('crack') || text.includes('broken') || text.includes('structural') || text.includes('wall') || text.includes('ceiling')) {
    category = 'Structural'; priority = 'High'
    title = 'Structural damage observed on ' + asset.name
    causes.push('Foundation settling', 'Water damage', 'Impact damage')
    checks.push('Do not occupy the area if unsafe', 'Document cracks with photos', 'Request structural assessment')
  } else if (text.includes('slow') || text.includes('performance') || text.includes('hang') || text.includes('lag')) {
    category = 'Performance'; priority = 'Low'
    title = 'Performance degradation on ' + asset.name
    causes.push('Insufficient memory or storage', 'Background processes consuming resources', 'Hardware wear')
    checks.push('Check available memory and storage', 'Restart the device', 'Review running processes')
  } else {
    causes.push('Unknown root cause – requires inspection', 'Possible wear and tear', 'Misconfiguration or operator error')
    checks.push('Perform a visual inspection', 'Document symptoms clearly', 'Consult the equipment manual')
  }

  if (asset.condition === 'Critical' || asset.condition === 'Poor') {
    if (priority === 'Low') priority = 'Medium'
    else if (priority === 'Medium') priority = 'High'
  }
  if (text.includes('urgent') || text.includes('danger') || text.includes('hazard') || text.includes('fire') || text.includes('smoke')) {
    priority = 'Critical'
  }

  return { title, category, priority, possibleCauses: causes, initialChecks: checks }
}

export function generateMaintenanceSummary(
  issue: Issue,
  asset: Asset,
  techName: string,
): string {
  return `Maintenance completed for ${asset.name} (${asset.code}) on ${new Date().toLocaleDateString()}. Issue: "${issue.title}". Category: ${issue.category}. Inspection findings: ${issue.inspection_findings ?? 'N/A'}. Work performed: ${issue.work_performed ?? 'N/A'}. ${issue.parts_used ? `Parts replaced/used: ${issue.parts_used}.` : ''} Total time: ${issue.time_spent ?? 0} hours. Cost: PKR ${issue.cost ?? 0}. Asset condition post-maintenance: ${issue.final_condition ?? 'Good'}. Technician: ${techName}.${issue.next_service_date ? ` Next service scheduled for ${new Date(issue.next_service_date).toLocaleDateString()}.` : ''}`
}
