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
  const [isCssFullscreen, setIsCssFullscreen] = useState(false)

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
          doubleClickZoom: false,
          draggable: true,
          disableKeyboardCtrl: false,
          touchmoveTwoFingers: false,
          deviceOrientationControl: true,
          friction: 0.8,
          pitch: 0,
          yaw: 0,
          hfov: 100,
          minHfov: 50,
          maxHfov: 120,
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

    // Check if fullscreen API is supported
    const isFullscreenSupported = !!(
      document.fullscreenEnabled ||
      (document as any).webkitFullscreenEnabled ||
      (document as any).mozFullScreenEnabled ||
      (document as any).msFullscreenEnabled
    )

    if (isFullscreenSupported) {
      if (!isFullscreen) {
        const requestFullscreen =
          wrapperRef.current.requestFullscreen ||
          (wrapperRef.current as any).webkitRequestFullscreen ||
          (wrapperRef.current as any).mozRequestFullScreen ||
          (wrapperRef.current as any).msRequestFullscreen

        if (requestFullscreen) {
          requestFullscreen.call(wrapperRef.current)
        }
      } else {
        const exitFullscreen =
          document.exitFullscreen ||
          (document as any).webkitExitFullscreen ||
          (document as any).mozCancelFullScreen ||
          (document as any).msExitFullscreen

        if (exitFullscreen) {
          exitFullscreen.call(document)
        }
      }
    } else {
      // Fallback: use CSS fullscreen for iOS Safari
      setIsCssFullscreen(!isCssFullscreen)
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
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

  const isInFullscreen = isFullscreen || isCssFullscreen

  return (
    <div
      ref={wrapperRef}
      className={`${isCssFullscreen 
        ? 'fixed inset-0 z-[9999] w-screen h-screen rounded-none' 
        : 'w-full h-full min-h-[400px] rounded-lg'
      } overflow-hidden relative ${className}`}
    >
      <style>{`
        .pnlm-controls {
          display: none !important;
        }
        .pnlm-compass {
          display: none !important;
        }
      `}</style>
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
        className="absolute top-4 right-4 z-[100] p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg transition-colors"
        title={isInFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      >
        {isInFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
      </button>
    </div>
  )
}
