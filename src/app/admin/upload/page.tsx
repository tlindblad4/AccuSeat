'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Upload, FileImage, Check } from 'lucide-react'

interface UploadedFile {
  name: string
  path: string
  publicUrl: string
  size: number
}

export default function BulkUploadPage() {
  const [venues, setVenues] = useState<any[]>([])
  const [selectedVenue, setSelectedVenue] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  useEffect(() => {
    loadVenues()
  }, [])

  const loadVenues = async () => {
    const { data } = await supabase.from('venues').select('*').order('name')
    setVenues(data || [])
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const uploadFiles = async () => {
    if (!selectedVenue || files.length === 0) return

    setUploading(true)
    setProgress({ current: 0, total: files.length })
    const uploaded: UploadedFile[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setProgress({ current: i + 1, total: files.length })

      try {
        const filePath = `${selectedVenue}/unmapped/${Date.now()}_${file.name}`
        
        const { error: uploadError } = await supabase.storage
          .from('seat-photos')
          .upload(filePath, file, { cacheControl: '3600', upsert: true })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('seat-photos')
          .getPublicUrl(filePath)

        uploaded.push({
          name: file.name,
          path: filePath,
          publicUrl,
          size: file.size,
        })
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error)
      }
    }

    setUploadedFiles(uploaded)
    setUploading(false)
    setFiles([])
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
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Upload Photos</h1>
        <p className="text-slate-600 mb-8">Upload 360° photos to map to seats later</p>

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

        {/* Upload Area */}
        {selectedVenue && (
          <div className="card-premium p-6 mb-6">
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all">
              <input
                type="file"
                accept=".jpg,.jpeg,.dng"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-lg font-semibold text-slate-900 mb-2">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-slate-500">
                  Support for JPEG and DNG 360° photos
                </p>
              </label>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-slate-900 mb-3">
                  Selected Files ({files.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <FileImage className="w-5 h-5 text-slate-400" />
                      <span className="flex-1 text-sm text-slate-700 truncate">{file.name}</span>
                      <span className="text-sm text-slate-500">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={uploadFiles}
                  disabled={uploading}
                  className="w-full mt-6 btn-primary py-4 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading {progress.current} of {progress.total}
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload {files.length} Files
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="card-premium p-6">
            <div className="flex items-center gap-2 mb-4">
              <Check className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900">
                Successfully Uploaded ({uploadedFiles.length})
              </h3>
            </div>
            <p className="text-slate-600 mb-4">
              Now go to{' '}
              <Link href="/admin/unmapped" className="text-blue-600 hover:underline font-medium">
                Map Photos
              </Link>{' '}
              to assign these to seats.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
