'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, MapPin, ImageIcon, Check } from 'lucide-react'

interface UnmappedFile {
  name: string
  path: string
  publicUrl: string
  size: number
}

export default function UnmappedPhotosPage() {
  const [venues, setVenues] = useState<any[]>([])
  const [selectedVenue, setSelectedVenue] = useState('')
  const [unmappedFiles, setUnmappedFiles] = useState<UnmappedFile[]>([])
  const [sections, setSections] = useState<any[]>([])
  const [rows, setRows] = useState<any[]>([])
  const [seats, setSeats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mappingFile, setMappingFile] = useState<UnmappedFile | null>(null)
  const [selectedSection, setSelectedSection] = useState('')
  const [selectedRow, setSelectedRow] = useState('')

  useEffect(() => {
    loadVenues()
  }, [])

  useEffect(() => {
    if (selectedVenue) {
      loadUnmappedFiles(selectedVenue)
      loadSections(selectedVenue)
    }
  }, [selectedVenue])

  useEffect(() => {
    if (selectedSection) {
      loadRows(selectedSection)
    }
  }, [selectedSection])

  useEffect(() => {
    if (selectedRow) {
      loadSeats(selectedRow)
    }
  }, [selectedRow])

  const loadVenues = async () => {
    const { data } = await supabase.from('venues').select('*').order('name')
    setVenues(data || [])
    setLoading(false)
  }

  const loadUnmappedFiles = async (venueId: string) => {
    const { data, error } = await supabase.storage
      .from('seat-photos')
      .list(`${venueId}/unmapped`, { limit: 100 })

    if (error) {
      setUnmappedFiles([])
      return
    }

    const files: UnmappedFile[] = (data || [])
      .filter(file => !file.id.endsWith('/'))
      .map(file => {
        const { data: { publicUrl } } = supabase.storage
          .from('seat-photos')
          .getPublicUrl(`${venueId}/unmapped/${file.name}`)
        
        return {
          name: file.name,
          path: `${venueId}/unmapped/${file.name}`,
          publicUrl,
          size: file.metadata?.size || 0,
        }
      })

    setUnmappedFiles(files)
  }

  const loadSections = async (venueId: string) => {
    const { data } = await supabase
      .from('sections')
      .select('*')
      .eq('venue_id', venueId)
      .order('level')
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

  const mapFileToSeat = async (file: UnmappedFile, seatId: string) => {
    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      const isDng = fileExtension === 'dng'

      const { data: existingPhoto } = await supabase
        .from('photos')
        .select('id')
        .eq('seat_id', seatId)
        .maybeSingle()

      if (existingPhoto) {
        await supabase
          .from('photos')
          .update({
            storage_path: file.path,
            public_url: file.publicUrl,
            file_size: file.size,
            metadata: {
              original_name: file.name,
              extension: fileExtension,
              is_raw: isDng,
            },
          })
          .eq('seat_id', seatId)
      } else {
        await supabase.from('photos').insert({
          seat_id: seatId,
          storage_path: file.path,
          public_url: file.publicUrl,
          file_size: file.size,
          metadata: {
            original_name: file.name,
            extension: fileExtension,
            is_raw: isDng,
          },
        })
      }

      setUnmappedFiles(prev => prev.filter(f => f.path !== file.path))
      setMappingFile(null)
    } catch (error: any) {
      alert('Failed to map file: ' + error.message)
    }
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Map Photos to Seats</h1>
          <p className="text-slate-600">Assign uploaded photos to specific seats</p>
        </div>

        {/* Venue Selection */}
        <div className="card-premium p-6 mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Select Venue
          </label>
          <select
            value={selectedVenue}
            onChange={(e) => setSelectedVenue(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
          >
            <option value="">Choose a venue...</option>
            {venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
            ))}
          </select>
        </div>

        {/* Unmapped Files */}
        {selectedVenue && (
          <div className="card-premium p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Unmapped Photos ({unmappedFiles.length})
            </h2>

            {unmappedFiles.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500">No unmapped photos found.</p>
                <Link href="/admin/upload" className="btn-primary inline-flex mt-4">
                  Upload Photos
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unmappedFiles.map((file) => (
                  <div
                    key={file.path}
                    className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm truncate max-w-[150px]">
                            {file.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {(file.size / 1024 / 1024).toFixed(1)} MB
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setMappingFile(file)}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors"
                    >
                      Map to Seat
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mapping Modal */}
        {mappingFile && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg animate-scale-in">
              <h3 className="text-xl font-bold text-slate-900 mb-4">
                Map: {mappingFile.name}
              </h3>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Section
                  </label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                  >
                    <option value="">Select section...</option>
                    {sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.level} - {section.section_number}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Row
                  </label>
                  <select
                    value={selectedRow}
                    onChange={(e) => setSelectedRow(e.target.value)}
                    disabled={!selectedSection}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none disabled:opacity-50"
                  >
                    <option value="">Select row...</option>
                    {rows.map((row) => (
                      <option key={row.id} value={row.id}>
                        Row {row.row_number}
                      </option>
                    ))}
                  </select>
                </div>

                {seats.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Select Seat
                    </label>
                    <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto">
                      {seats.map((seat) => (
                        <button
                          key={seat.id}
                          onClick={() => mapFileToSeat(mappingFile, seat.id)}
                          className="p-3 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          {seat.seat_number}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setMappingFile(null)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
