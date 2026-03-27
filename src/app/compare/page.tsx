'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { PanoramaViewer } from '@/components/viewer/PanoramaViewer'
import { Eye, X, Check, MapPin, ArrowLeft, Share2 } from 'lucide-react'

interface CompareSeat {
  id: string
  seat_number: string
  section_number: string
  row_number: string
  price?: number
  photo_url?: string
  plan_type?: string
}

export default function ComparePage() {
  const searchParams = useSearchParams()
  const [seats, setSeats] = useState<CompareSeat[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadSeats()
  }, [searchParams])

  const loadSeats = async () => {
    const seatIds = searchParams.get('seats')?.split(',') || []
    
    if (seatIds.length === 0) {
      setLoading(false)
      return
    }

    const { data: seatsData } = await supabase
      .from('seats')
      .select(`
        id,
        seat_number,
        price,
        plan_type,
        row:rows(row_number, section:sections(section_number))
      `)
      .in('id', seatIds)

    if (!seatsData) {
      setLoading(false)
      return
    }

    // Load photos for each seat
    const seatsWithPhotos = await Promise.all(
      seatsData.map(async (seat: any) => {
        const { data: photoData } = await supabase
          .from('photos')
          .select('public_url')
          .eq('seat_id', seat.id)
          .single()

        return {
          id: seat.id,
          seat_number: seat.seat_number,
          section_number: seat.row?.section?.section_number,
          row_number: seat.row?.row_number,
          price: seat.price,
          plan_type: seat.plan_type,
          photo_url: photoData?.public_url,
        }
      })
    )

    setSeats(seatsWithPhotos)
    setLoading(false)
  }

  const toggleSeatSelection = (seatId: string) => {
    const newSelected = new Set(selectedSeats)
    if (newSelected.has(seatId)) {
      newSelected.delete(seatId)
    } else {
      newSelected.add(seatId)
    }
    setSelectedSeats(newSelected)
  }

  const shareComparison = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    alert('Comparison link copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (seats.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">No Seats to Compare</h1>
          <p className="text-slate-500 mb-4">Select seats from a venue to compare them side by side.</p>
          <Link href="/rep" className="btn-primary">Browse Venues</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/rep" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Link>
              <div>
                <h1 className="font-bold text-slate-900">Compare Seats</h1>
                <p className="text-sm text-slate-500">{seats.length} seats selected</p>
              </div>
            </div>
            <button
              onClick={shareComparison}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      </header>

      {/* Comparison Grid */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className={`grid gap-4 ${
          seats.length === 2 ? 'md:grid-cols-2' :
          seats.length === 3 ? 'md:grid-cols-3' :
          'md:grid-cols-2 lg:grid-cols-4'
        }`}>
          {seats.map((seat) => (
            <div
              key={seat.id}
              className={`card-premium overflow-hidden transition-all ${
                selectedSeats.has(seat.id) ? 'ring-2 ring-emerald-500' : ''
              }`}
            >
              {/* Photo */}
              <div className="h-48 sm:h-64 relative">
                {seat.photo_url ? (
                  <PanoramaViewer imageUrl={seat.photo_url} />
                ) : (
                  <div className="h-full flex items-center justify-center bg-slate-100">
                    <Eye className="w-12 h-12 text-slate-300" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      Sec {seat.section_number}, Row {seat.row_number}
                    </h3>
                    <p className="text-slate-500">Seat {seat.seat_number}</p>
                  </div>
                  {seat.price && (
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">
                        ${seat.price.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {seat.plan_type && (
                  <p className="text-sm text-slate-600 mb-3">{seat.plan_type}</p>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleSeatSelection(seat.id)}
                    className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                      selectedSeats.has(seat.id)
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {selectedSeats.has(seat.id) ? (
                      <>
                        <Check className="w-4 h-4" />
                        Selected
                      </>
                    ) : (
                      'Select'
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        {selectedSeats.size > 0 && (
          <div className="mt-6 card-premium p-4 bg-emerald-50 border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-emerald-900">
                  {selectedSeats.size} seat{selectedSeats.size > 1 ? 's' : ''} selected
                </p>
                <p className="text-sm text-emerald-700">
                  Total: ${Array.from(selectedSeats)
                    .map(id => seats.find(s => s.id === id)?.price || 0)
                    .reduce((a, b) => a + b, 0)
                    .toLocaleString()}
                </p>
              </div>
              <button className="btn-primary">
                Request Info
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
