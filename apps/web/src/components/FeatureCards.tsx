'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

/* ------------------------------------------------------------------ */
/*  ❶  CONTENT                                                        */
/* ------------------------------------------------------------------ */
const CARD_LIST = [
  {
    key: "tab",
    title: "Active Tab Detection",
    desc: "Toggle the visibility of the window while keeping your cursor on the screen.",
    body: (
      <div className="mt-5 text-sm text-white/60">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
          <span>Thinking...</span>
        </div>
        <div className="mb-0.5">Sales call tips:</div>
        <span className="text-white/50 text-xs">Want to ask about their budget? Try: "What's a budget range you're comfortable with for this project?"</span>
      </div>
    ),
  },
  {
    key: "screen",
    title: "Screen Sharing",
    desc: "Completely invisible during screen sharing, cannot be seen by the other side.",
    body: (
      <div className="w-full flex flex-col items-start mt-6">
        <img
          className="rounded-xl border-0 w-full h-36 object-cover mb-2 pointer-events-none select-none"
          src="/lovable-uploads/65999347-393f-4379-bac8-54c6c65d6552.png"
          alt="Placeholder"
          draggable={false}
          style={{
            filter:
              "drop-shadow(0 0 28px #0ff9) drop-shadow(0 0 8px #86A5FF55)",
            objectFit: "cover",
            background:
              "linear-gradient(130deg, rgba(155,135,245,0.2) 0%, rgba(51,195,240,0.12) 100%)",
          }}
        />
        <div>
          <span className="block text-white/80 font-medium mt-2">Listening...</span>
          <span className="block text-white/70 text-xs mt-1">
            Meeting summary so far: The meeting covered Q1 sales performance, feedback on pricing, and upcoming product.
          </span>
        </div>
      </div>
    ),
  },
  {
    key: "reasoning",
    title: "Response Reasoning",
    desc: "Every response gets broken down clearly. Each step explained for easy understanding.",
    body: (
      <div className="mt-5 text-sm text-white/60">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
          <span>Analyzing...</span>
        </div>
        <span className="block text-xs text-white/50 mt-0.5">
          This code sends a GET request to a placeholder API endpoint.
        </span>
        <pre className="bg-white/5 p-2 rounded-lg text-xs text-blue-200 mt-2 mb-1 font-mono overflow-x-auto">
{`import requests

# The URL for the API endpoint you want to reach
url = "https://api.example.com/data"

# Perform a GET request
response = requests.get(url)`}
        </pre>
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
