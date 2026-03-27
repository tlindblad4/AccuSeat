'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Venue, UserVenue } from '@/types'
import { 
  Building2, 
  Users, 
  Upload, 
  MapPin, 
  TrendingUp,
  Bell,
  LogOut,
  Plus,
  ArrowRight
} from 'lucide-react'

export default function AdminDashboard() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [userVenues, setUserVenues] = useState<(UserVenue & { user: any; venue: Venue })[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Admin Portal</h1>
                <p className="text-sm text-slate-500">Manage venues and users</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/rep" 
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-medium transition-all"
              >
                Sales Portal
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card-premium p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{venues.length}</p>
              <p className="text-sm text-slate-500">Venues</p>
            </div>
          </div>
          <div className="card-premium p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{userVenues.length}</p>
              <p className="text-sm text-slate-500">Users</p>
            </div>
          </div>
          <div className="card-premium p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{userVenues.filter(uv => uv.role === 'admin').length}</p>
              <p className="text-sm text-slate-500">Admins</p>
            </div>
          </div>
          <div className="card-premium p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{userVenues.filter(uv => uv.role === 'rep').length}</p>
              <p className="text-sm text-slate-500">Reps</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/admin/venues/new"
            className="group card-premium p-6 hover:scale-[1.02] transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform">
                <Plus className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Add Venue</h3>
                <p className="text-sm text-slate-500">Create a new venue</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/unmapped"
            className="group card-premium p-6 hover:scale-[1.02] transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Map Photos</h3>
                <p className="text-sm text-slate-500">Assign photos to seats</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/users/new"
            className="group card-premium p-6 hover:scale-[1.02] transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Assign User</h3>
                <p className="text-sm text-slate-500">Give access to venue</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Venues List */}
        <div className="card-premium overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Venues</h2>
            <Link href="/admin/venues" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              View All →
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {venues.slice(0, 5).map((venue) => (
              <div key={venue.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center">
                    <span className="text-lg font-bold text-slate-600">{venue.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{venue.name}</p>
                    <p className="text-sm text-slate-500">{venue.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-500">
                    {venue.total_seats?.toLocaleString() || 0} seats
                  </span>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/venues/${venue.id}/edit`}
                      className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/admin/venues/${venue.id}/setup`}
                      className="px-3 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      Setup
                    </Link>
                    <Link
                      href="/admin/unmapped"
                      className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Upload
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            {venues.length === 0 && (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 mb-4">No venues yet</p>
                <Link
                  href="/admin/venues/new"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Your First Venue
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
