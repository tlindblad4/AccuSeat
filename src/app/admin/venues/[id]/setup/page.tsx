'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Venue, Section, Row, Seat } from '@/types'

export default function VenueSetupPage() {
  const params = useParams()
  const router = useRouter()
  const venueId = params.id as string

  const [venue, setVenue] = useState<Venue | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [rows, setRows] = useState<Row[]>([])
  const [seats, setSeats] = useState<Seat[]>([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [sectionLevel, setSectionLevel] = useState('100-Level')
  const [sectionNumber, setSectionNumber] = useState('')
  const [rowNumber, setRowNumber] = useState('')
  const [seatStart, setSeatStart] = useState('')
  const [seatEnd, setSeatEnd] = useState('')
  const [seatPrice, setSeatPrice] = useState('')

  useEffect(() => {
    loadVenue()
  }, [venueId])

  const loadVenue = async () => {
    const { data } = await supabase
      .from('venues')
      .select('*')
      .eq('id', venueId)
      .single()

    if (data) {
      setVenue(data)
      loadSections(data.id)
    }
    setLoading(false)
  }

  const loadSections = async (id: string) => {
    const { data } = await supabase
      .from('sections')
      .select('*')
      .eq('venue_id', id)
      .order('level')
      .order('section_number')
    setSections(data || [])
  }

  const loadRows = async (sectionId: string) => {
    const { data } = await supabase
      .from('rows')
      .select('*')
      .eq('section_id', sectionId)
      .order('row_number')
    setRows(data || [])
  }

  const loadSeats = async (rowId: string) => {
    const { data } = await supabase
      .from('seats')
      .select('*')
      .eq('row_id', rowId)
      .order('seat_number')
    setSeats(data || [])
  }

  const addSection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sectionNumber) return

    await supabase.from('sections').insert({
      venue_id: venueId,
      name: `Section ${sectionNumber}`,
      level: sectionLevel,
      section_number: sectionNumber,
    })

    setSectionNumber('')
    loadSections(venueId)
  }

  const addRow = async (e: React.FormEvent, sectionId: string) => {
    e.preventDefault()
    if (!rowNumber) return

    await supabase.from('rows').insert({
      section_id: sectionId,
      row_number: rowNumber,
    })

    setRowNumber('')
    loadRows(sectionId)
  }

  const addSeats = async (e: React.FormEvent, rowId: string) => {
    e.preventDefault()
    if (!seatStart || !seatEnd) return

    const start = parseInt(seatStart)
    const end = parseInt(seatEnd)
    const seatData = []

    for (let i = start; i <= end; i++) {
      seatData.push({
        row_id: rowId,
        seat_number: i.toString(),
        price: seatPrice ? parseFloat(seatPrice) : null,
        is_available: true,
      })
    }

    await supabase.from('seats').insert(seatData)

    setSeatStart('')
    setSeatEnd('')
    setSeatPrice('')
    loadSeats(rowId)
  }

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
            <Link href="/admin" className="text-slate-400 hover:text-white transition-colors">
              Admin
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-white">Setup {venue?.name}</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-2">Setup {venue?.name}</h1>
        <p className="text-slate-400 mb-8">Add sections, rows, and seats</p>

        {/* Add Section */}
        <div className="bg-slate-800 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Add Section</h2>
          <form onSubmit={addSection} className="flex gap-4">
            <select
              value={sectionLevel}
              onChange={(e) => setSectionLevel(e.target.value)}
              className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
            >
              <option>100-Level</option>
              <option>200-Level</option>
              <option>300-Level</option>
              <option>Premium</option>
            </select>
            <input
              type="text"
              value={sectionNumber}
              onChange={(e) => setSectionNumber(e.target.value)}
              placeholder="Section number (e.g., 101)"
              className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
            >
              Add Section
            </button>
          </form>
        </div>

        {/* Sections List */}
        {sections.map((section) => (
          <div key={section.id} className="bg-slate-800 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {section.level} - Section {section.section_number}
              </h3>
            </div>

            {/* Add Row */}
            <form onSubmit={(e) => addRow(e, section.id)} className="flex gap-4 mb-4">
              <input
                type="text"
                value={rowNumber}
                onChange={(e) => setRowNumber(e.target.value)}
                placeholder="Row (e.g., A, B, 1, 2)"
                className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium"
              >
                Add Row
              </button>
            </form>

            {/* Rows */}
            <div className="space-y-4">
              {rows
                .filter((r) => r.section_id === section.id)
                .map((row) => (
                  <div key={row.id} className="bg-slate-700/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Row {row.row_number}</h4>
                    </div>

                    {/* Add Seats */}
                    <form onSubmit={(e) => addSeats(e, row.id)} className="flex gap-3 mb-3">
                      <input
                        type="number"
                        value={seatStart}
                        onChange={(e) => setSeatStart(e.target.value)}
                        placeholder="Start seat"
                        className="w-24 px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm"
                      />
                      <span className="self-center text-slate-400">to</span>
                      <input
                        type="number"
                        value={seatEnd}
                        onChange={(e) => setSeatEnd(e.target.value)}
                        placeholder="End seat"
                        className="w-24 px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm"
                      />
                      <input
                        type="number"
                        value={seatPrice}
                        onChange={(e) => setSeatPrice(e.target.value)}
                        placeholder="Price $"
                        className="w-28 px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-sm"
                      >
                        Add Seats
                      </button>
                    </form>

                    {/* Seats */}
                    <div className="flex flex-wrap gap-2">
                      {seats
                        .filter((s) => s.row_id === row.id)
                        .map((seat) => (
                          <span
                            key={seat.id}
                            className="px-2 py-1 bg-slate-600 rounded text-sm"
                          >
                            {seat.seat_number}
                          </span>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}

        {sections.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            No sections yet. Add your first section above.
          </div>
        )}
      </main>
    </div>
  )
}
