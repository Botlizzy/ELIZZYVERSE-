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

    if (!response.ok) throw new Error(`Provider returned ${response.status}`)

    const data = await response.json()
    const content =
      data.result ??
      data.choices?.[0]?.message?.content ??
      data.output ??
      data.content ??
      (typeof data === 'string' ? data : JSON.stringify(data))

    return NextResponse.json({ content })
  } catch {
    return NextResponse.json(
      { error: 'Could not reach the AI endpoint. Try again.' },
      { status: 502 },
    )
  }
}
