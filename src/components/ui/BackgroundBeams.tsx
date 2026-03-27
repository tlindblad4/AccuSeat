'use client'

import { motion } from 'framer-motion'
import React from 'react'

export interface BackgroundBeamsProps {
  className?: string
}

export const BackgroundBeams = React.memo(({ className }: BackgroundBeamsProps) => {
  return (
    <div className={`pointer-events-none fixed inset-0 h-full w-full ${className || ''}`} style={{ zIndex: 0 }}>
      {/* Simple gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50" />
      
      {/* Animated beams container */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1000 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Generate multiple beam lines */}
        {Array.from({ length: 12 }).map((_, i) => {
          const yOffset = i * 50
          return (
            <motion.line
              key={i}
              x1="-100"
              y1={yOffset}
              x2="1100"
              y2={yOffset + 200}
              stroke="url(#beamGradient)"
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: [0, 1],
                opacity: [0, 0.5, 0.5, 0],
                x1: [-100, 1100],
                x2: [-100, 1100],
              }}
              transition={{
                duration: 3 + (i % 4),
                delay: i * 0.3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )
        })}

        {/* Diagonal beams */}
        {Array.from({ length: 8 }).map((_, i) => {
          const xOffset = i * 120
          return (
            <motion.line
              key={`diag-${i}`}
              x1={xOffset}
              y1="-100"
              x2={xOffset + 300}
              y2="700"
              stroke="url(#beamGradient2)"
              strokeWidth="1.5"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.4, 0.4, 0],
              }}
              transition={{
                duration: 4 + (i % 3),
                delay: i * 0.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )
        })}

        <defs>
          <linearGradient id="beamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0" />
            <stop offset="30%" stopColor="#3B82F6" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#8B5CF6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="beamGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0" />
            <stop offset="50%" stopColor="#6366F1" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
})

BackgroundBeams.displayName = 'BackgroundBeams'

export default BackgroundBeams
