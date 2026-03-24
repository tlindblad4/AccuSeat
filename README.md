# AccuSeat

A seat-level virtual venue experience built for sports teams and ticket sales reps. Uses real 360° photos from every seat, not virtual renderings.

## Features

- **360° Photo Viewer**: Gyroscope-enabled viewing on mobile devices
- **Rep Portal**: Sales reps can browse seats and create shareable links
- **Multi-Option Links**: Bundle 2-3 seat options in one shareable link
- **Admin Panel**: Bulk upload photos and manage users
- **CRM Integration**: Log shares to Salesforce/Microsoft Dynamics
- **Analytics**: Track link opens and engagement

## Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage)
- **360° Viewer**: Pannellum
- **Hosting**: Vercel

## Quick Start

### 1. Clone and Install

```bash
git clone <repo-url>
cd accuseat
npm install
```

### 2. Set up Supabase

1. Create a new Supabase project at https://supabase.com
2. Run the schema in `supabase/schema.sql`
3. Create a storage bucket called `seat-photos`
4. Copy your project URL and anon key

### 3. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Locally

```bash
npm run dev
```

Open http://localhost:3000

## Database Schema

### Core Tables

- **venues**: Stadiums/arenas
- **sections**: Levels and sections within venues
- **rows**: Rows within sections
- **seats**: Individual seats with pricing
- **photos**: 360° photo files linked to seats
- **user_venues**: User access control (reps assigned to venues)
- **share_links**: Generated shareable links
- **share_link_items**: Seats included in each link
- **analytics_events**: View/engagement tracking

### User Roles

- **admin**: Full access, can upload photos and manage users
- **rep**: Can browse assigned venue(s) and create share links

## Usage

### For Admins

1. Create venues in Supabase
2. Add sections, rows, and seats
3. Use bulk upload to add 360° photos
4. Create rep accounts and assign to venues

### For Reps

1. Log in to the rep portal
2. Select your venue
3. Browse sections → rows → seats
4. Click seats to view 360° photos
5. Add seats to a link and generate shareable URL
6. Send link to prospects via text/email

### For Prospects

1. Receive link from rep
2. Open on mobile device
3. Move phone to look around the 360° view
4. Like/dislike options to give feedback

## File Naming for Bulk Upload

Photos are auto-matched to seats based on filename:

- `Section-101-Row-A-Seat-1.jpg` → Seat 1
- `101-A-1.jpg` → Seat 1
- `1.jpg` → Seat 1

## Photo Requirements

- Format: JPEG (equirectangular 360°)
- Size: ~25MB per photo
- Resolution: 4K or higher recommended
- Metadata: EXIF data preserved for 360° viewing

## CRM Integration

Share links are logged to CRM as Tasks/Activities:

- **Salesforce**: Creates Task with seat details
- **Microsoft Dynamics**: Creates Activity

## Analytics

Google Analytics 4 tracks:

- Link opens
- View duration
- Seat/section popularity
- Device type
- Like/dislike feedback

## Roadmap

### MVP (Current)
- [x] Rep portal with seat browser
- [x] 360° photo viewer
- [x] Shareable links
- [x] Bulk upload
- [x] Basic analytics

### Future
- [ ] SMS integration
- [ ] Real-time notifications
- [ ] Advanced CRM sync
- [ ] Mobile app
- [ ] AI-powered seat recommendations

## License

Private - AccuSeat LLC
