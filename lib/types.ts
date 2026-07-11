export type UserRole = 'admin' | 'technician'

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: UserRole
  createdAt: string
}

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

export interface Asset {
  id: string
  code: string
  name: string
  category: AssetCategory
  location: string
  model?: string
  serialNumber?: string
  condition: 'Good' | 'Fair' | 'Poor' | 'Critical'
  status: AssetStatus
  assignedTechnicianId?: string
  purchaseDate?: string
  lastServiceDate?: string
  nextServiceDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

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

export interface MaintenanceRecord {
  inspectionFindings: string
  workPerformed: string
  parts: string
  cost: number
  timeSpent: number
  finalCondition: Asset['condition']
  completedAt: string
  technicianId: string
}

export interface Issue {
  id: string
  issueNumber: string
  assetId: string
  title: string
  description: string
  category: IssueCategory
  priority: IssuePriority
  status: IssueStatus
  reporterName: string
  reporterContact: string
  assignedTechnicianId?: string
  maintenanceRecord?: MaintenanceRecord
  aiSuggested: boolean
  aiEditedByUser: boolean
  possibleCauses?: string[]
  initialChecks?: string[]
  recurringWarning?: string
  maintenanceSummary?: string
  evidenceUrl?: string
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

export interface HistoryEntry {
  id: string
  assetId: string
  issueId?: string
  actor: string
  action: string
  details: string
  createdAt: string
}

export interface AppData {
  users: User[]
  assets: Asset[]
  issues: Issue[]
  history: HistoryEntry[]
  currentUserId?: string
}
