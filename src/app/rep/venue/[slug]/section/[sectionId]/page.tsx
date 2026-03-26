'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Section, Row, Seat, Photo } from '@/types'
import { PanoramaViewer } from '@/components/viewer/PanoramaViewer'
import { ArrowLeft, Eye, Share2, Copy, Check, Loader2 } from 'lucide-react'

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
  const [showLinkBuilder, setShowLinkBuilder] = useState(false)
  const [clientPhone, setClientPhone] = useState('')
  const [clientName, setClientName] = useState('')
  const [linkNotes, setLinkNotes] = useState('')
  const [generatedLink, setGeneratedLink] = useState('')
  const [sendingSms, setSendingSms] = useState(false)
  const [smsStatus, setSmsStatus] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadSectionData()
  }, [sectionId])

  const loadSectionData = async () => {
    const { data: sectionData } = await supabase
      .from('sections')
      .select(`*, venue:venues(*)`)
      .eq('id', sectionId)
      .single()

    if (!sectionData) {
      router.push('/rep')
      return
    }

    setSection(sectionData)

    const { data: rowsData } = await supabase
      .from('rows')
      .select('*')
      .eq('section_id', sectionId)
      .order('row_number')

    setRows(rowsData || [])

    if (rowsData && rowsData.length > 0) {
      const { data: seatsData } = await supabase
        .from('seats')
        .select('*')
        .in('row_id', rowsData.map(r => r.id))

      const sortedSeats = (seatsData || []).sort((a, b) => {
        const numA = parseInt(a.seat_number) || 0
        const numB = parseInt(b.seat_number) || 0
        return numA - numB
      })

      setSeats(sortedSeats)
      setSelectedRow(rowsData[0].id)
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

  const generateLink = async () => {
    if (!selectedSeat) return

    const { data: session } = await supabase.auth.getSession()
    
    const { data: linkData, error } = await supabase
      .from('share_links')
      .insert({
        created_by: session.data.session?.user.id,
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

    await supabase.from('share_link_items').insert({
      share_link_id: linkData.id,
      seat_id: selectedSeat.id,
      option_order: 1,
      rep_notes: linkNotes,
    })

    const url = `${window.location.origin}/view/${linkData.token}`
    setGeneratedLink(url)
    setShowLinkBuilder(true)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filteredSeats = selectedRow
    ? seats.filter(s => s.row_id === selectedRow)
    : seats

  const selectedRowData = rows.find(r => r.id === selectedRow)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/rep/venue/${venueSlug}`} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-slate-900 font-semibold">
              {(section as any)?.venue?.name} - Section {section?.section_number}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Panel - Seat Selection */}
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">
                Section {section?.section_number}
              </h1>
              <p className="text-slate-600">Select a seat to view</p>
            </div>

            {/* Row Selector */}
            {rows.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Row
                </label>
                <select
                  value={selectedRow || ''}
                  onChange={(e) => setSelectedRow(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
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
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Seats ({filteredSeats.length})
              </label>
              <div className="grid grid-cols-4 gap-2">
                {filteredSeats.map((seat) => (
                  <button
                    key={seat.id}
                    onClick={() => handleSeatClick(seat)}
                    className={`p-3 rounded-xl font-semibold transition-all ${
                      selectedSeat?.id === seat.id
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-600'
                    }`}
                  >
                    {seat.seat_number}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Seat Info */}
            {selectedSeat && (
              <div className="card-premium p-4">
                <h3 className="font-bold text-slate-900 mb-2">
                  Seat {selectedSeat.seat_number}
                </h3>
                {selectedSeat.price && (
                  <p className="text-2xl font-bold text-emerald-600 mb-2">
                    ${selectedSeat.price.toLocaleString()}
                  </p>
                )}
                <button
                  onClick={() => setShowLinkBuilder(true)}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Create Share Link
                </button>
              </div>
            )}
          </div>

          {/* Right Panel - 360° Viewer */}
          <div className="lg:col-span-2">
            {seatPhoto ? (
              <div className="card-premium overflow-hidden">
                <div className="h-[500px]">
                  <PanoramaViewer imageUrl={seatPhoto.public_url} />
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100">
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Move your phone or drag to look around
                  </p>
                </div>
              </div>
            ) : selectedSeat ? (
              <div className="h-[500px] card-premium flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500">No photo available for this seat</p>
                </div>
              </div>
            ) : (
              <div className="h-[500px] card-premium flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500">Select a seat to view the 360° photo</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Link Builder Modal */}
        {showLinkBuilder && selectedSeat && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md animate-scale-in">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Create Share Link</h3>
              <p className="text-slate-600 mb-6">
                Section {section?.section_number}, Row {selectedRowData?.row_number}, Seat {selectedSeat.seat_number}
              </p>

              {!generatedLink ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Client Name
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
                      placeholder="John Smith"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Client Phone (optional)
                    </label>
                    <input
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Notes (optional)
                    </label>
                    <textarea
                      value={linkNotes}
                      onChange={(e) => setLinkNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
                      placeholder="Add any notes for the client..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowLinkBuilder(false)}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={generateLink}
                      className="flex-1 btn-primary"
                    >
                      Generate Link
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-sm text-slate-500 mb-2">Share this link:</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={generatedLink}
                        readOnly
                        className="flex-1 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm"
                      />
                      <button
                        onClick={copyLink}
                        className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
                      >
                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowLinkBuilder(false)
                      setGeneratedLink('')
                      setClientName('')
                      setClientPhone('')
                      setLinkNotes('')
                    }}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
                  >
                    Create Another Link
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
