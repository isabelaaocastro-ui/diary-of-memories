import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  { label: 'Share a story', path: '/interview' },
  { label: 'Find a story', path: '/map' },
  { label: 'About', path: '/about' },
]

// Which "frame" we're on — controls what's visible
// 0: blank
// 1: disclaimer text appears (top-left)
// 2: big question appears (left body)
// 3: right-top quote appears
// 4: nav buttons appear bottom-right
// hover on button: that button goes black
type Frame = 0 | 1 | 2 | 3 | 4

export default function HubPage() {
  const navigate = useNavigate()
  const [frame, setFrame] = useState<Frame>(0)
  const [hoveredBtn, setHoveredBtn] = useState<number | null>(null)

  useEffect(() => {
    // Each frame appears 500ms after the previous
    const timers = [
      setTimeout(() => setFrame(1), 300),
      setTimeout(() => setFrame(2), 800),
      setTimeout(() => setFrame(3), 1300),
      setTimeout(() => setFrame(4), 1800),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#fff',
      fontFamily: 'Georgia, serif',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: '#000', color: '#fff',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 20px', flexShrink: 0,
      }}>
        <button
          onClick={() => navigate('/hub')}
          style={{ fontFamily: 'Georgia, serif', fontSize: '15pt', color: '#fff', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'normal', letterSpacing: '0.5px' }}
        >
          DIARY OF MEMORIES
        </button>
        <button
          onClick={() => navigate('/about')}
          style={{ fontFamily: 'Georgia, serif', fontSize: '15pt', color: '#fff', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'normal' }}
        >
          From Man to Machine
        </button>
      </div>

      {/* ── Two-column body ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden' }}>

        {/* LEFT column */}
        <div style={{ borderRight: '1px solid #000', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Disclaimer text — frame 1 */}
          <div style={{
            borderBottom: '1px solid #000',
            padding: '10px 14px',
            fontSize: '9pt',
            lineHeight: 1.5,
            color: '#000',
            flexShrink: 0,
            opacity: frame >= 1 ? 1 : 0,
            transition: 'opacity 0.5s ease',
          }}>
            Travelling is not moving through space. It is collecting sensations that the body
            memorises before the mind does. The perception of a memory becomes real the
            moment you smell it, hear it, feel it.
          </div>

          {/* Big question — frame 2 */}
          <div style={{
            flex: 1, padding: '20px 16px',
            display: 'flex', alignItems: 'flex-start',
            opacity: frame >= 2 ? 1 : 0,
            transition: 'opacity 0.5s ease',
          }}>
            <h1 style={{
              fontFamily: 'Georgia, serif',
              fontSize: 'clamp(32pt, 6vw, 56pt)',
              fontWeight: 'normal',
              lineHeight: 1.08,
              margin: 0,
              color: '#000',
            }}>
              Is A.I. able to understand the value of human sensations?
            </h1>
          </div>
        </div>

        {/* RIGHT column */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Top-right quote — frame 3 */}
          <div style={{
            flex: 1,
            borderBottom: '1px solid #000',
            padding: '16px 18px',
            opacity: frame >= 3 ? 1 : 0,
            transition: 'opacity 0.5s ease',
            overflow: 'hidden',
          }}>
            <QuoteText />
          </div>

          {/* Nav buttons — frame 4 */}
          <div style={{
            opacity: frame >= 4 ? 1 : 0,
            transition: 'opacity 0.5s ease',
          }}>
            {NAV_ITEMS.map((item, idx) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                onMouseEnter={() => setHoveredBtn(idx)}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  width: '100%', padding: '14px 18px',
                  borderBottom: idx < NAV_ITEMS.length - 1 ? '1px solid #000' : 'none',
                  borderTop: idx === 0 ? 'none' : 'none',
                  background: hoveredBtn === idx ? '#000' : '#fff',
                  color: hoveredBtn === idx ? '#fff' : '#000',
                  cursor: 'pointer', border: 'none',
                  borderBottom: '1px solid #000',
                  fontFamily: 'Georgia, serif',
                  fontSize: '16pt', fontWeight: 'normal',
                  transition: 'background 0.15s, color 0.15s',
                  textAlign: 'left',
                }}
              >
                <span>{item.label}</span>
                <span style={{ fontSize: '16pt' }}>→</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Quote with highlighted words — matches images 6 & 7
function QuoteText() {
  const [hovered, setHovered] = useState(false)

  // Words to highlight on hover
  const segments = [
    { text: 'We perceive', highlight: true },
    { text: ' a mind wherever something responds to us in a coherent and adaptive way. When ', highlight: false },
    { text: 'machines describe', highlight: true },
    { text: ' emotions and sensations to us, we end up believing them to be real.', highlight: false },
  ]

  return (
    <p
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily: 'Georgia, serif',
        fontSize: 'clamp(11pt, 2.2vw, 16pt)',
        lineHeight: 1.45,
        margin: 0,
        color: '#000',
        cursor: 'default',
      }}
    >
      {segments.map((seg, i) => (
        <span
          key={i}
          style={{
            background: hovered && seg.highlight ? '#4040ff' : 'transparent',
            color: hovered && seg.highlight ? '#6BA633' : '#000',
            transition: 'background 0.2s, color 0.2s',
            padding: seg.highlight ? '0 1px' : '0',
          }}
        >
          {seg.text}
        </span>
      ))}
    </p>
  )
}
