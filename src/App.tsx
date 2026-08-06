import { useState, useEffect, useRef, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────
type Theme = 'dark' | 'light'
type BootPhase = 'static' | 'typing' | 'ready'

interface Visitor {
  name: string
  email: string
}

// ── Constants ──────────────────────────────────────────────────
const INTRO_LINES = [
  '> initializing ash.wills.sys...',
  '> signal found.',
  '> tap a command or type one.',
]

const COMMANDS: { label: string; target: string }[] = [
  { label: 'music', target: 'music' },
  { label: 'youtube', target: 'youtube' },
  { label: 'tour', target: 'tour' },
  { label: 'join', target: 'join' },
]

const VALID_COMMANDS = COMMANDS.map((c) => c.label).concat(['about', 'theme --dark', 'theme --light'])

// ── Helpers ────────────────────────────────────────────────────
function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}

function getVisitor(): Visitor | null {
  try {
    const raw = localStorage.getItem('ash_visitor')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveVisitor(v: Visitor) {
  localStorage.setItem('ash_visitor', JSON.stringify(v))
}

// ── Typewriter hook ────────────────────────────────────────────
function useTypewriter(lines: string[], speed = 28, onDone?: () => void) {
  const [displayed, setDisplayed] = useState<string[]>([])
  const [currentLine, setCurrentLine] = useState(0)
  const [currentChar, setCurrentChar] = useState(0)

  useEffect(() => {
    if (currentLine >= lines.length) {
      onDone?.()
      return
    }
    const line = lines[currentLine]
    if (currentChar < line.length) {
      const t = setTimeout(() => {
        setCurrentChar((c) => c + 1)
        setDisplayed((prev) => {
          const next = [...prev]
          next[currentLine] = line.slice(0, currentChar + 1)
          return next
        })
      }, speed)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => {
        setCurrentLine((l) => l + 1)
        setCurrentChar(0)
      }, 340)
      return () => clearTimeout(t)
    }
  }, [currentLine, currentChar, lines, speed, onDone])

  return displayed
}

// ── Terminal boot section ──────────────────────────────────────
function TerminalHero({
  theme,
  onThemeToggle,
}: {
  theme: Theme
  onThemeToggle: (t: Theme) => void
}) {
  const visitor = getVisitor()
  const [bootPhase, setBootPhase] = useState<BootPhase>('static')
  const [typingInput, setTypingInput] = useState('')
  const [cmdFeedback, setCmdFeedback] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const returningLines = visitor
    ? [`> welcome back, ${visitor.name}.`, '> your commands:']
    : INTRO_LINES

  const handleDoneTyping = useCallback(() => setBootPhase('ready'), [])
  const displayedLines = useTypewriter(
    bootPhase === 'static' ? [] : returningLines,
    26,
    handleDoneTyping,
  )

  // Boot: static → typing
  useEffect(() => {
    const t = setTimeout(() => setBootPhase('typing'), 820)
    return () => clearTimeout(t)
  }, [])

  function runCommand(cmd: string) {
    const c = cmd.trim().toLowerCase()
    if (c === 'theme --dark') { onThemeToggle('dark'); setCmdFeedback('> theme set: dark'); return }
    if (c === 'theme --light') { onThemeToggle('light'); setCmdFeedback('> theme set: light'); return }
    if (VALID_COMMANDS.includes(c)) {
      scrollTo(c)
      setCmdFeedback(`> navigating to ${c}...`)
    } else {
      setCmdFeedback(`> unknown command: "${c}"`)
    }
    setTimeout(() => setCmdFeedback(''), 2000)
  }

  return (
    <section
      className="min-h-[calc(100vh-48px)] flex flex-col justify-center px-6 py-16 relative"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Boot static overlay */}
      {bootPhase === 'static' && (
        <div className="absolute inset-0 boot-static z-10 opacity-60" style={{ background: 'var(--bg)' }} />
      )}

      <div className="max-w-2xl mx-auto w-full space-y-1" style={{ fontFamily: 'var(--font-mono)' }}>
        {/* Name */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: 'var(--accent)' }}>
            ASH WILLS
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>musician · tech artist</p>
        </div>

        {/* Typewriter lines */}
        <div className="space-y-0.5 min-h-[4.5rem]">
          {displayedLines.map((line, i) => (
            <p key={i} className="text-sm" style={{ color: 'var(--fg)' }}>{line}</p>
          ))}
          {bootPhase === 'typing' && (
            <span className="cursor-blink text-sm" style={{ color: 'var(--fg)' }}>█</span>
          )}
        </div>

        {/* Commands */}
        {bootPhase === 'ready' && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              {COMMANDS.map((cmd) => (
                <button
                  key={cmd.label}
                  onClick={() => { scrollTo(cmd.target); setCmdFeedback(`> navigating to ${cmd.label}...`); setTimeout(() => setCmdFeedback(''), 1500) }}
                  className="text-sm px-3 py-1 border transition-colors"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--fg)',
                    background: 'transparent',
                    fontFamily: 'var(--font-mono)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--fg)'
                    e.currentTarget.style.color = 'var(--bg)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--fg)'
                  }}
                >
                  [{cmd.label}]
                </button>
              ))}
            </div>

            {/* Optional command input */}
            <div className="flex items-center gap-2 mt-2" style={{ color: 'var(--muted)' }}>
              <span className="text-sm" style={{ color: 'var(--accent)' }}>{'>'}</span>
              <input
                ref={inputRef}
                value={typingInput}
                onChange={(e) => setTypingInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    runCommand(typingInput)
                    setTypingInput('')
                  }
                }}
                placeholder="type a command..."
                className="bg-transparent text-sm outline-none flex-1 placeholder:opacity-30"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg)', caretColor: 'var(--accent)' }}
                spellCheck={false}
                autoComplete="off"
              />
              <span className="cursor-blink text-sm" style={{ color: 'var(--fg)' }}>█</span>
            </div>

            {cmdFeedback && (
              <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{cmdFeedback}</p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

// ── Section wrapper ────────────────────────────────────────────
function Section({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <section id={id} className="px-6 py-16 border-t" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-2xl mx-auto">
        <p className="text-xs mb-8 tracking-widest uppercase" style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          {'>'} {label}
        </p>
        {children}
      </div>
    </section>
  )
}

// ── Music section ──────────────────────────────────────────────
function MusicSection({ onJoinClick }: { onJoinClick: () => void }) {
  return (
    <Section id="music" label="music">
      {/* Hero */}
      <div className="relative mb-8 overflow-hidden scanlines" style={{ background: '#050a06' }}>
        <img
          src="https://images.unsplash.com/photo-1598488035139-bddb3c97c0d2?w=900&h=500&fit=crop&auto=format"
          alt="Ash Wills - Crashing Out"
          className="w-full h-56 sm:h-72 object-cover"
          style={{ filter: 'brightness(0.35) saturate(0.2) contrast(1.3)', mixBlendMode: 'screen' }}
        />
        {/* Green tint overlay */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(57,255,136,0.08) 0%, rgba(0,0,0,0.6) 100%)' }} />
        {/* Title treatment */}
        <div className="absolute inset-0 flex flex-col justify-end p-5">
          <p className="text-xs mb-1" style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>NEW SINGLE</p>
          <h2
            className="text-4xl sm:text-5xl font-bold leading-none tracking-tighter"
            style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', textShadow: '0 0 24px rgba(255,176,0,0.4)' }}
          >
            CRASHING OUT
          </h2>
        </div>
      </div>

      {/* Spotify embed */}
      <div className="mb-4">
        <iframe
          style={{ borderRadius: 0 }}
          src="https://open.spotify.com/embed/track/5elUf5WWJ69qIDsBmCfQUc?utm_source=generator&theme=0"
          width="100%"
          height="152"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title="Crashing Out — Spotify"
        />
      </div>

      {/* Links */}
      <div className="flex flex-wrap gap-3 text-sm mb-8" style={{ fontFamily: 'var(--font-mono)' }}>
        <a
          href="https://music.apple.com/us/album/crashing-out-single/6783549319"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 border transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--fg)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          apple music ↗
        </a>
        <a
          href="https://www.youtube.com/@awillsss"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 border transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--fg)' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--fg)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          youtube ↗
        </a>
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 border transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--fg)'; e.currentTarget.style.borderColor = 'var(--fg)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          instagram
        </a>
        <a
          href="https://tiktok.com"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 border transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--fg)'; e.currentTarget.style.borderColor = 'var(--fg)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          tiktok
        </a>
      </div>

      {/* CTA — peak conversion moment */}
      <div className="border p-5" style={{ borderColor: 'var(--border)' }}>
        <p className="text-sm mb-3" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
          {'>'} liked what you heard?
        </p>
        <p className="text-sm mb-4">
          Get early access to new releases, show dates, and behind-the-scenes from the studio.
        </p>
        <button
          onClick={onJoinClick}
          className="text-sm px-5 py-2 font-medium"
          style={{ background: 'var(--accent)', color: 'var(--bg)', fontFamily: 'var(--font-mono)' }}
        >
          join the list →
        </button>
      </div>
    </Section>
  )
}

// ── YouTube section ────────────────────────────────────────────
function YouTubeSection() {
  return (
    <Section id="youtube" label="youtube">
      <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'var(--font-mono)' }}>
        latest video
      </h2>
      <div className="relative w-full mb-4" style={{ paddingBottom: '56.25%', background: '#050a06' }}>
        <iframe
          className="absolute inset-0 w-full h-full"
          src="https://www.youtube.com/embed/sh8N9n_0pTM"
          title="Ash Wills — featured video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
      <a
        href="https://www.youtube.com/@awillsss"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}
      >
        {'>'} @awillsss — subscribe ↗
      </a>
    </Section>
  )
}

// ── Tour section ───────────────────────────────────────────────
function TourSection() {
  return (
    <Section id="tour" label="tour / shows">
      <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'var(--font-mono)' }}>
        shows
      </h2>
      <div className="border p-6 text-center" style={{ borderColor: 'var(--border)' }}>
        <p className="text-sm mb-2" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
          {'>'} no dates confirmed yet
        </p>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Join the list below to be first when shows drop.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <span className="cursor-blink text-xs" style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
            coming soon
          </span>
          <span className="cursor-blink text-xs" style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', animationDelay: '0.3s' }}>
            █
          </span>
        </div>
      </div>
    </Section>
  )
}

// ── Join section ───────────────────────────────────────────────
const BUTTONDOWN_KEY = import.meta.env.VITE_BUTTONDOWN_API_KEY as string | undefined

async function subscribeToButtondown(email: string, name: string): Promise<{ ok: boolean; already: boolean; detail: string }> {
  const res = await fetch('https://api.buttondown.com/v1/subscribers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${BUTTONDOWN_KEY}`,
    },
    body: JSON.stringify({
      email_address: email,
      tags: ['website'],
      metadata: { name },
    }),
  })
  if (res.ok) return { ok: true, already: false, detail: '' }
  const body = await res.json().catch(() => null)
  const detail = body?.detail || ''
  const already = /already|exist/i.test(detail)
  return { ok: false, already, detail }
}

function JoinSection() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const existing = getVisitor()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      setStatus('error')
      setMessage('> name and email required.')
      return
    }
    saveVisitor({ name: name.trim(), email: email.trim() })
    if (!BUTTONDOWN_KEY) {
      setStatus('success')
      return
    }
    setStatus('submitting')
    setMessage('')
    try {
      const result = await subscribeToButtondown(email.trim(), name.trim())
      if (result.ok) {
        setStatus('success')
      } else if (result.already) {
        setStatus('success')
        setMessage('> you were already on the list.')
      } else {
        setStatus('error')
        setMessage('> that didn\'t go through. try again, or email ash directly.')
      }
    } catch {
      setStatus('error')
      setMessage('> network error — you\'re saved locally, try again later.')
    }
  }

  if (existing || status === 'success') {
    return (
      <Section id="join" label="join">
        <div style={{ fontFamily: 'var(--font-mono)' }} className="space-y-2">
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {'>'} {message || "you're in the system."}
          </p>
          <p className="text-xl font-bold" style={{ color: 'var(--accent)' }}>
            {existing ? `welcome back, ${existing.name}.` : `you're in, ${name}.`}
          </p>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {BUTTONDOWN_KEY ? "check your inbox to confirm — you'll hear from ash when it matters." : "you'll hear from ash when it matters."}
          </p>
        </div>
      </Section>
    )
  }

  return (
    <Section id="join" label="join">
      <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-mono)' }}>join the community</h2>
      <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
        Not a newsletter. Show announcements, early drops, and studio dispatches — when there's something worth saying.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3 max-w-sm">
        <div>
          <label className="text-xs mb-1 block" style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
            {'>'} name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="your name"
            className="w-full px-3 py-2 text-sm outline-none border"
            style={{
              background: 'var(--bg)',
              color: 'var(--fg)',
              borderColor: 'var(--border)',
              fontFamily: 'var(--font-mono)',
              caretColor: 'var(--accent)',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--fg)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
          />
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
            {'>'} email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-3 py-2 text-sm outline-none border"
            style={{
              background: 'var(--bg)',
              color: 'var(--fg)',
              borderColor: 'var(--border)',
              fontFamily: 'var(--font-mono)',
              caretColor: 'var(--accent)',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--fg)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
          />
        </div>
        {status === 'error' && message && (
          <p className="text-xs" style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="px-5 py-2 text-sm font-medium mt-2"
          style={{ background: 'var(--accent)', color: 'var(--bg)', fontFamily: 'var(--font-mono)', opacity: status === 'submitting' ? 0.6 : 1 }}
        >
          {status === 'submitting' ? '> sending...' : '> send it →'}
        </button>
      </form>
    </Section>
  )
}

// ── About section ──────────────────────────────────────────────
function AboutSection() {
  return (
    <Section id="about" label="about">
      <div className="space-y-4 text-sm max-w-lg" style={{ lineHeight: '1.75' }}>
        <p>
          Ash Wills is a musician and tech artist working at the edge of electronic music
          and software. Known for layered production, noise aesthetics, and live
          performance systems that blur the line between instrument and code.
        </p>
        <p style={{ color: 'var(--muted)' }}>
          Based somewhere with bad weather and good reverb.
        </p>
      </div>
    </Section>
  )
}

// ── Root App ───────────────────────────────────────────────────
export default function App() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [isGlitching, setIsGlitching] = useState(false)

  // Sync theme to html class
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  function handleThemeToggle(next: Theme) {
    if (next === theme) return
    setIsGlitching(true)
    setTimeout(() => {
      setTheme(next)
      setIsGlitching(false)
    }, 200)
  }

  function cycleTheme() {
    handleThemeToggle(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--fg)', minHeight: '100vh' }}>
      {/* Glitch overlay */}
      {isGlitching && <div className="glitch-overlay" />}

      {/* Nav */}
      <nav
        className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 border-b"
        style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
      >
        <span className="text-sm font-bold tracking-widest uppercase" style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
          ASH WILLS
        </span>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex gap-4 text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
            {COMMANDS.map((c) => (
              <button
                key={c.label}
                onClick={() => scrollTo(c.target)}
                className="hover:underline underline-offset-3"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--fg)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted)' }}
              >
                {c.label}
              </button>
            ))}
          </div>
          {/* Theme toggle */}
          <button
            onClick={cycleTheme}
            className="text-xs px-2 py-1 border"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--muted)',
              borderColor: 'var(--border)',
            }}
            title={theme === 'dark' ? 'theme --light' : 'theme --dark'}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--fg)'; e.currentTarget.style.borderColor = 'var(--fg)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            {theme === 'dark' ? 'theme --light' : 'theme --dark'}
          </button>
        </div>
      </nav>

      {/* Terminal hero */}
      <TerminalHero theme={theme} onThemeToggle={handleThemeToggle} />

      {/* Sections */}
      <MusicSection onJoinClick={() => scrollTo('join')} />
      <YouTubeSection />
      <TourSection />
      <JoinSection />
      <AboutSection />

      {/* Footer */}
      <footer className="border-t px-6 py-6" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row justify-between gap-2 text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
          <span>© {new Date().getFullYear()} ash wills</span>
          <span>
            <button onClick={cycleTheme} className="hover:underline" style={{ color: 'var(--muted)' }}>
              {theme === 'dark' ? 'theme --light' : 'theme --dark'}
            </button>
          </span>
        </div>
      </footer>
    </div>
  )
}
