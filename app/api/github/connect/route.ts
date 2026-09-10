import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID
  if (!clientId) return NextResponse.json({ error: 'GitHub OAuth is not configured.' }, { status: 503 })
  const origin = new URL(request.url).origin
  const redirect = `${origin}/api/github/callback`
  const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirect, scope: 'repo', state: crypto.randomUUID() })
  const response = NextResponse.redirect(`https://github.com/login/oauth/authorize?${params}`)
  response.cookies.set('github_oauth_state', params.get('state')!, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 600, path: '/' })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ connected: false })
  response.cookies.delete('github_access_token')
  return response
} 
