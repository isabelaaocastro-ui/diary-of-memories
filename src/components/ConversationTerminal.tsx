import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, HelpCircle, Keyboard, Volume2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConversationTerminalProps {
  onComplete: (answers: {
    place: string;
    reason: string;
    moment: string;
    visual: string;
    senses: string;
    title: string;
    fullCombinedText: string;
  }) => void;
}

export default function ConversationTerminal({ onComplete }: ConversationTerminalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [extractedPlace, setExtractedPlace] = useState('');
  const [isConfirmingPlace, setIsConfirmingPlace] = useState(false);

  const [audioSinks, setAudioSinks] = useState<number[]>([12, 18, 11, 24, 8, 14, 20, 16, 12, 10]);

  const [answers, setAnswers] = useState({
    place: '',
    reason: '',
    moment: '',
    visual: '',
    senses: '',
    title: ''
  });

  const [chatLog, setChatLog] = useState<{ sender: 'ai' | 'user'; text: string; isQuestion?: boolean }[]>([
    { sender: 'ai', text: "Where was the most memorable trip you had?", isQuestion: true }
  ]);

  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const transcript = finalTranscript || interimTranscript;
        if (transcript) {
          setInputText(transcript);
        }

        setAudioSinks(Array.from({ length: 12 }, () => Math.floor(Math.random() * 26) + 4));
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error', event);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission denied. Using keyboard entry.');
        } else {
          setSpeechError(`Microphone issue (${event.error}). Falling back.`);
        }
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    } else {
      setSpeechError('Web Speech API is not supported in this browser. Please type via keyboard.');
    }
  }, []);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setAudioSinks(Array.from({ length: 12 }, () => Math.floor(Math.random() * 26) + 6));
      }, 100);
    } else {
      setAudioSinks([6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6]);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, isConfirmingPlace]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setSpeechError('No microphone driver detected. Please type manually inside the box.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setSpeechError(null);
      try {
        setIsRecording(true);
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        setIsRecording(false);
      }
    }
  };

  const extractLocation = (text: string): string => {
    const cleanWord = (w: string) => w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
    const tokens = text.split(/\s+/).map(cleanWord);

    const stopWords = new Set([
      'i', 'me', 'my', 'myself', 'we', 'our', 'u', 'us', 'the', 'a', 'an', 'in', 'on', 'at',
      'to', 'for', 'with', 'by', 'went', 'had', 'trip', 'most', 'memorable', 'was', 'were',
      'been', 'is', 'are', 'travelled', 'visited', 'travel', 'visit', 'there', 'here', 'that',
      'this', 'it', 'and', 'but', 'or', 'so', 'because', 'when', 'why', 'how', 'where'
    ]);

    const rawWords = text.split(/\s+/);
    for (let i = 0; i < rawWords.length; i++) {
      const stripped = cleanWord(rawWords[i]);
      if (stripped.length > 2 && /^[A-Z]/.test(stripped) && !stopWords.has(stripped.toLowerCase())) {
        return stripped;
      }
    }

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].length > 2 && !stopWords.has(tokens[i].toLowerCase())) {
        return tokens[i];
      }
    }

    return tokens[0] || 'the journey';
  };

  const speakQuestion = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleConfirmLocation = () => {
    if (!extractedPlace.trim()) return;
    setIsConfirmingPlace(false);

    const nextStep = 1;
    setCurrentStep(nextStep);

    const nextQ = `Why did you remember ${extractedPlace} when I asked that?`;
    setAnswers(prev => ({ ...prev, place: extractedPlace }));
    setChatLog(prev => [...prev, { sender: 'ai', text: nextQ, isQuestion: true }]);
    speakQuestion(nextQ);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    setInputText('');
    setChatLog(prev => [...prev, { sender: 'user', text }]);

    if (currentStep === 0) {
      const detected = extractLocation(text);
      setExtractedPlace(detected);
      setIsConfirmingPlace(true);
      return;
    }

    const fields = ['place', 'reason', 'moment', 'visual', 'senses', 'title'];
    const currentField = fields[currentStep];
    const newAnswers = { ...answers, [currentField]: text };
    setAnswers(newAnswers);

    const nextStep = currentStep + 1;

    if (nextStep < 6) {
      setCurrentStep(nextStep);

      let nextQ = "";
      if (nextStep === 1) {
        nextQ = `Why did you remember ${extractedPlace || 'that place'} when I asked that?`;
      } else if (nextStep === 2) {
        nextQ = "Can you tell me about a precise moment of your journey?";
      } else if (nextStep === 3) {
        nextQ = "I would like to understand this experience a bit more. Can you describe to me what you saw at that moment?";
      } else if (nextStep === 4) {
        nextQ = "I still don't understand... Can you describe another sense you felt at that time, like the taste, smell, sound or physical feelings you were experiencing?";
      } else if (nextStep === 5) {
        nextQ = "Okay... I see what you are saying. For the last question, If you were to give a title to that story, what would it be?";
      }

      setChatLog(prev => [...prev, { sender: 'ai', text: nextQ, isQuestion: true }]);
      setTimeout(() => speakQuestion(nextQ), 400);

    } else {
      // ✅ Conversation complete — BertDiagnosticWindow will handle the save
      const combined = `
        Location: ${newAnswers.place}.
        Reason: ${newAnswers.reason}.
        Moment: ${newAnswers.moment}.
        Visual details: ${newAnswers.visual}.
        Sensory dimensions: ${newAnswers.senses}.
        Title: ${newAnswers.title}.
      `;

      onComplete({
        place: newAnswers.place,
        reason: newAnswers.reason,
        moment: newAnswers.moment,
        visual: newAnswers.visual,
        senses: newAnswers.senses,
        title: newAnswers.title,
        fullCombinedText: combined
      });
    }
  };

  return (
    <div id="conversation_terminal_panel" className="relative flex flex-col justify-between w-full max-w-2xl bg-white border border-black p-5 sm:p-7 md:p-8 shrink-0 z-10 select-text">
      <div className="flex justify-between items-center text-[10px] font-mono border-b border-black pb-3 mb-6">
        <span className="text-black font-semibold uppercase tracking-widest flex items-center gap-1.5">
          <Volume2 className="w-3.5 h-3.5" /> DIALOGUE TRANSLATOR LOGS
        </span>
        <span className="text-neutral-500">STAGE {currentStep + 1} OF 6</span>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[280px] min-h-[140px] pr-2 flex flex-col gap-5 mb-6 scrollbar-thin">
        <AnimatePresence initial={false}>
          {chatLog.map((message, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex flex-col ${message.sender === 'ai' ? 'items-start' : 'items-end'}`}
            >
              <div className="text-[9px] font-mono text-gray-400 mb-1">
                {message.sender === 'ai' ? 'LOG::EMBEDDINGMODEL_v1.0' : 'RAW::HUMAN_SUBJ_02'}
              </div>
              <div
                className={`max-w-[85%] text-left p-3 border leading-relaxed ${
                  message.sender === 'ai'
                    ? 'font-mono text-sm bg-zinc-50 border-zinc-200 text-zinc-900'
                    : 'font-serif text-base italic bg-white border-black text-black font-medium'
                }`}
              >
                {message.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isConfirmingPlace && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 border border-blue-500 bg-blue-50/20 text-blue-900 font-mono text-xs flex flex-col gap-3"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 animate-pulse" />
              <span className="font-bold">LOCATION EXTRACTION DIAGNOSTIC</span>
            </div>
            <p>The AI system mapped your travel subject to the following vocabulary entity token:</p>
            <div className="flex items-center gap-2">
              <input
                id="entity_location_input"
                type="text"
                value={extractedPlace}
                onChange={(e) => setExtractedPlace(e.target.value)}
                className="font-serif italic text-sm border border-neutral-400 bg-white px-2 py-1 flex-1 text-black outline-none"
                placeholder="Type location manually"
              />
              <button
                id="confirm_location_btn"
                onClick={handleConfirmLocation}
                className="high-density-btn py-1 px-3 text-[10px]"
              >
                Confirm Word
              </button>
            </div>
            <span className="text-[10px] text-zinc-500">Correct this word before the system generates the subword sensor arrays.</span>
          </motion.div>
        )}

        <div ref={chatEndRef} />
      </div>

      {!isConfirmingPlace && (
        <form onSubmit={handleSubmit} className="border-t border-black pt-4 flex flex-col gap-3">
          {isRecording && (
            <div className="flex items-center justify-center gap-1.5 p-2 bg-zinc-50 border border-zinc-200">
              <span className="text-[9px] font-mono text-zinc-500 mr-2 uppercase tracking-widest animate-pulse">RECORDING AUDIO STREAM:</span>
              <div className="flex items-end gap-1 h-6">
                {audioSinks.map((height, i) => (
                  <div
                    key={i}
                    className="w-1 bg-[#4048D9] transition-all duration-75"
                    style={{ height: `${height}px` }}
                  />
                ))}
              </div>
            </div>
          )}

          {speechError && (
            <div className="text-[10px] font-mono text-amber-700 bg-amber-50/50 p-2 border border-amber-200 flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{speechError}</span>
            </div>
          )}

          <div className="flex gap-2 relative">
            <button
              id="voice_recording_btn"
              type="button"
              onClick={toggleRecording}
              className={`p-3 border outline-none cursor-pointer transition-all active:scale-95 duration-100 flex items-center justify-center ${
                isRecording
                  ? 'bg-red-500 border-red-500 text-white hover:bg-red-600'
                  : 'bg-white border-black text-black hover:bg-neutral-50'
              }`}
              title={isRecording ? "Stop voice transmission" : "Speak via Microphone"}
            >
              {isRecording ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
            </button>

            <input
              id="user_response_box"
              type="text"
              autoFocus
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isRecording ? "Transcribing speech... or start writing here" : "Type your answer inside here..."}
              className="flex-1 px-4 py-3 border border-black font-serif italic text-base/relaxed text-black outline-none placeholder:font-mono placeholder:text-neutral-400 focus:bg-zinc-50/40 transition-all"
            />

            <button
              id="submit_response_btn"
              type="submit"
              disabled={!inputText.trim()}
              className="high-density-btn px-6 py-3 flex items-center justify-center gap-2"
            >
              <span>SEND</span> <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 mt-1 px-1">
            <span className="flex items-center gap-1">
              <Keyboard className="w-3.5 h-3.5" /> KEYBOARD OR MICROPHONE ACTIVATED
            </span>
            <span>PRESS SEND OR ENTER KEY</span>
          </div>
        </form>
      )}

      <div className="mt-4 pt-3 border-t border-zinc-100 text-[9px] font-mono text-zinc-400 leading-normal text-center sm:text-left">
        DECISION ARRAYS READY // SENTENCE INPUT AUTOMATICALLY MAPS TO SPATIAL VECTOR SPACE THROUGH WORDPIECE TOKENIZATION.
      </div>
    </div>
  );
}
