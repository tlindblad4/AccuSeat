'use client'

import { useEffect, useState } from 'react'
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

interface UploadedFile {
  name: string
  path: string
  publicUrl: string
  size: number
  seatId?: string
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
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [showMapping, setShowMapping] = useState(false)
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

    const uploaded: UploadedFile[] = []

    for (const file of files) {
      setProgress((prev) => ({
        ...prev!,
        currentFile: file.name,
      }))

      try {
        // Upload to Supabase Storage (unmapped folder)
        const filePath = `${selectedVenue}/unmapped/${Date.now()}_${file.name}`
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

        uploaded.push({
          name: file.name,
          path: filePath,
          publicUrl,
          size: file.size,
        })

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

    setUploadedFiles(uploaded)
    setUploading(false)
    setShowMapping(true)
  }

  const mapFileToSeat = async (fileIndex: number, seatId: string) => {
    const file = uploadedFiles[fileIndex]
    if (!file) return

    // Move file to seat folder
    const newPath = `${selectedVenue}/${seatId}/${file.name}`
    
    try {
      // Copy to new location
      const { error: copyError } = await supabase.storage
        .from('seat-photos')
        .copy(file.path, newPath)

      if (copyError) {
        // If copy fails, try direct upload with new path
        console.log('Copy failed, file will remain in unmapped')
      }

      // Get public URL for new path
      const { data: { publicUrl } } = supabase.storage
        .from('seat-photos')
        .getPublicUrl(newPath)

      // Determine file type
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      const isDng = fileExtension === 'dng'

      // Save to database
      const { error: dbError } = await supabase.from('photos').upsert({
        seat_id: seatId,
        storage_path: newPath,
        public_url: publicUrl,
        file_size: file.size,
        metadata: {
          original_name: file.name,
          extension: fileExtension,
          is_raw: isDng,
        },
      }, {
        onConflict: 'seat_id',
      })

      if (dbError) {
        throw dbError
      }

      // Update local state
      const newUploaded = [...uploadedFiles]
      newUploaded[fileIndex] = { ...file, seatId }
      setUploadedFiles(newUploaded)
    } catch (error) {
      console.error('Error mapping file:', error)
      alert('Failed to map file to seat')
    }
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

        {/* File Upload */}
        {selectedVenue && !showMapping && (
          <div className="bg-slate-800 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">2. Upload Photos</h2>
            
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
                <p className="text-sm text-slate-400">Support for JPEG and DNG 360° photos</p>
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
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Button */}
            {files.length > 0 && (
              <button
                onClick={uploadFiles}
                disabled={uploading}
                className="w-full mt-6 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 rounded-xl font-semibold text-lg transition-colors"
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
          </div>
        )}

        {/* Mapping Interface */}
        {showMapping && (
          <div className="bg-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">3. Map Photos to Seats</h2>
            <p className="text-slate-400 mb-6">
              Select a section, row, and seat for each uploaded photo
            </p>

            {/* Section/Row Selectors */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
              >
                <option value="">Select Section</option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.level} - {section.section_number}
                  </option>
                ))}
              </select>

              <select
                value={selectedRow}
                onChange={(e) => setSelectedRow(e.target.value)}
                disabled={!selectedSection}
                className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white disabled:opacity-50"
              >
                <option value="">Select Row</option>
                {rows.map((row) => (
                  <option key={row.id} value={row.id}>
                    Row {row.row_number}
                  </option>
                ))}
              </select>

              <div className="text-sm text-slate-400 flex items-center">
                {seats.length > 0 ? `${seats.length} seats available` : 'Select section and row'}
              </div>
            </div>

            {/* Files to Map */}
            <div className="space-y-4">
              {uploadedFiles.map((file, index) => (
                <div key={index} className={`flex items-center justify-between p-4 rounded-lg ${file.seatId ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-slate-700'}`}>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400">{index + 1}.</span>
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-slate-400">
                        {file.seatId ? '✓ Mapped' : 'Not mapped'}
                      </p>
                    </div>
                  </div>
                  
                  {!file.seatId && selectedRow && (
                    <select
                      onChange={(e) => mapFileToSeat(index, e.target.value)}
                      className="px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm"
                      defaultValue=""
                    >
                      <option value="">Select seat...</option>
                      {seats.map((seat) => (
                        <option key={seat.id} value={seat.id}>
                          Seat {seat.seat_number}
                        </option>
                      ))}
                    </select>
                  )}
                  
                  {file.seatId && (
                    <span className="text-emerald-400 text-sm">
                      ✓ Assigned
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Done Button */}
            <div className="mt-6 flex gap-4">
              <Link
                href="/admin"
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-center transition-colors"
              >
                Done
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
