'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PanoramaViewer } from '@/components/viewer/PanoramaViewer'

interface SharedSeat {
  id: string
  seat_number: string
  price?: number
  plan_type?: string
  term_length?: string
  payment_plan?: string
  section_number?: string
  row_number?: string
  venue_name?: string
  photo_url?: string
  rep_notes?: string
}

export default function SimpleViewPage() {
  const params = useParams()
  const token = params.token as string

  const [seat, setSeat] = useState<SharedSeat | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadSharedSeat()
  }, [token])

  const loadSharedSeat = async () => {
    // Load share link
    const { data: linkData } = await supabase
      .from('share_links')
      .select('*')
      .eq('token', token)
      .single()

    if (!linkData) {
      setError('Invalid or expired link')
      setLoading(false)
      return
    }

    // Check if expired
    if (linkData.expires_at && new Date(linkData.expires_at) < new Date()) {
      setError('This link has expired')
      setLoading(false)
      return
    }

    // Load the first (and only) item
    const { data: itemData } = await supabase
      .from('share_link_items')
      .select(`
        *,
        seat:seats(
          *,
          row:rows(*, section:sections(*, venue:venues(*)))
        )
      `)
      .eq('share_link_id', linkData.id)
      .order('option_order')
      .limit(1)
      .single()

    if (!itemData || !itemData.seat) {
      setError('No seat found')
      setLoading(false)
      return
    }

    const seatData = itemData.seat as any

    // Load photo for this seat
    const { data: photoData } = await supabase
      .from('photos')
      .select('*')
      .eq('seat_id', seatData.id)
      .single()

    setSeat({
      id: seatData.id,
      seat_number: seatData.seat_number,
      price: seatData.price,
      plan_type: seatData.plan_type,
      term_length: seatData.term_length,
      payment_plan: seatData.payment_plan,
      section_number: seatData.row?.section?.section_number,
      row_number: seatData.row?.row_number,
      venue_name: seatData.row?.section?.venue?.name,
      photo_url: photoData?.public_url,
      rep_notes: itemData.rep_notes,
    })

    // Track view
    await supabase.from('analytics_events').insert({
      share_link_id: linkData.id,
      event_type: 'view',
      seat_id: seatData.id,
    })

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !seat) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Link Error</h1>
          <p className="text-slate-400">{error || 'Seat not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold text-blue-400">AccuSeat</div>
              {seat.venue_name && (
                <>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-300">{seat.venue_name}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 360° Viewer */}
        {seat.photo_url ? (
          <div className="bg-slate-800 rounded-2xl overflow-hidden mb-6">
            <div className="h-[500px] lg:h-[600px]">
              <PanoramaViewer imageUrl={seat.photo_url} />
            </div>
            <div className="p-4 bg-slate-800 border-t border-slate-700">
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-medium text-white">
                  Move your phone to look around
                </p>
              </div>
              <p className="text-xs text-slate-400">
                Tilt and rotate your phone to explore this seat&apos;s view
              </p>
            </div>
          </div>
        ) : (
          <div className="h-[400px] bg-slate-800 rounded-2xl flex items-center justify-center mb-6">
            <p className="text-slate-400">Photo not available</p>
          </div>
        )}

        {/* Seat Info */}
        <div className="bg-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Your Seat</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-slate-400">Section</p>
              <p className="text-lg font-medium">{seat.section_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Row</p>
              <p className="text-lg font-medium">{seat.row_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Seat</p>
              <p className="text-lg font-medium">{seat.seat_number}</p>
            </div>
            {seat.price && (
              <div>
                <p className="text-sm text-slate-400">Price</p>
                <p className="text-xl font-bold text-emerald-400">
                  ${seat.price.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {seat.plan_type && (
            <div className="mb-4">
              <p className="text-sm text-slate-400">Plan</p>
              <p className="font-medium">{seat.plan_type}</p>
            </div>
          )}

          {seat.term_length && (
            <div className="mb-4">
              <p className="text-sm text-slate-400">Term</p>
              <p className="font-medium">{seat.term_length}</p>
            </div>
          )}

          {seat.payment_plan && (
            <div className="mb-4">
              <p className="text-sm text-slate-400">Payment</p>
              <p className="font-medium">{seat.payment_plan}</p>
            </div>
          )}

          {seat.rep_notes && (
            <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
              <p className="text-sm text-slate-400 mb-1">Notes from your rep</p>
              <p className="text-slate-200">{seat.rep_notes}</p>
            </div>
          )}
        </div>

        {/* Feedback */}
        <div className="mt-6 bg-slate-800 rounded-xl p-6">
          <h3 className="font-semibold mb-4">What do you think?</h3>
          <div className="flex gap-3">
            <button
              onClick={() => alert('Thanks for your feedback!')}
              className="flex-1 py-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/50 rounded-lg font-medium text-emerald-400 transition-colors"
            >
              👍 I like it
            </button>
            <button
              onClick={() => alert('Thanks for your feedback!')}
              className="flex-1 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 rounded-lg font-medium text-red-400 transition-colors"
            >
              👎 Not for me
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
