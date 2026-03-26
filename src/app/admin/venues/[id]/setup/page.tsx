'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Trash2, Building2 } from 'lucide-react'

interface Section {
  id: string
  name: string
  level: string
  section_number: string
}

interface Row {
  id: string
  row_number: string
  section_id: string
}

interface Seat {
  id: string
  seat_number: string
  row_id: string
  price?: number
}

export default function VenueSetupPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [venue, setVenue] = useState<any>(null)
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
  }, [params.id])

  const loadVenue = async () => {
    const { data } = await supabase
      .from('venues')
      .select('*')
      .eq('id', params.id)
      .single()

    if (data) {
      setVenue(data)
      loadSections(data.id)
    }
    setLoading(false)
  }

  const loadSections = async (venueId: string) => {
    const { data } = await supabase
      .from('sections')
      .select('*')
      .eq('venue_id', venueId)
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
    setRows(prev => [...prev, ...(data || [])])
  }

  const loadSeats = async (rowId: string) => {
    const { data } = await supabase
      .from('seats')
      .select('*')
      .eq('row_id', rowId)
      .order('seat_number')
    setSeats(prev => [...prev, ...(data || [])])
  }

  const addSection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sectionNumber) return

    await supabase.from('sections').insert({
      venue_id: params.id,
      name: `Section ${sectionNumber}`,
      level: sectionLevel,
      section_number: sectionNumber,
    })

    setSectionNumber('')
    loadSections(params.id)
  }

  const addRow = async (sectionId: string) => {
    if (!rowNumber) return

    await supabase.from('rows').insert({
      section_id: sectionId,
      row_number: rowNumber,
    })

    setRowNumber('')
    loadRows(sectionId)
  }

  const addSeats = async (rowId: string) => {
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Back to Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Setup {venue?.name}</h1>
          <p className="text-slate-600">Add sections, rows, and seats to your venue</p>
        </div>

        {/* Add Section */}
        <div className="card-premium p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Section
          </h2>
          <form onSubmit={addSection} className="flex gap-4">
            <select
              value={sectionLevel}
              onChange={(e) => setSectionLevel(e.target.value)}
              className="px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
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
              className="flex-1 px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
            />
            <button
              type="submit"
              className="btn-primary"
            >
              Add Section
            </button>
          </form>
        </div>

        {/* Sections */}
        {sections.map((section) => (
          <div key={section.id} className="card-premium p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {section.level} - Section {section.section_number}
              </h3>
            </div>

            {/* Add Row */}
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                value={rowNumber}
                onChange={(e) => setRowNumber(e.target.value)}
                placeholder="Row (e.g., A, B, 1)"
                className="flex-1 px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
              />
              <button
                onClick={() => addRow(section.id)}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors"
              >
                Add Row
              </button>
            </div>

            {/* Rows */}
            <div className="space-y-4">
              {rows
                .filter((r) => r.section_id === section.id)
                .map((row) => (
                  <div key={row.id} className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-slate-900">Row {row.row_number}</h4>
                    </div>

                    {/* Add Seats */}
                    <div className="flex gap-3 mb-3">
                      <input
                        type="number"
                        value={seatStart}
                        onChange={(e) => setSeatStart(e.target.value)}
                        placeholder="Start seat"
                        className="w-24 px-3 py-2 bg-white border-2 border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                      />
                      <span className="self-center text-slate-400">to</span>
                      <input
                        type="number"
                        value={seatEnd}
                        onChange={(e) => setSeatEnd(e.target.value)}
                        placeholder="End seat"
                        className="w-24 px-3 py-2 bg-white border-2 border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                      />
                      <input
                        type="number"
                        value={seatPrice}
                        onChange={(e) => setSeatPrice(e.target.value)}
                        placeholder="Price $"
                        className="w-28 px-3 py-2 bg-white border-2 border-slate-200 rounded-lg text-sm focus:border-blue-500 outline-none"
                      />
                      <button
                        onClick={() => addSeats(row.id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors"
                      >
                        Add Seats
                      </button>
                    </div>

                    {/* Seats */}
                    <div className="flex flex-wrap gap-2">
                      {seats
                        .filter((s) => s.row_id === row.id)
                        .sort((a, b) => parseInt(a.seat_number) - parseInt(b.seat_number))
                        .map((seat) => (
                          <span
                            key={seat.id}
                            className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700"
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
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500">No sections yet. Add your first section above.</p>
          </div>
        )}
      </main>
    </div>
  )
}
