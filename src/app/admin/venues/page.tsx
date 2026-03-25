'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Venue } from '@/types'

export default function VenuesListPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVenues()
  }, [])

  const loadVenues = async () => {
    const { data } = await supabase
      .from('venues')
      .select('*')
      .order('name')
    
    setVenues(data || [])
    setLoading(false)
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
            <span className="text-white">All Venues</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">All Venues</h1>
          <Link
            href="/admin/venues/new"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
          >
            Add Venue
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((venue) => (
            <div
              key={venue.id}
              className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700"
            >
              <div className="h-32 bg-gradient-to-br from-blue-600/20 to-emerald-600/20 flex items-center justify-center">
                <div className="text-4xl font-bold text-slate-600">
                  {venue.name.charAt(0)}
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{venue.name}</h3>
                <p className="text-slate-400 text-sm mb-4">{venue.location}</p>
                <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                  <span>{venue.total_seats?.toLocaleString() || 0} seats</span>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/venues/${venue.id}/setup`}
                    className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/50 rounded-lg text-center text-emerald-400 text-sm font-medium transition-colors"
                  >
                    Setup
                  </Link>
                  <Link
                    href="/admin/upload"
                    className="flex-1 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/50 rounded-lg text-center text-blue-400 text-sm font-medium transition-colors"
                  >
                    Upload
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {venues.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 mb-4">No venues yet</p>
            <Link
              href="/admin/venues/new"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
            >
              Create Your First Venue
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
