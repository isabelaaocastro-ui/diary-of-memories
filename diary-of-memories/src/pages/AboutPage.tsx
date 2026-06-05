import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AboutPage() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 80) }, [])

  return (
    <div
      className="fixed inset-0 bg-white flex flex-col"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 1s ease-in-out', fontFamily: "'JetBrains Mono', monospace" }}
    >
      {/* Header */}
      <header className="px-12 pt-10 pb-4 border-b border-zinc-100 flex justify-between items-center">
        <button
          onClick={() => navigate('/hub')}
          style={{ fontFamily: 'Georgia, serif', fontSize: '20pt', fontWeight: 'normal', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          DIARY OF MEMORIES
        </button>
        <nav className="flex gap-10 text-[10px] tracking-wider">
          <button onClick={() => navigate('/interview')} className="hover:opacity-60 transition-opacity" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>EXPERIENCE</button>
          <button onClick={() => navigate('/map')} className="hover:opacity-60 transition-opacity" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>MAP</button>
        </nav>
      </header>

      <main className="flex-1 flex flex-col justify-center px-16 max-w-3xl mx-auto w-full">
        <div className="text-[9px] tracking-widest text-zinc-400 uppercase mb-6">ABOUT THE PROJECT</div>

        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '38pt', fontWeight: 'normal', lineHeight: 1.1, marginBottom: '32px' }}>
          Diary of<br />Memories
        </h1>

        {/* TODO: Fill in your actual about us content here */}
        <div className="space-y-4 text-[11px] leading-relaxed text-zinc-600 max-w-xl">
          <p>
            <span className="text-black font-bold">Diary of Memories</span> is a research project exploring the boundary between human sensory experience and machine understanding.
          </p>
          <p>
            We ask: can a language model truly access what it felt like to stand on a specific shoreline, or taste a meal in a foreign city? Or does it remain, structurally, blind?
          </p>
          <p>
            By tokenizing personal travel memories through BERT and projecting the resulting embedding dimensions as a visual heatmap, we create a geographic record of human experience — one city, one story at a time.
          </p>
          <p className="text-zinc-400">
            {/* TODO: Add team names, institution, course, year */}
            University project, 2026.
          </p>
        </div>
      </main>

      <footer className="px-12 py-4 border-t border-zinc-100 flex justify-between text-[9px] tracking-wider text-zinc-400">
        <span>DIARY_OF_MEMORIES // {new Date().getFullYear()}</span>
        <span>BERT-BASE-MULTILINGUAL-CASED</span>
      </footer>
    </div>
  )
}
