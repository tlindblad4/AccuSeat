'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Section, Row, Seat, Photo } from '@/types'
import { PanoramaViewer } from '@/components/viewer/PanoramaViewer'

export default function SectionPage() {
  const params = useParams()
  const router = useRouter()
  const venueSlug = params.slug as string
  const sectionId = params.sectionId as string

  const [section, setSection] = useState<Section | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [seats, setSeats] = useState<Seat[]>([])
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null)
  const [seatPhoto, setSeatPhoto] = useState<Photo | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRow, setSelectedRow] = useState<string | null>(null)
  const [linkItems, setLinkItems] = useState<{ seat: Seat; notes: string }[]>([])
  const [showLinkBuilder, setShowLinkBuilder] = useState(false)
  const [clientPhone, setClientPhone] = useState('')
  const [clientName, setClientName] = useState('')
  const [linkNotes, setLinkNotes] = useState('')
  const [generatedLink, setGeneratedLink] = useState('')
  const [sendingSms, setSendingSms] = useState(false)
  const [smsStatus, setSmsStatus] = useState<string | null>(null)

  useEffect(() => {
    loadSectionData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId])

  const loadSectionData = async () => {
    // Load section with venue
    const { data: sectionData } = await supabase
      .from('sections')
      .select(`
        *,
        venue:venues(*)
      `)
      .eq('id', sectionId)
      .single()

    if (!sectionData) {
      router.push('/rep')
      return
    }

    setSection(sectionData as Section & { venue: { name: string } })

    // Load rows
    const { data: rowsData } = await supabase
      .from('rows')
      .select('*')
      .eq('section_id', sectionId)
      .order('row_number')

    setRows(rowsData || [])

    // Load seats for all rows
    if (rowsData && rowsData.length > 0) {
      const { data: seatsData } = await supabase
        .from('seats')
        .select('*')
        .in('row_id', rowsData.map(r => r.id))
        .order('seat_number')

      setSeats(seatsData || [])
      
      // Select first row by default
      if (rowsData.length > 0) {
        setSelectedRow(rowsData[0].id)
      }
    }

    setLoading(false)
  }

  const loadSeatPhoto = async (seatId: string) => {
    const { data: photoData } = await supabase
      .from('photos')
      .select('*')
      .eq('seat_id', seatId)
      .single()

    setSeatPhoto(photoData || null)
  }

  const handleSeatClick = async (seat: Seat) => {
    setSelectedSeat(seat)
    await loadSeatPhoto(seat.id)
  }

  const addToLink = () => {
    if (!selectedSeat) return
    
    // Only allow one seat per link
    setLinkItems([{ seat: selectedSeat, notes: '' }])
    setShowLinkBuilder(true)
  }

  const removeFromLink = (seatId: string) => {
    setLinkItems(linkItems.filter(item => item.seat.id !== seatId))
    if (linkItems.length <= 1) {
      setShowLinkBuilder(false)
    }
  }

  const generateLink = async () => {
    // Create share link
    const { data: linkData, error } = await supabase
      .from('share_links')
      .insert({
        created_by: (await supabase.auth.getSession()).data.session?.user.id,
        venue_id: section?.venue_id,
        client_name: clientName,
        client_phone: clientPhone,
        notes: linkNotes,
      })
      .select()
      .single()

    if (error || !linkData) {
      console.error('Error creating link:', error)
      return
    }

    // Add items to link
    const items = linkItems.map((item, index) => ({
      share_link_id: linkData.id,
      seat_id: item.seat.id,
      option_order: index + 1,
      rep_notes: item.notes,
    }))

    await supabase.from('share_link_items').insert(items)

    // Generate URL
    const url = `${window.location.origin}/view/${linkData.token}`
    setGeneratedLink(url)
  }

  const sendSMS = async () => {
    if (!clientPhone || !generatedLink) return

    setSendingSms(true)
    setSmsStatus(null)

    try {
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: clientPhone,
          message: linkNotes || `Hi ${clientName}, check out this seat view!`,
          linkUrl: generatedLink,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSmsStatus('SMS sent successfully!')
      } else if (data.linkUrl) {
        // SMS not configured but we have the link
        setSmsStatus('SMS not configured. Copy the link below to send manually.')
      } else {
        setSmsStatus('Failed to send SMS: ' + (data.error || 'Unknown error'))
      }
    } catch (error: any) {
      setSmsStatus('Error: ' + error.message)
    } finally {
      setSendingSms(false)
    }
  }

  const filteredSeats = selectedRow
    ? seats.filter(s => s.row_id === selectedRow)
    : seats

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4 text-sm">
            <Link href="/rep" className="text-slate-400 hover:text-white transition-colors">
              Venues
            </Link>
            <span className="text-slate-600">/</span>
            <Link 
              href={`/rep/venue/${venueSlug}`} 
              className="text-slate-400 hover:text-white transition-colors"
            >
              {(section as any)?.venue?.name}
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-white">Section {section?.section_number}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Panel - Seat Selection */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">
                {section?.level} - Section {section?.section_number}
              </h1>
              <p className="text-slate-400">Select a seat to view</p>
            </div>

            {/* Row Selector */}
            {rows.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Row
                </label>
                <select
                  value={selectedRow || ''}
                  onChange={(e) => setSelectedRow(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {rows.map((row) => (
                    <option key={row.id} value={row.id}>
                      Row {row.row_number}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Seats Grid */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Seats
              </label>
              <div className="grid grid-cols-4 gap-2">
                {filteredSeats.map((seat) => (
                  <button
                    key={seat.id}
                    onClick={() => handleSeatClick(seat)}
                    className={`p-3 rounded-lg font-medium transition-colors ${
                      selectedSeat?.id === seat.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {seat.seat_number}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Seat Info */}
            {selectedSeat && (
              <div className="bg-slate-800 rounded-xl p-4">
                <h3 className="font-semibold mb-2">Seat {selectedSeat.seat_number}</h3>
                {selectedSeat.price && (
                  <p className="text-2xl font-bold text-emerald-400 mb-2">
                    ${selectedSeat.price.toLocaleString()}
                  </p>
                )}
                {selectedSeat.plan_type && (
                  <p className="text-slate-400 text-sm">{selectedSeat.plan_type}</p>
                )}
                {selectedSeat.term_length && (
                  <p className="text-slate-400 text-sm">{selectedSeat.term_length}</p>
                )}
                <button
                  onClick={addToLink}
                  disabled={linkItems.some(item => item.seat.id === selectedSeat.id)}
                  className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 rounded-lg font-medium transition-colors"
                >
                  {linkItems.some(item => item.seat.id === selectedSeat.id)
                    ? 'Added to Link'
                    : 'Add to Link'}
                </button>
              </div>
            )}
          </div>

          {/* Right Panel - 360° Viewer */}
          <div className="lg:col-span-2">
            {seatPhoto ? (
              <div className="bg-slate-800 rounded-2xl overflow-hidden">
                <div className="h-[500px]">
                  <PanoramaViewer imageUrl={seatPhoto.public_url} />
                </div>
                <div className="p-4 bg-slate-800 border-t border-slate-700">
                  <p className="text-sm text-slate-400">
                    Move your phone or drag to look around
                  </p>
                </div>
              </div>
            ) : selectedSeat ? (
              <div className="h-[500px] bg-slate-800 rounded-2xl flex items-center justify-center">
                <p className="text-slate-400">No photo available for this seat</p>
              </div>
            ) : (
              <div className="h-[500px] bg-slate-800 rounded-2xl flex items-center justify-center">
                <p className="text-slate-400">Select a seat to view the 360° photo</p>
              </div>
            )}
          </div>
        </div>

        {/* Link Builder */}
        {showLinkBuilder && linkItems.length > 0 && (
          <div className="mt-8 bg-slate-800 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-4">Build Share Link</h3>
            
            {/* Selected Seats */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-slate-300 mb-2">Selected Options:</h4>
              <div className="space-y-2">
                {linkItems.map((item, index) => (
                  <div key={item.seat.id} className="flex items-center justify-between bg-slate-700 rounded-lg p-3">
                    <div>
                      <span className="font-medium">Option {index + 1}:</span>
                      <span className="ml-2">Section {section?.section_number}, Row {item.seat.row?.row_number}, Seat {item.seat.seat_number}</span>
                      {item.seat.price && (
                        <span className="ml-2 text-emerald-400">${item.seat.price.toLocaleString()}</span>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromLink(item.seat.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Client Info */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Client Name
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Client Phone
                </label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Notes
              </label>
              <textarea
                value={linkNotes}
                onChange={(e) => setLinkNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add any notes for the client..."
              />
            </div>

            {!generatedLink ? (
              <button
                onClick={generateLink}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-semibold transition-colors"
              >
                Generate Share Link
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-700 rounded-lg p-4">
                  <p className="text-sm text-slate-400 mb-2">Link generated:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={generatedLink}
                      readOnly
                      className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(generatedLink)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {clientPhone && (
                  <button
                    onClick={sendSMS}
                    disabled={sendingSms}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    {sendingSms ? (
                      <>
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Send via SMS
                      </>
                    )}
                  </button>
                )}

                {smsStatus && (
                  <div className={`p-3 rounded-lg text-sm ${
                    smsStatus.includes('success') 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {smsStatus}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
