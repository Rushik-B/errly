import React from "react";
import { Instagram, Github } from "lucide-react";


export default function FooterLuxury() {
  return (
    <main 
      className="relative h-[650px] w-full overflow-hidden bg-black text-gray-200 bg-cover bg-[center_20%]"
      style={{ backgroundImage: "url('/lovable-uploads/footer.jpg')" }}
    >
      {/* Top Fade Overlay */}
      <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black to-transparent pointer-events-none" />

      {/* Slight dark overlay to enhance text readability */}
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />

      {/* Content container - above the overlay */}
      <div className="relative z-10 h-full flex flex-col">
        {/* ------------ HERO ------------ */}
        <section className="flex flex-col items-center justify-center gap-8 px-4 pt-0 text-center">
          <h1 className="font-semibold tracking-tight text-slate-200 drop-shadow-lg md:text-6xl sm:text-5xl text-4xl">
            Ready to fix errors before your customers see them?
          </h1>
          <p className="text-lg text-slate-300 drop-shadow">
            Try Errly today—no credit card required.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* Mac button */}
            <a
              href="/coming-soon"
              className="
                relative hidden md:block text-center rounded-full ring-3 ring-white/15 bg-gradient-to-t from-gray-300/70 to-white hover:bg-white text-black px-5 py-2.5 transition-colors duration-150 font-bold text-lg
              "
            >
              Start Your Free Trial
            </a>

            {/* Windows button */}
            <a
              href="/coming-soon"
              className="
                relative hidden md:block rounded-full bg-white/10 hover:bg-white/25 px-7 py-3 transition-colors duration-150 backdrop-blur
              "
            >
              <span className="flex items-center justify-center font-bold text-lg bg-clip-text text-transparent bg-gradient-to-t from-gray-300/70 to-white">
                See how Errly works
              </span>
            </a>
          </div>
        </section>


        {/* ------------ FOOTER GLASS CARD ------------ */}
        <footer className="absolute bottom-7 left-1/2 w-[90%] max-w-5xl -translate-x-1/2 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-xl md:p-12">
          <div className="grid gap-8 md:grid-cols-3">
            {/* Brand & socials */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <img
                  src="/lovable-uploads/errly-logo.png"
                  alt="Errly Logo"
                  width={28}  // Slightly smaller for the footer
                  height={28}
                  className="rounded-full"
                />
                <span className="text-2xl font-semibold">Errly</span>
              </div>
              <p className="text-sm leading-relaxed text-gray-300">
                Errly helps developers detect critical errors instantly through real-time SMS notifications, letting you proactively manage reliability.
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
                  <a href="/coming-soon" className="transition-all hover:text-white hover:font-bold hover:brightness-150">
                    Refund policy
                  </a>
                </li>
                <li>
                  <a href="/coming-soon" className="transition-all hover:text-white hover:font-bold hover:brightness-150">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/coming-soon" className="transition-all hover:text-white hover:font-bold hover:brightness-150">
                    Privacy policy
                  </a>
                </li>
                <li>
                  <a href="/coming-soon" className="transition-all hover:text-white hover:font-bold hover:brightness-150">
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
                  <a href="/coming-soon" className="transition-all hover:text-white hover:font-bold hover:brightness-150">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="/coming-soon" className="transition-all hover:text-white hover:font-bold hover:brightness-150">
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
