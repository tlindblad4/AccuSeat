'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ShareLink, ShareLinkItem, Photo } from '@/types'
import { PanoramaViewer } from '@/components/viewer/PanoramaViewer'

export default function ViewPage() {
  const params = useParams()
  const token = params.token as string

  const [shareLink, setShareLink] = useState<ShareLink | null>(null)
  const [items, setItems] = useState<(ShareLinkItem & { photo?: Photo })[]>([])
  const [selectedOption, setSelectedOption] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showNotes, setShowNotes] = useState(false)

  useEffect(() => {
    loadShareLink()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const loadShareLink = async () => {
    // Load share link
    const { data: linkData } = await supabase
      .from('share_links')
      .select(`
        *,
        venue:venues(*)
      `)
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

    setShareLink(linkData)

    // Load items with seats and photos
    const { data: itemsData } = await supabase
      .from('share_link_items')
      .select(`
        *,
        seat:seats(
          *,
          row:rows(*, section:sections(*))
        )
      `)
      .eq('share_link_id', linkData.id)
      .order('option_order')

    if (itemsData) {
      // Load photos for each seat
      const itemsWithPhotos: (ShareLinkItem & { photo?: Photo })[] = await Promise.all(
        itemsData.map(async (item) => {
          const { data: photoData } = await supabase
            .from('photos')
            .select('*')
            .eq('seat_id', item.seat_id)
            .single()
          
          return { ...item, photo: photoData || undefined }
        })
      )
      
      setItems(itemsWithPhotos)
    }

    // Track view
    await supabase.from('analytics_events').insert({
      share_link_id: linkData.id,
      event_type: 'view',
    })

    // Increment view count
    await supabase.rpc('increment_view_count', { link_id: linkData.id })

    setLoading(false)
  }

  const handleFeedback = async (type: 'like' | 'dislike') => {
    if (!shareLink) return

    await supabase.from('analytics_events').insert({
      share_link_id: shareLink.id,
      event_type: type,
      seat_id: items[selectedOption]?.seat_id,
    })

    // Show feedback confirmation
    alert(type === 'like' ? 'Thanks for your feedback!' : 'Thanks for letting us know!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Link Error</h1>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    )
  }

  const currentItem = items[selectedOption]

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold text-blue-400">AccuSeat</div>
              <span className="text-slate-400">|</span>
              <span className="text-slate-300">{(shareLink as any)?.venue?.name}</span>
            </div>
            {shareLink?.client_name && (
              <div className="text-sm text-slate-400">
                Prepared for: <span className="text-white">{shareLink.client_name}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Option Selector */}
        {items.length > 1 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {items.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedOption(index)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedOption === index
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Option {index + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* 360° Viewer */}
          <div className="lg:col-span-2">
            {currentItem?.photo ? (
              <div className="bg-slate-800 rounded-2xl overflow-hidden">
                <div className="h-[500px] lg:h-[600px]">
                  <PanoramaViewer imageUrl={currentItem.photo.public_url} />
                </div>
                <div className="p-4 bg-slate-800 border-t border-slate-700 flex items-center justify-between">
                  <p className="text-sm text-slate-400">
                    Move your phone or drag to look around
                  </p>
                  <button
                    onClick={() => setShowNotes(!showNotes)}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    {showNotes ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-[500px] bg-slate-800 rounded-2xl flex items-center justify-center">
                <p className="text-slate-400">No photo available</p>
              </div>
            )}
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* Seat Details */}
            <div className="bg-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">
                {items.length > 1 ? `Option ${selectedOption + 1}` : 'Seat Details'}
              </h2>
              
              {currentItem?.seat && (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Section</span>
                    <span className="font-medium">{currentItem.seat.row?.section?.section_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Row</span>
                    <span className="font-medium">{currentItem.seat.row?.row_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Seat</span>
                    <span className="font-medium">{currentItem.seat.seat_number}</span>
                  </div>
                  {currentItem.seat.price && (
                    <div className="flex justify-between pt-3 border-t border-slate-700">
                      <span className="text-slate-400">Price</span>
                      <span className="text-2xl font-bold text-emerald-400">
                        ${currentItem.seat.price.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {currentItem.seat.plan_type && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Plan</span>
                      <span className="font-medium">{currentItem.seat.plan_type}</span>
                    </div>
                  )}
                  {currentItem.seat.term_length && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Term</span>
                      <span className="font-medium">{currentItem.seat.term_length}</span>
                    </div>
                  )}
                  {currentItem.seat.payment_plan && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Payment</span>
                      <span className="font-medium">{currentItem.seat.payment_plan}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Rep Notes */}
            {showNotes && (currentItem?.rep_notes || shareLink?.notes) && (
              <div className="bg-slate-800 rounded-xl p-6">
                <h3 className="font-semibold mb-3">Notes from your rep</h3>
                {currentItem?.rep_notes && (
                  <p className="text-slate-300 mb-3">{currentItem.rep_notes}</p>
                )}
                {shareLink?.notes && (
                  <p className="text-slate-300">{shareLink.notes}</p>
                )}
              </div>
            )}

            {/* Feedback */}
            <div className="bg-slate-800 rounded-xl p-6">
              <h3 className="font-semibold mb-4">What do you think?</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => handleFeedback('like')}
                  className="flex-1 py-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/50 rounded-lg font-medium text-emerald-400 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                  Like
                </button>
                <button
                  onClick={() => handleFeedback('dislike')}
                  className="flex-1 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 rounded-lg font-medium text-red-400 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                  </svg>
                  Pass
                </button>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-slate-800 rounded-xl p-6 text-center">
              <p className="text-slate-400 text-sm mb-3">
                Interested in this seat?
              </p>
              <a
                href={`tel:${shareLink?.client_phone || ''}`}
                className="inline-block w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
              >
                Contact Your Rep
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
