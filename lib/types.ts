export type UserRole = 'admin' | 'technician'

export type AssetStatus =
  | 'Operational'
  | 'Issue Reported'
  | 'Under Inspection'
  | 'Under Maintenance'
  | 'Out of Service'
  | 'Retired'

export type AssetCategory =
  | 'HVAC'
  | 'Electrical'
  | 'Plumbing'
  | 'IT Equipment'
  | 'Furniture'
  | 'Vehicle'
  | 'Generator'
  | 'Fire Safety'
  | 'Security'
  | 'Other'

export type AssetCondition = 'Good' | 'Fair' | 'Poor' | 'Critical'

export type IssueStatus =
  | 'Reported'
  | 'Assigned'
  | 'Inspection Started'
  | 'Maintenance In Progress'
  | 'Waiting for Parts'
  | 'Resolved'
  | 'Closed'
  | 'Reopened'

export type IssuePriority = 'Low' | 'Medium' | 'High' | 'Critical'

export type IssueCategory =
  | 'Mechanical'
  | 'Electrical'
  | 'Plumbing'
  | 'Leakage'
  | 'Performance'
  | 'Safety'
  | 'Connectivity'
  | 'Structural'
  | 'Other'

export interface Profile {
  id: string
  name: string
  role: UserRole
  created_at: string
  email?: string // joined from auth.users when needed
}

export interface Asset {
  id: string
  code: string
  name: string
  category: AssetCategory
  location: string
  model?: string
  serial_number?: string
  condition: AssetCondition
  status: AssetStatus
  assigned_technician_id?: string
  purchase_date?: string
  last_service_date?: string
  next_service_date?: string
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Issue {
  id: string
  issue_number: string
  asset_id: string
  title: string
  description: string
  category: IssueCategory
  priority: IssuePriority
  status: IssueStatus
  reporter_name: string
  reporter_contact: string
  assigned_technician_id?: string
  inspection_findings?: string
  work_performed?: string
  parts_used?: string
  cost?: number
  time_spent?: number
  final_condition?: string
  completed_at?: string
  ai_suggested: boolean
  ai_edited_by_user: boolean
  possible_causes?: string[]
  initial_checks?: string[]
  recurring_warning?: string
  maintenance_summary?: string
  created_at: string
  updated_at: string
  resolved_at?: string
}

export interface HistoryEntry {
  id: string
  asset_id: string
  issue_id?: string
  actor: string
  action: string
  details: string
  created_at: string
}
