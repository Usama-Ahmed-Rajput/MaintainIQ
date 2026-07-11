'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, logout } from '@/lib/store'
import type { User } from '@/lib/types'
import {
  LayoutDashboard,
  Package,
  AlertCircle,
  Clock,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
  Wrench,
  Users,
} from 'lucide-react'

const adminNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/assets', label: 'Assets', icon: Package },
  { href: '/dashboard/issues', label: 'Issues', icon: AlertCircle },
  { href: '/dashboard/history', label: 'History', icon: Clock },
]

const techNav = [
  { href: '/technician', label: 'My Work', icon: Wrench },
  { href: '/technician/assets', label: 'Assets', icon: Package },
  { href: '/technician/history', label: 'History', icon: Clock },
]

interface AppShellProps {
  children: React.ReactNode
  requireRole?: 'admin' | 'technician'
}

export default function AppShell({ children, requireRole }: AppShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const u = getCurrentUser()
    if (!u) { router.replace('/'); return }
    if (requireRole && u.role !== requireRole) {
      router.replace(u.role === 'admin' ? '/dashboard' : '/technician')
      return
    }
    setUser(u)
  }, [router, requireRole])

  function handleLogout() {
    logout()
    router.replace('/')
  }

  if (!user) return null

  const nav = user.role === 'admin' ? adminNav : techNav

  const Sidebar = (
    <aside className="w-56 flex-shrink-0 bg-sidebar text-sidebar-foreground flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <p className="font-bold text-sm leading-tight">MaintainIQ</p>
          <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-wider">
            {user.role === 'admin' ? 'Admin Portal' : 'Tech Portal'}
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
              {active && <ChevronRight className="w-3 h-3 ml-auto" />}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="px-3 py-2 mb-1">
          <p className="text-sm font-semibold truncate">{user.name}</p>
          <p className="text-xs text-sidebar-foreground/50 truncate">{user.email}</p>
          <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
            user.role === 'admin'
              ? 'bg-primary/20 text-primary'
              : 'bg-chart-2/20 text-chart-2'
          }`}>
            {user.role}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-sidebar-foreground/60 hover:text-destructive hover:bg-sidebar-accent rounded-md transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">{Sidebar}</div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 flex w-56 flex-col">{Sidebar}</div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
          <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground hover:text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm">MaintainIQ</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
