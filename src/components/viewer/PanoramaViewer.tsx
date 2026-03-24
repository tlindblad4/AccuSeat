'use client'

import { useEffect, useRef } from 'react'

interface PanoramaViewerProps {
  imageUrl: string
  className?: string
}

export function PanoramaViewer({ imageUrl, className = '' }: PanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return

    // Dynamically import pannellum to avoid SSR issues
    import('pannellum').then((pannellum) => {
      if (containerRef.current && !viewerRef.current) {
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
          // Mobile gyroscope support
          deviceOrientationControl: true,
          // Smooth movement
          friction: 0.8,
          // Initial view
          pitch: 0,
          yaw: 0,
          hfov: 100,
        })
      }
    })

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy()
        viewerRef.current = null
      }
    }
  }, [imageUrl])

  return (
    <div
      ref={containerRef}
      className={`w-full h-full min-h-[400px] rounded-lg overflow-hidden ${className}`}
      style={{ position: 'relative' }}
    />
  )
}
