'use client'

import { useEffect, useRef, useState } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'

interface PanoramaViewerProps {
  imageUrl: string
  className?: string
}

declare global {
  interface Window {
    pannellum?: any
  }
}

export function PanoramaViewer({ imageUrl, className = '' }: PanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return
    
    setLoading(true)
    setError(null)

    // Load pannellum script dynamically
    const loadPannellum = async () => {
      // Check if already loaded
      if (window.pannellum) {
        initViewer()
        return
      }

      // Load CSS
      if (!document.getElementById('pannellum-css')) {
        const link = document.createElement('link')
        link.id = 'pannellum-css'
        link.rel = 'stylesheet'
        link.href = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css'
        document.head.appendChild(link)
      }

      // Load JS
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js'
      script.onload = () => initViewer()
      script.onerror = () => {
        setError('Failed to load 360° viewer')
        setLoading(false)
      }
      document.body.appendChild(script)
    }

    const initViewer = () => {
      if (!containerRef.current || !window.pannellum) {
        setError('Viewer not available')
        setLoading(false)
        return
      }

      try {
        viewerRef.current = window.pannellum.viewer(containerRef.current, {
          type: 'equirectangular',
          panorama: imageUrl,
          autoLoad: true,
          compass: false,
          showFullscreenCtrl: false,
          showZoomCtrl: true,
          mouseZoom: true,
          doubleClickZoom: true,
          draggable: true,
          disableKeyboardCtrl: false,
          touchmoveTwoFingers: false,
          deviceOrientationControl: true,
          friction: 0.8,
          pitch: 0,
          yaw: 0,
          hfov: 100,
        })
        setLoading(false)
      } catch (err: any) {
        console.error('Pannellum error:', err)
        setError(err.message || 'Failed to load viewer')
        setLoading(false)
      }
    }

    loadPannellum()

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy()
        viewerRef.current = null
      }
    }
  }, [imageUrl])

  const toggleFullscreen = () => {
    if (!wrapperRef.current) return

    if (!isFullscreen) {
      if (wrapperRef.current.requestFullscreen) {
        wrapperRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  if (error) {
    return (
      <div className={`w-full h-full min-h-[400px] rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center ${className}`}>
        <div className="text-center p-6">
          <p className="text-red-400 mb-2">Failed to load 360° photo</p>
          <p className="text-slate-400 text-sm">{error}</p>
          <p className="text-slate-500 text-xs mt-2">URL: {imageUrl.slice(0, 50)}...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={wrapperRef}
      className={`w-full h-full min-h-[400px] rounded-lg overflow-hidden relative ${className}`}
    >
      <div
        ref={containerRef}
        className="w-full h-full"
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800 z-10">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      )}
      {/* Fullscreen Button */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg backdrop-blur-sm transition-colors"
        title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      >
        {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
      </button>
    </div>
  )
}
