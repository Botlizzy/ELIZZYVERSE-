import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const token = (await cookies()).get('github_access_token')?.value
  if (!token) return NextResponse.json({ connected: false, repos: [] })
  const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }, cache: 'no-store' })
  if (!response.ok) return NextResponse.json({ error: 'GitHub session expired.' }, { status: 401 })
  const repos = await response.json()
  return NextResponse.json({ connected: true, repos: repos.map((repo: { id: number; full_name: string; private: boolean; default_branch: string }) => ({ id: repo.id, full_name: repo.full_name, private: repo.private, default_branch: repo.default_branch })) })
}
