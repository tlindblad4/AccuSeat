'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  email: string
  created_at: string
  role?: string
  venue?: string
}

export default function UsersListPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    // Get user venues with details
    const { data: userVenues } = await supabase
      .from('user_venues')
      .select(`
        user_id,
        role,
        venue:venues(name)
      `)

    // Create a map of user assignments
    const userAssignments: Record<string, { role: string; venue: string }> = {}
    userVenues?.forEach((uv: any) => {
      userAssignments[uv.user_id] = {
        role: uv.role,
        venue: uv.venue?.name || 'N/A'
      }
    })

    // For now, we'll show a placeholder since we can't easily list all auth users
    // In a real app, you'd have a server endpoint for this
    setUsers([])
    setLoading(false)
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
            <span className="text-white">Users</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Users</h1>
            <p className="text-slate-400 mt-1">
              View and manage user assignments
            </p>
          </div>
          <Link
            href="/admin/users/new"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
          >
            Assign User
          </Link>
        </div>

        {/* Instructions */}
        <div className="bg-slate-800 rounded-xl p-6 mb-6">
          <h3 className="font-semibold mb-3">How to assign users:</h3>
          <ol className="text-slate-400 list-decimal list-inside space-y-2">
            <li>Have the user sign up at the login page first</li>
            <li>They'll appear in Supabase → Authentication → Users</li>
            <li>Copy their User ID (UUID)</li>
            <li>Click "Assign User" above</li>
            <li>Paste their ID and select a venue</li>
          </ol>
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-300">
              <strong>Tip:</strong> To see all users, go to your Supabase dashboard → Authentication → Users
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href="/admin/users/new"
            className="bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl p-6 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Assign User to Venue</p>
                <p className="text-sm text-slate-400">Give a user access to a venue</p>
              </div>
            </div>
          </Link>

          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl p-6 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Open Supabase Dashboard</p>
                <p className="text-sm text-slate-400">View all users in Auth</p>
              </div>
            </div>
          </a>
        </div>
      </main>
    </div>
  )
}
