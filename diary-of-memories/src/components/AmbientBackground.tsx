import React from 'react';

export default function AmbientBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-white pointer-events-none select-none">
      {/* Brutalist top sequence coordinates */}
      <div className="absolute top-8 left-8 right-8 flex justify-between items-baseline text-[11px] font-mono text-gray-400 tracking-wider">
        <div className="flex gap-2 items-center">
          <span className="font-bold text-black border border-black px-1 py-0.5 text-[9px]">78240</span>
          <span className="hidden sm:inline">SEQUENCE.V3_ACTIVE</span>
        </div>
        <div className="flex gap-8">
          <span>34014.4627</span>
          <span>34014.15305</span>
          <span>35560</span>
          <span className="font-bold text-black">01014</span>
        </div>
      </div>

      {/* Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{
          backgroundImage: `
            linear-gradient(to right, rgb(0,0,0) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(0,0,0) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Minimalist Vector World Map */}
      <div className="absolute inset-x-0 top-[15%] bottom-[10%] mx-auto w-full max-w-[1400px] opacity-[0.08] flex items-center justify-center p-8">
        <svg 
          viewBox="0 0 1000 480" 
          className="w-full h-full text-zinc-900"
          fill="currentColor"
        >
          {/* North America */}
          <path d="M120 180 L180 180 L220 120 L280 120 L290 150 L250 200 L210 240 L190 280 L160 300 L140 280 L120 220 Z" />
          <path d="M150 100 L200 80 L230 100 L200 120 Z" />
          {/* Greenland */}
          <path d="M380 60 L450 40 L440 90 L390 120 Z" />
          {/* South America */}
          <path d="M220 300 L270 310 L300 370 L280 430 L250 440 L230 380 L210 330 Z" />
          {/* Africa */}
          <path d="M440 250 L520 230 L540 260 L570 280 L590 320 L580 370 L550 400 L530 390 L510 320 L450 280 Z" />
          {/* Europe */}
          <path d="M430 150 L480 130 L550 120 L540 180 L490 220 L440 190 Z" />
          {/* Asia */}
          <path d="M550 120 L800 120 L850 180 L880 250 L830 280 L760 320 L680 300 L620 240 L560 210 Z" />
          {/* Australia */}
          <path d="M780 340 L840 330 L870 370 L830 400 L770 380 Z" />
          {/* Antarctica */}
          <path d="M100 460 L900 460 L850 475 L150 475 Z" />

          {/* Core Telemetry dots from the reference images */}
          <g className="text-black">
            <rect x="250" y="210" width="8" height="8" className="animate-pulse" />
            <rect x="510" y="160" width="8" height="8" className="animate-pulse" style={{ animationDelay: '200ms' }} />
            <rect x="710" y="190" width="8" height="8" className="animate-pulse" style={{ animationDelay: '400ms' }} />
            <rect x="260" y="360" width="8" height="8" className="animate-pulse" style={{ animationDelay: '600ms' }} />
            <rect x="560" y="330" width="8" height="8" className="animate-pulse" style={{ animationDelay: '800ms' }} />
          </g>
        </svg>
      </div>

      {/* Decorative vertical brutalist metrics line */}
      <div className="absolute bottom-8 left-8 right-8 flex justify-between text-[9px] font-mono text-gray-400">
        <div>LATITUDE.COEF // 454.492.203</div>
        <div>DIARY_OF_MEMORIES_SERVER_STATUS_LOCAL</div>
      </div>
    </div>
  );
}
