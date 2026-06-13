import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileDown, Info, RefreshCw, Award } from 'lucide-react';
import { BertToken, ActivationStats } from '../types';
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

export default function BertDiagnosticWindow({
  storyTitle,
  locationName,
  combinedText,
  countryCode,
  onReset
}: BertDiagnosticWindowProps) {
  const navigate = useNavigate();
  const tokens = tokenizeBERT(combinedText);
  const stats = computeActivationStats(tokens);

  // Save to Supabase once
  const hasSaved = useRef(false);
  useEffect(() => {
    if (hasSaved.current) return;
    hasSaved.current = true;
    saveMemory({
      storyTitle,
      locationName,
      countryCode,
      transcript: combinedText,
      bertTokens: tokens,
      totalTokens: stats.totalTokens,
      positiveTokens: stats.positiveCount,
      positivePct: stats.positivePercent,
      negativeTokens: stats.negativeCount,
      negativePct: stats.negativePercent,
      neutralTokens: stats.neutralCount,
      neutralPct: stats.neutralPercent
    });
  }, []);

  const [hoveredCell, setHoveredCell] = useState<{
    token: string; tokenIdx: number; dimension: number; value: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const handleExportPNG = async () => {
    if (!containerRef.current) return;
    setIsExporting(true);
    setExportMessage('Generating high-resolution PNG workspace...');
    try {
      const target = containerRef.current.querySelector('#bert-diagnostic-card') as HTMLElement;
      if (!target) throw new Error('Visual target not found');
      const canvas = await html2canvas(target, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `BERT_activation_matrix_${storyTitle.replace(/\s+/g, '_') || 'diary'}.png`;
      link.href = dataUrl;
      link.click();
      setExportMessage('PNG saved successfully.');
    } catch (err) {
      console.error(err);
      setExportMessage('Export to PNG failed.');
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportMessage(null), 3000);
    }
  };

  const getActivationLabel = (val: number) => {
    if (val > 0.4) return { text: 'Positive Activation', class: 'text-green-600' };
    if (val < -0.4) return { text: 'Negative Activation', class: 'text-indigo-600' };
    return { text: 'Neutral Activation', class: 'text-zinc-400' };
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center justify-center relative z-10 px-4 md:px-0 select-text">

      {exportMessage && (
        <div className="mb-4 bg-black text-white px-4 py-2 text-xs font-mono tracking-wider flex items-center gap-2 border border-black animate-bounce">
          <Info className="w-4 h-4 text-[#6BA633] animate-spin" />
          <span>{exportMessage}</span>
        </div>
      )}

      <div
        id="bert-diagnostic-card"
        className="w-full max-w-5xl bg-white border border-black flex flex-col items-stretch overflow-hidden shadow-none mb-10"
      >
        {/* Top bar */}
        <div className="border-b border-black py-2 px-4 flex justify-between items-center bg-white text-xs font-mono select-none">
          <span className="text-black font-bold tracking-widest uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 bg-black animate-pulse" /> BERT-BASE-MULTILINGUAL-CASED EXTRAPOLATION REPORT
          </span>
          <span className="font-bold border border-black px-3 py-0.5 hover:bg-black hover:text-white transition-all cursor-pointer" onClick={onReset}>X</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-black">

          {/* Left panel */}
          <div className="lg:col-span-4 border-r border-black p-6 flex flex-col justify-between hc-bg-white text-left">
            <div>
              <h1 className="font-serif text-3xl font-medium tracking-tight text-black mb-1 leading-normal italic">
                {storyTitle || "Unspoken Memory"}
              </h1>
              <p className="font-mono text-[11px] hc-text-zinc-500 uppercase tracking-widest mb-6">
                {locationName || "Unrecorded Coordinates"}, {new Date().getFullYear()}
              </p>

              {/* Activation bar */}
              <div className="mb-6">
                <div className="flex w-full h-24 border border-black mb-4 overflow-hidden rounded-none">
                  <div style={{ width: `${stats.positivePercent}%`, backgroundColor: '#6BA633', transition: 'width 1s ease-out' }} />
                  <div style={{ width: `${stats.neutralPercent}%`, backgroundColor: '#e4e4e7', transition: 'width 1s ease-out' }} />
                  <div style={{ width: `${stats.negativePercent}%`, backgroundColor: '#4048D9', transition: 'width 1s ease-out' }} />
                </div>

                <div className="space-y-1.5 font-mono text-[10px]">
                  <div className="flex justify-between items-center text-zinc-500">
                    <span>Total Subword Tokens Extracted</span>
                    <span className="font-bold text-black">{stats.totalTokens}</span>
                  </div>
                  <div className="flex justify-between items-center text-[#6BA633]">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <span className="w-2.5 h-2.5 bg-[#6BA633]" /> Positive Activation
                    </span>
                    <span className="font-bold">{stats.positivePercent}%</span>
                  </div>
                  <div className="flex justify-between items-center text-[#4048D9]">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <span className="w-2.5 h-2.5 bg-[#4048D9]" /> Negative Activation
                    </span>
                    <span className="font-bold">{stats.negativePercent}%</span>
                  </div>
                  <div className="flex justify-between items-center hc-text-zinc-500">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <span className="w-2.5 h-2.5 hc-bg-zinc-200 border hc-border-zinc-300" /> Neutral Activation
                    </span>
                    <span className="font-bold">{stats.neutralPercent}%</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border hc-border-red-200 hc-bg-red-50-20 hc-text-neutral-800 font-mono text-[10px]/relaxed mb-6">
                <span className="font-bold hc-text-red-700 block mb-1">LIMITATION ARREST SYSTEM STATE:</span>
                Despite precise subword token indexing and multidimensional mathematical embedding representation (+2.00 to -2.00), this linguistic model possesses no conscious node for sensory reality. The subjective qualitative warmth, nostalgia, or flavor of your story exists only in human biological recollection. It is mathematically indemonstrable.
              </div>
            </div>

            {/* Color legend */}
            <div className="border-t hc-border-zinc-200 pt-4">
              <span className="font-mono text-[9px] text-[#2c2c2c] block mb-2 font-bold uppercase tracking-wider">Continuum Activation Scale Legend:</span>
              <div className="w-full h-4 relative overflow-hidden border border-black flex" style={{
                background: 'linear-gradient(to right, #4048D9 0%, #FFFFFF 50%, #6BA633 100%)'
              }}>
                <span className="absolute left-1 top-0.5 text-[8px] font-mono text-white mix-blend-difference">-2.0 (Purple)</span>
                <span className="absolute left-1/2 -translate-x-1/2 top-0.5 text-[8px] font-mono text-black">0.0 (Neutral)</span>
                <span className="absolute right-1 top-0.5 text-[8px] font-mono text-white mix-blend-difference">+2.0 (Green)</span>
              </div>
            </div>
          </div>

          {/* Right panel — heatmap */}
          <div className="lg:col-span-8 p-6 lg:p-8 flex flex-col justify-between hc-bg-zinc-50-20 overflow-x-auto">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="font-mono text-[10px] hc-text-zinc-500 uppercase tracking-widest">Dimension range activation map</span>
                <span className="font-mono text-[9px] border border-black hc-bg-white px-2 py-0.5">[ SAMPLE RANGE: 0 - 63 of 768 ]</span>
              </div>

              <div className="border border-black hc-bg-white relative">
                <div className="flex border-b border-black text-[8px] font-mono hc-text-zinc-400 select-none">
                  <div className="w-16 border-r border-black hc-bg-zinc-100 flex items-center justify-center font-bold text-black py-1">Token</div>
                  <div className="flex-1 grid grid-cols-8 text-center hc-bg-zinc-50">
                    {['D0','D8','D16','D24','D32','D40','D48','D56'].map(d => <div key={d}>{d}</div>)}
                  </div>
                </div>

                <div className="flex flex-col hc-divide-zinc-200 max-h-[460px] overflow-y-auto scrollbar-thin">
                  {tokens.map((token, tIdx) => (
                    <div key={token.id} className="flex hc-hover-bg-zinc-100-50 transition-all">
                      <div className="w-16 border-r border-black px-1.5 py-1 text-[10px] font-mono font-medium truncate text-[#222]" title={token.text}>
                        {token.text}
                      </div>
                      <div className="flex-1 grid h-6 select-none" style={{ gridTemplateColumns: 'repeat(64, minmax(0, 1fr))' }}>
                        {token.embeddings.map((val, dIdx) => (
                          <div
                            key={dIdx}
                            className="w-full h-full border-[0.5px] hc-border-zinc-100 cursor-pointer transition-transform duration-75 hover:scale-110 hover:z-20 hover:border-black"
                            style={{ backgroundColor: getInterpolatedColor(val) }}
                            onMouseEnter={() => setHoveredCell({ token: token.text, tokenIdx: tIdx, dimension: dIdx, value: val })}
                            onMouseLeave={() => setHoveredCell(null)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Hover info bar */}
            <div className="mt-6 border border-black hc-bg-white p-3 font-mono text-[10px] min-h-[58px] flex items-center gap-3">
              {hoveredCell ? (
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
                  <div>
                    <span className="hc-text-zinc-400 block pb-0.5 uppercase text-[8px]">Token Name</span>
                    <span className="font-serif italic text-sm text-black font-semibold">{hoveredCell.token}</span>
                  </div>
                  <div>
                    <span className="hc-text-zinc-400 block pb-0.5 uppercase text-[8px]">Token Index</span>
                    <span className="hc-text-neutral-800 font-bold">{hoveredCell.tokenIdx} / {tokens.length - 1}</span>
                  </div>
                  <div>
                    <span className="hc-text-zinc-400 block pb-0.5 uppercase text-[8px]">BERT Dimension</span>
                    <span className="hc-text-neutral-800 font-bold">D{hoveredCell.dimension} <span className="hc-text-zinc-400 text-[8px]">(sampled)</span></span>
                  </div>
                  <div>
                    <span className="hc-text-zinc-400 block pb-0.5 uppercase text-[8px]">Activation Force</span>
                    <span className={`font-bold ${getActivationLabel(hoveredCell.value).class}`}>
                      {hoveredCell.value.toFixed(4)} <span className="text-[8px] block sm:inline">({getActivationLabel(hoveredCell.value).text})</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="hc-text-zinc-400 italic flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" /> Pass your pointer over the BERT grid cells above to analyze activation details.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-zinc-50/20 p-4 border-t border-black flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex gap-2.5">
            <button onClick={handleExportPNG} disabled={isExporting} className="high-density-btn flex items-center gap-2">
              <Download className="w-4 h-4" /> Download PNG
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* ✅ Now uses React Router — no more localhost:5500 */}
            <button
              onClick={() => navigate('/map')}
              className="high-density-btn flex items-center gap-2 bg-black text-white hover:bg-zinc-800 border-black"
            >
              <Award className="w-4 h-4" /> Go to the Map
            </button>
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-500 hover:text-black uppercase tracking-wider underline underline-offset-4 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Transcribe a new memory
            </button>
          </div>
        </div>

        <div className="bg-white border-t border-black px-4 py-2.5 flex items-center justify-between text-[9px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
          <span>SYSTEM STATUS: EMBEDDINGS_EXTRACTED | DIM_X: 64 | DIM_Y: TOKENS | LATENCY: 24ms</span>
          <span className="hidden sm:inline">SAMPLES_LOADED // TRIAL_9883_ACTIVE</span>
        </div>
      </div>
    </div>
  );
}
