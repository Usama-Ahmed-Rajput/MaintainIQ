'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { signUp } from '@/lib/actions'
import { ShieldCheck, Eye, EyeOff, Loader2, Key, UserCheck, Wrench } from 'lucide-react'

type Mode = 'signin' | 'signup'

export default function HomePage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [isAdminSignup, setIsAdminSignup] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle()
        if (data?.role === 'admin') router.replace('/dashboard')
        else router.replace('/technician')
      } else {
        setCheckingSession(false)
      }
    })
  }, [router])

  function switchMode(m: Mode) {
    setMode(m)
    setError('')
    setMessage('')
    setIsAdminSignup(false)
    setInviteCode('')
  }

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
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()
        if (profile?.role === 'admin') router.replace('/dashboard')
        else router.replace('/technician')
      }
    } else {
      if (!name.trim()) {
        setError('Full name is required.')
        setLoading(false)
        return
      }
      const role = isAdminSignup ? 'admin' : 'technician'
      const { error: err, message: msg } = await signUp(
        name.trim(),
        email.trim(),
        password,
        role,
        isAdminSignup ? inviteCode.trim() : undefined,
      )
      if (err) {
        setError(err)
        setLoading(false)
        return
      }
      setMessage(msg ?? 'Account created! Check your email to confirm, then sign in.')
      switchMode('signin')
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

  const inputCls =
    'w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition'

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
              onClick={() => switchMode('signin')}
              className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                mode === 'signin'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => switchMode('signup')}
              className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                mode === 'signup'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
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

            {/* Signup-specific: role toggle + invite code */}
            {mode === 'signup' && (
              <>
                {/* Role toggle pills */}
                <div>
                  <label className="block text-sm font-medium mb-2">Account Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => { setIsAdminSignup(false); setInviteCode('') }}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                        !isAdminSignup
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Wrench className="w-4 h-4" />
                      Technician
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAdminSignup(true)}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                        isAdminSignup
                          ? 'bg-amber-50 border-amber-500 text-amber-700'
                          : 'border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                      Admin
                    </button>
                  </div>
                </div>

                {/* Admin invite code — only shown when Admin pill is selected */}
                {isAdminSignup && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-2">
                    <div className="flex items-center gap-2 text-amber-700">
                      <Key className="w-4 h-4 flex-shrink-0" />
                      <p className="text-xs font-semibold">Admin Invite Code Required</p>
                    </div>
                    <p className="text-xs text-amber-600">
                      Only one admin account is allowed. Enter the secret invite code provided by your system administrator.
                    </p>
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={e => setInviteCode(e.target.value)}
                      placeholder="e.g. MAINTAINIQ-ADMIN-2024"
                      className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition font-mono"
                      required={isAdminSignup}
                    />
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold text-sm hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'signin' ? 'Sign In' : isAdminSignup ? 'Create Admin Account' : 'Create Account'}
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
