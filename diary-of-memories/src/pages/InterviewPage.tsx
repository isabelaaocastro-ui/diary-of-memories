import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, MicOff, AlertCircle } from 'lucide-react'
import BertDiagnosticWindow from '../components/BertDiagnosticWindow'

// ── Grid background ───────────────────────────────────────────────────────────
function GridBg() {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.08, zIndex: 0 }}>
      {Array.from({ length: 30 }).map((_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 50} x2="100%" y2={i * 50} stroke="#000" strokeWidth="1" />
      ))}
      {Array.from({ length: 40 }).map((_, i) => (
        <line key={`v${i}`} x1={i * 60} y1="0" x2={i * 60} y2="100%" stroke="#000" strokeWidth="1" />
      ))}
    </svg>
  )
}

// ── Shared header ─────────────────────────────────────────────────────────────
function Header({ onMapClick, onAboutClick, onShareClick }: { onMapClick: () => void; onAboutClick: () => void; onShareClick: () => void }) {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: '50px',
      background: '#000', color: '#fff', zIndex: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px',
    }}>
      <button onClick={onMapClick} style={{ fontFamily: 'Georgia, serif', fontSize: '13pt', color: '#fff', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '1px' }}>
        DIARY OF MEMORIES
      </button>
      <button onClick={onAboutClick} style={{ fontFamily: 'Georgia, serif', fontSize: '13pt', color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}>
        From Man to Machine
      </button>
      <button onClick={onShareClick} style={{ fontFamily: 'Georgia, serif', fontSize: '13pt', color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}>
        Share a story
      </button>
    </div>
  )
}

// ── Shared footer ─────────────────────────────────────────────────────────────
function Footer({ left, onFindStory, onAbout }: { left?: string; onFindStory: () => void; onAbout: () => void }) {
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px',
      background: '#000', color: '#fff', zIndex: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px',
    }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#888' }}>
        {left || 'DIALOGUE TRANSLATOR LOGS'}
      </span>
      <div style={{ display: 'flex' }}>
        <button onClick={onFindStory} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '2px', color: '#fff', background: 'none', border: '1px solid #333', padding: '0 20px', height: '40px', cursor: 'pointer', textTransform: 'uppercase' }}>
          FIND A STORY
        </button>
        <button onClick={onAbout} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '2px', color: '#fff', background: 'none', border: '1px solid #333', padding: '0 20px', height: '40px', cursor: 'pointer', textTransform: 'uppercase' }}>
          ABOUT
        </button>
      </div>
    </div>
  )
}

// ── DISCLAIMER PAGE ───────────────────────────────────────────────────────────
function DisclaimerPage({ onAccept, onReject }: { onAccept: () => void; onReject: () => void }) {
  const navigate = useNavigate()
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#fff', fontFamily: 'Georgia, serif' }}>
      <GridBg />
      <Header onMapClick={() => navigate('/map')} onAboutClick={() => navigate('/about')} onShareClick={() => {}} />

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 80px 60px', zIndex: 1 }}>
        <p style={{ fontSize: '22pt', lineHeight: 1.45, color: '#000', maxWidth: '700px', marginBottom: '60px', fontWeight: 'normal' }}>
          Travelling is not moving through space. It is collecting sensations that the body memorises before the mind does. The perception of a memory becomes real the moment you smell it, hear it, feel it.
        </p>

        <div style={{ display: 'flex', gap: '32px' }}>
          <button
            onClick={onAccept}
            style={{
              fontFamily: 'Georgia, serif', fontSize: '28pt',
              border: '1px solid #000', padding: '16px 60px',
              background: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: '40px', minWidth: '260px',
            }}
          >
            Accept <span style={{ fontSize: '20pt' }}>→</span>
          </button>
          <button
            onClick={onReject}
            style={{
              fontFamily: 'Georgia, serif', fontSize: '28pt',
              border: '1px solid #000', padding: '16px 60px',
              background: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: '40px', minWidth: '260px',
            }}
          >
            Reject <span style={{ fontSize: '20pt' }}>→</span>
          </button>
        </div>
      </div>

      <Footer onFindStory={() => navigate('/map')} onAbout={() => navigate('/about')} />
    </div>
  )
}

// ── The 6 questions labels for the sidebar ────────────────────────────────────
const QUESTION_LABELS = [
  'Question 1',
  'Question 2',
  'Question 3',
  'Question 4',
  'Question 5',
  'Question 6',
]

const QUESTION_TEXTS = [
  'Where was the most memorable trip you had?',
  '', // filled dynamically with place name
  'Can you tell me about a precise moment of your journey?',
  'I would like to understand this experience a bit more. Can you describe to me what you saw at that moment?',
  'I still don\'t understand... Can you describe another sense you felt at that time, like the taste, smell, sound or physical feelings you were experiencing?',
  'Okay... I see what you are saying. For the last question, If you were to give a title to that story, what would it be?',
]

// ── CONVERSATION PAGE ─────────────────────────────────────────────────────────
function ConversationPage({ onComplete }: { onComplete: (data: any) => void }) {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [inputText, setInputText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [speechError, setSpeechError] = useState<string | null>(null)
  const [extractedPlace, setExtractedPlace] = useState('')
  const [isConfirmingPlace, setIsConfirmingPlace] = useState(false)
  const [audioSinks, setAudioSinks] = useState<number[]>(Array(12).fill(6))

  const [answers, setAnswers] = useState({ place: '', reason: '', moment: '', visual: '', senses: '', title: '' })

  // Chat log: only user messages shown in the center area
  const [userMessages, setUserMessages] = useState<string[]>([])
  // Current AI question
  const [currentQuestion, setCurrentQuestion] = useState(QUESTION_TEXTS[0])

  const recognitionRef = useRef<any>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Speech recognition setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.continuous = true
      rec.interimResults = true
      rec.lang = 'en-US'
      rec.onresult = (event: any) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript
        }
        if (transcript) setInputText(transcript)
        setAudioSinks(Array.from({ length: 12 }, () => Math.floor(Math.random() * 26) + 4))
      }
      rec.onerror = (event: any) => {
        if (event.error === 'not-allowed') setSpeechError('Microphone permission denied.')
        setIsRecording(false)
      }
      rec.onend = () => setIsRecording(false)
      recognitionRef.current = rec
    } else {
      setSpeechError('Speech not supported in this browser.')
    }
  }, [])

  useEffect(() => {
    let interval: any
    if (isRecording) {
      interval = setInterval(() => {
        setAudioSinks(Array.from({ length: 12 }, () => Math.floor(Math.random() * 26) + 6))
      }, 100)
    } else {
      setAudioSinks(Array(12).fill(6))
    }
    return () => clearInterval(interval)
  }, [isRecording])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [userMessages, isConfirmingPlace])

  const toggleRecording = () => {
    if (!recognitionRef.current) { setSpeechError('No microphone detected.'); return }
    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    } else {
      setSpeechError(null)
      try { setIsRecording(true); recognitionRef.current.start() }
      catch { setIsRecording(false) }
    }
  }

  const extractLocation = (text: string): string => {
    const cleanWord = (w: string) => w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').trim()
    const stopWords = new Set(['i','me','my','we','our','the','a','an','in','on','at','to','for','with','by','went','had','trip','most','memorable','was','were','been','is','are','travelled','visited','there','here','that','this','it','and','but','or','so','because','when','why','how','where'])
    const rawWords = text.split(/\s+/)
    for (const w of rawWords) {
      const s = cleanWord(w)
      if (s.length > 2 && /^[A-Z]/.test(s) && !stopWords.has(s.toLowerCase())) return s
    }
    const tokens = text.split(/\s+/).map(cleanWord)
    for (const t of tokens) {
      if (t.length > 2 && !stopWords.has(t.toLowerCase())) return t
    }
    return tokens[0] || 'the journey'
  }

  const getCountryCode = async (placeName: string): Promise<string> => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeName)}&format=json&limit=1&addressdetails=1`, { headers: { 'User-Agent': 'diary-of-memories-app' } })
      const data = await res.json()
      if (data.length > 0 && data[0].address?.country_code) return data[0].address.country_code.toUpperCase()
    } catch {}
    return '??'
  }

  const speakQuestion = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'en-US'; u.rate = 1.0; u.pitch = 0.85
      window.speechSynthesis.speak(u)
    }
  }

  const handleConfirmLocation = () => {
    if (!extractedPlace.trim()) return
    setIsConfirmingPlace(false)
    setCurrentStep(1)
    const nextQ = `Why did you remember ${extractedPlace} when I asked that?`
    setAnswers(prev => ({ ...prev, place: extractedPlace }))
    setCurrentQuestion(nextQ)
    speakQuestion(nextQ)
  }

  const handleSubmit = async () => {
    const text = inputText.trim()
    if (!text) return
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    if (isRecording && recognitionRef.current) { recognitionRef.current.stop(); setIsRecording(false) }

    setInputText('')
    setUserMessages(prev => [...prev, text])

    if (currentStep === 0) {
      const detected = extractLocation(text)
      setExtractedPlace(detected)
      setIsConfirmingPlace(true)
      return
    }

    const fields = ['place', 'reason', 'moment', 'visual', 'senses', 'title']
    const newAnswers = { ...answers, [fields[currentStep]]: text }
    setAnswers(newAnswers)
    const nextStep = currentStep + 1

    if (nextStep < 6) {
      setCurrentStep(nextStep)
      let nextQ = ''
      if (nextStep === 1) nextQ = `Why did you remember ${extractedPlace || 'that place'} when I asked that?`
      else if (nextStep === 2) nextQ = 'Can you tell me about a precise moment of your journey?'
      else if (nextStep === 3) nextQ = 'I would like to understand this experience a bit more. Can you describe to me what you saw at that moment?'
      else if (nextStep === 4) nextQ = "I still don't understand... Can you describe another sense you felt at that time, like the taste, smell, sound or physical feelings you were experiencing?"
      else if (nextStep === 5) nextQ = 'Okay... I see what you are saying. For the last question, If you were to give a title to that story, what would it be?'
      setCurrentQuestion(nextQ)
      setTimeout(() => speakQuestion(nextQ), 400)
    } else {
      const combined = `Location: ${newAnswers.place}. Reason: ${newAnswers.reason}. Moment: ${newAnswers.moment}. Visual details: ${newAnswers.visual}. Sensory dimensions: ${newAnswers.senses}. Title: ${newAnswers.title}.`
      const countryCode = await getCountryCode(newAnswers.place)
      onComplete({ place: newAnswers.place, reason: newAnswers.reason, moment: newAnswers.moment, visual: newAnswers.visual, senses: newAnswers.senses, title: newAnswers.title, fullCombinedText: combined, countryCode })
    }
  }

  const lastUserMessage = userMessages[userMessages.length - 1] || ''

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#fff', fontFamily: 'Georgia, serif' }}>
      <GridBg />
      <Header onMapClick={() => navigate('/map')} onAboutClick={() => navigate('/about')} onShareClick={() => {}} />

      {/* Main two-column layout */}
      <div style={{ position: 'absolute', top: '50px', bottom: '40px', left: 0, right: 0, display: 'grid', gridTemplateColumns: '1fr 340px', zIndex: 1 }}>

        {/* ── LEFT: question + chat area + input ── */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid #000' }}>

          {/* Current AI question — top, blue, large */}
          <div style={{
            padding: '24px 28px 16px',
            borderBottom: '1px solid #ddd',
            color: '#3333cc',
            fontSize: '22pt',
            lineHeight: 1.3,
            fontWeight: 'normal',
            minHeight: '120px',
          }}>
            {currentQuestion}
          </div>

          {/* Chat area — user messages right-aligned */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
            {/* Most recent user answer shown large in center */}
            {lastUserMessage && !isConfirmingPlace && (
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '18pt', color: '#000', textAlign: 'center',
                lineHeight: 1.4, maxWidth: '80%',
                fontFamily: 'Georgia, serif', fontStyle: 'normal',
                pointerEvents: 'none',
              }}>
                {lastUserMessage}
              </div>
            )}

            {/* Location confirm box */}
            {isConfirmingPlace && (
              <div style={{ border: '1px solid #3333cc', padding: '16px', background: 'rgba(51,51,204,0.04)', fontSize: '11pt', color: '#3333cc', fontFamily: "'JetBrains Mono', monospace" }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase' }}>LOCATION EXTRACTION — confirm the place name:</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={extractedPlace}
                    onChange={e => setExtractedPlace(e.target.value)}
                    style={{ flex: 1, border: '1px solid #3333cc', padding: '6px 10px', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '14pt', outline: 'none', color: '#000', background: '#fff' }}
                  />
                  <button
                    onClick={handleConfirmLocation}
                    style={{ background: '#000', color: '#fff', border: 'none', padding: '8px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer' }}
                  >
                    CONFIRM →
                  </button>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* ── Input bar ── */}
          {!isConfirmingPlace && (
            <div style={{ borderTop: '1px solid #000' }}>
              {/* Recording waveform */}
              {isRecording && (
                <div style={{ background: '#000', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px' }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', letterSpacing: '2px', color: '#888', textTransform: 'uppercase' }}>RECORDING</span>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '20px' }}>
                    {audioSinks.map((h, i) => (
                      <div key={i} style={{ width: '3px', background: '#4048D9', height: `${h}px`, transition: 'height 75ms' }} />
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'stretch', minHeight: '70px' }}>
                {/* Mic button */}
                <button
                  onClick={toggleRecording}
                  style={{
                    background: isRecording ? '#cc0000' : '#000',
                    color: '#fff', border: 'none',
                    padding: '0 16px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                {/* Text input */}
                <div style={{
                  flex: 1, position: 'relative',
                  background: inputText ? '#000' : '#fff',
                  transition: 'background 0.2s',
                }}>
                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
                    placeholder="TYPE OR TALK TO ANSWER"
                    style={{
                      width: '100%', height: '100%',
                      background: 'transparent',
                      border: 'none', outline: 'none',
                      padding: '0 20px',
                      fontFamily: 'Georgia, serif', fontStyle: 'italic',
                      fontSize: '14pt',
                      color: inputText ? '#fff' : '#bbb',
                      letterSpacing: '0.5px',
                    }}
                  />
                </div>

                {/* Send arrow */}
                <button
                  onClick={handleSubmit}
                  disabled={!inputText.trim()}
                  style={{
                    background: inputText.trim() ? '#000' : '#f0f0f0',
                    color: inputText.trim() ? '#fff' : '#999',
                    border: 'none', padding: '0 20px',
                    fontFamily: 'Georgia, serif', fontSize: '18pt',
                    cursor: inputText.trim() ? 'pointer' : 'default',
                    transition: 'background 0.2s',
                  }}
                >
                  →
                </button>
              </div>

              {speechError && (
                <div style={{ background: '#fff3cd', padding: '6px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#856404', letterSpacing: '1px' }}>
                  {speechError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT: sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', background: '#fff' }}>
          {/* Info text */}
          <div style={{ padding: '16px 18px', borderBottom: '1px solid #000', fontFamily: "'JetBrains Mono', monospace", fontSize: '9pt', lineHeight: 1.6, color: '#000' }}>
            Le seguenti domande saranno personali e permetteranno di raggiungere un resoconto il più possibile esplicito ed esplicativo della relazione tra A.I. e l'esperienza umana.
          </div>

          {/* Question progress list */}
          <div style={{ flex: 1 }}>
            {QUESTION_LABELS.map((label, idx) => {
              const isActive = idx === currentStep
              const isDone = idx < currentStep
              return (
                <div
                  key={idx}
                  style={{
                    padding: '12px 18px',
                    borderBottom: '1px solid #ddd',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '11pt',
                    color: isActive ? '#3333cc' : isDone ? '#000' : '#ccc',
                    fontWeight: isActive ? 'bold' : 'normal',
                    background: isActive ? 'rgba(51,51,204,0.04)' : '#fff',
                    borderLeft: isActive ? '3px solid #3333cc' : '3px solid transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  {label}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <Footer onFindStory={() => navigate('/map')} onAbout={() => navigate('/about')} />
    </div>
  )
}

// ── Main InterviewPage ────────────────────────────────────────────────────────
type PageState = 'disclaimer' | 'conversation' | 'analyzing' | 'report'

export default function InterviewPage() {
  const navigate = useNavigate()
  const [state, setState] = useState<PageState>('disclaimer')
  const [sessionData, setSessionData] = useState<any>(null)
  const [analysisLogs, setAnalysisLogs] = useState<string[]>([])

  const runAnalysisCycle = (data: any) => {
    setSessionData(data)
    setState('analyzing')
    setAnalysisLogs([])

    const logs = [
      'ESTABLISHING CONTEXT ENVELOPE...',
      'CONNECTED TO BERT-BASE-MULTILINGUAL-CASED WORKSPACE',
      `INGESTING DIALOGUE CONTENT — SUBJECT [${data?.place?.toUpperCase()}]`,
      'INITIATING TOKENIZATION: SUBWORD VOCABULARY MATCH (size=119547)...',
      'TAGGING STRUCTURAL HEADS: [CLS] PREFIX & [SEP] BOUNDARIES...',
      'COMPUTING WEIGHT ATTRIBUTIONS ACROSS MULTI-HEADED ATTENTION (12 heads)...',
      'CRUNCHING EMBEDDING VALUES (768 total dimensions)...',
      'SAMPLING 64 STRATEGIC DIMENSIONS (HIGH EMOTIONAL AMPLITUDE)...',
      'INTERPOLATING COLOR VALUES (violet -1.0 → green +1.0)...',
      'ANALYSIS VERIFIED. REDIRECTING TO VISUALIZATION.',
    ]
    logs.forEach((msg, idx) => {
      setTimeout(() => {
        setAnalysisLogs(prev => [...prev, msg])
        if (idx === logs.length - 1) setTimeout(() => setState('report'), 850)
      }, (idx + 1) * 450)
    })
  }

  if (state === 'disclaimer') {
    return (
      <DisclaimerPage
        onAccept={() => setState('conversation')}
        onReject={() => navigate('/map')}
      />
    )
  }

  if (state === 'conversation') {
    return <ConversationPage onComplete={runAnalysisCycle} />
  }

  if (state === 'analyzing') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'JetBrains Mono', monospace" }}>
        <GridBg />
        <div style={{ border: '1px solid #000', padding: '40px', maxWidth: '500px', width: '90%', zIndex: 1, background: '#fff' }}>
          <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#888', textTransform: 'uppercase', marginBottom: '20px', borderBottom: '1px solid #000', paddingBottom: '12px' }}>
            AI COGNITIVE TRANSLATION PIPELINE
          </div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '16pt', fontStyle: 'italic', marginBottom: '20px', color: '#3333cc' }}>
            Constructing Vector Embeddings...
          </div>
          <div style={{ background: '#f9f9f9', border: '1px solid #eee', padding: '16px', minHeight: '140px', fontSize: '9px', lineHeight: 1.8, color: '#444' }}>
            {analysisLogs.map((log, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px' }}>
                <span style={{ color: '#6BA633', fontWeight: 'bold' }}>✓</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', marginTop: '12px' }}>
            {['#000', '#4048D9', '#6BA633'].map((c, i) => (
              <div key={i} style={{ width: '6px', height: '6px', background: c, animation: 'pulse 1s infinite', animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (state === 'report' && sessionData) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', overflowY: 'auto' }}>
        <BertDiagnosticWindow
          storyTitle={sessionData.title}
          locationName={sessionData.place}
          combinedText={sessionData.fullCombinedText}
          countryCode={sessionData.countryCode}
          onReset={() => setState('disclaimer')}
        />
      </div>
    )
  }

  return null
}
