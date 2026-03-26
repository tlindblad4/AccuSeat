'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  created_at: string
  share_link_id?: string
  seat_id?: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      setUser(session.user)
      loadNotifications(session.user.id)
    }
  }

  const loadNotifications = async (userId: string) => {
    const { data } = await supabase
      .from('rep_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    setNotifications(data || [])
    setLoading(false)
  }

  const markAsRead = async (id: string) => {
    await supabase
      .from('rep_notifications')
      .update({ read: true })
      .eq('id', id)

    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAllAsRead = async () => {
    if (!user) return

    await supabase
      .from('rep_notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)

    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter(n => !n.read).length

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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <Link href="/rep" className="text-slate-400 hover:text-white transition-colors">
                ← Back
              </Link>
              <span className="text-slate-600">|</span>
              <span className="text-white text-lg font-semibold">Notifications</span>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            Your Notifications
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-blue-600 rounded-full text-sm">
                {unreadCount} new
              </span>
            )}
          </h1>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p>No notifications yet</p>
            <p className="text-sm mt-2">When prospects view your links or give feedback, you&apos;ll see it here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-xl border transition-colors ${
                  notification.read
                    ? 'bg-slate-800 border-slate-700'
                    : 'bg-blue-600/10 border-blue-600/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                      <h3 className={`font-semibold ${notification.read ? 'text-slate-300' : 'text-white'}`}>
                        {notification.title}
                      </h3>
                    </div>
                    <p className="text-slate-400 text-sm mb-2">{notification.message}</p>
                    <p className="text-slate-500 text-xs">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="ml-4 px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
