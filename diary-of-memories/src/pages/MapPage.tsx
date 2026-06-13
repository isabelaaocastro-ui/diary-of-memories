import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Memory } from '../types'
import { getInterpolatedColor, tokenizeBERT, computeActivationStats } from '../utils/tokenizer'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY as string

// ── Tiny blurred BERT thumbnail ───────────────────────────────────────────────
function BertThumbnail({ memory }: { memory: Memory }) {
  const tokens = useMemo(() => {
    const src = memory.bert_tokens?.length ? memory.bert_tokens : tokenizeBERT(memory.transcript || '')
    const step = Math.max(1, Math.floor(src.length / 8))
    return src.filter((_, i) => i % step === 0).slice(0, 8)
  }, [memory])
  const dims = [0, 9, 18, 27, 36, 45, 54, 63]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(8, 1fr)',
      gridTemplateRows: 'repeat(8, 1fr)',
      width: '100%', height: '100%',
      filter: 'blur(3px)',
      transform: 'scale(1.1)',
    }}>
      {tokens.map((token, ti) =>
        dims.map((d, di) => (
          <div key={`${ti}-${di}`} style={{ backgroundColor: getInterpolatedColor(token.embeddings[d] ?? 0) }} />
        ))
      )}
    </div>
  )
}

// ── Story card ────────────────────────────────────────────────────────────────
function StoryCard({ memory, onClick, size }: { memory: Memory; onClick: () => void; size: number }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute',
        left: memory._gridX,
        top: memory._gridY,
        width: size,
        height: size,
        cursor: 'pointer',
        overflow: 'hidden',
        border: '1px solid #000',
        background: '#fff',
      }}
    >
      {/* Corner brackets */}
      {[
        { top: 0, left: 0, borderTop: '2px solid #000', borderLeft: '2px solid #000' },
        { top: 0, right: 0, borderTop: '2px solid #000', borderRight: '2px solid #000' },
        { bottom: 0, left: 0, borderBottom: '2px solid #000', borderLeft: '2px solid #000' },
        { bottom: 0, right: 0, borderBottom: '2px solid #000', borderRight: '2px solid #000' },
      ].map((style, i) => (
        <div key={i} style={{ position: 'absolute', width: 14, height: 14, zIndex: 2, ...style }} />
      ))}

      {/* BERT thumbnail */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <BertThumbnail memory={memory} />
      </div>

      {/* Hover overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(255,255,255,0.88)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '10px', textAlign: 'center',
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.2s ease',
        zIndex: 3,
      }}>
        <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '11px', color: '#000', lineHeight: 1.3, marginBottom: 4 }}>
          {memory.story_title || 'Untitled'}
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '8px', color: '#888', letterSpacing: '1px', textTransform: 'uppercase' }}>
          {memory.location_name || ''}
        </span>
      </div>
    </div>
  )
}

// ── Fullscreen BERT panel ─────────────────────────────────────────────────────
function BertFullscreen({ memory, onClose }: { memory: Memory; onClose: () => void }) {
  const tokens = useMemo(() =>
    memory.bert_tokens?.length ? memory.bert_tokens : tokenizeBERT(memory.transcript || ''),
    [memory]
  )
  const stats = computeActivationStats(tokens)
  const pos = memory.positive_pct ?? stats.positivePercent
  const neg = memory.negative_pct ?? stats.negativePercent
  const neu = memory.neutral_pct ?? stats.neutralPercent
  const total = memory.total_tokens ?? stats.totalTokens
  const [hoveredCell, setHoveredCell] = useState<{ token: string; tokenIdx: number; dimension: number; value: number } | null>(null)

  const getLabel = (val: number) => {
    if (val > 0.4) return { text: 'Positive Activation', color: '#6BA633' }
    if (val < -0.4) return { text: 'Negative Activation', color: '#4048D9' }
    return { text: 'Neutral Activation', color: '#B3B3B3' }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#fff', zIndex: 200, overflowY: 'auto', fontFamily: "'JetBrains Mono', monospace" }}>
      <div style={{ padding: '40px 50px 100px' }}>
        <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#888', textTransform: 'uppercase', marginBottom: '30px' }}>
          BERT-BASE-MULTILINGUAL-CASED EXTRAPOLATION REPORT
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '40px', alignItems: 'start' }}>
          {/* Left */}
          <div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '32pt', lineHeight: 1.1, marginBottom: '4px', fontWeight: 'normal', fontStyle: 'italic' }}>
              {memory.story_title || 'Untitled Memory'}
            </h1>
            <div style={{ fontSize: '8pt', letterSpacing: '2px', color: '#888', textTransform: 'uppercase', marginBottom: '24px' }}>
              {(memory.location_name || '').toUpperCase()}{memory.country_code ? ` — ${memory.country_code}` : ''}{memory.created_at ? `, ${new Date(memory.created_at).getFullYear()}` : ''}
            </div>
            <div style={{ display: 'flex', width: '100%', height: '48px', border: '1px solid #000', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ width: `${pos}%`, background: '#4048D9' }} />
              <div style={{ width: `${neu}%`, background: '#e4e4e7' }} />
              <div style={{ width: `${neg}%`, background: '#6BA633' }} />
            </div>
            <div style={{ fontSize: '9px', lineHeight: 2 }}>
              <div>token estratti <strong style={{ float: 'right' }}>{total} (100%)</strong></div>
              <div style={{ color: '#6BA633' }}>positive activation <strong style={{ float: 'right' }}>{pos}%</strong></div>
              <div style={{ color: '#4048D9' }}>negative activation <strong style={{ float: 'right' }}>{neg}%</strong></div>
              <div style={{ color: '#888' }}>neutral activation <strong style={{ float: 'right' }}>{neu}%</strong></div>
            </div>
            <div style={{ border: '1px solid #ddd', padding: '12px', marginTop: '24px', fontSize: '8px', lineHeight: 1.6, color: '#444' }}>
              <div style={{ fontWeight: 'bold', color: '#b91c1c', marginBottom: '4px', textTransform: 'uppercase' }}>LIMITATION ARREST SYSTEM STATE</div>
              Despite precise subword token indexing and multidimensional mathematical representation (+2.00 to -2.00), this linguistic model possesses no conscious node for sensory reality. The subjective qualitative warmth, nostalgia, or flavor of your story exists only in human biological recollection. It is mathematically indemonstrable.
            </div>
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '8px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>continuum activation scale legend</div>
              <div style={{ height: '12px', background: 'linear-gradient(to right, #4048D9, #fff, #6BA633)', border: '1px solid #000', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 2, top: 1, fontSize: '7px', color: '#fff', mixBlendMode: 'difference' }}>-2</span>
                <span style={{ position: 'absolute', left: '50%', top: 1, transform: 'translateX(-50%)', fontSize: '7px' }}>0</span>
                <span style={{ position: 'absolute', right: 2, top: 1, fontSize: '7px', color: '#fff', mixBlendMode: 'difference' }}>+2</span>
              </div>
            </div>
          </div>
          {/* Right — heatmap */}
          <div>
            <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
              dimensione embedding 0–63 di 768
            </div>
            <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '65vh', border: '1px solid #000' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(64, 10px)', gap: '1px', minWidth: 'max-content' }}>
                {tokens.map((token, ti) => (
                  <React.Fragment key={ti}>
                    <div style={{ fontSize: '7px', display: 'flex', alignItems: 'center', paddingRight: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', height: '14px' }}>
                      {token.text}
                    </div>
                    {token.embeddings.map((val, di) => (
                      <div key={di}
                        onMouseEnter={() => setHoveredCell({ token: token.text, tokenIdx: ti, dimension: di, value: val })}
                        onMouseLeave={() => setHoveredCell(null)}
                        style={{ width: '10px', height: '14px', backgroundColor: getInterpolatedColor(val), cursor: 'pointer' }}
                      />
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div style={{ border: '1px solid #000', borderTop: 'none', padding: '8px 12px', fontSize: '9px', minHeight: '36px', display: 'flex', alignItems: 'center', gap: '32px' }}>
              {hoveredCell ? (
                <>
                  <div><span style={{ color: '#888', display: 'block', fontSize: '7px', textTransform: 'uppercase' }}>token name</span><em style={{ fontFamily: 'Georgia, serif', fontSize: '12px' }}>{hoveredCell.token}</em></div>
                  <div><span style={{ color: '#888', display: 'block', fontSize: '7px', textTransform: 'uppercase' }}>token index</span>{hoveredCell.tokenIdx}/{tokens.length - 1}</div>
                  <div><span style={{ color: '#888', display: 'block', fontSize: '7px', textTransform: 'uppercase' }}>BERT dimension</span>D{hoveredCell.dimension}</div>
                  <div><span style={{ color: '#888', display: 'block', fontSize: '7px', textTransform: 'uppercase' }}>activation force</span><span style={{ color: getLabel(hoveredCell.value).color, fontWeight: 'bold' }}>{hoveredCell.value.toFixed(2)}</span></div>
                </>
              ) : (
                <span style={{ color: '#aaa', fontStyle: 'italic' }}>Hover over cells to inspect activation values</span>
              )}
            </div>
          </div>
        </div>
      </div>
      <button onClick={onClose} style={{ position: 'fixed', bottom: '40px', right: '50px', background: '#000', color: '#fff', border: 'none', padding: '8px 20px', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', zIndex: 110 }}>
        ← BACK TO GRID
      </button>
    </div>
  )
}

// ── Dropdown filter component ─────────────────────────────────────────────────
function FilterDropdown({
  label, options, value, onChange, searchPlaceholder
}: {
  label: string; options: string[]; value: string;
  onChange: (v: string) => void; searchPlaceholder: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()))

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: value ? '#4ade80' : '#000',
          color: value ? '#000' : '#4ade80',
          border: 'none', padding: '0 16px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px', fontWeight: 'bold', letterSpacing: '2px',
          textTransform: 'uppercase', cursor: 'pointer',
          height: '40px', display: 'flex', alignItems: 'center', gap: '8px',
        }}
      >
        {label}
        {value && <span style={{ fontSize: '10px', opacity: 0.7 }}>({value})</span>}
        <span style={{ fontSize: '10px' }}>{open ? '↑' : '↓'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 0,
          background: '#000', color: '#fff',
          width: '220px', maxHeight: '320px', overflowY: 'auto',
          zIndex: 100, border: '1px solid #333',
        }}>
          {/* Header */}
          <div style={{ background: '#4ade80', color: '#000', padding: '8px 12px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {label}
            <span style={{ cursor: 'pointer' }} onClick={() => { onChange(''); setOpen(false) }}>↓</span>
          </div>
          {/* Search */}
          <div style={{ borderBottom: '1px solid #333', display: 'flex', alignItems: 'center' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              style={{ background: 'transparent', border: 'none', color: '#888', padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', width: '100%', outline: 'none' }}
            />
            <span style={{ paddingRight: '8px', color: '#555', fontSize: '10px' }}>→</span>
          </div>
          {/* Options */}
          {filtered.map(opt => (
            <div
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); setSearch('') }}
              style={{
                padding: '7px 12px', fontSize: '11px', cursor: 'pointer',
                background: value === opt ? '#4ade80' : 'transparent',
                color: value === opt ? '#000' : '#fff',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
              onMouseEnter={e => { if (value !== opt) (e.currentTarget as HTMLDivElement).style.background = '#111' }}
              onMouseLeave={e => { if (value !== opt) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
            >
              {opt}
              {value === opt && <span style={{ fontSize: '10px' }}>x</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Story title search dropdown ───────────────────────────────────────────────
function TitleDropdown({
  titles, value, onChange
}: {
  titles: string[]; value: string; onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = titles.filter(t => t.toLowerCase().includes(search.toLowerCase()))

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: value ? '#4ade80' : '#000',
          color: value ? '#000' : '#4ade80',
          border: 'none', padding: '0 16px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '11px', fontWeight: 'bold', letterSpacing: '2px',
          textTransform: 'uppercase', cursor: 'pointer',
          height: '40px', display: 'flex', alignItems: 'center', gap: '8px',
        }}
      >
        CONVERSATION'S TITLE
        {value && <span style={{ fontSize: '10px', opacity: 0.7 }}>({value.slice(0, 12)}...)</span>}
        <span style={{ fontSize: '10px' }}>{open ? '↑' : '↓'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 0,
          background: '#000', color: '#fff',
          width: '260px', maxHeight: '360px', overflowY: 'auto',
          zIndex: 100, border: '1px solid #333',
        }}>
          <div style={{ background: '#4ade80', color: '#000', padding: '8px 12px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            CONVERSATION'S TITLE
            <span style={{ cursor: 'pointer' }} onClick={() => { onChange(''); setOpen(false) }}>↓</span>
          </div>
          <div style={{ borderBottom: '1px solid #333', display: 'flex', alignItems: 'center' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="TYPE TO SEARCH"
              style={{ background: 'transparent', border: 'none', color: '#888', padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', width: '100%', outline: 'none' }}
            />
            <span style={{ paddingRight: '8px', color: '#555' }}>→</span>
          </div>
          {filtered.map(title => (
            <div
              key={title}
              onClick={() => { onChange(title); setOpen(false); setSearch('') }}
              style={{
                padding: '7px 12px', fontSize: '11px', cursor: 'pointer',
                background: value === title ? '#4ade80' : 'transparent',
                color: value === title ? '#000' : '#fff',
              }}
              onMouseEnter={e => { if (value !== title) (e.currentTarget as HTMLDivElement).style.background = '#111' }}
              onMouseLeave={e => { if (value !== title) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
            >
              {title}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Assign random-ish positions to memories for scattered grid layout ─────────
function assignGridPositions(memories: Memory[], width: number, height: number): (Memory & { _gridX: number; _gridY: number; _size: number })[] {
  const HEADER = 50
  const BOTTOM_BAR = 80
  const usableH = height - HEADER - BOTTOM_BAR - 20
  const usableW = width - 40

  // Scatter cards with varied sizes like the reference screenshot
  const sizes = [120, 90, 150, 100, 80, 130, 110, 95]
  const placed: { x: number; y: number; w: number; h: number }[] = []

  return memories.map((m, i) => {
    const size = sizes[i % sizes.length]
    let x = 0, y = 0, attempts = 0

    // Try to place without major overlap
    do {
      x = 20 + Math.floor(Math.random() * (usableW - size))
      y = HEADER + 10 + Math.floor(Math.random() * (usableH - size))
      attempts++
    } while (
      attempts < 50 &&
      placed.some(p => Math.abs(p.x - x) < size * 0.6 && Math.abs(p.y - y) < size * 0.6)
    )

    placed.push({ x, y, w: size, h: size })
    return { ...m, _gridX: x, _gridY: y, _size: size }
  })
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MapPage() {
  const navigate = useNavigate()
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)

  const [filterCountry, setFilterCountry] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [filterTitle, setFilterTitle] = useState('')

  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight })

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
    })
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    fetch(`${SUPABASE_URL}/rest/v1/memories?select=*&order=created_at.desc`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    })
      .then(r => r.json())
      .then((data: any) => {
        if (Array.isArray(data)) setMemories(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Unique filter options
  const countries = useMemo(() => [...new Set(memories.map(m => m.country_code).filter(Boolean))].sort() as string[], [memories])
  const cities = useMemo(() => [...new Set(memories.map(m => m.location_name).filter(Boolean))].sort() as string[], [memories])
  const titles = useMemo(() => memories.map(m => m.story_title).filter(Boolean) as string[], [memories])

  // Filtered list
  const filtered = useMemo(() => {
    let list = memories
    if (filterCountry) list = list.filter(m => m.country_code === filterCountry)
    if (filterCity) list = list.filter(m => m.location_name === filterCity)
    if (filterTitle) list = list.filter(m => m.story_title === filterTitle)
    return list
  }, [memories, filterCountry, filterCity, filterTitle])

  // If title search finds exactly one, open it directly
  useEffect(() => {
    if (filterTitle && filtered.length === 1) setSelectedMemory(filtered[0])
  }, [filterTitle, filtered])

  // Position cards
  const positioned = useMemo(() =>
    assignGridPositions(filtered, dimensions.width, dimensions.height),
    [filtered, dimensions]
  )

  const hasFilters = !!(filterCountry || filterCity || filterTitle)

  const clearFilters = () => {
    setFilterCountry('')
    setFilterCity('')
    setFilterTitle('')
  }

  if (selectedMemory) {
    return <BertFullscreen memory={selectedMemory} onClose={() => setSelectedMemory(null)} />
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed', inset: 0,
        background: '#fff',
        fontFamily: "'JetBrains Mono', monospace",
        overflow: 'hidden',
      }}
    >
      {/* ── Top header bar ──────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '50px',
        background: '#000', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', zIndex: 10,
      }}>
        <button
          onClick={() => navigate('/hub')}
          style={{ fontFamily: 'Georgia, serif', fontSize: '13pt', color: '#fff', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '1px' }}
        >
          DIARY OF MEMORIES
        </button>

        <button
          onClick={() => navigate('/about')}
          style={{ fontFamily: 'Georgia, serif', fontSize: '13pt', color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          From Man to Machine
        </button>

        <button
          onClick={() => navigate('/interview')}
          style={{ fontFamily: 'Georgia, serif', fontSize: '13pt', color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Find a story
        </button>
      </div>

      {/* ── Scattered cards canvas ───────────────────────────────────────────── */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* Faint grid lines like reference */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.07 }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 60} x2="100%" y2={i * 60} stroke="#000" strokeWidth="1" />
          ))}
          {Array.from({ length: 30 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 60} y1="0" x2={i * 60} y2="100%" stroke="#000" strokeWidth="1" />
          ))}
        </svg>

        {loading ? (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '10px', letterSpacing: '3px', color: '#888' }}>
            LOADING MEMORIES...
          </div>
        ) : positioned.length === 0 ? (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '10px', letterSpacing: '3px', color: '#888' }}>
            NO STORIES FOUND
          </div>
        ) : (
          positioned.map(memory => (
            <StoryCard
              key={memory.id}
              memory={memory}
              size={memory._size}
              onClick={() => setSelectedMemory(memory)}
            />
          ))
        )}
      </div>

      {/* ── Bottom bar ──────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: '#000',
        display: 'flex', alignItems: 'stretch',
        zIndex: 10, height: '80px',
      }}>
        {/* Left: filter buttons */}
        <div style={{ display: 'flex', alignItems: 'flex-end', padding: '0 0 0 0', gap: '2px', flex: 1 }}>
          <FilterDropdown
            label="COUNTRY"
            options={countries}
            value={filterCountry}
            onChange={setFilterCountry}
            searchPlaceholder="TYPE TO SEARCH"
          />
          <FilterDropdown
            label="CITY"
            options={cities}
            value={filterCity}
            onChange={setFilterCity}
            searchPlaceholder="TYPE TO SEARCH"
          />
          <TitleDropdown
            titles={titles}
            value={filterTitle}
            onChange={setFilterTitle}
          />
        </div>

        {/* Right: action buttons */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
          {hasFilters && (
            <button
              onClick={clearFilters}
              style={{
                background: '#222', color: '#4ade80',
                border: 'none', padding: '0 16px', height: '40px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px', fontWeight: 'bold', letterSpacing: '2px',
                textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              CLOSE FILTERS
            </button>
          )}
          <button
            onClick={() => navigate('/interview')}
            style={{
              background: '#000', color: '#fff',
              border: '1px solid #333', padding: '0 24px', height: '40px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px', fontWeight: 'bold', letterSpacing: '2px',
              textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            SHARE A STORY
          </button>
          <button
            onClick={() => navigate('/about')}
            style={{
              background: '#000', color: '#fff',
              border: '1px solid #333', padding: '0 24px', height: '40px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px', fontWeight: 'bold', letterSpacing: '2px',
              textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            ABOUT
          </button>
        </div>
      </div>
    </div>
  )
}
