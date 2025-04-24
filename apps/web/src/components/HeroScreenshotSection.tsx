import React from "react";
import { Download, Laptop } from "lucide-react";
export default function HeroScreenshotSection() {
  return <section className="relative min-h-[850px] w-full flex flex-col items-center justify-center select-none overflow-hidden">
      {/* Backdrop curtain gradient */}
      <img src="/lovable-uploads/screenshot.png" alt="curtain" draggable={false} aria-hidden="true" className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none" style={{
      objectPosition: "center"
    }} />

    {/* Bottom V-Shape Fade Effect using CSS Mask */}
    <div
      className="absolute bottom-0 left-0 right-0 h-1/2 bg-black pointer-events-none z-10" // Increased height for more effect room
      style={{
        maskImage: 'radial-gradient(ellipse var(--vignette-spread, 80%) var(--vignette-height, 50%) at 50% 100%, black var(--vignette-intensity, 20%), transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse var(--vignette-spread, 80%) var(--vignette-height, 50%) at 50% 100%, black var(--vignette-intensity, 20%), transparent 70%)',
        // Default CSS variables (can be overridden via inline style or parent component)
        '--vignette-spread': '150%', // Controls width of the V
        '--vignette-height': '40%', // Controls height of the V
        '--vignette-intensity': '20%' // Controls how sharp the V starts
      } as React.CSSProperties} // Cast to React.CSSProperties to allow custom properties
    />

      {/* Main hero content */}
      <div className="flex flex-col items-center justify-center relative z-20 pt-40 pb-32 md:pt-48 md:pb-44">
        {/* Top badge */}
        <span className="mb-6 px-5 py-2 rounded-full bg-white/10 border border-white/15 text-white/80 text-base backdrop-blur-md font-medium shadow-[0_2px_10px_0_rgba(60,70,130,0.16)] animate-fade-in">
          We just raised $5.3 million
        </span>
        {/* Headline */}
        <h1 className="text-[2.4rem] md:text-6xl lg:text-7xl font-bold leading-tight text-white text-center mb-3 transition-none">
          Wake Up Before Your Users Do
        </h1>
        {/* Subtitle */}
        <div className="text-white/70 text-lg md:text-2xl mt-3 mb-9 text-center font-normal max-w-2xl mx-auto">
          Instant alerts for critical errors—so you fix bugs before they cost you.
        </div>
        {/* Actions buttons */}
        <div className="flex gap-4 mb-8 justify-center">
          <a href="#" className="flex items-center gap-2 px-7 py-3 rounded-full shadow-[0_2px_12px_0_rgba(74,175,255,0.16)] text-base font-medium bg-white/90 hover:bg-white transition-colors text-black border border-white/50" style={{
          fontWeight: 600
        }}>
            Start Your Free Trial
          </a>
          <a href="#" className="flex items-center gap-2 px-7 py-3 rounded-full text-white/95 border border-white/30 bg-[#232B4C]/60 hover:bg-[#21284a] transition-colors text-base font-semibold shadow" style={{
          fontWeight: 600
        }}>
            See how it works
          </a>
        </div>
      </div>
      {/* Bottom floating glass overlay (AI Response box) */}
      <div className="absolute left-1/2 bottom-0 -translate-x-1/2 z-30 w-[97%] max-w-3xl">
        
      </div>
      {/* Blue purple glow bottom effect - repurposed for fade-out */}
      <div className="pointer-events-none absolute bottom-0 left-0 w-full h-44" style={{
        background: "linear-gradient(to bottom, rgba(19, 22, 41, 0), rgba(19, 22, 41, 1))"
    }} />
    </section>;
}