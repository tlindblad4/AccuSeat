import Link from 'next/link'
import { ArrowLeft, Eye, Smartphone, Share2, Check } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">AccuSeat</span>
            </Link>
            <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
              About AccuSeat
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            The seat-level virtual venue experience built for sports teams and ticket sales reps.
          </p>
        </div>

        {/* What is it */}
        <div className="card-premium p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">What is AccuSeat?</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            AccuSeat is a seat-level virtual venue experience built specifically for sports teams 
            and their ticket sales reps. Instead of showing fans a generic 3D animated rendering 
            or a static section-wide view, AccuSeat uses real, gyroscope-enabled 360° photos taken 
            from every single seat in the venue.
          </p>
          <p className="text-slate-600 leading-relaxed">
            No more guesswork. This means a fan can move their phone and &ldquo;look around&rdquo; 
            from the exact perspective of the seat they&apos;re considering — seeing the court, 
            the scoreboard, and even the atmosphere just as they would in person.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="card-premium p-6 text-center">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Eye className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Real 360° Photos</h3>
            <p className="text-slate-600 text-sm">
              Every seat has an actual 360° photo. No virtual renderings.
            </p>
          </div>
          <div className="card-premium p-6 text-center">
            <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-7 h-7 text-purple-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Gyroscope Enabled</h3>
            <p className="text-slate-600 text-sm">
              Fans move their phone to look around. Just like being there.
            </p>
          </div>
          <div className="card-premium p-6 text-center">
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Share2 className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Instant Sharing</h3>
            <p className="text-slate-600 text-sm">
              Reps send links via text in seconds. No app download required.
            </p>
          </div>
        </div>

        {/* How it Works */}
        <div className="card-premium p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">How It Works</h2>
          <div className="space-y-6">
            {[
              {
                step: '1',
                title: 'We Photograph the Venue',
                description: 'Our team captures 360° photos from every seat using professional equipment.',
              },
              {
                step: '2',
                title: 'Reps Access the Database',
                description: 'Sales reps log in to browse their venue\'s complete seat inventory.',
              },
              {
                step: '3',
                title: 'Instant Sharing',
                description: 'Reps generate shareable links with specific seat views and send them to prospects.',
              },
              {
                step: '4',
                title: 'Fans Experience Their Seat',
                description: 'Prospects view the 360° photo on their phone, moving it around to see the full perspective.',
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">{item.step}</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-slate-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <div className="card-premium p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">For Sales Reps</h3>
            <ul className="space-y-3">
              {[
                'Close sales faster',
                'Overcome "see it first" objections',
                'Send seat views instantly via text',
                'Track prospect engagement',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-slate-600">
                  <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="card-premium p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">For Fans</h3>
            <ul className="space-y-3">
              {[
                'See exactly what they\'ll see',
                'No app download required',
                'Use their phone to look around',
                'Buy with confidence',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-slate-600">
                  <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Ready to transform your ticket sales?
          </h2>
          <p className="text-slate-600 mb-8">
            Join the teams using AccuSeat to give prospects the confidence to buy.
          </p>
          <Link href="/auth/login" className="btn-primary inline-flex items-center gap-2">
            Get Started
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Eye className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900">AccuSeat</span>
            </div>
            <p className="text-slate-500 text-sm">
              © 2026 AccuSeat. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
