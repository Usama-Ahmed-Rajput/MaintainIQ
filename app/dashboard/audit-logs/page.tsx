'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/app-shell'
import { getAuditLogs } from '@/lib/actions'
import type { HistoryEntry } from '@/lib/types'
import { Shield, Search, Filter, Download } from 'lucide-react'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<HistoryEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterActor, setFilterActor] = useState('')

  useEffect(() => {
    getAuditLogs().then(data => {
      setLogs(data)
      setFilteredLogs(data)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    let filtered = logs

    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(
        log =>
          log.actor?.toLowerCase().includes(q) ||
          log.action?.toLowerCase().includes(q) ||
          log.details?.toLowerCase().includes(q),
      )
    }

    if (filterActor) {
      filtered = filtered.filter(log => log.actor === filterActor)
    }

    setFilteredLogs(filtered)
  }, [search, filterActor, logs])

  const actors = Array.from(new Set(logs.map(l => l.actor)))

  const downloadCSV = () => {
    const headers = ['Timestamp', 'Actor', 'Action', 'Details']
    const rows = filteredLogs.map(log => [
      new Date(log.created_at).toLocaleString(),
      log.actor,
      log.action,
      log.details,
    ])

    let csv = headers.join(',') + '\n'
    rows.forEach(row => {
      csv += row.map(cell => `"${cell}"`).join(',') + '\n'
    })

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <AppShell requireRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Audit Logs
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Track all administrative actions and system events.</p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by actor, action, or details..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-border rounded-lg bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={filterActor}
            onChange={e => setFilterActor(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Admins</option>
            {actors.map(actor => (
              <option key={actor} value={actor}>
                {actor}
              </option>
            ))}
          </select>
          <button
            onClick={downloadCSV}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition text-sm font-medium flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Logs Table */}
        {loading ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground mt-2">Loading audit logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No audit logs found.</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Timestamp</th>
                    <th className="text-left px-4 py-3 font-semibold">Admin</th>
                    <th className="text-left px-4 py-3 font-semibold">Action</th>
                    <th className="text-left px-4 py-3 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-muted/50 transition">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-medium">{log.actor}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-1 rounded bg-primary/10 text-primary text-xs font-semibold">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs text-muted-foreground truncate">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-muted/30 border-t border-border text-xs text-muted-foreground">
              Showing {filteredLogs.length} of {logs.length} audit entries
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
