import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CONSTELLATION = [
  { text: "17966", leftPercent: 2,  top: "50px" },
  { text: "25203", leftPercent: 27, top: "50px" },
  { text: "3963",  leftPercent: 17, top: "150px" },
  { text: "30971", leftPercent: 22, top: "250px" },
  { text: "1794",  leftPercent: 52, top: "250px" },
  { text: "40955", leftPercent: 82, top: "250px" },
  { text: "11",    leftPercent: 2,  top: "350px" },
  { text: "16085", leftPercent: 15, top: "450px" },
  { text: "31179", leftPercent: 40, top: "450px" },
  { text: "5765",  leftPercent: 2,  top: "550px" },
  { text: "5082",  leftPercent: 24, top: "550px" },
  { text: "3398",  leftPercent: 47, top: "550px" },
  { text: "41098", leftPercent: 69, top: "550px" },
]

const QUOTES = [
  {
    code:  "4242 80946 257 5157 14197 3448 35919 311 592 294 271 257 39591 323 37172 1195",
    words: "We perceive a mind wherever something responds to us in a coherent and adaptive way",
  },
  {
    code:  "1775 279 6743 24707 13133 323 10243 1166 311 592 11 392 1109 729 27042 1068 311 320 1205 13",
    words: "When the machine describes emotions and sensations to us, we end up believing them to be real.",
  },
]

type Phase = 'terminal' | 'constellation' | 'title' | 'quotes' | 'done'

export default function IntroPage() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('terminal')
  const [logs, setLogs] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  const [showTitle, setShowTitle] = useState(false)
  const [titleFading, setTitleFading] = useState(false)
  const logEndRef = useRef<HTMLDivElement>(null)

  // quote slide state
  const [quoteStep, setQuoteStep] = useState(0)       // 0 or 1
  const [quoteVisible, setQuoteVisible] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [quoteBg, setQuoteBg] = useState(1.0)         // white bg opacity

  // ── Phase 1: terminal log sequence ──────────────────────────────────────────
  useEffect(() => {
    const lines = [
      "Loading bert-base-multilingual-cased model weights...",
      "BertModel LOAD REPORT from: bert-base-multilingual-cased",
      "Key                                     | Status      |",
      "----------------------------------------+-------------+",
      "SYSTEM: Initializing Diary of Memories network protocol layer over HTTP/2...",
      "MAPBOX: Handshake request dispatched to cluster endpoints on api.mapbox.com",
      "DATABASE: Stream established. Fetching serialized entries...",
      "[DECODER] Tokenizing dictionary inputs into multidimensional raw byte vectors:",
      "--------------------------------------------------------------------------------",
      `MEM_PTR [0x${randHex()}:${randHex(4)}] => mapping local state registers...`,
      `  tensor([ [48.858844], [2.294351] ], idx=0, val_dim=768)`,
      `  attn_weights_layer_0 = [ ${randTokens()} ]`,
      `MEM_PTR [0x${randHex()}:${randHex(4)}] => mapping local state registers...`,
      `  tensor([ [35.689487], [139.691711] ], idx=1, val_dim=768)`,
      `  attn_weights_layer_1 = [ ${randTokens()} ]`,
      "--------------------------------------------------------------------------------",
      "MATRIX_STATUS: RAM memory mapping complete. Structural threads terminated.",
    ]

    let i = 0
    const timer = setInterval(() => {
      if (i < lines.length) {
        setLogs(prev => [...prev, lines[i]])
        i++
      } else {
        clearInterval(timer)
        startLoadingBar()
      }
    }, 80)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  function randHex(len = 6) {
    return Math.floor(Math.random() * Math.pow(16, len)).toString(16).toUpperCase().padStart(len, '0')
  }
  function randTokens() {
    return Array.from({ length: 9 }, () => Math.floor(1000 + Math.random() * 32000)).join(', ')
  }

  function startLoadingBar() {
    let current = 0
    const total = 199
    const timer = setInterval(() => {
      current += Math.floor(Math.random() * 5) + 3
      if (current >= total) {
        current = total
        clearInterval(timer)
        setTimeout(() => setPhase('constellation'), 800)
      }
      setProgress(Math.min(current / total, 1))
    }, 80)
  }

  // ── Phase 2: constellation decode animation ──────────────────────────────────
  useEffect(() => {
    if (phase !== 'constellation') return

    const items = CONSTELLATION
    let scanX = 0
    const activated = new Set<number>()
    const resolved = new Set<number>()

    const scanInterval = setInterval(() => {
      if (scanX <= 100) {
        items.forEach((item, idx) => {
          if (!activated.has(idx) && scanX >= item.leftPercent) {
            activated.add(idx)
            decodeItem(idx, () => resolved.add(idx))
          }
        })
        scanX += 1.5
      } else {
        if (resolved.size >= items.length) {
          clearInterval(scanInterval)
          setTimeout(() => setPhase('title'), 400)
        }
      }
    }, 40)

    return () => clearInterval(scanInterval)
  }, [phase])

  const [constellationItems, setConstellationItems] = useState(
    CONSTELLATION.map(c => ({ ...c, display: '\u00A0'.repeat(c.text.length), visible: false, flyOut: false }))
  )

  function decodeItem(idx: number, onDone: () => void) {
    const target = CONSTELLATION[idx].text
    let chars = Array(target.length).fill('\u00A0')
    let charIdx = 0

    setConstellationItems(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], visible: true }
      return next
    })

    const rollChar = () => {
      if (charIdx >= target.length) { onDone(); return }
      let cycles = 0
      const max = 5 + Math.floor(Math.random() * 3)
      const roll = setInterval(() => {
        if (cycles < max) {
          chars[charIdx] = String(Math.floor(Math.random() * 10))
          cycles++
        } else {
          clearInterval(roll)
          chars[charIdx] = target[charIdx]
          charIdx++
          setConstellationItems(prev => {
            const next = [...prev]
            next[idx] = { ...next[idx], display: chars.join('') }
            return next
          })
          rollChar()
        }
        setConstellationItems(prev => {
          const next = [...prev]
          next[idx] = { ...next[idx], display: chars.join('') }
          return next
        })
      }, 30)
    }
    rollChar()
  }

  // ── Phase 3: giant title → then quotes ───────────────────────────────────────
  useEffect(() => {
    if (phase !== 'title') return
    setConstellationItems(prev => prev.map(c => ({ ...c, flyOut: true })))
    setTimeout(() => setShowTitle(true), 600)
    setTimeout(() => setTitleFading(true), 4500)
    // After title fades, go to quotes phase
    setTimeout(() => {
      setPhase('quotes')
      setQuoteVisible(true)
    }, 5800)
  }, [phase])

  // ── Phase 4: quote NEXT handler ───────────────────────────────────────────────
  const handleNext = () => {
    if (quoteStep === 0) {
      // Fade text, swap to second quote
      setQuoteVisible(false)
      setQuoteBg(0.9)
      setTimeout(() => {
        setQuoteStep(1)
        setHovering(false)
        setQuoteVisible(true)
      }, 400)
    } else {
      // Second NEXT → go to hub
      setQuoteVisible(false)
      setTimeout(() => navigate('/hub'), 800)
    }
  }

  const barFilled = Math.round(progress * 33)
  const barPct = Math.round(progress * 100)
  const currentQuote = QUOTES[quoteStep]

  return (
    <div className="fixed inset-0 bg-white overflow-hidden" style={{ fontFamily: "'JetBrains Mono', monospace" }}>

      {/* ── Terminal phase ─────────────────────────────────────────────────── */}
      {phase === 'terminal' && (
        <div className="absolute inset-0 flex flex-col justify-start items-start p-10 overflow-hidden">
          <div className="w-full max-w-3xl text-[11px] leading-relaxed text-black space-y-0.5">
            {logs.map((line, i) => (
              <div key={i} style={{ opacity: 1 }}>{line}</div>
            ))}
            {progress > 0 && progress < 1 && (
              <div className="mt-1">
                {`Loading weights: ${barPct}% |${'█'.repeat(barFilled)}${' '.repeat(33 - barFilled)}| ${Math.round(progress * 199)}/199 [00:00<00:00, 595.93it/s]`}
              </div>
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      )}

      {/* ── Constellation phase ────────────────────────────────────────────── */}
      {(phase === 'constellation' || phase === 'title') && (
        <div className="absolute inset-0 overflow-hidden">
          {constellationItems.map((item, idx) => (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: `${item.leftPercent}%`,
                top: item.top,
                fontSize: '40pt',
                fontFamily: "'JetBrains Mono', monospace",
                color: '#000',
                opacity: item.visible ? 1 : 0,
                transform: item.flyOut ? 'translateX(110vw)' : 'translateX(0)',
                transition: item.flyOut
                  ? 'transform 0.8s cubic-bezier(0.32,1,0.37,1), opacity 0.8s ease-in-out'
                  : 'opacity 0.3s',
              }}
            >
              {item.display}
            </div>
          ))}
        </div>
      )}

      {/* ── Giant title phase ──────────────────────────────────────────────── */}
      {showTitle && (
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ opacity: titleFading ? 0 : 1, transition: 'opacity 1.3s ease-in-out' }}
        >
          <div style={{ position: 'absolute', top: '-40px', left: '-15px', fontFamily: 'Georgia, serif', fontSize: '180pt', fontWeight: 100, color: '#000', lineHeight: 1, textTransform: 'uppercase', transform: 'scale(0.7, 1.10)', transformOrigin: 'top left' }}>DIARY</div>
          <div style={{ position: 'absolute', top: '48%', left: '50%', fontFamily: 'Georgia, serif', fontSize: '180pt', fontWeight: 100, color: '#000', lineHeight: 1, textTransform: 'uppercase', transform: 'translate(-50%, -50%) scale(0.7, 1.10)', transformOrigin: 'center' }}>OF</div>
          <div style={{ position: 'absolute', bottom: '-30px', right: '0', fontFamily: 'Georgia, serif', fontSize: '180pt', fontWeight: 100, color: '#000', lineHeight: 1, textTransform: 'uppercase', transform: 'scale(0.7, 1.10)', transformOrigin: 'bottom right' }}>MEMORIES</div>
        </div>
      )}

      {/* ── Quote slides phase ─────────────────────────────────────────────── */}
      {phase === 'quotes' && (
        <div
          className="absolute inset-0 flex justify-start items-center"
          style={{
            backgroundColor: `rgba(255,255,255,${quoteBg})`,
            transition: 'background-color 0.6s ease-out',
            paddingLeft: '50px',
            paddingRight: '50px',
          }}
        >
          <div className="w-full flex flex-col items-end">

            {/* Text block — hover to toggle code ↔ words */}
            <div
              className="relative w-full"
              style={{ cursor: 'default' }}
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
            >
              {/* Code version */}
              <p
                style={{
                  position: 'absolute', top: 0, left: 0, width: '100%',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '50pt', lineHeight: 1.4, color: '#B3B3B3',
                  opacity: quoteVisible && !hovering ? 1 : 0,
                  transition: 'opacity 0.4s ease-in-out',
                  margin: 0,
                }}
              >
                {currentQuote.code}
              </p>

              {/* Words version */}
              <p
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '50pt', lineHeight: 1.4, color: '#000',
                  opacity: quoteVisible && hovering ? 1 : 0,
                  transition: 'opacity 0.4s ease-in-out',
                  margin: 0,
                  // Invisible spacer so layout doesn't collapse
                  visibility: 'visible',
                }}
              >
                {currentQuote.words}
              </p>

              {/* Invisible spacer to hold height */}
              <p style={{ fontFamily: 'Georgia, serif', fontSize: '50pt', lineHeight: 1.4, opacity: 0, margin: 0, pointerEvents: 'none' }}>
                {currentQuote.words}
              </p>
            </div>

            {/* NEXT button */}
            <button
              onClick={handleNext}
              className="group"
              style={{
                position: 'fixed', bottom: '40px', right: '50px',
                background: '#000', border: 'none', cursor: 'pointer',
                width: '100px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: quoteVisible ? 1 : 0,
                transition: 'opacity 0.4s ease-in-out',
              }}
            >
              <span
                className="group-hover:opacity-0 transition-opacity duration-300"
                style={{ position: 'absolute', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '1px', color: '#fff' }}
              >
                42921
              </span>
              <span
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ position: 'absolute', fontFamily: 'Georgia, serif', fontSize: '10px', color: '#fff' }}
              >
                NEXT
              </span>
            </button>

          </div>
        </div>
      )}

    </div>
  )
}
