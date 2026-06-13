import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, RefreshCw } from 'lucide-react';
import { getInterpolatedColor, computeActivationStats, tokenizeBERT } from '../utils/tokenizer';
import { saveMemory } from '../utils/saveMemory';
import html2canvas from 'html2canvas';

interface BertDiagnosticWindowProps {
  storyTitle: string;
  locationName: string;
  combinedText: string;
  countryCode: string;
  onReset: () => void;
}

// Color filter options
// 'blue-overlay' is the default: all cells are blue-tinted, hovered row reveals true color
// other filters apply a CSS filter to the whole grid
const COLOR_FILTERS = [
  { label: 'BLUE (DEFAULT)', filter: 'blue-overlay' },
  { label: 'TRUE COLORS', filter: 'none' },
  { label: 'VIOLET', filter: 'hue-rotate(260deg) saturate(1.6)' },
  { label: 'GREY', filter: 'grayscale(1)' },
]

// Tooltip messages shown on hover — reinforce the "we don't fully know why" idea
const HOVER_MESSAGES = [
  (token: string, val: number) =>
    `"${token}" activated at ${val.toFixed(2)}. The model flagged this word as ${val > 0 ? 'significant in a positive direction' : 'significant in a negative direction'} — but we don't fully know why.`,
  (token: string, val: number) =>
    `The word "${token}" (${val.toFixed(2)}) is weighted here. Whether that reflects emotion, grammar, or something else entirely, the model doesn't say.`,
  (token: string, val: number) =>
    `"${token}": activation ${val.toFixed(2)}. This dimension responded to this word. The reason remains opaque — even to the system itself.`,
  (token: string, val: number) =>
    `We know "${token}" mattered to the model at this dimension (${val.toFixed(2)}). We just don't know what that means about your memory.`,
]

function getHoverMessage(token: string, val: number, seed: number) {
  return HOVER_MESSAGES[seed % HOVER_MESSAGES.length](token, val)
}

export default function BertDiagnosticWindow({
  storyTitle, locationName, combinedText, countryCode, onReset
}: BertDiagnosticWindowProps) {
  const navigate = useNavigate()
  const tokens = tokenizeBERT(combinedText)
  const stats = computeActivationStats(tokens)

  // Save once
  const hasSaved = useRef(false)
  useEffect(() => {
    if (hasSaved.current) return
    hasSaved.current = true
    saveMemory({
      storyTitle, locationName, countryCode, transcript: combinedText,
      bertTokens: tokens,
      totalTokens: stats.totalTokens,
      positiveTokens: stats.positiveCount, positivePct: stats.positivePercent,
      negativeTokens: stats.negativeCount, negativePct: stats.negativePercent,
      neutralTokens: stats.neutralCount, neutralPct: stats.neutralPercent
    })
  }, [])

  // Selected token row (click to lock)
  const [selectedToken, setSelectedToken] = useState<{ token: string; tokenIdx: number; value: number; dimension: number } | null>(null)
  const [lockedToken, setLockedToken] = useState<{ token: string; tokenIdx: number; value: number; dimension: number } | null>(null)

  // Hovered row
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)

  // Color filter
  const [colorFilter, setColorFilter] = useState('blue-overlay')

  // Tooltip
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)

  const cardRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  const handleExportPNG = async () => {
    if (!cardRef.current) return
    setIsExporting(true)
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      const link = document.createElement('a')
      link.download = `BERT_${(storyTitle || 'memory').replace(/\s+/g, '_')}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) { console.error(err) }
    setIsExporting(false)
  }

  // Proportional scale marker
  const total = stats.positivePercent + stats.negativePercent + stats.neutralPercent || 1
  const sliderPos = 50 + ((stats.positivePercent - stats.negativePercent) / total) * 50

  // Transcript lines
  const transcriptLines = combinedText.split('.').map(s => s.trim()).filter(Boolean)

  // Active display token (locked takes priority over hovered)
  const activeToken = lockedToken || selectedToken

  // handleCellHover and handleCellLeave are now inlined per-cell in the heatmap grid
  // to allow per-row blue-overlay reveal logic

  const handleCellClick = (token: string, ti: number, di: number, val: number) => {
    if (lockedToken && lockedToken.tokenIdx === ti && lockedToken.dimension === di) {
      setLockedToken(null) // click again to unlock
    } else {
      setLockedToken({ token, tokenIdx: ti, value: val, dimension: di })
    }
  }

  const getActivationColor = (val: number) => {
    if (val > 0.4) return '#6BA633'
    if (val < -0.4) return '#4048D9'
    return '#B3B3B3'
  }

  return (
    <div
      ref={cardRef}
      style={{
        position: 'fixed', inset: 0,
        background: '#fff',
        fontFamily: "'JetBrains Mono', monospace",
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ── Big blue title ─────────────────────────────────────────────────── */}
      <div style={{
        background: '#3333cc', color: '#fff',
        padding: '16px 32px',
        fontFamily: 'Georgia, serif',
        fontSize: '24pt', fontWeight: 'normal',
        textTransform: 'uppercase', letterSpacing: '2px',
        flexShrink: 0,
      }}>
        {storyTitle || 'Untitled Memory'}
      </div>

      {/* ── Info row ───────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 2fr',
        borderBottom: '1px solid #000', flexShrink: 0,
      }}>
        <div style={{ padding: '8px 16px', borderRight: '1px solid #000' }}>
          <div style={{ fontSize: '8px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Location</div>
          <div style={{ fontSize: '11pt' }}>{locationName || '—'}</div>
        </div>
        <div style={{ padding: '8px 16px', borderRight: '1px solid #000' }}>
          <div style={{ fontSize: '8px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Embedding dimension</div>
          <div style={{ fontSize: '11pt' }}>0–63 di 768</div>
        </div>
        <div style={{ padding: '8px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ fontSize: '8px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>CONTINUUM ACTIVATION SCALE</span>
            <div
              title="The marker shows the overall balance of your story. Leaning green = more positive activations. Leaning blue = more negative. We know something was important to the model — but not exactly why."
              style={{ width: '16px', height: '16px', border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold', cursor: 'help', flexShrink: 0 }}
            >!</div>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ height: '20px', background: 'linear-gradient(to right, #4048D9, #ffffff, #6BA633)', border: '1px solid #ccc', position: 'relative' }}>
              <div style={{ position: 'absolute', left: `${sliderPos}%`, top: '50%', transform: 'translate(-50%, -50%)', width: '2px', height: '28px', background: '#000', zIndex: 2 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#666', marginTop: '2px' }}>
              <span>-2.0</span><span>0</span><span>+2.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Color filter bar ───────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '2px',
        padding: '6px 16px', borderBottom: '1px solid #000',
        flexShrink: 0, background: '#fafafa',
      }}>
        <span style={{ fontSize: '8px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginRight: '8px' }}>VIEW FILTER:</span>
        {COLOR_FILTERS.map(f => (
          <button
            key={f.label}
            onClick={() => setColorFilter(f.filter)}
            style={{
              padding: '3px 10px', fontSize: '8px', letterSpacing: '1px',
              textTransform: 'uppercase', cursor: 'pointer',
              border: '1px solid #000',
              background: colorFilter === f.filter ? '#000' : '#fff',
              color: colorFilter === f.filter ? '#fff' : '#000',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >{f.label}</button>
        ))}
        <span style={{ marginLeft: '16px', fontSize: '8px', color: '#aaa', fontStyle: 'italic' }}>
          Hover a row to reveal its true colors · click to lock
        </span>
      </div>

      {/* ── Main two-column body ────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden' }}>

        {/* LEFT: heatmap */}
        <div style={{ borderRight: '1px solid #000', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '70px repeat(64, 9px)',
              gap: '1px', padding: '8px',
              minWidth: 'max-content',
              // Non-blue-overlay filters apply to the whole grid
              filter: (colorFilter !== 'none' && colorFilter !== 'blue-overlay') ? colorFilter : undefined,
            }}>
              {tokens.map((token, ti) => {
                const isLockedRow = lockedToken?.tokenIdx === ti
                const isHoveredRow = hoveredRow === ti
                // A row is "revealed" (shows true color) when:
                // - blue-overlay is ON and this row is hovered or locked
                // - blue-overlay is OFF (all rows always show true color)
                const isRevealed = colorFilter !== 'blue-overlay' || isHoveredRow || isLockedRow

                return (
                  <React.Fragment key={ti}>
                    {/* Token label */}
                    <div
                      onMouseEnter={() => setHoveredRow(ti)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{
                        fontSize: '7px', display: 'flex', alignItems: 'center',
                        paddingRight: '4px', overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap', height: '13px',
                        color: isLockedRow ? '#3333cc' : isHoveredRow ? '#000' : '#555',
                        fontWeight: (isLockedRow || isHoveredRow) ? 'bold' : 'normal',
                        cursor: 'default',
                      }}>
                      {token.text}
                    </div>
                    {/* Embedding cells */}
                    {token.embeddings.map((val, di) => {
                      const isLockedCell = lockedToken?.tokenIdx === ti && lockedToken?.dimension === di
                      // True color of this cell
                      const trueColor = getInterpolatedColor(val)
                      // Blue-tinted color: shift everything toward a deep blue
                      const blueColor = '#4048D9'

                      return (
                        <div
                          key={di}
                          onMouseEnter={() => {
                            setHoveredRow(ti)
                            setSelectedToken({ token: token.text, tokenIdx: ti, value: val, dimension: di })
                          }}
                          onMouseMove={e => {
                            const seed = ti * 7 + di
                            setTooltip({ x: e.clientX, y: e.clientY, text: getHoverMessage(token.text, val, seed) })
                          }}
                          onMouseLeave={() => {
                            setHoveredRow(null)
                            if (!lockedToken) setSelectedToken(null)
                            setTooltip(null)
                          }}
                          onClick={() => handleCellClick(token.text, ti, di, val)}
                          style={{
                            width: '9px', height: '13px',
                            // In blue-overlay mode: show blue unless this row is revealed
                            backgroundColor: isRevealed ? trueColor : blueColor,
                            cursor: 'pointer',
                            outline: isLockedCell ? '2px solid #fff' : 'none',
                            outlineOffset: '-1px',
                            // Dim other rows when a row is locked
                            opacity: lockedToken && !isLockedRow ? 0.4 : 1,
                            transition: 'background-color 0.18s ease, opacity 0.15s',
                          }}
                        />
                      )
                    })}
                  </React.Fragment>
                )
              })}
            </div>
          </div>

          {/* Info bar */}
          <div style={{ borderTop: '1px solid #000', display: 'flex', flexShrink: 0, minHeight: '44px' }}>
            {activeToken ? (
              <>
                <div style={{ padding: '6px 12px', borderRight: '1px solid #000', background: '#000', minWidth: '110px' }}>
                  <div style={{ fontSize: '7px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Token name</div>
                  <div style={{ fontSize: '10px', color: '#6BA633', fontWeight: 'bold' }}>{activeToken.token}</div>
                </div>
                <div style={{ padding: '6px 12px', borderRight: '1px solid #000' }}>
                  <div style={{ fontSize: '7px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>N Token</div>
                  <div style={{ fontSize: '10px' }}>{activeToken.tokenIdx}/{tokens.length}</div>
                </div>
                <div style={{ padding: '6px 12px', borderRight: '1px solid #000' }}>
                  <div style={{ fontSize: '7px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Dimension</div>
                  <div style={{ fontSize: '10px' }}>D{activeToken.dimension}</div>
                </div>
                <div style={{ padding: '6px 12px' }}>
                  <div style={{ fontSize: '7px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Activation</div>
                  <div style={{ fontSize: '10px', color: getActivationColor(activeToken.value), fontWeight: 'bold' }}>{activeToken.value.toFixed(2)}</div>
                </div>
                {lockedToken && (
                  <div style={{ padding: '6px 12px', marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                    <button onClick={() => setLockedToken(null)} style={{ fontSize: '8px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '1px' }}>
                      UNLOCK ROW
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: '8px 12px', fontSize: '9px', color: '#aaa', fontStyle: 'italic', display: 'flex', alignItems: 'center' }}>
                Hover over a cell to explore · click to lock a token row
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: transcript */}
        <div style={{ overflowY: 'auto', padding: '24px 28px' }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '13pt', lineHeight: 1.8, color: '#000' }}>
            {transcriptLines.map((line, i) => {
              const words = line.split(' ')
              const highlightIdx = words.findIndex(w => w.length > 6)
              return (
                <p key={i} style={{ marginBottom: '10px' }}>
                  {words.map((word, wi) => (
                    <span key={wi} style={{ color: wi === highlightIdx ? '#6BA633' : '#000' }}>
                      {word}{wi < words.length - 1 ? ' ' : ''}
                    </span>
                  ))}
                </p>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Bottom action bar ───────────────────────────────────────────────── */}
      <div style={{
        borderTop: '1px solid #000',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: '52px',
        background: '#fff', flexShrink: 0,
      }}>
        <button
          onClick={handleExportPNG}
          disabled={isExporting}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            border: '1px solid #000', background: '#fff', padding: '8px 16px',
            fontFamily: "'JetBrains Mono', monospace", fontSize: '10px',
            textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer',
          }}
        >
          <Download size={14} /> {isExporting ? 'EXPORTING...' : 'DOWNLOAD PNG'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/map')}
            style={{
              border: '1px solid #ddd', background: '#fff', padding: '8px 24px',
              fontFamily: "'JetBrains Mono', monospace", fontSize: '10px',
              textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', color: '#888',
            }}
          >
            SEE ALL MEMORIES
          </button>
          <button
            onClick={onReset}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              border: 'none', background: 'none',
              fontFamily: "'JetBrains Mono', monospace", fontSize: '10px',
              textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer', color: '#888',
              textDecoration: 'underline',
            }}
          >
            <RefreshCw size={12} /> TRANSCRIBE A NEW MEMORY
          </button>
        </div>
      </div>

      {/* ── System footer ───────────────────────────────────────────────────── */}
      <div style={{
        borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between',
        padding: '3px 20px', background: '#fff', flexShrink: 0,
      }}>
        <span style={{ fontSize: '8px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>
          SYSTEM STATUS: EMBEDDINGS_EXTRACTED | DIM_X: 64 | DIM_Y: {stats.totalTokens} TOKENS | LATENCY: 24MS
        </span>
        <span style={{ fontSize: '8px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>
          SAMPLES_LOADED // TRIAL_9883_ACTIVE
        </span>
      </div>

      {/* ── Floating tooltip ────────────────────────────────────────────────── */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 16,
          top: tooltip.y - 8,
          maxWidth: '280px',
          background: '#000', color: '#fff',
          padding: '10px 14px',
          fontSize: '10px', lineHeight: 1.6,
          fontFamily: "'JetBrains Mono', monospace",
          pointerEvents: 'none',
          zIndex: 999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          {tooltip.text}
          <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #333', fontSize: '8px', color: '#888', fontStyle: 'italic' }}>
            The model registered this. The reason remains opaque.
          </div>
        </div>
      )}
    </div>
  )
}
