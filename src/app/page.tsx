import Link from 'next/link'
import { ArrowRight, Sparkles, Eye, Share2 } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
              AccuSeat
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/about"
              className="text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              About
            </Link>
            <Link
              href="/auth/login"
              className="btn-primary flex items-center gap-2"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg shadow-slate-200/50 border border-slate-100 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-slate-600">The Future of Ticket Sales</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-8 animate-slide-up">
            <span className="text-slate-900">See Every Seat in</span>
            <br />
            <span className="gradient-text">Stunning 360°</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Give your prospects the confidence to buy. Real photos from every seat, 
            not virtual renderings. Close sales faster with immersive seat views.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link
              href="/auth/signup"
              className="btn-primary text-lg px-8 py-4 flex items-center justify-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/about"
              className="px-8 py-4 bg-white text-slate-700 font-semibold rounded-xl shadow-lg shadow-slate-200/50 border border-slate-200 hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex items-center justify-center gap-2"
            >
              Learn More
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">360°</div>
              <div className="text-sm text-slate-500">Immersive Views</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">100%</div>
              <div className="text-sm text-slate-500">Real Photos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900">3x</div>
              <div className="text-sm text-slate-500">Faster Closes</div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          {[
            {
              icon: Eye,
              title: "Real 360° Photos",
              description: "Every seat photographed in stunning detail. No virtual renderings, no guesswork.",
              color: "blue",
            },
            {
              icon: Share2,
              title: "Instant Sharing",
              description: "Send seat views via text in seconds. No app download required.",
              color: "purple",
            },
            {
              icon: Sparkles,
              title: "Gyroscope Enabled",
              description: "Prospects move their phone to look around. Just like being there.",
              color: "pink",
            },
          ].map((feature, index) => (
            <div
              key={feature.title}
              className="card-premium p-8 hover-lift group animate-slide-up"
              style={{ animationDelay: `${0.4 + index * 0.1}s` }}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-${feature.color}-500 to-${feature.color}-600 flex items-center justify-center mb-6 shadow-lg shadow-${feature.color}-500/25 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
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
// trigger rebuild
