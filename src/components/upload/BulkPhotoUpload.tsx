'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { supabase } from '@/lib/supabase'
import { Upload, X, Check, Loader2, ImageIcon, FileImage, Wand2 } from 'lucide-react'

interface BulkUploadProps {
  venueId: string
  sections: { id: string; section_number: string }[]
  rows: { id: string; row_number: string; section_id: string }[]
  seats: { id: string; seat_number: string; row_id: string }[]
  onComplete: () => void
}

interface UploadFile {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'processing' | 'matched' | 'error'
  progress: number
  matchedSeat?: {
    seatId: string
    section: string
    row: string
    seat: string
  }
  error?: string
}

export function BulkPhotoUpload({ venueId, sections, rows, seats, onComplete }: BulkUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadComplete, setUploadComplete] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map((file, index) => ({
      file,
      id: `${Date.now()}-${index}`,
      status: 'pending',
      progress: 0,
    }))
    setFiles(prev => [...prev, ...newFiles])
    
    // Auto-process filenames to match seats
    processFilenames(newFiles)
  }, [sections, rows, seats])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.dng'],
    },
    disabled: isUploading,
  })

  const processFilenames = (filesToProcess: UploadFile[]) => {
    // Common filename patterns:
    // Section-101-Row-A-Seat-12.jpg
    // 101_A_12.jpg
    // S101_R12_A1.jpg
    
    const updatedFiles = filesToProcess.map(uploadFile => {
      const filename = uploadFile.file.name.replace(/\.[^/.]+$/, '') // Remove extension
      let matchedSeat = null

      // Try different patterns
      const patterns = [
        // Section-101-Row-A-Seat-12 or Section_101_Row_A_Seat_12
        /(?:section[_-])?(\w+)[_-](?:row[_-])?(\w+)[_-](?:seat[_-])?(\w+)/i,
        // 101_A_12 (section_row_seat)
        /^(\w+)_(\w+)_(\w+)$/,
        // S101_R12_A1
        /S(\w+)[_-]R(\w+)[_-](\w+)/i,
      ]

      for (const pattern of patterns) {
        const match = filename.match(pattern)
        if (match) {
          const [, sectionNum, rowNum, seatNum] = match
          
          // Find matching section
          const section = sections.find(s => 
            s.section_number.toLowerCase() === sectionNum.toLowerCase()
          )
          
          if (section) {
            // Find matching row in section
            const row = rows.find(r => 
              r.section_id === section.id && 
              r.row_number.toLowerCase() === rowNum.toLowerCase()
            )
            
            if (row) {
              // Find matching seat in row
              const seat = seats.find(s => 
                s.row_id === row.id && 
                s.seat_number.toLowerCase() === seatNum.toLowerCase()
              )
              
              if (seat) {
                matchedSeat = {
                  seatId: seat.id,
                  section: section.section_number,
                  row: row.row_number,
                  seat: seat.seat_number,
                }
                break
              }
            }
          }
        }
      }

      return {
        ...uploadFile,
        status: matchedSeat ? 'matched' : 'pending',
        matchedSeat: matchedSeat || undefined,
      }
    })

    setFiles(prev => {
      const otherFiles = prev.filter(f => !filesToProcess.find(uf => uf.id === f.id))
      return [...otherFiles, ...updatedFiles]
    })
  }

  const uploadFiles = async () => {
    setIsUploading(true)
    
    for (const uploadFile of files) {
      if (!uploadFile.matchedSeat) continue

      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'uploading' } : f
      ))

      try {
        // Upload to storage
        const fileExt = uploadFile.file.name.split('.').pop()
        const fileName = `${venueId}/${uploadFile.matchedSeat.seatId}-${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('seat-photos')
          .upload(fileName, uploadFile.file)

        if (uploadError) {
          throw uploadError
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('seat-photos')
          .getPublicUrl(fileName)

        // Save to database
        const { error: dbError } = await supabase
          .from('photos')
          .insert({
            seat_id: uploadFile.matchedSeat.seatId,
            public_url: publicUrl,
            file_path: fileName,
            is_raw: fileExt?.toLowerCase() === 'dng',
            extension: fileExt,
          })

        if (dbError) {
          throw dbError
        }

        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, status: 'matched', progress: 100 } : f
        ))
      } catch (err: any) {
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, status: 'error', error: err.message } : f
        ))
      }
    }

    setIsUploading(false)
    setUploadComplete(true)
    onComplete()
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const matchedCount = files.filter(f => f.matchedSeat).length
  const uploadedCount = files.filter(f => f.status === 'matched').length

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-300 hover:border-slate-400'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Upload className="w-8 h-8 text-blue-600" />
        </div>
        <p className="text-lg font-semibold text-slate-900 mb-2">
          {isDragActive ? 'Drop files here' : 'Drag & drop photos here'}
        </p>
        <p className="text-slate-500 mb-4">
          or click to select files
        </p>
        <p className="text-sm text-slate-400">
          Supports: JPG, PNG, DNG • Auto-matches by filename
        </p>
        <p className="text-xs text-slate-400 mt-2">
          Example: Section-101-Row-A-Seat-12.jpg
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="card-premium overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">Files ({files.length})</h3>
              <p className="text-sm text-slate-500">
                {matchedCount} matched • {uploadedCount} uploaded
              </p>
            </div>
            {!isUploading && !uploadComplete && matchedCount > 0 && (
              <button
                onClick={uploadFiles}
                className="btn-primary flex items-center gap-2"
              >
                <Wand2 className="w-4 h-4" />
                Upload {matchedCount} Matched
              </button>
            )}
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {files.map((file) => (
              <div
                key={file.id}
                className="px-6 py-3 border-b border-slate-100 last:border-0 flex items-center gap-4"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {file.status === 'matched' || file.status === 'uploading' ? (
                    <ImageIcon className="w-5 h-5 text-blue-600" />
                  ) : file.status === 'error' ? (
                    <X className="w-5 h-5 text-red-500" />
                  ) : (
                    <FileImage className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">
                    {file.file.name}
                  </p>
                  {file.matchedSeat ? (
                    <p className="text-sm text-emerald-600">
                      ✓ Matched: Sec {file.matchedSeat.section}, Row {file.matchedSeat.row}, Seat {file.matchedSeat.seat}
                    </p>
                  ) : (
                    <p className="text-sm text-amber-600">
                      ⚠ Could not auto-match - check filename format
                    </p>
                  )}
                  {file.error && (
                    <p className="text-sm text-red-600">{file.error}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {file.status === 'uploading' && (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  )}
                  {file.status === 'matched' && (
                    <Check className="w-5 h-5 text-emerald-600" />
                  )}
                  {!isUploading && (
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Message */}
      {uploadComplete && (
        <div className="card-premium p-6 bg-emerald-50 border-emerald-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-bold text-emerald-900">Upload Complete!</p>
              <p className="text-emerald-700">
                {uploadedCount} photos uploaded and matched to seats
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
