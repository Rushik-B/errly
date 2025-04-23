'use client';

import React, { useState } from 'react';
// import { motion } from 'framer-motion'; // Removed framer-motion import
import { Button } from './ui/button';
import { ArrowRight, Check } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  PLAN DATA                                                         */
/* ------------------------------------------------------------------ */
const plans = [
  {
    name: 'Hacker',
    monthly: { price: '$10', subtitle: '/mo' },
    yearly: { price: '$100', subtitle: '/yr' },
    features: [
      'Up to 5,000 error alerts',
      'SMS notifications',
      'Email support',
      'Basic dashboard access',
    ],
    cta: {
      text: 'Start Free Trial',
      icon: <ArrowRight className="ml-1 w-4 h-4" />,
      style: 'bg-[#16161e] text-white hover:bg-white/10 border-none',
    },
    shadow: 'shadow-[0_2px_40px_rgba(60,64,100,0.25)]',
    highlighted: false,
  },
  {
    name: 'Startup',
    monthly: { price: '$49', subtitle: '/mo' },
    yearly: { price: '$490', subtitle: '/yr' },
    features: [
      'Up to 50,000 error alerts',
      'Voice & SMS notifications',
      'Advanced dashboard & analytics',
      'Unlimited team members',
      'Priority chat support',
    ],
    cta: {
      text: 'Get Started',
      icon: <ArrowRight className="ml-1 w-4 h-4" />,
      style:
        'bg-gradient-to-br from-white/90 via-white/80 to-white/60 text-black shadow-lg hover:scale-105 transition-transform px-6',
    },
    shadow: 'shadow-[0_6px_40px_rgba(12,72,180,0.12)]',
    highlighted: true,
    gradient:
      'bg-[radial-gradient(ellipse_120%_120%_at_60%_40%,rgba(43,107,242,0.25)_0%,rgba(32,61,129,0.15)_100%)] bg-blue-900/40 border border-blue-300/10',
  },
  {
    name: 'Enterprise',
    monthly: { price: 'Custom', subtitle: 'Contact us' },
    yearly: { price: 'Custom', subtitle: 'Contact us' },
    features: [
      'Unlimited error alerts',
      'Custom notification workflows',
      'Dedicated account manager',
      'Enterprise‑grade analytics',
      'SSO & custom integrations',
    ],
    cta: {
      text: 'Contact Sales',
      icon: null,
      style: 'bg-[#16161e] text-white hover:bg-white/10 border-none',
    },
    shadow: 'shadow-[0_2px_40px_rgba(60,64,100,0.25)]',
    highlighted: false,
  },
];

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                         */
/* ------------------------------------------------------------------ */
export default function PricingSection() {
  const [tab, setTab] = useState<'monthly' | 'yearly'>('monthly');
  // Removed animation state variables
  // const [active, setActive] = useState<number | null>(null);
  // const [isHoveringContainer, setIsHoveringContainer] = useState(false);
  
  const cardBaseWidth = 200;
  const cardHeightRatio = 1.05;

  return (
    <section
      aria-label="Pricing"
      className="w-full flex flex-col items-center pt-20 sm:pt-24 md:pt-32 pb-16 sm:pb-20 bg-black px-4 overflow-hidden"
    >
      {/* Heading ---------------------------------------------------- */}
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white/90 text-center tracking-tight mb-6 max-w-5xl">
        Choose Your Error‑Monitoring Plan
        <br />
        <span className="text-white/70 font-semibold text-xl sm:text-2xl md:text-3xl">
          Perfect fits for every team size
        </span>
      </h2>

      {/* Toggle ----------------------------------------------------- */}
      <div className="relative flex items-center gap-2 rounded-full bg-white/5 border border-white/10 p-1 mb-10 sm:mb-16">
        {/* slider */}
        <div
          className={`absolute top-1 bottom-1 left-1 w-[120px] rounded-full bg-gradient-to-br from-blue-600 via-sky-600 to-purple-500 transition-transform duration-300 ${
            tab === 'yearly' ? 'translate-x-[calc(100%+8px)]' : ''
          }`}
        />
        {/* buttons */}
        {(['monthly', 'yearly'] as const).map((option) => (
          <button
            key={option}
            onClick={() => setTab(option)}
            className={`relative z-10 min-w-[120px] py-2 font-semibold transition-colors ${
              tab === option ? 'text-white' : 'text-white/60'
            }`}
          >
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </button>
        ))}
      </div>

      {/* Cards ------------------------------------------------------ */}
      <div
        className="flex flex-col md:flex-row items-center md:items-stretch gap-6 md:gap-8 lg:gap-10 w-full max-w-[1100px] px-4"
        // Removed container event handlers
        // onMouseEnter={() => setIsHoveringContainer(true)}
        // onMouseLeave={() => {
        //   setIsHoveringContainer(false);
        //   setActive(null);
        // }}
      >
        {plans.map((plan, idx) => {
          const isHighlight = plan.highlighted;
          // Removed animation-related variables
          // const isActive = idx === active;
          // const isBlurred = isHoveringContainer && !isActive;
          // const isFocused = isHoveringContainer && isActive;
          
          const cardWidthSm = cardBaseWidth + 40;
          const cardMinHeight = Math.round(cardBaseWidth * cardHeightRatio);
          
          return (
            <div
              key={plan.name}
              className={`relative w-full max-w-[${cardBaseWidth}px] sm:max-w-[${cardWidthSm}px] min-h-[${cardMinHeight}px] rounded-[28px] overflow-hidden px-6 sm:px-7 py-7 flex flex-col justify-between mb-6 md:mb-0 
                ${
                  isHighlight
                    ? `${plan.gradient} ${plan.shadow} border border-blue-200/10 backdrop-blur-md`
                    : `bg-white/[0.02] border border-white/10 backdrop-blur-lg shadow-inner shadow-white/5 ${plan.shadow}`
                }
                transition-all duration-300 ease-in-out hover:-translate-y-2 hover:scale-[1.03] hover:shadow-xl hover:shadow-blue-900/20 hover:z-10
              `}
              style={{
                backgroundImage: isHighlight
                  ? `url('/lovable-uploads/ChatGPT Image Apr 20, 2025, 10_15_26 PM.png')`
                  : `linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 35%), linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('/lovable-uploads/ChatGPT Image Apr 20, 2025, 10_20_56 PM.png')`,
                backgroundSize: isHighlight ? '145%' : 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* TOP ------------------------------------------------ */}
              <div className="w-full">
                {/* plan name */}
                <p className="text-xl font-semibold text-white mb-4 tracking-wide">
                  {plan.name}
                </p>

                {/* price */}
                {plan.name === 'Enterprise' ? (
                  <div className="mb-6 sm:mb-7">
                    <span className="text-3xl sm:text-4xl font-bold text-white leading-none tracking-tight">
                      {plan[tab].price}
                    </span>
                    {/* Subtitle removed for Enterprise as CTA clarifies */}
                  </div>
                ) : (
                  <div className="flex items-baseline gap-2 mb-6 sm:mb-7">
                    <span className="text-4xl sm:text-5xl font-extrabold text-white leading-none tracking-tight">
                      {plan[tab].price}
                    </span>
                    <span className="text-lg sm:text-xl font-semibold text-white/80">
                      {plan[tab].subtitle}
                    </span>
                  </div>
                )}

                {/* feature list */}
                <ul className="flex flex-col gap-2.5 sm:gap-3">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                      <span className="text-white/75 leading-snug text-sm sm:text-base">
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA ------------------------------------------------ */}
              <Button
                className={`w-full mt-8 sm:mt-10 font-semibold rounded-full py-2.5 sm:py-3 text-sm sm:text-base ${
                  plan.cta.style
                }`}
              >
                {plan.cta.text}
                {plan.cta.icon}
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
