'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Venue, Section, Row, Seat } from '@/types'

interface UploadProgress {
  total: number
  completed: number
  failed: number
  currentFile: string
}

export default function BulkUploadPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [selectedVenue, setSelectedVenue] = useState<string>('')
  const [sections, setSections] = useState<Section[]>([])
  const [selectedSection, setSelectedSection] = useState<string>('')
  const [rows, setRows] = useState<Row[]>([])
  const [selectedRow, setSelectedRow] = useState<string>('')
  const [seats, setSeats] = useState<Seat[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<UploadProgress | null>(null)
  const [mappingMode, setMappingMode] = useState<'auto' | 'manual'>('auto')
  const [seatMapping, setSeatMapping] = useState<Record<string, string>>({})
  const router = useRouter()

  useEffect(() => {
    loadVenues()
  }, [])

  useEffect(() => {
    if (selectedVenue) {
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files)
      setFiles(fileArray)
      
      // Auto-map files to seats based on filename
      if (mappingMode === 'auto') {
        const mapping: Record<string, string> = {}
        fileArray.forEach(file => {
          // Try to extract seat number from filename
          // Supports: "LOWER 101_A_1.dng", "Section-101-Row-A-Seat-1.jpg", "101-A-1.jpg", "1.jpg", "1.dng"
          // Pattern: anything followed by underscore or hyphen, then number before .extension
          const match = file.name.match(/[\s_-](\d+)\.(jpg|jpeg|dng)$/i) || 
                       file.name.match(/(\d+)\.(jpg|jpeg|dng)$/i)
          if (match) {
            const seatNum = match[1]
            const seat = seats.find(s => s.seat_number === seatNum)
            if (seat) {
              mapping[file.name] = seat.id
            }
          }
        })
        setSeatMapping(mapping)
      }
    }
  }

  const uploadFiles = async () => {
    if (!selectedVenue || files.length === 0) return

    setUploading(true)
    setProgress({
      total: files.length,
      completed: 0,
      failed: 0,
      currentFile: '',
    })

    for (const file of files) {
      setProgress((prev) => ({
        ...prev!,
        currentFile: file.name,
      }))

      try {
        // Determine seat ID
        let seatId = seatMapping[file.name]
        
        // If no mapping, try to find by filename
        if (!seatId && mappingMode === 'auto') {
          const match = file.name.match(/seat[\s_-]?(\d+)|[\s_-](\d+)\.[a-z]+$/i)
          if (match) {
            const seatNum = match[1] || match[2]
            const seat = seats.find(s => s.seat_number === seatNum)
            if (seat) {
              seatId = seat.id
            }
          }
        }

        if (!seatId) {
          console.error(`No seat mapping for ${file.name}`)
          setProgress((prev) => ({
            ...prev!,
            failed: prev!.failed + 1,
          }))
          continue
        }

        // Upload to Supabase Storage
        const filePath = `${selectedVenue}/${seatId}/${file.name}`
        const { error: uploadError } = await supabase.storage
          .from('seat-photos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
          })

        if (uploadError) {
          throw uploadError
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('seat-photos')
          .getPublicUrl(filePath)

        // Determine file type
        const fileExtension = file.name.split('.').pop()?.toLowerCase()
        const isDng = fileExtension === 'dng'
        
        // Save to database
        const { error: dbError } = await supabase.from('photos').upsert({
          seat_id: seatId,
          storage_path: filePath,
          public_url: publicUrl,
          file_size: file.size,
          metadata: {
            original_name: file.name,
            type: file.type,
            extension: fileExtension,
            is_raw: isDng,
          },
        }, {
          onConflict: 'seat_id',
        })

        if (dbError) {
          throw dbError
        }

        setProgress((prev) => ({
          ...prev!,
          completed: prev!.completed + 1,
        }))
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error)
        setProgress((prev) => ({
          ...prev!,
          failed: prev!.failed + 1,
        }))
      }
    }

    setUploading(false)
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
            <span className="text-white">Bulk Upload</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Bulk Photo Upload</h1>

        {/* Venue Selection */}
        <div className="bg-slate-800 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">1. Select Venue</h2>
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

        {/* Section/Row Selection (Optional) */}
        {selectedVenue && (
          <div className="bg-slate-800 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">2. Select Section & Row (Optional)</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Sections</option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.level} - Section {section.section_number}
                  </option>
                ))}
              </select>

              <select
                value={selectedRow}
                onChange={(e) => setSelectedRow(e.target.value)}
                disabled={!selectedSection}
                className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">All Rows</option>
                {rows.map((row) => (
                  <option key={row.id} value={row.id}>
                    Row {row.row_number}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedRow && seats.length > 0 && (
              <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
                <p className="text-sm text-slate-300">
                  {seats.length} seats available in this row
                </p>
              </div>
            )}
          </div>
        )}

        {/* File Upload */}
        {selectedVenue && (
          <div className="bg-slate-800 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">3. Upload Photos</h2>
            
            {/* Mapping Mode */}
            <div className="flex gap-4 mb-4">
              <button
                onClick={() => setMappingMode('auto')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  mappingMode === 'auto'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Auto-Match by Filename
              </button>
              <button
                onClick={() => setMappingMode('manual')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  mappingMode === 'manual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Manual Mapping
              </button>
            </div>

            {mappingMode === 'auto' && (
              <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-300">
                  <strong>Auto-Match:</strong> Files will be matched to seats based on filename. 
                  Expected format: "Section-101-Row-A-Seat-1.jpg" or just "1.jpg"
                </p>
              </div>
            )}

            <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept=".jpg,.jpeg,.dng,image/jpeg,image/dng"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <svg className="w-12 h-12 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-lg font-medium mb-2">Drop files here or click to browse</p>
                <p className="text-sm text-slate-400">Support for JPEG and DNG 360° photos (25MB max per file)</p>
                <p className="text-xs text-slate-500 mt-1">.jpg, .jpeg, .dng files accepted</p>
              </label>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium mb-3">Selected Files ({files.length})</h3>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-slate-700 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-sm">{index + 1}.</span>
                        <span className="truncate max-w-xs">{file.name}</span>
                        <span className="text-slate-400 text-sm">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                      </div>
                      {mappingMode === 'auto' && (
                        <span className={`text-xs ${
                          seatMapping[file.name] ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {seatMapping[file.name] ? 'Matched' : 'Unmatched'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upload Button */}
        {files.length > 0 && (
          <button
            onClick={uploadFiles}
            disabled={uploading}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 rounded-xl font-semibold text-lg transition-colors"
          >
            {uploading ? 'Uploading...' : `Upload ${files.length} Files`}
          </button>
        )}

        {/* Progress */}
        {progress && (
          <div className="mt-6 bg-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Upload Progress</h3>
              <span className="text-slate-400">
                {progress.completed} / {progress.total}
              </span>
            </div>
            
            <div className="w-full bg-slate-700 rounded-full h-3 mb-4">
              <div
                className="bg-emerald-500 h-3 rounded-full transition-all"
                style={{ width: `${(progress.completed / progress.total) * 100}%` }}
              />
            </div>
            
            <p className="text-sm text-slate-400 mb-2">
              Current: {progress.currentFile}
            </p>
            
            {progress.failed > 0 && (
              <p className="text-sm text-red-400">
                Failed: {progress.failed} files
              </p>
            )}
          </div>
        )}

        {/* Success Message */}
        {progress && progress.completed === progress.total && !uploading && (
          <div className="mt-6 bg-emerald-500/20 border border-emerald-500/50 rounded-xl p-6 text-center">
            <svg className="w-12 h-12 text-emerald-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h3 className="text-xl font-semibold text-emerald-400 mb-2">Upload Complete!</h3>
            <p className="text-slate-300">
              {progress.completed} files uploaded successfully
              {progress.failed > 0 && ` (${progress.failed} failed)`}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
