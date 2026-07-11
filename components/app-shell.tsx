'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'
import {
  LayoutDashboard, Package, AlertTriangle, History,
  LogOut, Menu, X, ShieldCheck, Wrench, ChevronDown, Shield, Bell,
} from 'lucide-react'
import Link from 'next/link'

interface AppShellProps {
  children: React.ReactNode
  requireRole?: 'admin' | 'technician' | 'any'
}

export default function AppShell({ children, requireRole = 'any' }: AppShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let isMounted = true

    async function loadProfile() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          if (isMounted) router.replace('/')
          return
        }

        // Fetch profile from database (bypassing cache)
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
        
        if (!isMounted) return

        if (error) {
          console.error('[v0] Profile load error:', error)
          router.replace('/')
          return
        }

        // If profile exists, use it
        if (data) {
          const p: Profile = { ...data, email: user.email ?? '' }
          if (requireRole !== 'any' && data.role !== requireRole) {
            router.replace(data.role === 'admin' ? '/dashboard' : '/technician')
            return
          }
          if (isMounted) {
            setProfile(p)
            setLoading(false)
          }
          return
        }

        // If profile doesn't exist, try to create it (fallback for users created before trigger)
        if (!data) {
          const defaultProfile = {
            id: user.id,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            role: (user.user_metadata?.role as 'admin' | 'technician') || 'technician',
            created_at: new Date().toISOString(),
            email: user.email ?? '',
          }

          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              name: defaultProfile.name,
              role: defaultProfile.role,
            })
            .select()
            .single()

          if (!isMounted) return

          // If creation failed due to admin constraint, still proceed with default profile
          // This allows technicians and other users to work even if admin slot is full
          if (createError) {
            if (createError.code === 'P0001' && createError.message.includes('admin')) {
              // Admin constraint error - use default technician profile
              const p: Profile = { ...defaultProfile, role: 'technician' }
              if (requireRole !== 'any' && requireRole !== 'technician') {
                router.replace('/technician')
                return
              }
              setProfile(p)
              setLoading(false)
              return
            }
            console.error('[v0] Profile creation error:', createError)
            router.replace('/')
            return
          }

          if (!newProfile) {
            console.error('[v0] Profile creation failed')
            router.replace('/')
            return
          }

          const p: Profile = { ...newProfile, email: user.email ?? '' }
          setProfile(p)
          setLoading(false)
          return
        }

        const p: Profile = { ...data, email: user.email ?? '' }
        if (requireRole !== 'any' && data.role !== requireRole) {
          router.replace(data.role === 'admin' ? '/dashboard' : '/technician')
          return
        }

        if (isMounted) {
          setProfile(p)
          setLoading(false)
        }
      } catch (err) {
        console.error('[v0] loadProfile error:', err)
        if (isMounted) {
          setLoading(false)
          router.replace('/')
        }
      }
    }

    const timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.error('[v0] Profile load timeout')
        setLoading(false)
        router.replace('/')
      }
    }, 5000)

    loadProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && isMounted) router.replace('/')
    })

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [router, requireRole, loading])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!profile) return null

  const isAdmin = profile.role === 'admin'

  const adminNav = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/alerts', label: 'Alerts', icon: Bell },
    { href: '/dashboard/assets', label: 'Assets', icon: Package },
    { href: '/dashboard/issues', label: 'Issues', icon: AlertTriangle },
    { href: '/dashboard/history', label: 'History', icon: History },
    { href: '/dashboard/audit-logs', label: 'Audit Logs', icon: Shield },
  ]
  const techNav = [
    { href: '/technician', label: 'My Tasks', icon: Wrench },
  ]
  const nav = isAdmin ? adminNav : techNav

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold text-sm text-sidebar-foreground leading-tight">MaintainIQ</p>
            <p className="text-[10px] text-sidebar-foreground/50 font-medium uppercase tracking-wider">
              {isAdmin ? 'Admin Portal' : 'Technician Portal'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/technician' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
          <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary">
              {profile.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-sidebar-foreground truncate leading-tight">{profile.name}</p>
            <p className="text-[10px] text-sidebar-foreground/50 capitalize">{profile.role}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-sidebar border-r border-sidebar-border flex-col flex-shrink-0">
        <NavContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-sidebar flex flex-col h-full shadow-xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-md hover:bg-sidebar-accent"
            >
              <X className="w-4 h-4 text-sidebar-foreground" />
            </button>
            <NavContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-sidebar border-b border-sidebar-border flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-1 rounded-md hover:bg-sidebar-accent">
            <Menu className="w-5 h-5 text-sidebar-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm text-sidebar-foreground">MaintainIQ</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 md:p-7">
          {children}
        </main>
      </div>
    </div>
  )
}
