'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Venue, UserVenue } from '@/types'

export default function RepDashboard() {
  const [userVenues, setUserVenues] = useState<(UserVenue & { venue: Venue })[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      router.push('/auth/login')
      return
    }

    setUser(session.user)
    
    // Allow admins to view sales portal too (no redirect)
    await loadUserVenues(session.user.id)
  }

  const loadUserVenues = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_venues')
      .select(`
        *,
        venue:venues(*)
      `)
      .eq('user_id', userId)
      .not('venue_id', 'is', null) // Only get records with actual venues

    if (error) {
      console.error('Error loading venues:', error)
    } else {
      // Filter out any null venues and cast properly
      const validVenues = (data || []).filter((uv: any) => uv.venue !== null) as (UserVenue & { venue: Venue })[]
      setUserVenues(validVenues)
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold text-blue-400">
              AccuSeat
            </Link>
            <span className="text-slate-400">|</span>
            <span className="text-slate-300">Sales Portal</span>
            <Link 
              href="/admin" 
              className="ml-4 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300 hover:text-white transition-colors"
            >
              ← Admin Portal
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome, {user?.email?.split('@')[0]}
          </h1>
          <p className="text-slate-400">
            Select a venue to browse seats and create shareable links
          </p>
        </div>

        {userVenues.length === 0 ? (
          <div className="bg-slate-800 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">No Venues Assigned</h3>
            <p className="text-slate-400">
              You don't have access to any venues yet. Contact your administrator.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userVenues.map((userVenue) => (
              <Link
                key={userVenue.venue.id}
                href={`/rep/venue/${userVenue.venue.slug}`}
                className="group bg-slate-800 rounded-2xl overflow-hidden hover:bg-slate-750 transition-colors border border-slate-700 hover:border-blue-500/50"
              >
                <div className="h-48 bg-gradient-to-br from-blue-600/20 to-emerald-600/20 flex items-center justify-center">
                  {userVenue.venue.logo_url ? (
                    <img
                      src={userVenue.venue.logo_url}
                      alt={userVenue.venue.name}
                      className="h-24 w-auto object-contain"
                    />
                  ) : (
                    <div className="text-6xl font-bold text-slate-600">
                      {userVenue.venue.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-400 transition-colors">
                    {userVenue.venue.name}
                  </h3>
                  {userVenue.venue.location && (
                    <p className="text-slate-400 text-sm mb-4">
                      {userVenue.venue.location}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      {userVenue.venue.total_seats?.toLocaleString() || '0'} seats
                    </span>
                    <span className="text-blue-400 text-sm font-medium">
                      Browse →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
