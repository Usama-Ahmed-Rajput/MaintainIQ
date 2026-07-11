'use client'

import type { AppData, Asset, Issue, HistoryEntry, User } from './types'

const STORAGE_KEY = 'maintainiq_data'

function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

function generateAssetCode(category: string): string {
  const prefix = category.toUpperCase().slice(0, 3).replace(/\s/g, '')
  return `${prefix}-${Date.now().toString(36).toUpperCase().slice(-5)}`
}

function generateIssueNumber(): string {
  return `ISS-${Date.now().toString(36).toUpperCase().slice(-6)}`
}

const SEED_DATA: AppData = {
  users: [
    {
      id: 'admin-001',
      name: 'Admin User',
      email: 'admin@maintainiq.com',
      password: 'admin123',
      role: 'admin',
      createdAt: new Date('2025-01-01').toISOString(),
    },
    {
      id: 'tech-001',
      name: 'Ali Hassan',
      email: 'ali@maintainiq.com',
      password: 'tech123',
      role: 'technician',
      createdAt: new Date('2025-01-05').toISOString(),
    },
    {
      id: 'tech-002',
      name: 'Sara Ahmed',
      email: 'sara@maintainiq.com',
      password: 'tech123',
      role: 'technician',
      createdAt: new Date('2025-01-06').toISOString(),
    },
  ],
  assets: [
    {
      id: 'asset-001',
      code: 'ITE-A1B2C',
      name: 'Classroom Projector 01',
      category: 'IT Equipment',
      location: 'Room 101, Block A',
      model: 'Epson EB-S41',
      serialNumber: 'SN-PRJ-2023-001',
      condition: 'Fair',
      status: 'Operational',
      assignedTechnicianId: 'tech-001',
      purchaseDate: '2023-03-15',
      lastServiceDate: '2024-09-10',
      nextServiceDate: '2025-09-10',
      createdAt: new Date('2025-01-10').toISOString(),
      updatedAt: new Date('2025-01-10').toISOString(),
    },
    {
      id: 'asset-002',
      code: 'HVA-D3E4F',
      name: 'AC Unit - Lab 3',
      category: 'HVAC',
      location: 'Lab 3, Block B',
      model: 'Daikin 1.5 Ton',
      condition: 'Good',
      status: 'Operational',
      assignedTechnicianId: 'tech-002',
      lastServiceDate: '2025-02-01',
      nextServiceDate: '2025-08-01',
      createdAt: new Date('2025-01-12').toISOString(),
      updatedAt: new Date('2025-01-12').toISOString(),
    },
    {
      id: 'asset-003',
      code: 'ELE-G5H6I',
      name: 'Main Generator',
      category: 'Generator',
      location: 'Utility Room, Ground Floor',
      model: 'Perkins 50kVA',
      condition: 'Good',
      status: 'Issue Reported',
      assignedTechnicianId: 'tech-001',
      lastServiceDate: '2024-12-15',
      nextServiceDate: '2025-06-15',
      createdAt: new Date('2025-01-08').toISOString(),
      updatedAt: new Date('2025-06-01').toISOString(),
    },
    {
      id: 'asset-004',
      code: 'PLU-J7K8L',
      name: 'Washroom Pump - Block C',
      category: 'Plumbing',
      location: 'Basement, Block C',
      condition: 'Poor',
      status: 'Under Maintenance',
      assignedTechnicianId: 'tech-002',
      lastServiceDate: '2024-11-20',
      createdAt: new Date('2025-01-15').toISOString(),
      updatedAt: new Date('2025-06-05').toISOString(),
    },
    {
      id: 'asset-005',
      code: 'FIR-M9N0O',
      name: 'Fire Alarm Panel - Main',
      category: 'Fire Safety',
      location: 'Reception, Ground Floor',
      model: 'Notifier NFS2-3030',
      condition: 'Good',
      status: 'Operational',
      lastServiceDate: '2025-03-01',
      nextServiceDate: '2025-09-01',
      createdAt: new Date('2025-01-20').toISOString(),
      updatedAt: new Date('2025-01-20').toISOString(),
    },
  ],
  issues: [
    {
      id: 'issue-001',
      issueNumber: 'ISS-A1B2C3',
      assetId: 'asset-003',
      title: 'Generator failing to start under load',
      description: 'The generator starts normally but shuts down when load exceeds 30kW. Occurred twice this week.',
      category: 'Mechanical',
      priority: 'High',
      status: 'Assigned',
      reporterName: 'Kamran Malik',
      reporterContact: 'kamran@school.edu',
      assignedTechnicianId: 'tech-001',
      aiSuggested: true,
      aiEditedByUser: false,
      possibleCauses: ['Fuel supply issue', 'Faulty automatic voltage regulator', 'Overloaded circuit'],
      initialChecks: ['Check fuel level and filter', 'Inspect AVR connections', 'Verify load distribution'],
      createdAt: new Date('2025-06-01').toISOString(),
      updatedAt: new Date('2025-06-02').toISOString(),
    },
    {
      id: 'issue-002',
      issueNumber: 'ISS-D4E5F6',
      assetId: 'asset-004',
      title: 'Water pump making unusual noise and weak pressure',
      description: 'Pump is producing grinding noise and water pressure in Block C has dropped significantly.',
      category: 'Mechanical',
      priority: 'Critical',
      status: 'Maintenance In Progress',
      reporterName: 'Fatima Khan',
      reporterContact: '03001234567',
      assignedTechnicianId: 'tech-002',
      aiSuggested: true,
      aiEditedByUser: true,
      possibleCauses: ['Worn bearings', 'Cavitation', 'Impeller damage'],
      initialChecks: ['Isolate power before inspection', 'Check bearing condition', 'Inspect impeller'],
      maintenanceRecord: {
        inspectionFindings: 'Bearings are severely worn. Impeller has minor damage.',
        workPerformed: 'Replaced bearings. Impeller being ordered.',
        parts: 'Bearing set x2',
        cost: 0,
        timeSpent: 3,
        finalCondition: 'Poor',
        completedAt: '',
        technicianId: 'tech-002',
      },
      createdAt: new Date('2025-06-03').toISOString(),
      updatedAt: new Date('2025-06-05').toISOString(),
    },
  ],
  history: [
    {
      id: 'hist-001',
      assetId: 'asset-001',
      action: 'Asset Registered',
      actor: 'Admin User',
      details: 'Asset Classroom Projector 01 registered with code ITE-A1B2C.',
      createdAt: new Date('2025-01-10').toISOString(),
    },
    {
      id: 'hist-002',
      assetId: 'asset-003',
      issueId: 'issue-001',
      action: 'Issue Reported',
      actor: 'Kamran Malik',
      details: 'Issue ISS-A1B2C3: Generator failing to start under load.',
      createdAt: new Date('2025-06-01').toISOString(),
    },
    {
      id: 'hist-003',
      assetId: 'asset-003',
      issueId: 'issue-001',
      action: 'Issue Assigned',
      actor: 'Admin User',
      details: 'Issue assigned to technician Ali Hassan.',
      createdAt: new Date('2025-06-02').toISOString(),
    },
    {
      id: 'hist-004',
      assetId: 'asset-004',
      issueId: 'issue-002',
      action: 'Issue Reported',
      actor: 'Fatima Khan',
      details: 'Issue ISS-D4E5F6: Water pump making unusual noise and weak pressure.',
      createdAt: new Date('2025-06-03').toISOString(),
    },
    {
      id: 'hist-005',
      assetId: 'asset-004',
      issueId: 'issue-002',
      action: 'Inspection Started',
      actor: 'Sara Ahmed',
      details: 'Technician Sara Ahmed began inspection of the pump.',
      createdAt: new Date('2025-06-04').toISOString(),
    },
  ],
}

export function getData(): AppData {
  if (typeof window === 'undefined') return SEED_DATA
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA))
    return SEED_DATA
  }
  return JSON.parse(raw) as AppData
}

export function saveData(data: AppData): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function resetData(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA))
}

// Auth helpers
export function login(email: string, password: string): User | null {
  const data = getData()
  const user = data.users.find(u => u.email === email && u.password === password)
  if (user) {
    data.currentUserId = user.id
    saveData(data)
  }
  return user || null
}

export function logout(): void {
  const data = getData()
  data.currentUserId = undefined
  saveData(data)
}

export function getCurrentUser(): User | null {
  const data = getData()
  if (!data.currentUserId) return null
  return data.users.find(u => u.id === data.currentUserId) || null
}

export function register(name: string, email: string, password: string, role: 'admin' | 'technician'): User | null {
  const data = getData()
  if (data.users.find(u => u.email === email)) return null
  const user: User = {
    id: generateId(),
    name,
    email,
    password,
    role,
    createdAt: new Date().toISOString(),
  }
  data.users.push(user)
  data.currentUserId = user.id
  saveData(data)
  return user
}

// Asset helpers
export function createAsset(asset: Omit<Asset, 'id' | 'code' | 'createdAt' | 'updatedAt'>): Asset {
  const data = getData()
  const code = generateAssetCode(asset.category)
  if (data.assets.find(a => a.code === code)) {
    return createAsset(asset) // retry on collision
  }
  const newAsset: Asset = {
    ...asset,
    id: generateId(),
    code,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  data.assets.push(newAsset)
  addHistory(data, {
    assetId: newAsset.id,
    actor: getCurrentUser()?.name || 'System',
    action: 'Asset Registered',
    details: `Asset ${newAsset.name} registered with code ${newAsset.code}.`,
  })
  saveData(data)
  return newAsset
}

export function updateAsset(id: string, updates: Partial<Asset>): Asset | null {
  const data = getData()
  const idx = data.assets.findIndex(a => a.id === id)
  if (idx === -1) return null
  data.assets[idx] = { ...data.assets[idx], ...updates, updatedAt: new Date().toISOString() }
  addHistory(data, {
    assetId: id,
    actor: getCurrentUser()?.name || 'System',
    action: 'Asset Updated',
    details: `Asset details updated.`,
  })
  saveData(data)
  return data.assets[idx]
}

export function getAssetByCode(code: string): Asset | null {
  const data = getData()
  return data.assets.find(a => a.code === code) || null
}

// Issue helpers
export function createIssue(issue: Omit<Issue, 'id' | 'issueNumber' | 'createdAt' | 'updatedAt'>): Issue {
  const data = getData()
  const newIssue: Issue = {
    ...issue,
    id: generateId(),
    issueNumber: generateIssueNumber(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  data.issues.push(newIssue)
  // Update asset status
  const assetIdx = data.assets.findIndex(a => a.id === issue.assetId)
  if (assetIdx !== -1) {
    data.assets[assetIdx].status = 'Issue Reported'
    data.assets[assetIdx].updatedAt = new Date().toISOString()
  }
  addHistory(data, {
    assetId: issue.assetId,
    issueId: newIssue.id,
    actor: issue.reporterName,
    action: 'Issue Reported',
    details: `Issue ${newIssue.issueNumber}: ${newIssue.title}.`,
  })
  saveData(data)
  return newIssue
}

export function updateIssue(id: string, updates: Partial<Issue>, actorName?: string): Issue | null {
  const data = getData()
  const idx = data.issues.findIndex(i => i.id === id)
  if (idx === -1) return null
  const old = data.issues[idx]
  data.issues[idx] = { ...old, ...updates, updatedAt: new Date().toISOString() }

  const actor = actorName || getCurrentUser()?.name || 'System'
  const newStatus = updates.status

  if (newStatus && newStatus !== old.status) {
    // Update asset status based on issue status
    const assetIdx = data.assets.findIndex(a => a.id === old.assetId)
    if (assetIdx !== -1) {
      const statusMap: Record<string, Asset['status']> = {
        Assigned: 'Issue Reported',
        'Inspection Started': 'Under Inspection',
        'Maintenance In Progress': 'Under Maintenance',
        'Waiting for Parts': 'Under Maintenance',
        Resolved: 'Operational',
        Closed: 'Operational',
        Reopened: 'Issue Reported',
      }
      if (statusMap[newStatus]) {
        data.assets[assetIdx].status = statusMap[newStatus]
        data.assets[assetIdx].updatedAt = new Date().toISOString()
      }
    }
    addHistory(data, {
      assetId: old.assetId,
      issueId: id,
      actor,
      action: `Status Changed to ${newStatus}`,
      details: `Issue ${old.issueNumber} status changed from ${old.status} to ${newStatus}.`,
    })
  }
  saveData(data)
  return data.issues[idx]
}

// History helper (internal)
function addHistory(data: AppData, entry: Omit<HistoryEntry, 'id' | 'createdAt'>): void {
  data.history.push({
    ...entry,
    id: generateId(),
    createdAt: new Date().toISOString(),
  })
}

export function addHistoryEntry(entry: Omit<HistoryEntry, 'id' | 'createdAt'>): void {
  const data = getData()
  addHistory(data, entry)
  saveData(data)
}

export function getTechnicians(): User[] {
  return getData().users.filter(u => u.role === 'technician')
}

export function getPublicAssetUrl(code: string): string {
  if (typeof window === 'undefined') return `/asset/${code}`
  return `${window.location.origin}/asset/${code}`
}
