import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Memory } from '../types'
import { getInterpolatedColor, tokenizeBERT, computeActivationStats } from '../utils/tokenizer'
import { Info, RefreshCw, Download, Award, Search, X } from 'lucide-react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY as string

// ── Tiny 8×8 blurred BERT thumbnail ──────────────────────────────────────────
function BertThumbnail({ memory }: { memory: Memory }) {
  const tokens = useMemo(() => {
    const src = memory.bert_tokens?.length ? memory.bert_tokens : tokenizeBERT(memory.transcript || '')
    // Sample 8 tokens evenly
    const step = Math.max(1, Math.floor(src.length / 8))
    return src.filter((_, i) => i % step === 0).slice(0, 8)
  }, [memory])

  // 8 dimensions evenly sampled from 64
  const dims = [0, 9, 18, 27, 36, 45, 54, 63]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(8, 1fr)',
      gridTemplateRows: 'repeat(8, 1fr)',
      width: '100%',
      height: '100%',
      filter: 'blur(4px)',
      transform: 'scale(1.08)', // compensate blur edges
    }}>
      {tokens.map((token, ti) =>
        dims.map((d, di) => (
          <div
            key={`${ti}-${di}`}
            style={{ backgroundColor: getInterpolatedColor(token.embeddings[d] ?? 0) }}
          />
        ))
      )}
    </div>
  )
}

// ── Story card ────────────────────────────────────────────────────────────────
function StoryCard({ memory, onClick }: { memory: Memory; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        border: '1px solid #000',
        aspectRatio: '1',
        cursor: 'pointer',
        overflow: 'hidden',
        background: '#fff',
      }}
    >
      {/* Corner brackets — like the screenshots */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: 16, height: 16, borderTop: '1px solid #000', borderLeft: '1px solid #000', zIndex: 2, background: 'transparent' }} />
      <div style={{ position: 'absolute', top: 0, right: 0, width: 16, height: 16, borderTop: '1px solid #000', borderRight: '1px solid #000', zIndex: 2 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 16, height: 16, borderBottom: '1px solid #000', borderLeft: '1px solid #000', zIndex: 2 }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, borderBottom: '1px solid #000', borderRight: '1px solid #000', zIndex: 2 }} />

      {/* BERT thumbnail — always visible */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <BertThumbnail memory={memory} />
      </div>

      {/* Hover overlay — name + place */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(255,255,255,0.82)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '12px', textAlign: 'center',
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.25s ease-in-out',
        zIndex: 3,
      }}>
        <span style={{
          fontFamily: 'Georgia, serif', fontStyle: 'italic',
          fontSize: '13px', color: '#000', lineHeight: 1.3, marginBottom: 4,
        }}>
          {memory.story_title || 'Untitled'}
        </span>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '9px', color: '#888', letterSpacing: '1px', textTransform: 'uppercase',
        }}>
          {memory.location_name || memory.country_code || ''}
        </span>
      </div>
    </div>
  )
}

// ── Full BERT diagnostic panel (fullscreen, like image 3) ─────────────────────
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
    <div style={{
      position: 'fixed', inset: 0, background: '#fff', zIndex: 100,
      overflowY: 'auto', fontFamily: "'JetBrains Mono', monospace",
    }}>
      <div style={{ padding: '40px 50px 100px' }}>

        {/* Header */}
        <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#888', textTransform: 'uppercase', marginBottom: '30px' }}>
          BERT-BASE-MULTILINGUAL-CASED EXTRAPOLATION REPORT
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '40px', alignItems: 'start' }}>

          {/* Left column */}
          <div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '32pt', lineHeight: 1.1, marginBottom: '4px', fontWeight: 'normal', fontStyle: 'italic' }}>
              {memory.story_title || 'Untitled Memory'}
            </h1>
            <div style={{ fontSize: '8pt', letterSpacing: '2px', color: '#888', textTransform: 'uppercase', marginBottom: '24px' }}>
              {(memory.location_name || '').toUpperCase()}
              {memory.country_code ? ` — ${memory.country_code}` : ''}
              {memory.created_at ? `, ${new Date(memory.created_at).getFullYear()}` : ''}
            </div>

            {/* Activation bar */}
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

            {/* Limitation box */}
            <div style={{ border: '1px solid #ddd', padding: '12px', marginTop: '24px', fontSize: '8px', lineHeight: 1.6, color: '#444' }}>
              <div style={{ fontWeight: 'bold', color: '#b91c1c', marginBottom: '4px', textTransform: 'uppercase' }}>LIMITATION ARREST SYSTEM STATE</div>
              Despite precise subword token indexing and multidimensional mathematical representation (+2.00 to -2.00), this linguistic model possesses no conscious node for sensory reality. The subjective qualitative warmth, nostalgia, or flavor of your story exists only in human biological recollection. It is mathematically indemonstrable.
            </div>

            {/* Scale legend */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '8px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>continuum activation scale legend</div>
              <div style={{ height: '12px', background: 'linear-gradient(to right, #4048D9, #fff, #6BA633)', border: '1px solid #000', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 2, top: 1, fontSize: '7px', color: '#fff', mixBlendMode: 'difference' }}>-2</span>
                <span style={{ position: 'absolute', left: '50%', top: 1, transform: 'translateX(-50%)', fontSize: '7px', color: '#000' }}>0</span>
                <span style={{ position: 'absolute', right: 2, top: 1, fontSize: '7px', color: '#fff', mixBlendMode: 'difference' }}>+2</span>
              </div>
            </div>
          </div>

          {/* Right column — heatmap */}
          <div>
            <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
              dimensione embedding 0-63-di-768
            </div>

            {/* Token rows */}
            <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '65vh', border: '1px solid #000' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(64, 10px)', gap: '1px', minWidth: 'max-content' }}>
                {tokens.map((token, ti) => (
                  <React.Fragment key={ti}>
                    <div style={{ fontSize: '7px', display: 'flex', alignItems: 'center', paddingRight: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#000', height: '14px' }}>
                      {token.text}
                    </div>
                    {token.embeddings.map((val, di) => (
                      <div
                        key={di}
                        title={`${token.text} · D${di} · ${val.toFixed(3)}`}
                        onMouseEnter={() => setHoveredCell({ token: token.text, tokenIdx: ti, dimension: di, value: val })}
                        onMouseLeave={() => setHoveredCell(null)}
                        style={{ width: '10px', height: '14px', backgroundColor: getInterpolatedColor(val), cursor: 'pointer' }}
                      />
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Hover info bar */}
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

      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'fixed', bottom: '40px', right: '50px',
          background: '#000', color: '#fff', border: 'none',
          padding: '8px 20px', fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase',
          cursor: 'pointer', zIndex: 110,
        }}
      >
        ← BACK TO GRID
      </button>
    </div>
  )
}

// ── Main grid page ────────────────────────────────────────────────────────────
export default function MapPage() {
  const navigate = useNavigate()
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<string>('')

  useEffect(() => {
    console.log('Supabase URL:', SUPABASE_URL)
    console.log('Supabase KEY present:', !!SUPABASE_KEY)
    fetch(`${SUPABASE_URL}/rest/v1/memories?select=*&order=created_at.desc`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    })
      .then(r => {
        console.log('Supabase status:', r.status)
        return r.json()
      })
      .then((data: any) => {
        console.log('Supabase data:', data)
        if (Array.isArray(data)) {
          setMemories(data)
        } else {
          console.error('Bad response:', data)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Fetch failed:', err)
        setLoading(false)
      })
  }, [])

  // Unique countries for dropdown
  const countries = useMemo(() => {
    const set = new Set<string>()
    memories.forEach(m => { if (m.country_code) set.add(m.country_code) })
    return Array.from(set).sort()
  }, [memories])

  // Filtered memories
  const filtered = useMemo(() => {
    let list = memories
    if (selectedCountry) list = list.filter(m => m.country_code === selectedCountry)
    if (searchQuery) list = list.filter(m =>
      m.story_title?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    return list
  }, [memories, selectedCountry, searchQuery])

  // If search finds exactly one result, open it directly
  useEffect(() => {
    if (searchQuery && filtered.length === 1) {
      setSelectedMemory(filtered[0])
    }
  }, [searchQuery, filtered])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery(searchInput)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSearchInput('')
    setSelectedCountry('')
  }

  if (selectedMemory) {
    return <BertFullscreen memory={selectedMemory} onClose={() => setSelectedMemory(null)} />
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 40px', borderBottom: '1px solid #000',
        position: 'sticky', top: 0, background: '#fff', zIndex: 10,
      }}>
        {/* Left: title + place filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button
            onClick={() => navigate('/hub')}
            style={{ fontFamily: 'Georgia, serif', fontSize: '14pt', fontWeight: 'normal', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '1px' }}
          >
            DIARY OF MEMORIES
          </button>

          {/* Place / country dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedCountry}
              onChange={e => setSelectedCountry(e.target.value)}
              style={{
                fontFamily: 'Georgia, serif', fontSize: '18pt',
                border: '1px solid #000', padding: '4px 36px 4px 12px',
                background: '#fff', cursor: 'pointer', appearance: 'none',
                color: selectedCountry ? '#000' : '#000',
              }}
            >
              <option value="">Select Place ▾</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Show country name when filtered */}
          {selectedCountry && (
            <span style={{ fontFamily: 'Georgia, serif', fontSize: '24pt', fontWeight: 'normal' }}>
              {selectedCountry}
            </span>
          )}
        </div>

        {/* Right: about link + search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <button
            onClick={() => navigate('/about')}
            style={{ fontFamily: 'Georgia, serif', fontSize: '14pt', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            From Man To Machine
          </button>

          {/* Search form */}
          <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', border: '1px solid #000' }}>
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="SEARCH STORY"
              style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: '9px',
                padding: '6px 10px', border: 'none', outline: 'none',
                letterSpacing: '1px', width: '160px', background: '#fff',
              }}
            />
            <button type="submit" style={{ background: '#fff', border: 'none', borderLeft: '1px solid #000', padding: '6px 10px', cursor: 'pointer' }}>
              <Search size={14} />
            </button>
          </form>

          {/* Clear filters */}
          {(searchQuery || selectedCountry) && (
            <button
              onClick={clearFilters}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <X size={10} /> clear
            </button>
          )}
        </div>
      </header>

      {/* ── Grid ────────────────────────────────────────────────────────────── */}
      <main style={{ padding: '32px 40px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', fontSize: '10px', color: '#888', letterSpacing: '2px' }}>
            LOADING MEMORIES...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', fontSize: '10px', color: '#888', letterSpacing: '2px' }}>
            NO STORIES FOUND
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '24px',
          }}>
            {filtered.map(memory => (
              <StoryCard
                key={memory.id}
                memory={memory}
                onClick={() => setSelectedMemory(memory)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
