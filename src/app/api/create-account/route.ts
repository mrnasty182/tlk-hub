import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!

async function supabaseRequest(path: string, method: string, body?: object) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data = {}
  try { data = JSON.parse(text) } catch {}
  return { status: res.status, data }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const { action } = body

  // List all users
  if (action === 'list') {
    const { status, data } = await supabaseRequest('/auth/v1/admin/users', 'GET') as { status: number; data: { users?: object[] } }
    return NextResponse.json({ status, users: data.users || [] })
  }

  // Reset password for joshua.mitchell208@gmail.com by user ID
  if (action === 'reset') {
    const { status, data } = await supabaseRequest(
      '/auth/v1/admin/users/f7cee420-c0e8-41e8-b81f-0e357e72c3dc',
      'PUT',
      { password: 'Sharks00', email_confirm: true }
    )
    return NextResponse.json({ status, data })
  }

  // Update password by email
  const { email, password } = body
  if (!email || !password) {
    return NextResponse.json({ error: 'email and password required' }, { status: 400 })
  }

  // Get all users and find the one with this email
  const { data: listData } = await supabaseRequest('/auth/v1/admin/users', 'GET') as { status: number; data: { users?: object[] } }
  const users = listData.users || []
  const user = users.find((u: { email?: string; id?: string }) => u.email === email) as { email?: string; id?: string } | undefined

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const { status, data } = await supabaseRequest(
    `/auth/v1/admin/users/${user.id}`,
    'PUT',
    { password, email_confirm: true }
  )

  return NextResponse.json({ success: status < 400, data })
}