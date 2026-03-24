'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Venue, UserVenue } from '@/types'

export default function AdminDashboard() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [userVenues, setUserVenues] = useState<(UserVenue & { user: any; venue: Venue })[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAdmin()
  }, [])

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      router.push('/auth/login')
      return
    }

    setUser(session.user)

    // Check if user is admin
    const { data: userVenueData } = await supabase
      .from('user_venues')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .single()

    if (!userVenueData) {
      router.push('/rep')
      return
    }

    setIsAdmin(true)
    await loadData()
  }

  const loadData = async () => {
    // Load venues
    const { data: venuesData } = await supabase
      .from('venues')
      .select('*')
      .order('name')
    
    setVenues(venuesData || [])

    // Load user venues with details
    const { data: uvData } = await supabase
      .from('user_venues')
      .select(`
        *,
        venue:venues(*),
        user:user_metadata(*)
      `)
    
    setUserVenues(uvData || [])
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
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
            <span className="text-slate-300">Admin Portal</span>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 rounded-xl p-6">
            <p className="text-slate-400 text-sm mb-1">Venues</p>
            <p className="text-3xl font-bold">{venues.length}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-6">
            <p className="text-slate-400 text-sm mb-1">Users</p>
            <p className="text-3xl font-bold">{userVenues.length}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-6">
            <p className="text-slate-400 text-sm mb-1">Admins</p>
            <p className="text-3xl font-bold">{userVenues.filter(uv => uv.role === 'admin').length}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-6">
            <p className="text-slate-400 text-sm mb-1">Reps</p>
            <p className="text-3xl font-bold">{userVenues.filter(uv => uv.role === 'rep').length}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/admin/venues/new"
            className="bg-blue-600 hover:bg-blue-700 rounded-xl p-6 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <div>
                <p className="font-semibold">Add Venue</p>
                <p className="text-sm text-blue-200">Create a new venue</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/upload"
            className="bg-emerald-600 hover:bg-emerald-700 rounded-xl p-6 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="font-semibold">Bulk Upload</p>
                <p className="text-sm text-emerald-200">Upload 360° photos</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/users/new"
            className="bg-purple-600 hover:bg-purple-700 rounded-xl p-6 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <div>
                <p className="font-semibold">Add User</p>
                <p className="text-sm text-purple-200">Create rep account</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Venues List */}
        <div className="bg-slate-800 rounded-2xl overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Venues</h2>
            <Link href="/admin/venues" className="text-blue-400 hover:text-blue-300 text-sm">
              View All →
            </Link>
          </div>
          <div className="divide-y divide-slate-700">
            {venues.slice(0, 5).map((venue) => (
              <div key={venue.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-750">
                <div>
                  <p className="font-medium">{venue.name}</p>
                  <p className="text-sm text-slate-400">{venue.location}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-400">
                    {venue.total_seats?.toLocaleString() || 0} seats
                  </span>
                  <Link
                    href={`/admin/venues/${venue.id}/upload`}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    Upload Photos
                  </Link>
                </div>
              </div>
            ))}
            {venues.length === 0 && (
              <div className="px-6 py-8 text-center text-slate-400">
                No venues yet. Create your first venue to get started.
              </div>
            )}
          </div>
        </div>

        {/* Users List */}
        <div className="bg-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Users</h2>
            <Link href="/admin/users" className="text-blue-400 hover:text-blue-300 text-sm">
              View All →
            </Link>
          </div>
          <div className="divide-y divide-slate-700">
            {userVenues.slice(0, 5).map((uv) => (
              <div key={uv.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-750">
                <div>
                  <p className="font-medium">{(uv as any).user?.email || 'Unknown'}</p>
                  <p className="text-sm text-slate-400">
                    {uv.venue.name} • {uv.role}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  uv.role === 'admin' 
                    ? 'bg-purple-500/20 text-purple-400' 
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {uv.role}
                </span>
              </div>
            ))}
            {userVenues.length === 0 && (
              <div className="px-6 py-8 text-center text-slate-400">
                No users yet. Add users to give them access to venues.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
