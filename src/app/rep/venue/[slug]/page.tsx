'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Venue, Section } from '@/types'

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
    // Load venue
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

    // Load sections
    const { data: sectionsData } = await supabase
      .from('sections')
      .select('*')
      .eq('venue_id', venueData.id)
      .order('level')
      .order('section_number')

    setSections(sectionsData || [])
    
    // Set default level
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
            <Link href="/rep" className="text-slate-400 hover:text-white transition-colors">
              Venues
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-white">{venue?.name}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{venue?.name}</h1>
          <p className="text-slate-400">
            Select a section to browse seats
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
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedLevel === level
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sections Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSections.map((section) => (
            <Link
              key={section.id}
              href={`/rep/venue/${venueSlug}/section/${section.id}`}
              className="group bg-slate-800 rounded-xl p-6 hover:bg-slate-750 transition-colors border border-slate-700 hover:border-blue-500/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">{section.level}</p>
                  <h3 className="text-xl font-semibold group-hover:text-blue-400 transition-colors">
                    Section {section.section_number}
                  </h3>
                  {section.name && section.name !== section.section_number && (
                    <p className="text-slate-400 text-sm mt-1">{section.name}</p>
                  )}
                </div>
                <svg
                  className="w-6 h-6 text-slate-500 group-hover:text-blue-400 transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
