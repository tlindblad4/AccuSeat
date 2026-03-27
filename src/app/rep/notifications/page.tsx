'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, 
  Bell, 
  ThumbsUp, 
  ThumbsDown, 
  Phone, 
  Eye, 
  Share2,
  Check,
  Filter,
  TrendingUp,
  Users,
  Clock
} from 'lucide-react'

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
  const [filter, setFilter] = useState<'all' | 'likes' | 'feedback' | 'callbacks' | 'views'>('all')

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

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <ThumbsUp className="w-5 h-5 text-emerald-500" />
      case 'dislike':
        return <ThumbsDown className="w-5 h-5 text-red-500" />
      case 'callback_request':
        return <Phone className="w-5 h-5 text-blue-500" />
      case 'view':
        return <Eye className="w-5 h-5 text-slate-400" />
      case 'share':
        return <Share2 className="w-5 h-5 text-purple-500" />
      default:
        return <Bell className="w-5 h-5 text-slate-400" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'like':
        return 'bg-emerald-50 border-emerald-200'
      case 'dislike':
        return 'bg-red-50 border-red-200'
      case 'callback_request':
        return 'bg-blue-50 border-blue-200'
      case 'view':
        return 'bg-slate-50 border-slate-200'
      case 'share':
        return 'bg-purple-50 border-purple-200'
      default:
        return 'bg-slate-50 border-slate-200'
    }
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true
    if (filter === 'likes') return n.type === 'like'
    if (filter === 'feedback') return n.type === 'like' || n.type === 'dislike'
    if (filter === 'callbacks') return n.type === 'callback_request'
    if (filter === 'views') return n.type === 'view'
    return true
  })

  const unreadCount = notifications.filter(n => !n.read).length
  const likesCount = notifications.filter(n => n.type === 'like').length
  const callbacksCount = notifications.filter(n => n.type === 'callback_request').length
  const viewsCount = notifications.filter(n => n.type === 'view').length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/rep" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                Back
              </Link>
              <span className="text-slate-300">|</span>
              <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
              {unreadCount > 0 && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <Check className="w-4 h-4" />
                Mark all read
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card-premium p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{viewsCount}</p>
              <p className="text-sm text-slate-500">Total Views</p>
            </div>
          </div>
          <div className="card-premium p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <ThumbsUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{likesCount}</p>
              <p className="text-sm text-slate-500">Likes</p>
            </div>
          </div>
          <div className="card-premium p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Phone className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{callbacksCount}</p>
              <p className="text-sm text-slate-500">Callbacks</p>
            </div>
          </div>
          <div className="card-premium p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {viewsCount > 0 ? Math.round((likesCount / viewsCount) * 100) : 0}%
              </p>
              <p className="text-sm text-slate-500">Conversion</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'all', label: 'All', count: notifications.length },
            { id: 'likes', label: 'Likes', count: notifications.filter(n => n.type === 'like').length },
            { id: 'feedback', label: 'Feedback', count: notifications.filter(n => n.type === 'like' || n.type === 'dislike').length },
            { id: 'callbacks', label: 'Callbacks', count: callbacksCount },
            { id: 'views', label: 'Views', count: viewsCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                filter === tab.id
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                filter === tab.id ? 'bg-white/20' : 'bg-slate-100'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="card-premium p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No notifications yet</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              When prospects view your links, give feedback, or request callbacks, you&apos;ll see it all here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  notification.read
                    ? 'bg-white border-slate-100'
                    : `${getTypeColor(notification.type)} shadow-sm`
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    notification.read ? 'bg-slate-100' : 'bg-white/50'
                  }`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className={`font-semibold ${notification.read ? 'text-slate-600' : 'text-slate-900'}`}>
                          {notification.title}
                        </h3>
                        <p className="text-slate-500 text-sm mt-1">{notification.message}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />
                          {new Date(notification.created_at).toLocaleString()}
                        </div>
                      </div>
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="flex-shrink-0 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 text-sm font-medium rounded-lg border border-slate-200 transition-colors"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
