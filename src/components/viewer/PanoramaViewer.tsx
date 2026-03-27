'use client'

import { useEffect, useRef, useState } from 'react'
import { Maximize2, X } from 'lucide-react'

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
  const modalContainerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<any>(null)
  const modalViewerRef = useRef<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

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

  const openModal = () => {
    setShowModal(true)
    // Initialize modal viewer after render
    setTimeout(() => {
      if (modalContainerRef.current && window.pannellum && !modalViewerRef.current) {
        modalViewerRef.current = window.pannellum.viewer(modalContainerRef.current, {
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
      }
    }, 100)
  }

  const closeModal = () => {
    if (modalViewerRef.current) {
      modalViewerRef.current.destroy()
      modalViewerRef.current = null
    }
    setShowModal(false)
  }

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
    <>
      <div
        className={`w-full h-full min-h-[400px] rounded-lg overflow-hidden relative ${className}`}
      >
        <style>{`
          .pnlm-zoom-controls {
            display: none !important;
          }
          .pnlm-compass {
            display: none !important;
          }
          .pnlm-fullscreen-toggle-button {
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
        {/* Expand Button */}
        <button
          onClick={openModal}
          className="absolute top-4 right-4 z-50 p-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl shadow-lg transition-all"
          title="Expand View"
          type="button"
        >
          <Maximize2 className="w-6 h-6" />
        </button>
      </div>

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] bg-black">
          <div
            ref={modalContainerRef}
            className="w-full h-full"
          />
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 z-[10000] p-3 bg-white/20 hover:bg-white/30 text-white rounded-xl backdrop-blur-sm transition-all"
            title="Close"
            type="button"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </>
  )
}
