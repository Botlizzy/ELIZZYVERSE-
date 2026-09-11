'use client'

import { useState, useRef } from 'react'
import {
  ArrowUp, CheckCircle2, ChevronDown, Code2, Download, FileCode2, Folder, GitBranch, Globe2,
  ImagePlus, Layers3, LayoutPanelTop, Loader2, MoreHorizontal, Paperclip,
  Play, Plus, RefreshCw, Upload, WandSparkles, X, Zap, Sparkles
} from 'lucide-react'

type Message = { role: 'user' | 'assistant'; text: string; images?: string[] }
type Model = 'gpt5' | 'claude' | 'qwen'
type AttachedFile = { name: string; dataUrl?: string; isImage: boolean }

const AI_BASE = process.env.NEXT_PUBLIC_AI_BASE || 'https://apis.davidcyril.name.ng/ai'

const modelInfo: Record<Model, { name: string; detail: string; mark: string; slug: string }> = {
  gpt5: { name: 'GPT-5', detail: 'Best for full builds', mark: 'G5', slug: 'gpt-5' },
  claude: { name: 'Claude Haiku 4.5', detail: 'Fast & precise', mark: 'CH', slug: 'claude-haiku-4.5' },
  qwen: { name: 'Qwen3 Max', detail: 'Great with code', mark: 'Q3', slug: 'qwen3-max' },
}

const starterFiles = [
  { name: 'app', type: 'folder' },
  { name: 'page.tsx', type: 'tsx' },
  { name: 'globals.css', type: 'css' },
  { name: 'layout.tsx', type: 'tsx' },
  { name: 'package.json', type: 'json' },
]

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function Home() {
  const [model, setModel] = useState<Model>('gpt5')
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'preview' | 'code'>('preview')
  const [attached, setAttached] = useState<AttachedFile[]>([])
  const [modelOpen, setModelOpen] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [domainOpen, setDomainOpen] = useState(false)
  const [domain, setDomain] = useState('')
  const [domainState, setDomainState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [domainMessage, setDomainMessage] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  async function sendPrompt() {
    if ((!prompt.trim() && attached.length === 0) || loading) return

    const current =
      prompt.trim() ||
      (attached.some(a => a.isImage)
        ? 'Please analyze the attached image(s) and help me build from them.'
        : 'Help me build.')
    const imageDataUrls = attached
      .filter(a => a.isImage && a.dataUrl)
      .map(a => a.dataUrl!) as string[]

    setPrompt('')
    setAttached([])
    setMessages(m => [
      ...m,
      { role: 'user', text: current, images: imageDataUrls.length ? imageDataUrls : undefined },
    ])
    setLoading(true)

    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac

    let textPayload = current
    if (imageDataUrls.length) {
      textPayload += '\n\n[Attached image(s) as data URLs — analyze them carefully:]\n'
      imageDataUrls.forEach((url, i) => {
        textPayload += `\n--- Image ${i + 1} ---\n${url}\n`
      })
    }

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model, prompt: textPayload, images: imageDataUrls }),
        signal: AbortSignal.any([ac.signal, AbortSignal.timeout(28000)]),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || `API ${response.status}`)
      setMessages(m => [...m, { role: 'assistant', text: data.content || 'Done.' }])
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      setMessages(m => [...m, {
        role: 'assistant',
        text: err instanceof Error ? err.message : 'Could not reach the AI. Try again.',
      }])
    } finally {
      setLoading(false)
    }
  }

  async function publishDomain() {
    const value = domain.trim()
    if (!value) {
      setDomainState('error')
      setDomainMessage('Enter a domain before continuing.')
      return
    }
    setDomainState('loading')
    setDomainMessage('')
    await new Promise(resolve => setTimeout(resolve, 650))
    setDomainState('success')
    setDomainMessage(`${value} is ready to connect to this project.`)
  }

  async function addFiles(files: FileList | null) {
    if (!files) return
    const list: AttachedFile[] = []
    for (const f of Array.from(files)) {
      const isImage = f.type.startsWith('image/')
      let dataUrl: string | undefined
      if (isImage) {
        try {
          dataUrl = await fileToDataUrl(f)
        } catch {
          /* skip */
        }
      }
      list.push({ name: f.name, dataUrl, isImage })
    }
    setAttached(prev => [...prev, ...list])
  }

  return (
    <main className="flex h-screen min-h-[720px] overflow-hidden bg-[#0a0a12] text-[#f0f0f8]">
      {/* Sidebar */}
      <aside className="hidden w-[248px] shrink-0 flex-col border-r border-[#2a2a3d] bg-[#12121c] px-3 py-4 md:flex">
        <div className="flex items-center gap-3 px-3 pb-6">
          <div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-[#a78bfa] to-[#22d3ee] text-sm font-black text-[#0a0a12]">
            E
          </div>
          <span className="font-semibold tracking-tight">ELIZZYVERSE</span>
          <button className="ml-auto text-[#9b9bb0]">
            <MoreHorizontal size={18} />
          </button>
        </div>

        <button className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#a78bfa] to-[#8b5cf6] px-3 py-2.5 text-sm font-semibold text-white transition hover:brightness-110">
          <Plus size={16} /> New project <span className="ml-auto text-xs opacity-60">⌘ N</span>
        </button>

        <nav className="mt-5 flex flex-col gap-1 text-sm">
          <NavItem icon={<Layers3 size={16} />} label="Projects" active />
          <NavItem icon={<GitBranch size={16} />} label="GitHub" />
          <NavItem icon={<Zap size={16} />} label="Settings" />
        </nav>

        <div className="mt-8 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-[#6b6b80]">
          Recent projects
        </div>
        <div className="mt-3 flex flex-col gap-1">
          <ProjectItem name="Lumen landing page" color="#a78bfa" />
          <ProjectItem name="Atlas dashboard" color="#22d3ee" />
          <ProjectItem name="Studio portfolio" color="#c4b5fd" />
        </div>

        <div className="mt-auto rounded-xl border border-[#2a2a3d] bg-[#1a1a28] p-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Zap size={14} className="text-[#a78bfa]" /> Pro workspace
          </div>
          <p className="mt-2 text-xs leading-5 text-[#9b9bb0]">
            Build faster with unlimited previews and GitHub sync.
          </p>
          <button className="mt-3 w-full rounded-md border border-[#3b3b55] py-1.5 text-xs font-semibold hover:bg-[#252535]">
            Upgrade plan
          </button>
        </div>
      </aside>

      {/* Main */}
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#2a2a3d] px-4 md:px-7">
          <div className="flex items-center gap-3">
            <button className="md:hidden">
              <Layers3 size={20} />
            </button>
            <div>
              <div className="text-sm font-semibold">Untitled project</div>
              <div className="text-xs text-[#9b9bb0]">Draft · saved just now</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="hidden items-center gap-2 rounded-md border border-[#3b3b55] px-3 py-2 text-xs font-semibold text-[#c5c5d5] hover:bg-[#1a1a28] sm:flex">
              <GitBranch size={14} /> Connect GitHub
            </button>
            <div className="relative">
              <button
                onClick={() => setPublishOpen(value => !value)}
                aria-expanded={publishOpen}
                className="flex items-center gap-2 rounded-md bg-gradient-to-r from-[#a78bfa] to-[#8b5cf6] px-3 py-2 text-xs font-bold text-white hover:brightness-110"
              >
                <Upload size={14} /> Publish <ChevronDown size={13} />
              </button>
              {publishOpen && (
                <div className="absolute right-0 top-11 z-30 w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-[#3b3b55] bg-[#1a1a28] p-2 shadow-2xl">
                  <button
                    onClick={() => {
                      setDomainOpen(true)
                      setPublishOpen(false)
                    }}
                    className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left hover:bg-[#252535]"
                  >
                    <Globe2 size={16} className="mt-0.5 shrink-0 text-[#a78bfa]" />
                    <span>
                      <span className="block text-xs font-semibold text-white">Custom domain</span>
                      <span className="mt-1 block text-[11px] leading-4 text-[#9b9bb0]">Connect your own domain to this project.</span>
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {domainOpen && (
          <div className="absolute inset-x-0 top-16 z-20 px-4 sm:px-7 lg:left-auto lg:right-7 lg:w-[min(25rem,calc(100vw-2rem))] lg:px-0">
            <section className="rounded-xl border border-[#3b3b55] bg-[#1a1a28] p-4 shadow-2xl sm:p-5" aria-label="Custom domain setup">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">Custom domain</p>
                  <p className="mt-1 text-xs leading-5 text-[#9b9bb0]">Publish this project at a domain you own.</p>
                </div>
                <button onClick={() => setDomainOpen(false)} aria-label="Close custom domain panel" className="rounded-md p-1.5 text-[#9b9bb0] hover:bg-[#252535] hover:text-white"><X size={16} /></button>
              </div>
              <label htmlFor="custom-domain" className="mt-5 block text-xs font-semibold text-[#c5c5d5]">Domain</label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input id="custom-domain" value={domain} onChange={event => { setDomain(event.target.value); setDomainState('idle'); setDomainMessage('') }} placeholder="www.example.com" className="min-w-0 flex-1 rounded-md border border-[#3b3b55] bg-[#12121c] px-3 py-2.5 text-sm outline-none placeholder:text-[#6b6b80] focus:border-[#a78bfa]" />
                <button onClick={publishDomain} disabled={domainState === 'loading'} className="rounded-md bg-gradient-to-r from-[#a78bfa] to-[#8b5cf6] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{domainState === 'loading' ? 'Checking…' : 'Connect'}</button>
              </div>
              {domainMessage && (
                <div className={`mt-3 flex items-start gap-2 rounded-md border px-3 py-2.5 text-xs leading-5 ${domainState === 'success' ? 'border-[#2f8061] bg-[#15352d] text-[#9de5c5]' : 'border-[#8f4b55] bg-[#3b2028] text-[#ffc0c7]'}`} role="status">
                  {domainState === 'success' && <CheckCircle2 size={15} className="mt-0.5 shrink-0" />}
                  <span>{domainMessage}</span>
                </div>
              )}
            </section>
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* Chat */}
          <section className="flex min-h-0 min-w-0 flex-1 flex-col border-r border-[#2a2a3d]">
            <div className="flex items-center justify-between border-b border-[#2a2a3d] px-5 py-3">
              <div className="relative">
                <button
                  onClick={() => setModelOpen(v => !v)}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-semibold hover:bg-[#1a1a28]"
                >
                  <span className="grid size-5 place-items-center rounded bg-[#252535] text-[9px] font-black text-[#a78bfa]">
                    {modelInfo[model].mark}
                  </span>
                  {modelInfo[model].name}
                  <ChevronDown size={14} className="text-[#9b9bb0]" />
                </button>
                {modelOpen && (
                  <div className="absolute left-0 top-9 z-20 w-52 rounded-lg border border-[#3b3b55] bg-[#1a1a28] p-1 shadow-2xl">
                    {(Object.keys(modelInfo) as Model[]).map(key => (
                      <button
                        key={key}
                        onClick={() => {
                          setModel(key)
                          setModelOpen(false)
                        }}
                        className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-[#252535]"
                      >
                        <span className="grid size-6 place-items-center rounded bg-[#252535] text-[9px] font-black text-[#a78bfa]">
                          {modelInfo[key].mark}
                        </span>
                        <span>
                          <span className="block text-xs font-semibold">{modelInfo[key].name}</span>
                          <span className="block text-[10px] text-[#9b9bb0]">{modelInfo[key].detail}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 text-[#9b9bb0]">
                <button className="rounded p-1.5 hover:bg-[#1a1a28]" title="Refresh">
                  <RefreshCw size={15} />
                </button>
                <button className="rounded p-1.5 hover:bg-[#1a1a28]" title="Options">
                  <MoreHorizontal size={17} />
                </button>
              </div>
            </div>

            <div className="scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-6">
              <div className="mx-auto flex max-w-2xl flex-col gap-6">
                {messages.length === 0 ? (
                  <div className="grid min-h-[390px] place-items-center py-12 text-center">
                    <div>
                      <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-[#3b3b55] bg-[#1a1a28] text-[#a78bfa]">
                        <WandSparkles size={24} />
                      </div>
                      <h1 className="mt-5 text-2xl font-semibold tracking-tight">What will you build?</h1>
                      <p className="mt-2 max-w-sm text-sm leading-6 text-[#9b9bb0]">
                        Describe a website, product, or experience. ELIZZYVERSE turns your idea into a
                        working project. Upload images and the AI will read them.
                      </p>
                      <div className="mt-7 grid gap-2 text-left sm:grid-cols-2">
                        <PromptChip text="A cinematic portfolio for a photographer" onClick={setPrompt} />
                        <PromptChip text="A SaaS landing page with pricing" onClick={setPrompt} />
                        <PromptChip text="A dashboard for tracking habits" onClick={setPrompt} />
                        <PromptChip text="Recreate this design from an image" onClick={setPrompt} />
                      </div>
                    </div>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
                      <div
                        className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-6 ${
                          m.role === 'user'
                            ? 'bg-gradient-to-br from-[#a78bfa] to-[#8b5cf6] text-white'
                            : 'border border-[#2a2a3d] bg-[#1a1a28] text-[#e0e0f0]'
                        }`}
                      >
                        {m.images && m.images.length > 0 && (
                          <div className="mb-2 flex flex-wrap gap-2">
                            {m.images.map((src, j) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={j}
                                src={src}
                                alt={`upload-${j}`}
                                className="h-16 w-16 rounded-lg object-cover border border-white/20"
                              />
                            ))}
                          </div>
                        )}
                        {m.text}
                      </div>
                    </div>
                  ))
                )}
                {loading && (
                  <div className="flex items-center gap-3 text-sm text-[#9b9bb0]">
                    <Loader2 size={16} className="animate-spin text-[#a78bfa]" /> ELIZZYVERSE is
                    thinking...
                  </div>
                )}
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-[#2a2a3d] p-4">
              <div className="mx-auto max-w-2xl">
                {attached.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {attached.map((f, idx) => (
                      <span
                        key={`${f.name}-${idx}`}
                        className="flex items-center gap-1 rounded-md border border-[#3b3b55] bg-[#1a1a28] px-2 py-1 text-xs text-[#c5c5d5]"
                      >
                        {f.isImage && f.dataUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={f.dataUrl} alt="" className="h-5 w-5 rounded object-cover" />
                        ) : (
                          <FileCode2 size={12} />
                        )}
                        {f.name}
                        <button onClick={() => setAttached(a => a.filter((_, i) => i !== idx))}>
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="rounded-xl border border-[#3b3b55] bg-[#1a1a28] p-2 shadow-lg focus-within:border-[#a78bfa]">
                  <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    onKeyDown={e => {
                      if (
                        e.key === 'Enter' &&
                        !e.shiftKey &&
                        !e.nativeEvent.isComposing &&
                        e.keyCode !== 229
                      ) {
                        e.preventDefault()
                        sendPrompt()
                      }
                    }}
                    placeholder="Describe what you want to build... (images are sent to the AI)"
                    rows={3}
                    className="w-full resize-none bg-transparent px-2 py-1 text-sm leading-6 outline-none placeholder:text-[#6b6b80]"
                  />
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1">
                      <label
                        className="cursor-pointer rounded-md p-2 text-[#9b9bb0] hover:bg-[#252535]"
                        title="Attach files"
                      >
                        <Paperclip size={16} />
                        <input
                          type="file"
                          multiple
                          className="sr-only"
                          onChange={e => addFiles(e.target.files)}
                        />
                      </label>
                      <label
                        className="cursor-pointer rounded-md p-2 text-[#9b9bb0] hover:bg-[#252535]"
                        title="Attach image — AI will read it"
                      >
                        <ImagePlus size={16} />
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="sr-only"
                          onChange={e => addFiles(e.target.files)}
                        />
                      </label>
                      <span className="ml-2 text-[11px] text-[#6b6b80]">Shift + Enter for new line</span>
                    </div>
                    <button
                      onClick={sendPrompt}
                      disabled={(!prompt.trim() && attached.length === 0) || loading}
                      className="grid size-8 place-items-center rounded-lg bg-gradient-to-r from-[#a78bfa] to-[#8b5cf6] text-white disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ArrowUp size={17} />
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-center text-[10px] text-[#5a5a70]">
                  ELIZZYVERSE can make mistakes. Review generated code before publishing.
                </p>
              </div>
            </div>
          </section>

          {/* Preview panel */}
          <aside className="hidden w-[380px] shrink-0 flex-col bg-[#12121c] xl:flex">
            <div className="flex h-12 items-center justify-between border-b border-[#2a2a3d] px-4">
              <div className="flex items-center gap-1 rounded-md bg-[#1a1a28] p-1">
                <button
                  onClick={() => setTab('preview')}
                  className={`flex items-center gap-2 rounded px-3 py-1.5 text-xs font-semibold ${
                    tab === 'preview' ? 'bg-[#2a2a3d] text-white' : 'text-[#9b9bb0]'
                  }`}
                >
                  <Play size={13} /> Preview
                </button>
                <button
                  onClick={() => setTab('code')}
                  className={`flex items-center gap-2 rounded px-3 py-1.5 text-xs font-semibold ${
                    tab === 'code' ? 'bg-[#2a2a3d] text-white' : 'text-[#9b9bb0]'
                  }`}
                >
                  <Code2 size={13} /> Code
                </button>
              </div>
              <div className="flex items-center gap-1 text-[#9b9bb0]">
                <button className="rounded p-1.5 hover:bg-[#1a1a28]">
                  <RefreshCw size={14} />
                </button>
                <button className="rounded p-1.5 hover:bg-[#1a1a28]">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>

            {tab === 'preview' ? (
              <div className="grid-bg flex min-h-0 flex-1 flex-col p-4">
                <div className="flex min-h-[430px] flex-1 flex-col overflow-hidden rounded-lg border border-[#3b3b55] bg-white shadow-2xl">
                  <div className="flex h-8 items-center gap-1 border-b border-[#e5e7eb] bg-[#f7f8f9] px-3">
                    <span className="size-2 rounded-full bg-[#ff6b6b]" />
                    <span className="size-2 rounded-full bg-[#ffc56b]" />
                    <span className="size-2 rounded-full bg-[#75d681]" />
                    <div className="mx-3 flex-1 rounded bg-white px-2 py-1 text-[9px] text-[#9ca3af]">
                      localhost:3000
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col items-center justify-center px-8 text-center text-[#111827]">
                    <div className="mb-4 grid size-12 place-items-center rounded-xl bg-gradient-to-br from-[#a78bfa] to-[#22d3ee] text-white">
                      <Sparkles size={20} />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight">Your preview appears here</h2>
                    <p className="mt-2 max-w-[230px] text-xs leading-5 text-[#6b7280]">
                      Ask ELIZZYVERSE to build something and see it come alive in this window.
                    </p>
                    <button className="mt-5 rounded-lg bg-[#111827] px-4 py-2 text-xs font-semibold text-white">
                      Explore starter
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[10px] text-[#6b6b80]">
                  <span>Preview sandbox · Not published</span>
                  <button className="flex items-center gap-1 hover:text-white">
                    <LayoutPanelTop size={12} /> Desktop
                  </button>
                </div>
              </div>
            ) : (
              <div className="scrollbar min-h-0 flex-1 overflow-y-auto p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold">Project files</span>
                  <button className="text-[#9b9bb0] hover:text-white">
                    <Download size={14} />
                  </button>
                </div>
                {starterFiles.map((f, i) => (
                  <div
                    key={f.name}
                    className={`flex items-center gap-2 rounded px-2 py-2 text-xs ${
                      i === 1 ? 'bg-[#1a1a28] text-white' : 'text-[#aeb8be]'
                    }`}
                  >
                    <span className="text-[#22d3ee]">
                      {f.type === 'folder' ? <Folder size={14} /> : <FileCode2 size={14} />}
                    </span>
                    {f.name}
                    <span className="ml-auto text-[10px] text-[#5a5a70]">
                      {f.type === 'folder' ? '⌄' : ''}
                    </span>
                  </div>
                ))}
                <pre className="mt-5 overflow-auto rounded-lg border border-[#2a2a3d] bg-[#0a0a12] p-4 text-[10px] leading-5 text-[#9fabb3]">
{`export default function Page() {
  return (
    <main>
      <h1>Build something
        remarkable.</h1>
    </main>
  )
}`}
                </pre>
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  )
}

function NavItem({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
}) {
  return (
    <button
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left ${
        active ? 'bg-[#1a1a28] text-white' : 'text-[#9b9bb0] hover:bg-[#1a1a28] hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function ProjectItem({ name, color }: { name: string; color: string }) {
  return (
    <button className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-xs text-[#aeb8be] hover:bg-[#1a1a28]">
      <span className="size-2 rounded-full" style={{ background: color }} />
      {name}
    </button>
  )
}

function PromptChip({ text, onClick }: { text: string; onClick: (v: string) => void }) {
  return (
    <button
      onClick={() => onClick(text)}
      className="rounded-lg border border-[#2a2a3d] bg-[#1a1a28] px-3 py-2.5 text-left text-xs leading-5 text-[#aeb8be] transition hover:border-[#a78bfa] hover:bg-[#252535]"
    >
      {text}
    </button>
  )
}
