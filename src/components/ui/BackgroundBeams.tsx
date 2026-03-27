'use client'

import { motion } from 'framer-motion'
import React from 'react'

export interface BackgroundBeamsProps {
  className?: string
}

export const BackgroundBeams = React.memo(({ className }: BackgroundBeamsProps) => {
  console.log('BackgroundBeams rendering')
  return (
    <div 
      className={`pointer-events-none ${className || ''}`} 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        overflow: 'hidden',
      }}
    >
      {/* Base gradient - more visible */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.15) 50%, rgba(99, 102, 241, 0.2) 100%)',
        }}
      />
      
      {/* Animated orbs - much more visible */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.6) 0%, rgba(59, 130, 246, 0.2) 40%, transparent 70%)',
          top: '-300px',
          left: '-200px',
        }}
        animate={{
          x: [0, 150, 0],
          y: [0, 100, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <motion.div
        className="absolute rounded-full"
        style={{
          width: '700px',
          height: '700px',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, rgba(139, 92, 246, 0.15) 40%, transparent 70%)',
          bottom: '-200px',
          right: '-150px',
        }}
        animate={{
          x: [0, -120, 0],
          y: [0, -80, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute rounded-full"
        style={{
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.5) 0%, rgba(99, 102, 241, 0.1) 40%, transparent 70%)',
          top: '40%',
          left: '60%',
          marginLeft: '-300px',
          marginTop: '-300px',
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  )
})

BackgroundBeams.displayName = 'BackgroundBeams'

export default BackgroundBeams
