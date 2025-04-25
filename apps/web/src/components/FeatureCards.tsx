'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

/* ------------------------------------------------------------------ */
/*  ❶  CONTENT                                                        */
/* ------------------------------------------------------------------ */
const CARD_LIST = [
  {
    key: "alerts",
    title: "Instant Error Alerts",
    desc: "Receive real-time SMS notifications whenever critical errors occur in your application.",
    body: (
      <div className="mt-5 text-sm text-white/60">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
          <span>Alert Sent!</span>
        </div>
        <span className="text-white/50 text-xs">SMS notification delivered to +1-XXX-XXX-XXXX.</span>
      </div>
    ),
  },
  {
    key: "setup",
    title: "Easy One-Line Setup",
    desc: "Add Errly to your project instantly with just one line of code. Zero friction, instant protection.",
    body: (
        <div className="mt-5 text-sm text-white/60">
         <span className="block text-xs text-white/50 mt-0.5">
          Just import and initialize:
        </span>
        <pre className="bg-white/5 p-2 rounded-lg text-xs text-blue-200 mt-2 mb-1 font-mono overflow-x-auto">
{`import Errly from '@errly/sdk';

Errly.init({ projectId: 'YOUR_PROJECT_ID' });`}
        </pre>
      </div>
    ),
  },
  {
    key: "rate-limiting",
    title: "Intelligent Rate Limiting",
    desc: "Stay informed without getting spammed—Errly smartly filters duplicates, keeping alerts actionable.",
    body: (
       <div className="mt-5 text-sm text-white/60">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full"></span>
          <span>Filtering Duplicates...</span>
        </div>
        <span className="text-white/50 text-xs">5 identical errors suppressed. 1 unique alert sent.</span>
      </div>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  ❷  COMPONENT                                                      */
/* ------------------------------------------------------------------ */
export default function FeatureCards() {
  /* index of the card that is selected */
  const [active, setActive] = useState(1) // default = middle card ("Screen Sharing")
  /* track if mouse is over the container */
  const [isHoveringContainer, setIsHoveringContainer] = useState(false);

  /* ---------------------------------------------------------------- */
  /*  ❸  MARK‑UP                                                     */
  /* ---------------------------------------------------------------- */
  return (
    <div className="w-full flex flex-col items-center bg-black py-12">
      {/* ── Cards Row ─────────────────────────────────────────── */}
      {/* Using flex to layout cards in a row and center them */}
      {/* Increased gap for visual separation */}
      <div
        className="flex flex-row justify-center items-end gap-8 mb-8 relative h-[430px] w-full"
        onMouseEnter={() => setIsHoveringContainer(true)} // Set hover state true
        onMouseLeave={() => {
          setIsHoveringContainer(false); // Set hover state false
          setActive(1); // Reset to default card
        }}
      >
        {CARD_LIST.map((card, idx) => {
          const isActive = idx === active
          // Determine if the card should be blurred: true if mouse is over the container but not this card
          const isBlurred = isHoveringContainer && !isActive;
          // Determine if the card is the one being hovered over (and mouse is inside container)
          const isFocused = isHoveringContainer && isActive;

          return (
            <motion.div
              key={card.key}
              onMouseEnter={() => setActive(idx)} // Activate on hover
              className={`
                w-[340px] h-[390px] p-8 pt-8 rounded-[34px] overflow-hidden cursor-pointer 
                bg-white/[0.04] border border-white/10 // Consistent border and background
              `}
              style={{
                // Keep distinct background gradients if needed, or simplify
                background: 'linear-gradient(120deg,rgba(20,24,42,.85)0%,rgba(70,74,93,.38)100%)', // Consistent background
              }}
              // Animate properties based on active state
              animate={{
                filter: isBlurred ? 'blur(3px)' : 'blur(0px)',
                opacity: isBlurred ? 0.6 : 1,
                scale: isFocused ? 1.03 : 1, // Scale up only if focused
                y: isFocused ? -5 : 0, // Lift up only if focused
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }} // Smooth spring transition for all animated properties
            >
              {/* title + desc */}
              <h2
                className="text-2xl font-bold mb-2 tracking-tight text-white" // Consistent text color
              >
                {card.title}
              </h2>
              <p className="text-base mb-1 text-white/70">{card.desc}</p>
              {/* body (provided via CARD_LIST) */}
              {card.body}
            </motion.div>
          )
        })}
      </div>

      {/* ── Dots ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mt-0"> {/* Reduced margin-top as cards are higher now */} 
        {CARD_LIST.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={`Show card ${i + 1}`}
            className={`
              w-5 h-2 rounded-full transition-all duration-200 outline-none focus:outline-none
              ${active === i
                ? 'bg-gradient-to-r from-sky-400 via-purple-400 to-white shadow-lg'
                : 'bg-white/20 hover:bg-white/40' // Add hover effect to inactive dots
              }
            `}
          />
        ))}
      </div>
    </div>
  )
}
