'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PanoramaViewer } from '@/components/viewer/PanoramaViewer'
import { Eye, MapPin, ThumbsUp, ThumbsDown, Check } from 'lucide-react'

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

export default function ViewPage() {
  const params = useParams()
  const token = params.token as string

  const [seat, setSeat] = useState<SharedSeat | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  useEffect(() => {
    loadSharedSeat()
  }, [token])

  const loadSharedSeat = async () => {
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

    if (linkData.expires_at && new Date(linkData.expires_at) < new Date()) {
      setError('This link has expired')
      setLoading(false)
      return
    }

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

    await supabase.from('analytics_events').insert({
      share_link_id: linkData.id,
      event_type: 'view',
      seat_id: seatData.id,
    })

    setLoading(false)
  }

  const handleFeedback = async (type: 'like' | 'dislike') => {
    if (!seat) return

    const { data: linkData } = await supabase
      .from('share_links')
      .select('*')
      .eq('token', token)
      .single()

    if (!linkData) return

    await supabase.from('prospect_feedback').insert({
      share_link_id: linkData.id,
      seat_id: seat.id,
      feedback_type: type,
    })

    await supabase.from('rep_notifications').insert({
      user_id: linkData.created_by,
      type: 'feedback',
      title: type === 'like' ? '👍 Prospect liked a seat!' : '👎 Prospect passed on a seat',
      message: `${seat.venue_name} - Section ${seat.section_number}, Row ${seat.row_number}, Seat ${seat.seat_number}`,
      share_link_id: linkData.id,
      seat_id: seat.id,
    })

    setFeedbackSubmitted(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !seat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Link Error</h1>
          <p className="text-slate-500">{error || 'Seat not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900">AccuSeat</h1>
              {seat.venue_name && (
                <p className="text-sm text-slate-500">{seat.venue_name}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* 360° Viewer */}
        {seat.photo_url ? (
          <div className="card-premium overflow-hidden mb-6">
            <div className="h-[400px] md:h-[500px]">
              <PanoramaViewer imageUrl={seat.photo_url} />
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <div className="flex items-center gap-2 text-slate-600">
                <Eye className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Move your phone to look around</span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Tilt and rotate your phone to explore this seat&apos;s view
              </p>
            </div>
          </div>
        ) : (
          <div className="h-[400px] card-premium flex items-center justify-center mb-6">
            <p className="text-slate-500">Photo not available</p>
          </div>
        )}

        {/* Seat Info */}
        <div className="card-premium p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Your Seat</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-500 mb-1">Section</p>
              <p className="text-lg font-bold text-slate-900">{seat.section_number || 'N/A'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-500 mb-1">Row</p>
              <p className="text-lg font-bold text-slate-900">{seat.row_number || 'N/A'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-500 mb-1">Seat</p>
              <p className="text-lg font-bold text-slate-900">{seat.seat_number}</p>
            </div>
            {seat.price && (
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-500 mb-1">Price</p>
                <p className="text-xl font-bold text-emerald-600">
                  ${seat.price.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {seat.plan_type && (
            <div className="mb-3">
              <p className="text-sm text-slate-500">Plan</p>
              <p className="font-medium text-slate-900">{seat.plan_type}</p>
            </div>
          )}

          {seat.term_length && (
            <div className="mb-3">
              <p className="text-sm text-slate-500">Term</p>
              <p className="font-medium text-slate-900">{seat.term_length}</p>
            </div>
          )}

          {seat.rep_notes && (
            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-sm text-blue-600 font-medium mb-1">Notes from your rep</p>
              <p className="text-slate-700">{seat.rep_notes}</p>
            </div>
          )}
        </div>

        {/* Feedback */}
        {!feedbackSubmitted ? (
          <div className="card-premium p-6">
            <h3 className="font-bold text-slate-900 mb-4">What do you think?</h3>
            <div className="flex gap-3">
              <button
                onClick={() => handleFeedback('like')}
                className="flex-1 py-4 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <ThumbsUp className="w-5 h-5" />
                I like it
              </button>
              <button
                onClick={() => handleFeedback('dislike')}
                className="flex-1 py-4 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <ThumbsDown className="w-5 h-5" />
                Not for me
              </button>
            </div>
          </div>
        ) : (
          <div className="card-premium p-6 bg-emerald-50 border-emerald-200">
            <div className="flex items-center gap-3 text-emerald-700">
              <Check className="w-6 h-6" />
              <span className="font-semibold">Thanks for your feedback! The rep has been notified.</span>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
