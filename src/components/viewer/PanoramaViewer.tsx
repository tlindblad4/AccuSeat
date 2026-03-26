'use client'

import { useEffect, useRef, useState } from 'react'

interface PanoramaViewerProps {
  imageUrl: string
  className?: string
}

export function PanoramaViewer({ imageUrl, className = '' }: PanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return
    
    setLoading(true)
    setError(null)

    // Dynamically import pannellum to avoid SSR issues
    import('pannellum').then((module: any) => {
      const pannellum = module.default || module
      if (containerRef.current && !viewerRef.current) {
        try {
          viewerRef.current = pannellum.viewer(containerRef.current, {
            type: 'equirectangular',
            panorama: imageUrl,
            autoLoad: true,
            compass: false,
            showFullscreenCtrl: true,
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
    }).catch((err) => {
      console.error('Import error:', err)
      setError('Failed to load viewer library')
      setLoading(false)
    })

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy()
        viewerRef.current = null
      }
    }
  }, [imageUrl])

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
      ref={containerRef}
      className={`w-full h-full min-h-[400px] rounded-lg overflow-hidden ${className}`}
      style={{ position: 'relative' }}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  )
}
