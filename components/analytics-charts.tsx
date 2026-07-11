'use client'

import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { Asset, Issue } from '@/lib/types'

interface AnalyticsChartsProps {
  assets: Asset[]
  issues: Issue[]
}

export default function AnalyticsCharts({ assets, issues }: AnalyticsChartsProps) {
  // Issue trend (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

  const issueTrendData = last7Days.map(date => {
    const count = issues.filter(
      i =>
        new Date(i.created_at).toISOString().split('T')[0] === date &&
        !['Resolved', 'Closed'].includes(i.status),
    ).length
    return { date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), issues: count }
  })

  // Priority distribution
  const priorityData = [
    { name: 'Critical', value: issues.filter(i => i.priority === 'Critical').length, fill: '#dc2626' },
    { name: 'High', value: issues.filter(i => i.priority === 'High').length, fill: '#ea580c' },
    { name: 'Medium', value: issues.filter(i => i.priority === 'Medium').length, fill: '#eab308' },
    { name: 'Low', value: issues.filter(i => i.priority === 'Low').length, fill: '#22c55e' },
  ]

  // Asset condition by category
  const categoryData = Array.from(
    new Map(
      assets.map(a => [
        a.category,
        { category: a.category, good: 0, fair: 0, poor: 0, critical: 0 },
      ]),
    ).values(),
  )

  assets.forEach(a => {
    const cat = categoryData.find(c => c.category === a.category)
    if (cat) {
      if (a.condition === 'Good') cat.good++
      else if (a.condition === 'Fair') cat.fair++
      else if (a.condition === 'Poor') cat.poor++
      else if (a.condition === 'Critical') cat.critical++
    }
  })

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Issue Trend */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold text-sm mb-4">Open Issues (Last 7 Days)</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={issueTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--muted-foreground)" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
            />
            <Line type="monotone" dataKey="issues" stroke="var(--primary)" strokeWidth={2} dot={{ fill: 'var(--primary)' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Priority Distribution */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold text-sm mb-4">Issues by Priority</h2>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={priorityData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {priorityData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Asset Health by Category */}
      {categoryData.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 lg:col-span-2">
          <h2 className="font-semibold text-sm mb-4">Asset Condition by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="category" stroke="var(--muted-foreground)" fontSize={12} angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="good" stackId="a" fill="#22c55e" name="Good" />
              <Bar dataKey="fair" stackId="a" fill="#eab308" name="Fair" />
              <Bar dataKey="poor" stackId="a" fill="#ea580c" name="Poor" />
              <Bar dataKey="critical" stackId="a" fill="#dc2626" name="Critical" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
