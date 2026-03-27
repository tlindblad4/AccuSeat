'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, UserPlus, Building2, Check } from 'lucide-react'

export default function AssignUserPage() {
  const [venues, setVenues] = useState<any[]>([])
  const [userId, setUserId] = useState('')
  const [selectedVenue, setSelectedVenue] = useState('')
  const [role, setRole] = useState<'admin' | 'rep'>('rep')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadVenues()
  }, [])

  const loadVenues = async () => {
    const { data } = await supabase.from('venues').select('*').order('name')
    setVenues(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!userId) {
      setError('Please enter a user ID')
      setLoading(false)
      return
    }

    if (role === 'rep' && !selectedVenue) {
      setError('Please select a venue for the rep')
      setLoading(false)
      return
    }

    try {
      const { error: assignError } = await supabase.from('user_venues').insert({
        user_id: userId,
        venue_id: role === 'admin' ? null : selectedVenue,
        role,
      })

      if (assignError) {
        if (assignError.message.includes('duplicate')) {
          setError('User is already assigned to this venue')
        } else {
          setError(assignError.message)
        }
        setLoading(false)
        return
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    }

    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="card-premium p-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">User Assigned!</h2>
            <p className="text-slate-600 mb-6">
              The user has been assigned successfully.
            </p>
            <Link href="/admin" className="btn-primary inline-block w-full">
              Back to Admin
            </Link>
          </div>
        </div>
      </div>
    )
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

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Assign User to Venue</h1>
          <p className="text-slate-600">Give a user access to a venue</p>
        </div>

        {/* Instructions */}
        <div className="card-premium p-6 mb-6 bg-blue-50/50 border-blue-100">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            How to find a User ID:
          </h3>
          <ol className="text-slate-600 list-decimal list-inside space-y-2 text-sm">
            <li>Go to Supabase Dashboard</li>
            <li>Click Authentication → Users</li>
            <li>Find the user and copy their ID (UUID)</li>
            <li>Paste it below</li>
          </ol>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card-premium p-8 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              User ID (UUID) *
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              placeholder="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none font-mono text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">
              Paste the UUID from Supabase Auth → Users
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Role *
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setRole('rep')}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                  role === 'rep'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Sales Rep
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                  role === 'admin'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          {role === 'rep' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Assign to Venue *
              </label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  value={selectedVenue}
                  onChange={(e) => setSelectedVenue(e.target.value)}
                  required={role === 'rep'}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
                >
                  <option value="">Select a venue...</option>
                  {venues.map((venue) => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Reps can only access their assigned venue
              </p>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary py-4 disabled:opacity-50"
            >
              {loading ? 'Assigning...' : 'Assign User'}
            </button>
            <Link
              href="/admin"
              className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}
