'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { login, register, getCurrentUser } from '@/lib/store'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'technician'>('technician')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const user = getCurrentUser()
    if (user) {
      router.replace(user.role === 'admin' ? '/dashboard' : '/technician')
    }
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 400))

    if (mode === 'login') {
      const user = login(email, password)
      if (!user) {
        setError('Invalid email or password.')
      } else {
        router.replace(user.role === 'admin' ? '/dashboard' : '/technician')
      }
    } else {
      if (!name.trim()) { setError('Name is required.'); setLoading(false); return }
      const user = register(name, email, password, role)
      if (!user) {
        setError('An account with this email already exists.')
      } else {
        router.replace(user.role === 'admin' ? '/dashboard' : '/technician')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 bg-sidebar text-sidebar-foreground p-12">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">MaintainIQ</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight text-balance mb-4">
            Asset maintenance,<br />reimagined with AI.
          </h1>
          <p className="text-sidebar-foreground/70 leading-relaxed text-sm">
            Scan. Report. Diagnose. Maintain. Give every physical asset a digital identity and a permanent service history.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-sidebar-foreground/40 font-semibold mb-2">Demo Credentials</p>
          {[
            { label: 'Administrator', email: 'admin@maintainiq.com', pass: 'admin123' },
            { label: 'Technician (Ali Hassan)', email: 'ali@maintainiq.com', pass: 'tech123' },
            { label: 'Technician (Sara Ahmed)', email: 'sara@maintainiq.com', pass: 'tech123' },
          ].map(cred => (
            <div
              key={cred.email}
              className="bg-sidebar-accent rounded-lg p-3 cursor-pointer hover:bg-sidebar-accent/60 transition-colors"
              onClick={() => { setEmail(cred.email); setPassword(cred.pass); setMode('login') }}
            >
              <p className="text-sm font-semibold text-sidebar-foreground">{cred.label}</p>
              <p className="text-xs text-sidebar-foreground/50 mt-0.5">{cred.email} &bull; {cred.pass}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">MaintainIQ</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">
            {mode === 'login' ? 'Sign in to your account' : 'Create an account'}
          </h2>
          <p className="text-muted-foreground text-sm mb-8">
            {mode === 'login'
              ? 'Enter your credentials to access the platform.'
              : 'Register to start managing assets.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John Smith"
                  className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as 'admin' | 'technician')}
                  className="w-full border border-border rounded-md px-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
                >
                  <option value="technician">Technician</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md px-3 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-md hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-sm text-center mt-6 text-muted-foreground">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError('') }}
              className="text-primary font-medium hover:underline"
            >
              {mode === 'login' ? 'Register' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
