import React from "react";
import { Instagram, Github } from "lucide-react";


export default function FooterLuxury() {
  return (
    <main 
      className="relative h-[650px] w-full overflow-hidden bg-black text-gray-200 bg-cover bg-top"
      style={{ backgroundImage: "url('/lovable-uploads/screenshot.png')" }}
    >
      {/* Slight dark overlay to enhance text readability */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content container - above the overlay */}
      <div className="relative z-10 h-full flex flex-col">
        {/* ------------ HERO ------------ */}
        <section className="flex flex-col items-center justify-center gap-8 px-4 pt-16 text-center">
          <h1 className="font-semibold tracking-tight text-slate-200 drop-shadow-lg md:text-6xl sm:text-5xl text-4xl">
            Take The Short Way.
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* Mac button */}
            <a
              href="#"
              className="
                flex items-center gap-2 px-7 py-3 rounded-full shadow-[0_2px_12px_0_rgba(74,175,255,0.16)] text-base font-medium bg-white/90 hover:bg-white transition-colors text-black border border-white/50
              "
              style={{
                fontWeight: 600
              }}
            >
              Start Your Free Trial
            </a>

            {/* Windows button */}
            <a
              href="/coming-soon"
              className="
                flex items-center gap-2 px-7 py-3 rounded-full text-white/95 border border-white/30 bg-[#232B4C]/60 hover:bg-[#21284a] transition-colors text-base font-semibold shadow
              "
              style={{
                fontWeight: 600
              }}
              onClick={(e) => {
                // e.preventDefault(); // <<< Make sure this line is removed or commented out

                // Use 'any' cast to bypass TypeScript error for now
                console.text('User clicked "See how it works" link', {
                  component: 'FooterLuxury',
                  href: '/coming-soon',
                  timestamp: new Date().toISOString(),
                });
                
                // The default navigation to href="/coming-soon" will happen automatically now
              }}
            >
              See how it works
            </a>
          </div>
        </section>


        {/* ------------ FOOTER GLASS CARD ------------ */}
        <footer className="absolute bottom-8 left-1/2 w-[90%] max-w-5xl -translate-x-1/2 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-xl md:p-12">
          <div className="grid gap-8 md:grid-cols-3">
            {/* Brand & socials */}
            <div className="space-y-4">
              <div className="text-2xl font-semibold">🌀 Errly</div>
              <p className="text-sm leading-relaxed text-gray-300">
                Errly is an undetectable AI‑powered assistant built for interviews,
                sales calls, Zoom meetings, and more.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <a href="#" className="transition-all hover:font-bold hover:brightness-150 hover:scale-110">
                  <img 
                    src="/lovable-uploads/1691832708new-twitter-x-logo-white.png" 
                    alt="X logo" 
                    className="w-5 h-5"
                  />
                </a>
                <a href="#" className="transition-all hover:text-white hover:font-bold hover:brightness-150 hover:scale-110">
                  <Github size={20} />
                </a>
              </div>
              <div className="pt-4 text-xs">
                <span className="mr-2 inline-flex h-2 w-2 items-center justify-center rounded-full bg-emerald-400" />
                All services are online
              </div>
              <p className="pt-4 text-xs text-gray-400">© 2025 Errly. All rights reserved.</p>
            </div>

            {/* Legal links */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-gray-400">
                Legal
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="transition-all hover:text-white hover:font-bold hover:brightness-150">
                    Refund policy
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-all hover:text-white hover:font-bold hover:brightness-150">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-all hover:text-white hover:font-bold hover:brightness-150">
                    Privacy policy
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-all hover:text-white hover:font-bold hover:brightness-150">
                    Cancellation Policy
                  </a>
                </li>
              </ul>
            </div>

            {/* Helpful links */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-gray-400">
                Links
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="transition-all hover:text-white hover:font-bold hover:brightness-150">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-all hover:text-white hover:font-bold hover:brightness-150">
                    Get Started
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-all hover:text-white hover:font-bold hover:brightness-150">
                    Log in to Errly
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
