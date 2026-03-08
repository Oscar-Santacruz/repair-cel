"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ModeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className="w-12 h-6 sm:w-16 sm:h-8" />
    }

    const isDark = theme === "dark"
    const toggleTheme = () => setTheme(isDark ? "light" : "dark")

    return (
        <button
            onClick={toggleTheme}
            className="group relative flex items-center justify-center rounded-full hover:bg-accent ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring p-1"
            aria-label="Cambiar tema"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 100 50"
                className="w-12 h-6 sm:w-16 sm:h-8 overflow-visible"
            >
                <defs>
                    <filter id="knob-shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.2" />
                    </filter>
                    <filter id="moon-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Main Pill */}
                <rect
                    width="100" height="50" rx="25"
                    fill={isDark ? "#1A233A" : "#48CAE4"}
                    className="transition-[fill] duration-500 ease-in-out"
                />

                {/* Background Details (Stars & Clouds) */}
                <g className="transition-opacity duration-500" style={{ opacity: isDark ? 1 : 0 }}>
                    <path fill="white" d="M25 11 Q25 15 29 15 Q25 15 25 19 Q25 15 21 15 Q25 15 25 11 Z" />
                    <path fill="white" d="M15 27 Q15 30 18 30 Q15 30 15 33 Q15 30 12 30 Q15 30 15 27 Z" />
                    <path fill="white" d="M42 33 Q42 35 44 35 Q42 35 42 37 Q42 35 40 35 Q42 35 42 33 Z" />
                </g>

                <g className="transition-all duration-500" style={{
                    opacity: isDark ? 0 : 0.9,
                    transform: isDark ? 'translateX(-10px)' : 'translateX(0)'
                }}>
                    <circle fill="white" cx="70" cy="27" r="5" />
                    <circle fill="white" cx="76" cy="23" r="6" />
                    <circle fill="white" cx="82" cy="27" r="5" />
                    <rect fill="white" x="70" y="27" width="12" height="5" />
                </g>

                {/* The Sliding Knob Container */}
                <g
                    className="transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    style={{ transform: isDark ? 'translateX(50px)' : 'translateX(0)' }}
                >
                    <circle cx="25" cy="25" r="21" fill="white" filter="url(#knob-shadow)" />

                    {/* Inner Graphic Container (Rotation) */}
                    <g
                        className="transition-transform duration-500 origin-[25px_25px]"
                        style={{ transform: isDark ? 'rotate(360deg)' : 'rotate(0deg)' }}
                    >
                        {/* Sun Rays (Light Only) */}
                        <g
                            stroke="#FFB703" strokeWidth="2.2" strokeLinecap="round"
                            className="transition-opacity duration-300"
                            style={{ opacity: isDark ? 0 : 1 }}
                        >
                            <line x1="25" y1="11" x2="25" y2="7" />
                            <line x1="25" y1="39" x2="25" y2="43" />
                            <line x1="11" y1="25" x2="7" y2="25" />
                            <line x1="39" y1="25" x2="43" y2="25" />
                            <line x1="15.1" y1="15.1" x2="12.3" y2="12.3" />
                            <line x1="34.9" y1="34.9" x2="37.7" y2="37.7" />
                            <line x1="15.1" y1="34.9" x2="12.3" y2="37.7" />
                            <line x1="34.9" y1="15.1" x2="37.7" y2="12.3" />
                        </g>

                        {/* Core Circle (Sun/Moon) */}
                        <circle
                            cx="25" cy="25" r="11"
                            fill={isDark ? "#F1FAEE" : "#FFB703"}
                            filter={isDark ? "url(#moon-glow)" : "none"}
                            className="transition-all duration-500"
                        />

                        {/* Moon craters (Dark only) */}
                        <g
                            fill="#CFD8DC"
                            className="transition-opacity duration-500"
                            style={{ opacity: isDark ? 1 : 0, transitionDelay: isDark ? '200ms' : '0ms' }}
                        >
                            <circle cx="21" cy="21" r="3" />
                            <circle cx="29" cy="28" r="2.5" />
                            <circle cx="31" cy="21" r="1.5" />
                        </g>
                    </g>
                </g>
            </svg>
        </button>
    )
}
