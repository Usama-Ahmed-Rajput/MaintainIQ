'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/app-shell'
import { getAssets } from '@/lib/actions'
import type { Asset } from '@/lib/types'
import { AlertTriangle, Zap, Clock, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

type AlertType = 'critical' | 'overdue' | 'due_soon' | 'due_later'

interface Alert {
  type: AlertType
  asset: Asset
  daysFromNow: number
  message: string
}

export default function AlertsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<AlertType | 'All'>('All')

  useEffect(() => {
    getAssets().then(data => {
      setAssets(data)

      const now = new Date()
      const allAlerts: Alert[] = []

      data.forEach(asset => {
        // Critical condition alert
        if (asset.condition === 'Critical') {
          allAlerts.push({
            type: 'critical',
            asset,
            daysFromNow: 0,
            message: `${asset.name} is in CRITICAL condition and needs immediate attention.`,
          })
        }

        // Service date alerts
        if (asset.next_service_date) {
          const serviceDate = new Date(asset.next_service_date)
          const daysUntil = Math.ceil((serviceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

          if (daysUntil < 0) {
            allAlerts.push({
              type: 'overdue',
              asset,
              daysFromNow: daysUntil,
              message: `${asset.name} is ${Math.abs(daysUntil)} days OVERDUE for maintenance.`,
            })
          } else if (daysUntil <= 7) {
            allAlerts.push({
              type: 'due_soon',
              asset,
              daysFromNow: daysUntil,
              message: `${asset.name} is due for service in ${daysUntil} days.`,
            })
          } else if (daysUntil <= 30) {
            allAlerts.push({
              type: 'due_later',
              asset,
              daysFromNow: daysUntil,
              message: `${asset.name} is due for service in ${daysUntil} days.`,
            })
          }
        }
      })

      // Sort by severity
      allAlerts.sort((a, b) => {
        const severity = { critical: 0, overdue: 1, due_soon: 2, due_later: 3 }
        return severity[a.type] - severity[b.type]
      })

      setAlerts(allAlerts)
      setLoading(false)
    })
  }, [])

  const filteredAlerts = filterType === 'All' ? alerts : alerts.filter(a => a.type === filterType)

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'overdue':
        return <Zap className="w-5 h-5 text-red-500" />
      case 'due_soon':
        return <Clock className="w-5 h-5 text-orange-500" />
      case 'due_later':
        return <Clock className="w-5 h-5 text-yellow-500" />
    }
  }

  const getAlertColor = (type: AlertType) => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 border-red-200 hover:bg-red-100/50'
      case 'overdue':
        return 'bg-orange-50 border-orange-200 hover:bg-orange-100/50'
      case 'due_soon':
        return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100/50'
      case 'due_later':
        return 'bg-blue-50 border-blue-200 hover:bg-blue-100/50'
    }
  }

  return (
    <AppShell requireRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            Maintenance Alerts
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Track assets requiring maintenance or service.</p>
        </div>

        {/* Alert Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Critical', count: alerts.filter(a => a.type === 'critical').length, icon: AlertTriangle, color: 'text-red-600' },
            { label: 'Overdue', count: alerts.filter(a => a.type === 'overdue').length, icon: Zap, color: 'text-red-500' },
            { label: 'Due Soon', count: alerts.filter(a => a.type === 'due_soon').length, icon: Clock, color: 'text-orange-500' },
            { label: 'Scheduled', count: alerts.filter(a => a.type === 'due_later').length, icon: CheckCircle2, color: 'text-blue-600' },
          ].map(({ label, count, icon: Icon, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-xs text-muted-foreground font-medium">{label}</span>
              </div>
              <p className="text-2xl font-bold">{count}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {(['All', 'critical', 'overdue', 'due_soon', 'due_later'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type as AlertType | 'All')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                filterType === type ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {type === 'All' ? 'All' : type.replace(/_/g, ' ').toUpperCase()}
            </button>
          ))}
        </div>

        {/* Alerts List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-3" />
            <p className="font-semibold text-lg">All systems nominal!</p>
            <p className="text-sm text-muted-foreground mt-1">No maintenance alerts at this time.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map(alert => (
              <Link
                key={`${alert.asset.id}-${alert.type}`}
                href={`/dashboard/assets/${alert.asset.id}`}
                className={`block border rounded-xl p-4 transition ${getAlertColor(alert.type)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1">{alert.asset.name}</h3>
                    <p className="text-sm mb-2">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">
                      Code: {alert.asset.code} • Location: {alert.asset.location}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-sm font-semibold text-muted-foreground">
                      {alert.daysFromNow >= 0 ? `${alert.daysFromNow}d` : `${Math.abs(alert.daysFromNow)}d ago`}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
