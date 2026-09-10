import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

function encode(content: string) { return Buffer.from(content, 'utf8').toString('base64') }
export async function POST(request: Request) {
  const token = (await cookies()).get('github_access_token')?.value
  if (!token) return NextResponse.json({ error: 'Connect GitHub before publishing.' }, { status: 401 })
  const body = await request.json() as { repo?: string; branch?: string; files?: { path: string; content: string }[] }
  if (!body.repo || !body.files?.length) return NextResponse.json({ error: 'Choose a repository and provide files.' }, { status: 400 })
  const branch = body.branch || 'forge-updates'
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' }
  for (const file of body.files.slice(0, 50)) {
    const path = file.path.replace(/^\/+/, '').replace(/\.\./g, '')
    const existing = await fetch(`https://api.github.com/repos/${body.repo}/contents/${path}?ref=${encodeURIComponent(branch)}`, { headers })
    const current = existing.ok ? await existing.json() as { sha?: string } : {}
    const result = await fetch(`https://api.github.com/repos/${body.repo}/contents/${path}`, { method: 'PUT', headers, body: JSON.stringify({ message: `Forge update: ${path}`, content: encode(file.content), branch, ...(current.sha ? { sha: current.sha } : {}) }) })
    if (!result.ok) return NextResponse.json({ error: `Could not publish ${path}. Create the branch first or check permissions.` }, { status: 502 })
  }
  return NextResponse.json({ published: true, branch, files: body.files.length })
}
