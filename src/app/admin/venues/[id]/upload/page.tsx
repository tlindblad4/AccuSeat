'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { BulkPhotoUpload } from '@/components/upload/BulkPhotoUpload'
import { ArrowLeft, Upload, Wand2 } from 'lucide-react'

interface Venue {
  id: string
  name: string
}

interface Section {
  id: string
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
}

export default function BulkUploadPage() {
  const params = useParams()
  const router = useRouter()
  const venueId = params.id as string

  const [venue, setVenue] = useState<Venue | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [rows, setRows] = useState<Row[]>([])
  const [seats, setSeats] = useState<Seat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVenueData()
  }, [venueId])

  const loadVenueData = async () => {
    // Load venue
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

    // Load sections
    const { data: sectionsData } = await supabase
      .from('sections')
      .select('*')
      .eq('venue_id', venueId)
      .order('section_number')

    setSections(sectionsData || [])

    // Load rows
    if (sectionsData && sectionsData.length > 0) {
      const sectionIds = sectionsData.map(s => s.id)
      const { data: rowsData } = await supabase
        .from('rows')
        .select('*')
        .in('section_id', sectionIds)
        .order('row_number')

      setRows(rowsData || [])

      // Load seats
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href={`/admin/venues/${venueId}/edit`}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
            <span className="text-slate-300">|</span>
            <h1 className="text-xl font-bold text-slate-900">Bulk Photo Upload</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Card */}
        <div className="card-premium p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Wand2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">
                Smart Photo Upload for {venue?.name}
              </h2>
              <p className="text-slate-600 mb-4">
                Upload hundreds of photos at once. The system automatically matches them to seats based on filenames.
              </p>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-slate-700 mb-2">Supported filename formats:</p>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Section-101-Row-A-Seat-12.jpg</li>
                  <li>• 101_A_12.jpg</li>
                  <li>• S101_R12_A1.jpg</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card-premium p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{sections.length}</p>
            <p className="text-sm text-slate-500">Sections</p>
          </div>
          <div className="card-premium p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{rows.length}</p>
            <p className="text-sm text-slate-500">Rows</p>
          </div>
          <div className="card-premium p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{seats.length}</p>
            <p className="text-sm text-slate-500">Seats</p>
          </div>
        </div>

        {/* Upload Component */}
        <BulkPhotoUpload
          venueId={venueId}
          sections={sections}
          rows={rows}
          seats={seats}
          onComplete={loadVenueData}
        />
      </main>
    </div>
  )
}
