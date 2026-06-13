import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function HubPage() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Soft fade-in after cinematic intro
    setTimeout(() => setVisible(true), 100)
  }, [])

  const navItems = [
    { code: '4681 311 279 6806', label: 'GO TO THE EXPERIENCE', path: '/interview' },
    { code: '41603 3180 1169 22006', label: 'GO TO THE MAP', path: '/map' },
    { code: '34814 18600', label: 'ABOUT US', path: '/about' },
  ]

  return (
    <div
      className="fixed inset-0 bg-white flex flex-col"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 1.2s ease-in-out',
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {/* Top title */}
      <div className="absolute top-10 left-12" style={{ fontFamily: 'Georgia, serif', fontSize: '32pt', fontWeight: 'normal', lineHeight: 0.95, letterSpacing: '1px' }}>
        DIARY OF <br /> MEMORIES
      </div>

      {/* Top-right nav */}
      <div className="absolute top-10 right-12 flex gap-20 items-center" style={{ height: '32px' }}>
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="group relative flex items-center"
            style={{ background: 'none', border: 'none', cursor: 'pointer', height: '32px' }}
          >
            <span className="group-hover:opacity-0 transition-opacity duration-300 text-[10px] tracking-wider" style={{ color: '#B3B3B3' }}>
              {item.code}
            </span>
            <span className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[10px] tracking-wider text-black whitespace-nowrap">
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* Center content — the hub description */}
      <div className="flex-1 flex flex-col items-center justify-center px-16 max-w-3xl mx-auto w-full">
        <div className="w-full">
          {/* Subtitle code line */}
          <div className="text-[9px] tracking-widest mb-8 uppercase" style={{ color: '#B3B3B3' }}>
            SEQUENCE.V3_ACTIVE // SYSTEM: BERT-BASE-MULTILINGUAL-CASED
          </div>

          {/* Main headline */}
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '42pt', fontWeight: 'normal', lineHeight: 1.1, marginBottom: '32px' }}>
            Can a machine understand<br />what you felt?
          </h2>

          <p className="text-[11px] leading-relaxed mb-12" style={{ color: '#555', maxWidth: '520px' }}>
            This is a clinical conversational experiment designed to transfer human sensory memory into a high-dimensional digital space. Choose your path.
          </p>

          {/* Two main CTA buttons */}
          <div className="flex gap-6">
            <button
              onClick={() => navigate('/interview')}
              className="group flex flex-col gap-1 border border-black px-8 py-5 hover:bg-black hover:text-white transition-all duration-200 text-left"
            >
              <span className="text-[9px] tracking-widest" style={{ color: 'inherit', opacity: 0.5 }}>01 — EXPERIENCE</span>
              <span className="text-[13px] tracking-wider uppercase font-medium">Share your memory</span>
              <span className="text-[10px] mt-1" style={{ opacity: 0.5 }}>AI interview → BERT analysis</span>
            </button>

            <button
              onClick={() => navigate('/map')}
              className="group flex flex-col gap-1 border border-black px-8 py-5 hover:bg-black hover:text-white transition-all duration-200 text-left"
            >
              <span className="text-[9px] tracking-widest" style={{ opacity: 0.5 }}>02 — EXPLORE</span>
              <span className="text-[13px] tracking-wider uppercase font-medium">See all memories</span>
              <span className="text-[10px] mt-1" style={{ opacity: 0.5 }}>World map → BERT maps</span>
            </button>
          </div>

          {/* Privacy note — placeholder for the missing disclaimer */}
          <div className="mt-10 text-[9px] leading-relaxed" style={{ color: '#B3B3B3', maxWidth: '480px' }}>
            <span className="text-black font-medium">PRIVACY NOTICE:</span> All transcripts are processed locally and stored anonymously. No personal data is linked to your identity.
            {/* TODO: Replace with full privacy disclaimer page link when built */}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="px-12 py-4 border-t border-zinc-100 flex justify-between text-[9px] tracking-wider" style={{ color: '#B3B3B3' }}>
        <span>LATITUDE.COEF // 454.492.203</span>
        <span>DIARY_OF_MEMORIES // {new Date().getFullYear()}</span>
      </div>
    </div>
  )
}
