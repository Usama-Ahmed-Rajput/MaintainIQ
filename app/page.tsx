'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react'

type Mode = 'signin' | 'signup'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'technician'>('technician')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
        if (data?.role === 'admin') router.replace('/dashboard')
        else router.replace('/technician')
      } else {
        setCheckingSession(false)
      }
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    const supabase = createClient()

    if (mode === 'signin') {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }
      if (data.user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
        if (profile?.role === 'admin') router.replace('/dashboard')
        else router.replace('/technician')
      }
    } else {
      if (!name.trim()) {
        setError('Name is required')
        setLoading(false)
        return
      }
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: name.trim(), role },
        },
      })
      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }
      setMessage('Account created! Check your email to confirm, then sign in.')
      setMode('signin')
      setPassword('')
      setLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const inputCls = "w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-3 shadow-lg">
            <ShieldCheck className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">MaintainIQ</h1>
          <p className="text-sm text-muted-foreground mt-1">Asset & Maintenance Management</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          {/* Tab switcher */}
          <div className="flex bg-muted rounded-lg p-1 mb-6">
            <button
              onClick={() => { setMode('signin'); setError(''); setMessage('') }}
              className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                mode === 'signin' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); setMessage('') }}
              className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                mode === 'signup' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign Up
            </button>
          </div>

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm mb-4">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-3 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your full name"
                  className={inputCls}
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
                className={inputCls}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                  className={`${inputCls} pr-10`}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as 'admin' | 'technician')}
                  className={inputCls}
                >
                  <option value="admin">Admin</option>
                  <option value="technician">Technician</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Secure facility management platform
        </p>
      </div>
    </div>
  )
}
