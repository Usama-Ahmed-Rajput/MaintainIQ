import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Server-side signup enforcing single-admin rule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role, inviteCode } = body

    // Validate input
    if (!name?.trim() || !email?.trim() || !password || !role) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }
    if (!['admin', 'technician'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
    }

    // --- Admin-specific checks ---
    if (role === 'admin') {
      // 1. Verify invite code
      const validCode = process.env.ADMIN_INVITE_CODE ?? 'MAINTAINIQ-ADMIN-2024'
      if (!inviteCode || inviteCode.trim() !== validCode) {
        return NextResponse.json(
          { error: 'Invalid admin invite code. Contact your system administrator.' },
          { status: 403 },
        )
      }

      // 2. Check if admin already exists using server client
      const supabase = await createClient()
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin')

      if ((count ?? 0) > 0) {
        return NextResponse.json(
          { error: 'An admin account already exists. Only one admin is allowed in MaintainIQ.' },
          { status: 409 },
        )
      }
    }

    // --- Create user via Supabase Admin client (service role) ---
    // This bypasses email confirmation for faster onboarding
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const origin = request.headers.get('origin') || ''
    const redirectUrl =
      process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${origin}/auth/callback`

    const { data, error } = await adminClient.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: false, // require email confirmation
      user_metadata: {
        name: name.trim(),
        role,
      },
      app_metadata: { role },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: role === 'admin'
        ? 'Admin account created! Please check your email to confirm your account.'
        : 'Account created! Please check your email to confirm, then sign in.',
    })
  } catch (err) {
    console.error('[signup API]', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
