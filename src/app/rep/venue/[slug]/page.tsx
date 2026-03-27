'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Venue, Section } from '@/types'
import { ArrowLeft, MapPin, ChevronRight } from 'lucide-react'

export default function VenuePage() {
  const params = useParams()
  const router = useRouter()
  const venueSlug = params.slug as string

  const [venue, setVenue] = useState<Venue | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null)

  useEffect(() => {
    loadVenueData()
  }, [venueSlug])

  const loadVenueData = async () => {
    const { data: venueData } = await supabase
      .from('venues')
      .select('*')
      .eq('slug', venueSlug)
      .single()

    if (!venueData) {
      router.push('/rep')
      return
    }

    setVenue(venueData)

    const { data: sectionsData } = await supabase
      .from('sections')
      .select('*')
      .eq('venue_id', venueData.id)
      .order('level')
      .order('section_number')

    setSections(sectionsData || [])
    
    if (sectionsData && sectionsData.length > 0) {
      const levels: string[] = []
      sectionsData.forEach((s: Section) => {
        if (!levels.includes(s.level)) {
          levels.push(s.level)
        }
      })
      setSelectedLevel(levels[0])
    }

    setLoading(false)
  }

  const levels = [...new Set(sections.map(s => s.level))]
  const filteredSections = selectedLevel
    ? sections.filter(s => s.level === selectedLevel)
    : sections

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
            <Link href="/rep" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Back to Venues
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{venue?.name}</h1>
              {venue?.location && (
                <p className="text-slate-500">{venue.location}</p>
              )}
            </div>
          </div>
          <p className="text-slate-600 mt-4">
            Select a section to browse seats and create share links
          </p>
        </div>

        {/* Level Selector */}
        {levels.length > 0 && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              {levels.map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    selectedLevel === level
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-blue-500 hover:text-blue-600'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sections Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSections.map((section) => (
            <Link
              key={section.id}
              href={`/rep/venue/${venueSlug}/section/${section.id}`}
              className="group card-premium p-6 hover:scale-[1.02] transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">{section.level}</p>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    Section {section.section_number}
                  </h3>
                  {section.name && section.name !== section.section_number && (
                    <p className="text-slate-500 text-sm mt-1">{section.name}</p>
                  )}
                </div>
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
