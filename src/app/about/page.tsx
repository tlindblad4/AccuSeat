import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-400">
              AccuSeat
            </Link>
            <nav className="flex gap-6">
              <Link href="/" className="text-slate-300 hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/about" className="text-white font-medium">
                About
              </Link>
              <Link href="/auth/login" className="text-slate-300 hover:text-white transition-colors">
                Login
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-8">
          About AccuSeat
        </h1>
        
        <div className="prose prose-invert prose-lg max-w-none">
          <p className="text-xl text-slate-300 leading-relaxed mb-8">
            AccuSeat is a seat-level virtual venue experience built specifically for sports teams 
            and their ticket sales reps. Instead of showing fans a generic 3D animated rendering 
            or a static section-wide view, AccuSeat uses real, gyroscope-enabled 360° photos taken 
            from every single seat in the venue.
          </p>

          <h2 className="text-2xl font-semibold mt-12 mb-6">The Problem We Solve</h2>
          <p className="text-slate-300 mb-6">
            Ticket sales reps face a common objection: "I need to come see it in person before I buy." 
            This slows down the sales process and creates friction for both reps and prospects. 
            Existing solutions either use virtual recreations that don't match reality, or only 
            offer section-level views that don't show the actual seat perspective.
          </p>

          <h2 className="text-2xl font-semibold mt-12 mb-6">Our Solution</h2>
          <p className="text-slate-300 mb-6">
            AccuSeat eliminates the guesswork. We photograph every single seat in the venue, 
            creating a complete database of 360° views. When a rep is working with a prospect, 
            they can instantly send a link to the exact seat view, allowing the fan to "look around" 
            from that specific perspective using their phone's gyroscope.
          </p>

          <div className="grid md:grid-cols-2 gap-8 my-12">
            <div className="bg-slate-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-3 text-blue-400">For Sales Reps</h3>
              <ul className="space-y-2 text-slate-300">
                <li>• Close sales faster</li>
                <li>• Overcome "see it first" objections</li>
                <li>• Send seat views instantly via text</li>
                <li>• Track prospect engagement</li>
                <li>• Bundle multiple options in one link</li>
              </ul>
            </div>
            <div className="bg-slate-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-3 text-emerald-400">For Fans</h3>
              <ul className="space-y-2 text-slate-300">
                <li>• See exactly what they'll see</li>
                <li>• No app download required</li>
                <li>• Use their phone to look around</li>
                <li>• Compare multiple seat options</li>
                <li>• Buy with confidence</li>
              </ul>
            </div>
          </div>

          <h2 className="text-2xl font-semibold mt-12 mb-6">How It Works</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">We Photograph the Venue</h3>
                <p className="text-slate-400">
                  Our team captures 360° photos from every seat using professional equipment.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Reps Access the Database</h3>
                <p className="text-slate-400">
                  Sales reps log in to browse their venue's complete seat inventory.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Instant Sharing</h3>
                <p className="text-slate-400">
                  Reps generate shareable links with specific seat views and send them to prospects.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold mb-1">Fans Experience Their Seat</h3>
                <p className="text-slate-400">
                  Prospects view the 360° photo on their phone, moving it around to see the full perspective.
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-semibold mt-12 mb-6">Built by Reps, for Reps</h2>
          <p className="text-slate-300 mb-6">
            AccuSeat was designed by ticket sales professionals who understand the daily challenges 
            of selling seats. Every feature, from the mobile-first design to the one-tap sharing, 
            was built to make reps more effective and help them close more sales.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to transform your ticket sales?</h2>
          <Link
            href="/auth/login"
            className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-lg transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  )
}
