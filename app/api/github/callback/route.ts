import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  if (!code) return NextResponse.redirect(`${url.origin}/?github=error`)
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code }) })
  const data = await tokenResponse.json() as { access_token?: string }
  if (!data.access_token) return NextResponse.redirect(`${url.origin}/?github=error`)
  const response = NextResponse.redirect(`${url.origin}/?github=connected`)
  response.cookies.set('github_access_token', data.access_token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 30, path: '/' })
  return response
}
