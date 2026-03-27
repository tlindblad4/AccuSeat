'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, 
  TrendingUp, 
  Eye, 
  ThumbsUp, 
  Share2,
  BarChart3,
  Calendar,
  MapPin,
  DollarSign,
  Users
} from 'lucide-react'

interface AnalyticsData {
  totalViews: number
  totalLikes: number
  totalShares: number
  conversionRate: number
  popularSeats: PopularSeat[]
  popularSections: PopularSection[]
  recentActivity: Activity[]
  viewsByDay: ViewsByDay[]
}

interface PopularSeat {
  seat_id: string
  seat_number: string
  row_number: string
  section_number: string
  venue_name: string
  view_count: number
  like_count: number
}

interface PopularSection {
  section_id: string
  section_number: string
  venue_name: string
  view_count: number
}

interface Activity {
  id: string
  type: string
  title: string
  message: string
  created_at: string
  venue_name?: string
}

interface ViewsByDay {
  date: string
  views: number
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    loadAnalytics()
  }, [dateRange])

  const loadAnalytics = async () => {
    setLoading(true)
    
    // Calculate date range
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get total views
    const { count: totalViews } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'view')
      .gte('created_at', startDate.toISOString())

    // Get total likes from notifications
    const { count: totalLikes } = await supabase
      .from('rep_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'like')
      .gte('created_at', startDate.toISOString())

    // Get total shares
    const { count: totalShares } = await supabase
      .from('share_links')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())

    // Get popular seats
    const { data: popularSeatsData } = await supabase
      .from('analytics_events')
      .select('seat_id, seat:seats(seat_number, row:rows(row_number, section:sections(section_number, venue:venues(name))))')
      .eq('event_type', 'view')
      .gte('created_at', startDate.toISOString())

    // Process popular seats
    const seatCounts: Record<string, PopularSeat> = {}
    popularSeatsData?.forEach((event: any) => {
      if (!event.seat) return
      const seat = event.seat
      const key = seat.id
      if (!seatCounts[key]) {
        seatCounts[key] = {
          seat_id: seat.id,
          seat_number: seat.seat_number,
          row_number: seat.row?.row_number,
          section_number: seat.row?.section?.section_number,
          venue_name: seat.row?.section?.venue?.name,
          view_count: 0,
          like_count: 0,
        }
      }
      seatCounts[key].view_count++
    })

    const popularSeats = Object.values(seatCounts)
      .sort((a, b) => b.view_count - a.view_count)
      .slice(0, 10)

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from('rep_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    // Get views by day
    const { data: viewsData } = await supabase
      .from('analytics_events')
      .select('created_at')
      .eq('event_type', 'view')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    // Process views by day
    const viewsByDayMap: Record<string, number> = {}
    viewsData?.forEach((event: any) => {
      const date = new Date(event.created_at).toLocaleDateString()
      viewsByDayMap[date] = (viewsByDayMap[date] || 0) + 1
    })

    const viewsByDay = Object.entries(viewsByDayMap).map(([date, views]) => ({
      date,
      views,
    }))

    setData({
      totalViews: totalViews || 0,
      totalLikes: totalLikes || 0,
      totalShares: totalShares || 0,
      conversionRate: totalViews ? Math.round((totalLikes / totalViews) * 100) : 0,
      popularSeats,
      popularSections: [], // Simplified for now
      recentActivity: recentActivity || [],
      viewsByDay,
    })

    setLoading(false)
  }

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
              <Link href="/admin" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                Back
              </Link>
              <span className="text-slate-300">|</span>
              <h1 className="text-xl font-bold text-slate-900">Analytics Dashboard</h1>
            </div>
            <div className="flex gap-2">
              {(['7d', '30d', '90d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    dateRange === range
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="card-premium p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm text-slate-500">Total Views</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">{data?.totalViews.toLocaleString()}</p>
          </div>
          <div className="card-premium p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <ThumbsUp className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-sm text-slate-500">Total Likes</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">{data?.totalLikes.toLocaleString()}</p>
          </div>
          <div className="card-premium p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Share2 className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-sm text-slate-500">Links Created</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">{data?.totalShares.toLocaleString()}</p>
          </div>
          <div className="card-premium p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-sm text-slate-500">Conversion Rate</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">{data?.conversionRate}%</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Popular Seats */}
          <div className="card-premium overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Most Viewed Seats
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {data?.popularSeats.length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-500">
                  No views yet
                </div>
              ) : (
                data?.popularSeats.map((seat, index) => (
                  <div key={seat.seat_id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-sm font-bold text-slate-600">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">
                          Sec {seat.section_number}, Row {seat.row_number}, Seat {seat.seat_number}
                        </p>
                        <p className="text-sm text-slate-500">{seat.venue_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{seat.view_count}</p>
                      <p className="text-xs text-slate-500">views</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card-premium overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Recent Activity
              </h2>
            </div>
            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
              {data?.recentActivity.length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-500">
                  No activity yet
                </div>
              ) : (
                data?.recentActivity.map((activity) => (
                  <div key={activity.id} className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === 'like' ? 'bg-emerald-500' :
                        activity.type === 'view' ? 'bg-blue-500' :
                        activity.type === 'callback_request' ? 'bg-purple-500' :
                        'bg-slate-400'
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">{activity.message}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Views Chart */}
        {data?.viewsByDay.length > 0 && (
          <div className="card-premium p-6 mt-8">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Views Over Time
            </h2>
            <div className="h-64 flex items-end gap-2">
              {data.viewsByDay.map((day, index) => {
                const maxViews = Math.max(...data.viewsByDay.map(d => d.views))
                const height = maxViews > 0 ? (day.views / maxViews) * 100 : 0
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all hover:from-blue-700 hover:to-blue-500"
                      style={{ height: `${height}%`, minHeight: '4px' }}
                      title={`${day.date}: ${day.views} views`}
                    />
                    <p className="text-xs text-slate-500 rotate-45 origin-left translate-y-2">
                      {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
