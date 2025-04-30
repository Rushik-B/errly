'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

/* ------------------------------------------------------------------ */
/*  ❶  CONTENT                                                        */
/* ------------------------------------------------------------------ */
const CARD_LIST = [
  {
    key: "setup",
    title: "Quick Initialization",
    desc: "Install the SDK, import, and initialize with your Project ID. Get set up in 15 seconds — Errly automatically captures errors right away.",
    body: (
      <div className="mt-5 text-sm text-white/60">
        <pre className="bg-white/5 p-2 rounded-lg text-xs text-blue-200 mt-2 mb-1 font-mono overflow-x-auto">
{`// 1. npm install @errly/sdk

// 2. Initialize in your app's entry point:
import { setKey, patch } from '@errly/sdk';

setKey('YOUR_PROJECT_ID'); // Find in Project Settings
patch(); // Start capturing errors

// That's it!`}
        </pre>
      </div>
    ),
  },
  {
    key: "alerts",
    title: "Instant SMS Alerts",
    desc: "If your app throws a critical error in production, Errly sends you a text within seconds. Even at 3AM.",
    body: (
      <div className="mt-5 text-sm text-white/60">
        <div className="bg-blue-500/20 border border-blue-400/30 p-3 rounded-lg shadow-md">
            <p className="font-semibold text-blue-300">❗ Errly Alert</p>
            <p className="text-xs mt-1 text-white/80">TypeError at /checkout: Cannot read 'amount' of undefined</p>
        </div>
        {/* TODO: Simulate SMS pop-up bubble */}
      </div>
    ),
  },
  {
    key: "dashboard",
    title: "Insightful Debug Dashboard",
    desc: "View clean error logs, stack traces, and metadata — all in one modern dashboard. No setup required.",
    body: (
       <div className="mt-5 text-sm text-white/60">
         <div className="flex items-center gap-2 mb-2">
          <span className="inline-block w-2 h-2 bg-purple-500 rounded-full"></span>
          <span>Dashboard Ready</span>
        </div>
        <span className="text-white/50 text-xs">Error details, stack trace, and metadata available.</span>
        {/* TODO: A small snippet of your beautiful dashboard UI. Highlight a row with stack trace + metadata. */}
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
      <div className="flex items-center gap-2 mt-4"> {/* Added margin-top back to dots */}
          {/* Dots (kept unchanged, just adjusted container) */}
          {CARD_LIST.map((_, i) => (
            <button
              key={`dot-${i}`}
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
