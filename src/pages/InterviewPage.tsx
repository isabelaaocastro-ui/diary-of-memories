import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import AmbientBackground from '../components/AmbientBackground'
import ConversationTerminal from '../components/ConversationTerminal'
import BertDiagnosticWindow from '../components/BertDiagnosticWindow'

type InterviewState = 'landing' | 'dialogue' | 'analyzing' | 'report'

export default function InterviewPage() {
  const navigate = useNavigate()
  const [state, setState] = useState<InterviewState>('landing')
  const [sessionData, setSessionData] = useState<{
    place: string
    reason: string
    moment: string
    visual: string
    senses: string
    title: string
    fullCombinedText: string
    countryCode: string
  } | null>(null)
  const [analysisLogs, setAnalysisLogs] = useState<string[]>([])

  const runAnalysisCycle = (data: typeof sessionData) => {
    setSessionData(data)
    setState('analyzing')
    setAnalysisLogs([])

    const logMessages = [
      "ESTABLISHING CONTEXT ENVELOPE...",
      "CONNECTED TO BERT-BASE-MULTILINGUAL-CASED WORKSPACE",
      `INGESTING DIALOGUE CONTENT — SUBJECT [${data?.place.toUpperCase()}]`,
      "INITIATING TOKENIZATION: SUBWORD VOCABULARY MATCH (size=119547)...",
      "TAGGING STRUCTURAL HEADS: APPLIED [CLS] PREFIX & [SEP] BOUNDARIES...",
      "COMPUTING WEIGHT ATTRIBUTIONS ACROSS MULTI-HEADED ATTENTION (12 heads)...",
      "CRUNCHING EMBEDDING VALUES (768 total dimensions)...",
      "SAMPLING 64 STRATEGIC DIMENSIONS (HIGH EMOTIONAL AMPLITUDE)...",
      "INTERPOLATING COLOR VALUES (violet -1.0 → green +1.0)...",
      "ANALYSIS VERIFIED. REDIRECTING TO VISUALIZATION."
    ]

    logMessages.forEach((msg, idx) => {
      setTimeout(() => {
        setAnalysisLogs(prev => [...prev, msg])
        if (idx === logMessages.length - 1) {
          setTimeout(() => setState('report'), 850)
        }
      }, (idx + 1) * 450)
    })
  }

  const handleReset = () => {
    setSessionData(null)
    setState('landing')
  }

  return (
    <div className="relative min-h-screen bg-white text-black font-sans flex flex-col items-center justify-between pb-12 select-text">
      <AmbientBackground />

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 pt-6 flex justify-between items-center z-10 select-none border-b border-zinc-200 pb-4">
        <div className="flex flex-col text-left">
          <button
            onClick={() => navigate('/hub')}
            className="font-sans text-[13px] sm:text-[14px] font-bold tracking-[0.2em] text-black uppercase text-left hover:opacity-60 transition-opacity"
          >
            Diary of Memories / Research Interface
          </button>
          <span className="font-mono text-[9px] text-zinc-400 tracking-wider mt-1">
            CLINICAL LINGUISTIC COMPATIBILITY INDEX // MODULE: bert-base-multilingual-cased
          </span>
        </div>

        {state !== 'landing' ? (
          <button onClick={handleReset} className="high-density-btn text-[10px] py-1.5 px-3 uppercase">
            Terminate Trial
          </button>
        ) : (
          <div className="hidden md:block font-mono text-[10px] text-zinc-500 uppercase">
            Trial Code: 9883-EXT
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="w-full max-w-5xl mx-auto px-4 flex-1 flex flex-col items-center justify-center py-10 z-10">
        <AnimatePresence mode="wait">

          {/* 1. Landing */}
          {state === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-xl bg-white border border-black p-8 sm:p-12 text-left relative"
            >
              <div className="flex justify-between items-center text-[9px] font-mono border-b border-black pb-4 mb-6">
                <span className="font-bold uppercase tracking-wider text-zinc-800">EXPERIMENT INSTRUCTIONS</span>
                <span className="text-zinc-400">STATUS: INITIAL POINT</span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl italic font-medium leading-tight text-black mb-4">
                Can a machine understand what you felt?
              </h2>

              <p className="font-mono text-zinc-600 text-[11px]/relaxed mb-6 leading-relaxed">
                This is a clinical conversational experiment designed to transfer human sensory memory into a high-dimensional digital space.
                <br /><br />
                You will engage in a 6-question dialogue regarding your most treasured journey. The system will tokenize your language using{' '}
                <span className="text-black font-semibold">bert-base-multilingual-cased</span> and project the corresponding embedding dimensions into a real geometric heatmap.
              </p>

              <div className="border-t border-black pt-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest">
                  * ALL TRANSCRIPTS REMAIN STRICTLY LOCAL TO YOUR BROWSER.
                </span>
                <button
                  onClick={() => setState('dialogue')}
                  className="high-density-btn px-6 py-3 font-mono font-bold text-xs uppercase tracking-widest text-center shrink-0 cursor-pointer active:scale-95"
                >
                  START TRIAL REGISTRY
                </button>
              </div>
            </motion.div>
          )}

          {/* 2. Dialogue */}
          {state === 'dialogue' && (
            <motion.div
              key="dialogue"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full flex items-center justify-center"
            >
              <ConversationTerminal onComplete={runAnalysisCycle} />
            </motion.div>
          )}

          {/* 3. Analyzing */}
          {state === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-lg bg-white border border-black p-8 text-left"
            >
              <div className="font-mono text-[10px] text-gray-400 border-b border-black pb-3 mb-4 uppercase tracking-widest">
                AI COGNITIVE TRANSLATION PIPELINE
              </div>

              <div className="flex items-center gap-3 mb-6">
                <Brain className="w-5 h-5 text-[#4048D9] animate-bounce" />
                <h3 className="font-serif italic text-lg font-medium text-black">Constructing Vector Embeddings...</h3>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 p-4 font-mono text-[10px] leading-relaxed text-zinc-800 space-y-1.5 min-h-[160px] max-h-[220px] overflow-y-auto">
                {analysisLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-[#6BA633] font-bold">✓</span>
                    <span className="text-zinc-600 font-medium">{log}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between font-mono text-[8px] text-gray-400 uppercase">
                <span>GPU.Attributor // Ready</span>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-black animate-pulse" />
                  <span className="w-1.5 h-1.5 bg-[#4048D9] animate-pulse" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#6BA633] animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}

          {/* 4. BERT Report — the yellow page from the diagram, now inside the interview flow */}
          {state === 'report' && sessionData && (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full"
            >
              <BertDiagnosticWindow
                storyTitle={sessionData.title}
                locationName={sessionData.place}
                combinedText={sessionData.fullCombinedText}
                countryCode={sessionData.countryCode}
                onReset={handleReset}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 border-t border-zinc-100 pt-4 text-center sm:text-left flex flex-col sm:flex-row justify-between text-[9px] font-mono text-zinc-400 z-10 select-none">
        <div>DESIGNED UNDER THE PRINCIPLES OF EMOTIONAL INCOMPATIBILITY // AI STUDIO 2026</div>
        <div className="hidden sm:block">SYSTEM MODEL: BERT-BASE-MULTILINGUAL-CASED</div>
      </footer>
    </div>
  )
}
