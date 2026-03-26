'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Venue } from '@/types'

interface User {
  id: string
  email: string
  created_at: string
}

export default function AssignUserPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [assignedUsers, setAssignedUsers] = useState<string[]>([])
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedVenue, setSelectedVenue] = useState('')
  const [role, setRole] = useState<'admin' | 'rep'>('rep')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadVenues()
    loadUsers()
  }, [])

  const loadVenues = async () => {
    const { data } = await supabase.from('venues').select('*').order('name')
    setVenues(data || [])
  }

  const loadUsers = async () => {
    // Get all users from auth
    const { data: usersData, error: usersError } = await supabase
      .from('user_venues')
      .select('user_id')

    if (usersError) {
      console.error('Error loading assigned users:', usersError)
    } else {
      const assignedIds = (usersData || []).map((u: any) => u.user_id)
      setAssignedUsers(assignedIds)
    }

    // For now, we'll show a simple message since we can't list all auth users easily
    // In production, you'd use a server function or admin API
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!selectedUser) {
      setError('Please enter a user email')
      setLoading(false)
      return
    }

    // Find user by email
    const { data: userData, error: userError } = await supabase
      .from('user_venues')
      .select('user_id')
      .eq('user_id', selectedUser)
      .maybeSingle()

    if (userError) {
      console.error('Error checking user:', userError)
    }

    // Check if user exists in auth by trying to get their ID
    // For now, we'll accept any UUID format or email
    let userId = selectedUser

    // If it looks like an email, we need to find the user ID
    if (selectedUser.includes('@')) {
      setError('Please enter the user ID (UUID) from Supabase Auth, not the email. Go to Supabase → Auth → Users to find the ID.')
      setLoading(false)
      return
    }

    // Assign to venue
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
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-slate-800 rounded-2xl p-8 shadow-xl">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">User Assigned!</h2>
            <p className="text-slate-400 mb-6">
              The user has been assigned to the venue successfully.
            </p>
            <Link
              href="/admin"
              className="inline-block w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-white transition-colors"
            >
              Back to Admin
            </Link>
          </div>
        </div>
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
            <span className="text-white">Assign User</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-2">Assign User to Venue</h1>
        <p className="text-slate-400 mb-8">
          Assign existing users to venues so they can access seat photos
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <div className="bg-slate-800 rounded-xl p-6 mb-6">
          <h3 className="font-semibold mb-2">How to find a User ID:</h3>
          <ol className="text-sm text-slate-400 list-decimal list-inside space-y-1">
            <li>Go to Supabase Dashboard</li>
            <li>Click Authentication → Users</li>
            <li>Find the user and copy their ID (UUID)</li>
            <li>Paste it below</li>
          </ol>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              User ID (UUID) *
            </label>
            <input
              type="text"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              required
              placeholder="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              Paste the UUID from Supabase Auth → Users
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Role *
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setRole('rep')}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                  role === 'rep'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Sales Rep
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                  role === 'admin'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          {role === 'rep' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Assign to Venue *
              </label>
              <select
                value={selectedVenue}
                onChange={(e) => setSelectedVenue(e.target.value)}
                required={role === 'rep'}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a venue...</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Reps can only access their assigned venue
              </p>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 rounded-lg font-semibold transition-colors"
            >
              {loading ? 'Assigning...' : 'Assign User'}
            </button>
            <Link
              href="/admin"
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}
