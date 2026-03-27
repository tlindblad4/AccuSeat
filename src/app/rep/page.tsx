'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Venue, UserVenue } from '@/types'
import { 
  Building2, 
  ArrowRight, 
  LogOut, 
  Bell,
  MapPin,
  Eye
} from 'lucide-react'

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
                <Eye className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Sales Portal</h1>
                <p className="text-sm text-slate-500">Browse seats and share with clients</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/admin" 
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-medium transition-all"
              >
                <Building2 className="w-4 h-4" />
                Admin
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome back, {user?.email?.split('@')[0]}
          </h2>
          <p className="text-slate-600">
            Select a venue to browse seats and create shareable links
          </p>
        </div>

        {userVenues.length === 0 ? (
          <div className="card-premium p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Venues Assigned</h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              You don&apos;t have access to any venues yet. Contact your administrator to get assigned.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userVenues.map((userVenue) => (
              <Link
                key={userVenue.venue.id}
                href={`/rep/venue/${userVenue.venue.slug}`}
                className="group card-premium overflow-hidden hover:scale-[1.02] transition-all duration-300"
              >
                <div className="h-48 bg-gradient-to-br from-blue-100 via-purple-50 to-emerald-100 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 group-hover:opacity-75 transition-opacity" />
                  {userVenue.venue.avatar_url ? (
                    <img
                      src={userVenue.venue.avatar_url}
                      alt={userVenue.venue.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-6xl font-bold text-slate-300 group-hover:scale-110 transition-transform duration-300">
                      {userVenue.venue.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {userVenue.venue.name}
                  </h3>
                  {userVenue.venue.location && (
                    <div className="flex items-center gap-2 text-slate-500 mb-4">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{userVenue.venue.location}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      {userVenue.venue.total_seats?.toLocaleString() || '0'} seats
                    </span>
                    <span className="text-blue-600 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                      Browse
                      <ArrowRight className="w-4 h-4" />
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
