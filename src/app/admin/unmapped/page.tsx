'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Venue, Section, Row, Seat } from '@/types'

interface UnmappedFile {
  name: string
  path: string
  publicUrl: string
  size: number
  created_at: string
}

export default function UnmappedPhotosPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [selectedVenue, setSelectedVenue] = useState<string>('')
  const [unmappedFiles, setUnmappedFiles] = useState<UnmappedFile[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [selectedSection, setSelectedSection] = useState<string>('')
  const [rows, setRows] = useState<Row[]>([])
  const [selectedRow, setSelectedRow] = useState<string>('')
  const [seats, setSeats] = useState<Seat[]>([])
  const [loading, setLoading] = useState(true)
  const [mappingFile, setMappingFile] = useState<UnmappedFile | null>(null)

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
    // List files in the unmapped folder
    const { data, error } = await supabase.storage
      .from('seat-photos')
      .list(`${venueId}/unmapped`, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) {
      console.error('Error loading files:', error)
      setUnmappedFiles([])
      return
    }

    // Get public URLs for each file
    const files: UnmappedFile[] = (data || [])
      .filter(file => !file.id.endsWith('/')) // Filter out folders
      .map(file => {
        const { data: { publicUrl } } = supabase.storage
          .from('seat-photos')
          .getPublicUrl(`${venueId}/unmapped/${file.name}`)
        
        return {
          name: file.name,
          path: `${venueId}/unmapped/${file.name}`,
          publicUrl,
          size: file.metadata?.size || 0,
          created_at: file.created_at,
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
      .order('section_number')
    setSections(data || [])
    setSelectedSection('')
    setRows([])
    setSeats([])
  }

  const loadRows = async (sectionId: string) => {
    const { data } = await supabase
      .from('rows')
      .select('*')
      .eq('section_id', sectionId)
      .order('row_number')
    setRows(data || [])
    setSelectedRow('')
    setSeats([])
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

      // Save to database (insert only, no upsert since no unique constraint)
      // First check if photo already exists for this seat
      const { data: existingPhoto } = await supabase
        .from('photos')
        .select('id')
        .eq('seat_id', seatId)
        .maybeSingle()

      let dbError

      if (existingPhoto) {
        // Update existing
        const { error } = await supabase
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
        dbError = error
      } else {
        // Insert new
        const { error } = await supabase.from('photos').insert({
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
        dbError = error
      }

      if (dbError) {
        throw dbError
      }

      // Remove from unmapped list
      setUnmappedFiles(prev => prev.filter(f => f.path !== file.path))
      setMappingFile(null)
    } catch (error: any) {
      console.error('Error mapping file:', error)
      alert('Failed to map file: ' + (error.message || 'Unknown error'))
    }
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
            <span className="text-white">Unmapped Photos</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-2">Unmapped Photos</h1>
        <p className="text-slate-400 mb-8">
          Map uploaded photos to seats
        </p>

        {/* Venue Selection */}
        <div className="bg-slate-800 rounded-2xl p-6 mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Select Venue
          </label>
          <select
            value={selectedVenue}
            onChange={(e) => setSelectedVenue(e.target.value)}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="bg-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">
              Unmapped Files ({unmappedFiles.length})
            </h2>

            {unmappedFiles.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                No unmapped photos found for this venue.
              </p>
            ) : (
              <div className="space-y-4">
                {unmappedFiles.map((file) => (
                  <div
                    key={file.path}
                    className="flex items-center justify-between p-4 bg-slate-700 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-slate-400">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                    <button
                      onClick={() => setMappingFile(file)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
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
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-lg">
              <h3 className="text-xl font-semibold mb-4">
                Map: {mappingFile.name}
              </h3>

              {/* Section/Row/Seat Selectors */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Section
                  </label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
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
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Row
                  </label>
                  <select
                    value={selectedRow}
                    onChange={(e) => setSelectedRow(e.target.value)}
                    disabled={!selectedSection}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white disabled:opacity-50"
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
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Select Seat
                    </label>
                    <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto">
                      {seats.map((seat) => (
                        <button
                          key={seat.id}
                          onClick={() => mapFileToSeat(mappingFile, seat.id)}
                          className="p-2 bg-slate-700 hover:bg-blue-600 rounded text-sm transition-colors"
                        >
                          {seat.seat_number}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setMappingFile(null)}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
