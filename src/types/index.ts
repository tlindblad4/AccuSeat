export interface Venue {
  id: string
  name: string
  slug: string
  location?: string
  description?: string
  total_seats?: number
  logo_url?: string
  is_active: boolean
  created_at: string
}

export interface Section {
  id: string
  venue_id: string
  name: string
  level: string
  section_number: string
  description?: string
  created_at: string
}

export interface Row {
  id: string
  section_id: string
  row_number: string
  created_at: string
}

export interface Seat {
  id: string
  row_id: string
  seat_number: string
  price?: number
  plan_type?: string
  term_length?: string
  payment_plan?: string
  is_available: boolean
  created_at: string
  // Joined fields
  row?: Row & { section?: Section }
  section?: Section
  venue?: Venue
  photo?: Photo
}

export interface Photo {
  id: string
  seat_id: string
  storage_path: string
  public_url: string
  file_size?: number
  metadata?: Record<string, any>
  uploaded_by?: string
  uploaded_at: string
}

export interface ShareLink {
  id: string
  token: string
  created_by: string
  venue_id: string
  client_name?: string
  client_phone?: string
  client_email?: string
  notes?: string
  expires_at?: string
  is_active: boolean
  view_count: number
  created_at: string
  // Joined fields
  items?: ShareLinkItem[]
  venue?: Venue
}

export interface ShareLinkItem {
  id: string
  share_link_id: string
  seat_id: string
  option_order: number
  rep_notes?: string
  created_at: string
  // Joined fields
  seat?: Seat & { row?: Row & { section?: Section } }
}

export interface UserVenue {
  id: string
  user_id: string
  venue_id: string
  role: 'admin' | 'rep'
  created_at: string
  // Joined fields
  venue?: Venue
}
