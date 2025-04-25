import React from "react";
import { Download, Laptop } from "lucide-react";
export default function HeroScreenshotSection() {
  return <section className="relative min-h-[1000px] w-full flex flex-col items-center justify-center select-none overflow-hidden">
      {/* Backdrop curtain video */}
      <video
        src="/lovable-uploads/hero.webm"
        autoPlay
        loop
        muted
        playsInline
        draggable={false}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
        style={{
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
        '--vignette-height': '30%', // Reduced height of the V
        '--vignette-intensity': '10%' // Reduced sharpness of the V
      } as React.CSSProperties} // Cast to React.CSSProperties to allow custom properties
    />

      {/* Main hero content */}
      <div className="flex flex-col items-center justify-center relative z-20 pt-40 pb-32 md:pt-48 md:pb-44">
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
          <a href="/coming-soon" className="relative hidden md:block text-center rounded-full ring-3 ring-white/15 bg-gradient-to-t from-gray-300/70 to-white hover:bg-white text-black px-5 py-2.5 transition-colors duration-150 font-bold text-lg">
            Start Your Free Trial
          </a>
          <a href="/docs" className="relative hidden md:block rounded-full bg-white/10 hover:bg-white/25 px-7 py-3 transition-colors duration-150 backdrop-blur">
            <span className="flex items-center justify-center font-bold text-lg bg-clip-text text-transparent bg-gradient-to-t from-gray-300/70 to-white">
              See how Errly Works
            </span>
          </a>
        </div>
      </div>
      {/* Bottom floating glass overlay (AI Response box) */}
      <div className="absolute left-1/2 bottom-0 -translate-x-1/2 z-30 w-[97%] max-w-3xl">
        
      </div>
      {/* Blue purple glow bottom effect - repurposed for fade-out */}
      <div className="pointer-events-none absolute bottom-0 left-0 w-full h-32" // Reduced height
       style={{
        background: "linear-gradient(to bottom, rgba(19, 22, 41, 0), rgba(19, 22, 41, 1))"
    }} />
    </section>;
}