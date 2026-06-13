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
const COLOR_FILTERS = [
  { label: 'FOCUS MODE', filter: 'blue-overlay' },
  { label: 'ORIGINAL COLORS', filter: 'none' },
]

// Dimension concepts — what each of the 64 sampled dimensions broadly captures
// These are illustrative labels based on known BERT attention patterns
const DIMENSION_CONCEPTS: Record<number, string> = {
  0:  'syntactic structure',
  1:  'sentence boundaries',
  2:  'subject–verb relations',
  3:  'tense and temporality',
  4:  'negation patterns',
  5:  'spatial references',
  6:  'emotional valence',
  7:  'entity salience',
  8:  'causal relationships',
  9:  'sensory language',
  10: 'named locations',
  11: 'abstract concepts',
  12: 'concrete objects',
  13: 'person references',
  14: 'movement and action',
  15: 'intensity modifiers',
  16: 'contextual grounding',
  17: 'discourse markers',
  18: 'memory and recall',
  19: 'contrast and opposition',
  20: 'certainty and doubt',
  21: 'social relationships',
  22: 'time expressions',
  23: 'sensory-motor integration',
  24: 'narrative sequence',
  25: 'body and physicality',
  26: 'light and visual perception',
  27: 'sound and auditory cues',
  28: 'temperature and touch',
  29: 'smell and taste',
  30: 'desire and intention',
  31: 'surprise and novelty',
  32: 'fear and threat',
  33: 'joy and warmth',
  34: 'loss and absence',
  35: 'belonging and place',
  36: 'grammatical function',
  37: 'subword morphology',
  38: 'word frequency signals',
  39: 'cultural references',
  40: 'numeric and quantity',
  41: 'comparison patterns',
  42: 'metaphor and imagery',
  43: 'uncertainty markers',
  44: 'completion and endings',
  45: 'beginning and origin',
  46: 'depth of experience',
  47: 'shared vs. private',
  48: 'motion trajectory',
  49: 'stillness and pause',
  50: 'color and texture',
  51: 'scale and distance',
  52: 'repetition patterns',
  53: 'transition signals',
  54: 'human vs. non-human',
  55: 'interior vs. exterior',
  56: 'familiarity and recognition',
  57: 'surprise and the unexpected',
  58: 'collective memory',
  59: 'individual experience',
  60: 'language register',
  61: 'cross-lingual patterns',
  62: 'contextual emphasis',
  63: 'global sentence meaning',
}

// Build tooltip text based on activation strength and dimension concept
function getHoverMessage(token: string, val: number, dimension: number): { main: string; sub: string; relevance: 'high' | 'low' } {
  const abs = Math.abs(val)
  const dimConcept = DIMENSION_CONCEPTS[dimension] ?? `pattern ${dimension}`
  const direction = val > 0 ? 'positively' : 'negatively'

  if (abs >= 1) {
    // High relevance — the model found this important
    const mains = [
      `The model found "${token}" strongly relevant here — it activated ${direction} at ${val.toFixed(2)} on the dimension of ${dimConcept}.`,
      `"${token}" crossed the relevance threshold (${val.toFixed(2)}). For this dimension — ${dimConcept} — the model registered this word as meaningful.`,
      `Strong signal: "${token}" activated at ${val.toFixed(2)}. In terms of ${dimConcept}, the model treated this as significant.`,
    ]
    return {
      main: mains[Math.abs(Math.round(val * 10 + dimension)) % mains.length],
      sub: "We know it mattered. We don't fully know why.",
      relevance: 'high',
    }
  } else {
    // Low relevance — the model found this less important
    const mains = [
      `"${token}" registered weakly here (${val.toFixed(2)}). For the dimension of ${dimConcept}, the model considered this less central to meaning.`,
      `Low activation: "${token}" at ${val.toFixed(2)}. On the axis of ${dimConcept}, this word didn't strongly shape the model's understanding.`,
      `The model passed over "${token}" on this dimension (${dimConcept}, ${val.toFixed(2)}). Not everything in a sentence carries equal weight.`,
    ]
    return {
      main: mains[Math.abs(Math.round(val * 10 + dimension)) % mains.length],
      sub: 'The model registered this as background — not foreground.',
      relevance: 'low',
    }
  }
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

  // Hovered row and dimension
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)
  const [hoveredDim, setHoveredDim] = useState<number | null>(null)

  // Color filter
  const [colorFilter, setColorFilter] = useState('blue-overlay')

  // Tooltip
  const [tooltip, setTooltip] = useState<{ x: number; y: number; msg: ReturnType<typeof getHoverMessage> } | null>(null)

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
          Hover a row to reveal its true colors · click to keep it revealed
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
              // CSS filter only applies in non-overlay modes
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
                            setHoveredDim(di)
                            setSelectedToken({ token: token.text, tokenIdx: ti, value: val, dimension: di })
                            const msg = getHoverMessage(token.text, val, di)
                            setTooltip({ x: 0, y: 0, msg })
                          }}
                          onMouseMove={e => {
                            const msg = getHoverMessage(token.text, val, di)
                            setTooltip({ x: e.clientX, y: e.clientY, msg })
                          }}
                          onMouseLeave={() => {
                            setHoveredRow(null)
                            setHoveredDim(null)
                            if (!lockedToken) setSelectedToken(null)
                            setTooltip(null)
                          }}
                          onClick={() => handleCellClick(token.text, ti, di, val)}
                          style={{
                            width: '9px', height: '13px',
                            // Always show true color underneath
                            backgroundColor: trueColor,
                            position: 'relative',
                            cursor: 'pointer',
                            outline: isLockedCell ? '2px solid #000' : 'none',
                            outlineOffset: '-1px',
                            // Dim non-locked rows when something is locked
                            opacity: lockedToken && !isLockedRow ? 0.5 : 1,
                            // Column highlight via box shadow
                            boxShadow: hoveredDim === di ? 'inset 0 0 0 1px rgba(0,0,0,0.4)' : 'none',
                            transition: 'opacity 0.15s, box-shadow 0.1s',
                          }}
                        >
                          {/* Multiply-style blue overlay — covers non-revealed rows in focus mode */}
                          {colorFilter === 'blue-overlay' && !isRevealed && (
                            <div style={{
                              position: 'absolute', inset: 0,
                              backgroundColor: '#6060ff',
                              mixBlendMode: 'multiply',
                              pointerEvents: 'none',
                              transition: 'opacity 0.2s ease',
                              opacity: 0.85,
                            }} />
                          )}
                        </div>
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
                <div style={{ padding: '6px 12px', borderRight: '1px solid #000', minWidth: '180px' }}>
                  <div style={{ fontSize: '7px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>
                    D{activeToken.dimension} — what this column tracks
                  </div>
                  <div style={{ fontSize: '10px', color: '#6BA633', fontWeight: 'bold', textTransform: 'lowercase' }}>
                    {DIMENSION_CONCEPTS[activeToken.dimension] ?? 'unknown pattern'}
                  </div>
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
          left: Math.min(tooltip.x + 16, window.innerWidth - 320),
          top: Math.max(tooltip.y - 80, 8),
          width: '300px',
          background: '#000', color: '#fff',
          padding: '12px 14px',
          fontSize: '10px', lineHeight: 1.65,
          fontFamily: "'JetBrains Mono', monospace",
          pointerEvents: 'none',
          zIndex: 999,
          boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
        }}>
          {/* Relevance badge */}
          <div style={{
            display: 'inline-block',
            fontSize: '8px', letterSpacing: '1.5px', textTransform: 'uppercase',
            padding: '2px 7px', marginBottom: '8px',
            background: tooltip.msg.relevance === 'high' ? '#4048D9' : '#444',
            color: '#fff',
          }}>
            {tooltip.msg.relevance === 'high' ? '● RELEVANT TO MODEL' : '○ LESS RELEVANT'}
          </div>

          {/* Dimension concept label */}
          {selectedToken && (
            <div style={{
              fontSize: '8px', color: '#6BA633', textTransform: 'uppercase',
              letterSpacing: '1px', marginBottom: '8px',
            }}>
              DIMENSION {selectedToken.dimension} — {(DIMENSION_CONCEPTS[selectedToken.dimension] ?? 'unknown pattern').toUpperCase()}
            </div>
          )}

          {/* Main message */}
          <div style={{ marginBottom: '8px', color: '#eee' }}>
            {tooltip.msg.main}
          </div>

          {/* Sub note */}
          <div style={{
            paddingTop: '6px', borderTop: '1px solid #333',
            fontSize: '8px', color: '#888', fontStyle: 'italic',
          }}>
            {tooltip.msg.sub}
          </div>
        </div>
      )}
    </div>
  )
}
