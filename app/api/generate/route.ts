import { NextResponse } from 'next/server'

const prompts: Record<string, string> = {
  gpt5: process.env.AI_ENDPOINT_GPT5 ?? '',
  claude: process.env.AI_ENDPOINT_CLAUDE ?? '',
  qwen: process.env.AI_ENDPOINT_QWEN ?? '',
}
export async function POST(request: Request) {
  const body = await request.json() as { model?: string; prompt?: string }
  const prompt = body.prompt?.trim()
  if (!prompt) return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 })
  const endpoint = prompts[body.model ?? 'gpt5']
  if (!endpoint) return NextResponse.json({ content: `I’m ready to build “${prompt}”. Add your server-side AI endpoint to generate a real project.` })
  try {
    const response = await fetch(endpoint, { method:'POST', headers:{ 'content-type':'application/json', ...(process.env.AI_API_KEY ? { authorization:`Bearer ${process.env.AI_API_KEY}` } : {}) }, body:JSON.stringify({ model:body.model, messages:[{ role:'user', content:prompt }] }), signal:AbortSignal.timeout(30000) })
    if (!response.ok) throw new Error(`Provider returned ${response.status}`)
    const data = await response.json()
    return NextResponse.json({ content:data.choices?.[0]?.message?.content ?? data.output ?? data.content ?? JSON.stringify(data) })
  } catch { return NextResponse.json({ error:'The selected model could not be reached. Check endpoint configuration.' }, { status:502 }) }
}
