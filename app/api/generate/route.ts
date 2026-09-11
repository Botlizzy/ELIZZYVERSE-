import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json() as {
    model?: string
    prompt?: string
    images?: string[]
  }

  const prompt = body.prompt?.trim()
  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 })
  }

  const slugMap: Record<string, string> = {
    gpt5: 'gpt-5',
    claude: 'claude-haiku-4.5',
    qwen: 'qwen3-max',
  }
  const slug = slugMap[body.model ?? 'gpt5'] ?? 'gpt-5'
  const endpoint = `https://apis.davidcyril.name.ng/ai/${slug}`

  let text = prompt
  if (body.images?.length) {
    text += '\n\n[User attached image(s) — please analyze them:]\n'
    body.images.forEach((img, i) => {
      text += `\nImage ${i + 1}: ${img}\n`
    })
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text,
        systemPrompt:
          'You are ELIZZYVERSE, an expert AI that builds websites, apps, and experiences. Be fast, precise, and helpful. When images are provided, describe and use them.',
        sessionId: 'elizzyverse',
      }),
      signal: AbortSignal.timeout(25000),
    })

    const raw = await response.text()
    let data: unknown
    try {
      data = raw ? JSON.parse(raw) : raw
    } catch {
      data = raw
    }

    if (!response.ok) {
      const providerError = extractContent(data)
      return NextResponse.json(
        { error: providerError || `Provider returned ${response.status}.` },
        { status: response.status >= 500 ? 502 : response.status },
      )
    }

    return NextResponse.json({ content: extractContent(data) || 'Generation complete.' })
  } catch (error) {
    const message = error instanceof Error && error.name === 'TimeoutError'
      ? 'The AI endpoint timed out. Try again.'
      : 'Could not reach the AI endpoint. Try again.'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

function extractContent(value: unknown): string {
  if (typeof value === 'string') return value
  if (!value || typeof value !== 'object') return ''
  const data = value as Record<string, unknown>
  const choices = Array.isArray(data.choices) ? data.choices : []
  const choice = choices[0] && typeof choices[0] === 'object' ? choices[0] as Record<string, unknown> : undefined
  const message = choice?.message && typeof choice.message === 'object' ? choice.message as Record<string, unknown> : undefined
  const content = data.result ?? message?.content ?? choice?.text ?? data.output ?? data.content
  if (typeof content === 'string') return content
  if (content !== undefined && content !== null) return JSON.stringify(content)
  return JSON.stringify(value)
}
