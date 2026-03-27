'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PanoramaViewer } from '@/components/viewer/PanoramaViewer'
import { Eye, MapPin, ThumbsUp, ThumbsDown, Check, Phone, Share2, Users, X } from 'lucide-react'

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
  const [seats, setSeats] = useState<SharedSeat[]>([])
  const [isComparison, setIsComparison] = useState(false)
  const [selectedCompareSeat, setSelectedCompareSeat] = useState<SharedSeat | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [showCallbackModal, setShowCallbackModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [callbackPhone, setCallbackPhone] = useState('')
  const [callbackName, setCallbackName] = useState('')
  const [callbackSubmitted, setCallbackSubmitted] = useState(false)
  const [shareEmails, setShareEmails] = useState('')
  const [shareSubmitted, setShareSubmitted] = useState(false)

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

    setIsComparison(linkData.is_comparison || false)

    const { data: itemsData } = await supabase
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

    if (!itemsData || itemsData.length === 0) {
      setError('No seats found')
      setLoading(false)
      return
    }

    // Load all seats with photos
    const loadedSeats = await Promise.all(
      itemsData.map(async (item: any) => {
        const seatData = item.seat as any
        if (!seatData) return null

        const { data: photoData } = await supabase
          .from('photos')
          .select('*')
          .eq('seat_id', seatData.id)
          .single()

        return {
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
          rep_notes: item.rep_notes,
        }
      })
    )

    const validSeats = loadedSeats.filter(Boolean) as SharedSeat[]
    
    if (validSeats.length === 0) {
      setError('No seats found')
      setLoading(false)
      return
    }

    setSeats(validSeats)
    setSeat(validSeats[0])
    setSelectedCompareSeat(validSeats[0])

    await supabase.from('analytics_events').insert({
      share_link_id: linkData.id,
      event_type: 'view',
      seat_id: validSeats[0].id,
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

  const handleRequestCallback = async () => {
    if (!seat || !callbackPhone) return

    const { data: linkData } = await supabase
      .from('share_links')
      .select('*')
      .eq('token', token)
      .single()

    if (!linkData) return

    await supabase.from('rep_notifications').insert({
      user_id: linkData.created_by,
      type: 'callback_request',
      title: '📞 Callback Requested!',
      message: `${callbackName || 'A prospect'} wants a call about Section ${seat.section_number}, Row ${seat.row_number}, Seat ${seat.seat_number}. Phone: ${callbackPhone}`,
      share_link_id: linkData.id,
      seat_id: seat.id,
    })

    setCallbackSubmitted(true)
    setShowCallbackModal(false)
  }

  const handleShareWithGroup = async () => {
    if (!seat || !shareEmails) return

    const emails = shareEmails.split(',').map(e => e.trim()).filter(e => e)
    
    // In a real app, you'd send emails here
    // For now, just copy the link to clipboard
    const shareUrl = window.location.href
    navigator.clipboard.writeText(shareUrl)

    setShareSubmitted(true)
    setTimeout(() => {
      setShowShareModal(false)
      setShareSubmitted(false)
      setShareEmails('')
    }, 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !seat) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
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
        {/* Comparison Selector */}
        {isComparison && seats.length > 1 && (
          <div className="card-premium p-4 mb-6">
            <h3 className="font-bold text-slate-900 mb-3">Compare Seats ({seats.length})</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {seats.map((s, index) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedCompareSeat(s)}
                  className={`flex-shrink-0 p-3 rounded-xl border-2 transition-all ${
                    selectedCompareSeat?.id === s.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <p className="font-semibold text-slate-900">Option {index + 1}</p>
                  <p className="text-sm text-slate-500">
                    Sec {s.section_number}, Row {s.row_number}
                  </p>
                  <p className="text-sm text-slate-500">Seat {s.seat_number}</p>
                  {s.price && (
                    <p className="text-emerald-600 font-semibold">${s.price.toLocaleString()}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 360° Viewer */}
        {(selectedCompareSeat || seat)?.photo_url ? (
          <div className="card-premium overflow-hidden mb-6">
            <div className="h-[400px] md:h-[500px]">
              <PanoramaViewer imageUrl={(selectedCompareSeat || seat)!.photo_url!} />
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
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            {isComparison ? 'Selected Seat' : 'Your Seat'}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-500 mb-1">Section</p>
              <p className="text-lg font-bold text-slate-900">{(selectedCompareSeat || seat)?.section_number || 'N/A'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-500 mb-1">Row</p>
              <p className="text-lg font-bold text-slate-900">{(selectedCompareSeat || seat)?.row_number || 'N/A'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-500 mb-1">Seat</p>
              <p className="text-lg font-bold text-slate-900">{(selectedCompareSeat || seat)?.seat_number}</p>
            </div>
            {(selectedCompareSeat || seat)?.price && (
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-500 mb-1">Price</p>
                <p className="text-xl font-bold text-emerald-600">
                  ${(selectedCompareSeat || seat)!.price!.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {(selectedCompareSeat || seat)?.plan_type && (
            <div className="mb-3">
              <p className="text-sm text-slate-500">Plan</p>
              <p className="font-medium text-slate-900">{(selectedCompareSeat || seat)?.plan_type}</p>
            </div>
          )}

          {(selectedCompareSeat || seat)?.term_length && (
            <div className="mb-3">
              <p className="text-sm text-slate-500">Term</p>
              <p className="font-medium text-slate-900">{(selectedCompareSeat || seat)?.term_length}</p>
            </div>
          )}

          {(selectedCompareSeat || seat)?.rep_notes && (
            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-sm text-blue-600 font-medium mb-1">Notes from your rep</p>
              <p className="text-slate-700">{(selectedCompareSeat || seat)?.rep_notes}</p>
            </div>
          )}
        </div>

        {/* Feedback */}
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setShowCallbackModal(true)}
            className="card-premium p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-900">Request Callback</p>
              <p className="text-sm text-slate-500">Have a rep call you</p>
            </div>
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="card-premium p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-900">Share with Group</p>
              <p className="text-sm text-slate-500">Send to friends/family</p>
            </div>
          </button>
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

        {/* Callback Modal */}
        {showCallbackModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900">Request a Callback</h3>
                <button onClick={() => setShowCallbackModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              {callbackSubmitted ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-emerald-600" />
                  </div>
                  <p className="font-semibold text-slate-900">Request sent!</p>
                  <p className="text-slate-500">A rep will call you soon.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Your Name</label>
                    <input
                      type="text"
                      value={callbackName}
                      onChange={(e) => setCallbackName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      value={callbackPhone}
                      onChange={(e) => setCallbackPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <button
                    onClick={handleRequestCallback}
                    disabled={!callbackPhone}
                    className="w-full btn-primary py-3 disabled:opacity-50"
                  >
                    Request Callback
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900">Share with Group</h3>
                <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              {shareSubmitted ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-emerald-600" />
                  </div>
                  <p className="font-semibold text-slate-900">Link copied!</p>
                  <p className="text-slate-500">Share it with your group.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-slate-600">Share this seat with friends or family to get their opinion.</p>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email Addresses (optional)</label>
                    <textarea
                      value={shareEmails}
                      onChange={(e) => setShareEmails(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                      placeholder="email1@example.com, email2@example.com"
                    />
                    <p className="text-xs text-slate-500 mt-1">Separate multiple emails with commas</p>
                  </div>
                  <button
                    onClick={handleShareWithGroup}
                    className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Copy Link & Share
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
