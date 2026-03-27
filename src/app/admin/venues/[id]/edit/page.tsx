'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Building2, MapPin, Save, Trash2, AlertTriangle } from 'lucide-react'

interface Venue {
  id: string
  name: string
  location: string
  slug: string
}

interface Section {
  id: string
  section_number: string
  section_name?: string
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
}

export default function EditVenuePage() {
  const params = useParams()
  const router = useRouter()
  const venueId = params.id as string

  const [venue, setVenue] = useState<Venue | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [rows, setRows] = useState<Row[]>([])
  const [seats, setSeats] = useState<Seat[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'sections' | 'rows' | 'seats'>('details')

  // Form states
  const [venueName, setVenueName] = useState('')
  const [venueLocation, setVenueLocation] = useState('')
  const [venueSlug, setVenueSlug] = useState('')

  useEffect(() => {
    loadVenue()
  }, [venueId])

  const loadVenue = async () => {
    const { data: venueData } = await supabase
      .from('venues')
      .select('*')
      .eq('id', venueId)
      .single()

    if (!venueData) {
      router.push('/admin')
      return
    }

    setVenue(venueData)
    setVenueName(venueData.name)
    setVenueLocation(venueData.location || '')
    setVenueSlug(venueData.slug)

    // Load sections
    const { data: sectionsData } = await supabase
      .from('sections')
      .select('*')
      .eq('venue_id', venueId)
      .order('section_number')

    setSections(sectionsData || [])

    // Load rows for all sections
    if (sectionsData && sectionsData.length > 0) {
      const sectionIds = sectionsData.map(s => s.id)
      const { data: rowsData } = await supabase
        .from('rows')
        .select('*')
        .in('section_id', sectionIds)
        .order('row_number')

      setRows(rowsData || [])

      // Load seats for all rows
      if (rowsData && rowsData.length > 0) {
        const rowIds = rowsData.map(r => r.id)
        const { data: seatsData } = await supabase
          .from('seats')
          .select('*')
          .in('row_id', rowIds)

        setSeats(seatsData || [])
      }
    }

    setLoading(false)
  }

  const saveVenueDetails = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('venues')
      .update({
        name: venueName,
        location: venueLocation,
        slug: venueSlug,
      })
      .eq('id', venueId)

    if (error) {
      alert('Error saving: ' + error.message)
    } else {
      alert('Venue updated!')
    }
    setSaving(false)
  }

  const deleteSection = async (sectionId: string) => {
    if (!confirm('Delete this section and all its rows/seats?')) return
    await supabase.from('sections').delete().eq('id', sectionId)
    loadVenue()
  }

  const deleteRow = async (rowId: string) => {
    if (!confirm('Delete this row and all its seats?')) return
    await supabase.from('rows').delete().eq('id', rowId)
    loadVenue()
  }

  const deleteSeat = async (seatId: string) => {
    if (!confirm('Delete this seat?')) return
    await supabase.from('seats').delete().eq('id', seatId)
    loadVenue()
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Edit Venue</h1>
          <p className="text-slate-600">{venue?.name}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'details', label: 'Details', icon: Building2 },
            { id: 'sections', label: `Sections (${sections.length})`, icon: MapPin },
            { id: 'rows', label: `Rows (${rows.length})`, icon: MapPin },
            { id: 'seats', label: `Seats (${seats.length})`, icon: MapPin },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="card-premium p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Venue Details</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Venue Name
                </label>
                <input
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={venueLocation}
                  onChange={(e) => setVenueLocation(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={venueSlug}
                  onChange={(e) => setVenueSlug(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Used in URLs: /venue/{venueSlug}
                </p>
              </div>
              <button
                onClick={saveVenueDetails}
                disabled={saving}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Sections Tab */}
        {activeTab === 'sections' && (
          <div className="card-premium overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Sections</h2>
              <Link
                href={`/admin/venues/${venueId}/setup`}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Add Section →
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {sections.map((section) => (
                <div key={section.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <p className="font-semibold text-slate-900">Section {section.section_number}</p>
                    {section.section_name && (
                      <p className="text-sm text-slate-500">{section.section_name}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteSection(section.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {sections.length === 0 && (
                <div className="px-6 py-12 text-center text-slate-500">
                  No sections yet. Use Setup to add sections.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rows Tab */}
        {activeTab === 'rows' && (
          <div className="card-premium overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Rows</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {sections.map((section) => {
                const sectionRows = rows.filter(r => r.section_id === section.id)
                return (
                  <div key={section.id} className="px-6 py-4">
                    <p className="font-semibold text-slate-900 mb-2">
                      Section {section.section_number}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {sectionRows.map((row) => (
                        <div
                          key={row.id}
                          className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg"
                        >
                          <span className="text-sm font-medium text-slate-700">
                            Row {row.row_number}
                          </span>
                          <button
                            onClick={() => deleteRow(row.id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {sectionRows.length === 0 && (
                        <span className="text-sm text-slate-400">No rows</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Seats Tab */}
        {activeTab === 'seats' && (
          <div className="card-premium overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Seats</h2>
            </div>
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {rows.map((row) => {
                const rowSeats = seats.filter(s => s.row_id === row.id)
                const section = sections.find(s => s.id === row.section_id)
                return (
                  <div key={row.id} className="px-6 py-3">
                    <p className="text-sm font-medium text-slate-700 mb-2">
                      Section {section?.section_number}, Row {row.row_number}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {rowSeats.map((seat) => (
                        <button
                          key={seat.id}
                          onClick={() => deleteSeat(seat.id)}
                          className="w-8 h-8 bg-slate-100 hover:bg-red-100 hover:text-red-600 rounded text-xs font-medium text-slate-600 transition-colors"
                          title={`Seat ${seat.seat_number} (click to delete)`}
                        >
                          {seat.seat_number}
                        </button>
                      ))}
                      {rowSeats.length === 0 && (
                        <span className="text-sm text-slate-400">No seats</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className="mt-8 card-premium p-6 border-red-200 bg-red-50/50">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-red-900">Danger Zone</h3>
          </div>
          <p className="text-red-700 mb-4">
            Deleting this venue will remove all sections, rows, seats, and photos. This cannot be undone.
          </p>
          <button
            onClick={async () => {
              if (!confirm('Are you sure? This will delete EVERYTHING for this venue.')) return
              await supabase.from('venues').delete().eq('id', venueId)
              router.push('/admin')
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
          >
            Delete Venue
          </button>
        </div>
      </main>
    </div>
  )
}
