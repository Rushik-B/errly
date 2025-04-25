'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'

const NAV_LINKS = [
  { label: 'Use Cases', href: '/coming-soon' },
  { label: 'Pricing', href: '/coming-soon' },
  { label: 'Manifesto', href: '/coming-soon' },
  { label: 'Help Center', href: '/coming-soon' },
]

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false)
  const { user, signOut, loading } = useAuth()

  // ────────────────────────────────────────────────────────────
  // Detect scroll to toggle "compact" navbar
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40)
    }
    handleScroll() // run once on mount (in case we aren't at the very top)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // ────────────────────────────────────────────────────────────
  // Dynamic classes
  // ────────────────────────────────────────────────────────────
  const wrapperClasses = scrolled
    ? 'mx-auto w-[1100px] max-w-full rounded-full bg-black/60 backdrop-blur-xl px-8 py-3 shadow-lg'
    : 'w-full px-8'

  const listGap = scrolled ? 'gap-4' : 'gap-6'

  return (
    <nav
      className={`fixed top-0 left-0 z-40 w-full transition-all duration-300 ${
        scrolled ? 'pt-3' : 'pt-6'
      }`}
    >
      <div
        className={`flex items-center transition-all duration-300 ${wrapperClasses}`}
      >
        {/* ─────────── Logo ─────────── */}
        <div className="flex-1">
          <a href="/" className="flex items-center gap-2">
            <img
              src="/lovable-uploads/errly-logo.png"
              alt="Errly Logo"
              width={32}
              height={32}
              className="rounded-full"
            />
            <span className="ml-1 text-2xl font-semibold tracking-tight text-white">
              Errly
            </span>
          </a>
        </div>

        {/* ─────────── Links ─────────── */}
        <div className="flex-none">
          <ul
            className={`hidden md:flex ${listGap} transition-all duration-300`}
          >
            {NAV_LINKS.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="rounded-full px-4 py-2 text-base font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* ─────────── Auth Buttons / User Info ─────────── */}
        <div className="flex flex-1 items-center justify-end gap-3">
          {loading ? (
            <div className="h-8 w-24 rounded-full bg-white/10 animate-pulse"></div>
          ) : user ? (
            <>
              <span className="text-sm text-white/80 hidden sm:block">{user.email}</span>
              <Link
                to="/dashboard"
                className="rounded-full px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                Dashboard
              </Link>
              <button
                onClick={signOut}
                title="Logout"
                className="flex items-center justify-center rounded-full p-2 font-medium text-white/70 transition-all hover:bg-white/10"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <a
                href="/login"
                className="rounded-full px-6 py-2 font-medium text-white/70 transition-all hover:bg-white/10"
              >
                Log&nbsp;In
              </a>
              <a
                href="/login"
                className="rounded-full bg-white px-6 py-2 font-semibold text-black shadow-[0_4px_20px_rgba(0,0,0,0.30)] transition-all hover:bg-white/90"
              >
                Sign&nbsp;Up
              </a>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}