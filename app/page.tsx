import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#3D1A54] sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center hover:opacity-80 transition">
              <Image
                src="/logo.png"
                alt="SnapfaceID"
                width={45}
                height={45}
                priority
                className="rounded-lg"
              />
              <span className="ml-3 text-xl font-semibold text-white hidden sm:block">
                SnapfaceID
              </span>
            </Link>
            <div className="hidden md:flex space-x-6">
              <Link href="#features" className="text-white/80 hover:text-white transition">
                Features
              </Link>
              <Link href="#how-it-works" className="text-white/80 hover:text-white transition">
                How It Works
              </Link>
              <Link href="/contact" className="text-white/80 hover:text-white transition">
                Contact
              </Link>
            </div>
            <Link
              href="#download"
              className="bg-[#FF5722] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#E64A19] transition text-sm"
            >
              Download App
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section with Banner */}
      <section className="relative bg-[#3D1A54] overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            <Image
              src="/web-header.png"
              alt="SnapfaceID - Personal Safety Dating App"
              width={1920}
              height={600}
              priority
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-16 bg-gradient-to-b from-[#3D1A54] to-[#6A1B9A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Your Personal Safety Companion for Dating
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8">
            Verify identities, share reviews, and stay protected with real-time Guardian monitoring.
            Because your safety matters.
          </p>
          <div id="download" className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#"
              className="inline-flex items-center justify-center bg-white text-[#6A1B9A] px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition shadow-lg"
            >
              <svg className="w-7 h-7 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              App Store
            </a>
            <a
              href="#"
              className="inline-flex items-center justify-center bg-[#FF5722] text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-[#E64A19] transition shadow-lg"
            >
              <svg className="w-7 h-7 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
              </svg>
              Google Play
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Your Safety, Our Priority
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              SnapfaceID provides multiple layers of protection to keep you safe while dating
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-purple-50 to-white p-8 rounded-2xl border border-purple-100 hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 bg-[#6A1B9A] rounded-xl flex items-center justify-center text-white text-2xl mb-5">
                📸
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Facial Recognition</h3>
              <p className="text-gray-600">
                Verify your date's identity with advanced facial recognition. Compare selfies to ensure you're meeting the right person.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-orange-50 to-white p-8 rounded-2xl border border-orange-100 hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 bg-[#FF5722] rounded-xl flex items-center justify-center text-white text-2xl mb-5">
                📱
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Phone Verification</h3>
              <p className="text-gray-600">
                Verify phone numbers instantly. Check if numbers are legitimate and not disposable or fake accounts.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-purple-50 to-white p-8 rounded-2xl border border-purple-100 hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 bg-[#6A1B9A] rounded-xl flex items-center justify-center text-white text-2xl mb-5">
                🛡️
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Guardian Protection</h3>
              <p className="text-gray-600">
                Real-time location tracking during dates. If you don't respond to check-ins, we'll ensure your safety.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-orange-50 to-white p-8 rounded-2xl border border-orange-100 hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 bg-[#FF5722] rounded-xl flex items-center justify-center text-white text-2xl mb-5">
                ⭐
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Community Reviews</h3>
              <p className="text-gray-600">
                Read and share experiences about dates. See preset reviews about behavior and safety concerns.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gradient-to-br from-purple-50 to-white p-8 rounded-2xl border border-purple-100 hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 bg-[#6A1B9A] rounded-xl flex items-center justify-center text-white text-2xl mb-5">
                🚨
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Report & Alert</h3>
              <p className="text-gray-600">
                Report dangerous individuals or suspicious behavior. Help protect the community with critical safety info.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gradient-to-br from-orange-50 to-white p-8 rounded-2xl border border-orange-100 hover:shadow-xl transition-all duration-300">
              <div className="w-14 h-14 bg-[#FF5722] rounded-xl flex items-center justify-center text-white text-2xl mb-5">
                ✓
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Profile Search</h3>
              <p className="text-gray-600">
                Search profiles by phone, name, or photo. See verification status and safety ratings before meeting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How SnapfaceID Works
            </h2>
            <p className="text-lg text-gray-600">
              Simple steps to stay safe while dating
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#6A1B9A] text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">
                1
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Search Profile</h3>
              <p className="text-gray-600 text-sm">
                Search for your date using their phone number, name, or photo
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#FF5722] text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">
                2
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Verify Identity</h3>
              <p className="text-gray-600 text-sm">
                Request selfie verification and check community reviews
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#6A1B9A] text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">
                3
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Activate Guardian</h3>
              <p className="text-gray-600 text-sm">
                Enable real-time location tracking before meeting
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#FF5722] text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">
                4
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Date Safely</h3>
              <p className="text-gray-600 text-sm">
                Meet with confidence knowing you're protected
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-[#6A1B9A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center text-white">
            <div>
              <div className="text-5xl font-bold mb-2">50K+</div>
              <div className="text-lg text-white/80">Verified Users</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">100K+</div>
              <div className="text-lg text-white/80">Safe Dates</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">10K+</div>
              <div className="text-lg text-white/80">Reviews Shared</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#3D1A54] via-[#6A1B9A] to-[#FF5722]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Date Safely?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of women who trust SnapfaceID to keep them safe
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#"
              className="inline-flex items-center justify-center bg-white text-[#6A1B9A] px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition shadow-lg"
            >
              Download Now
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/10 transition"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Image
                  src="/logo.png"
                  alt="SnapfaceID"
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
                <span className="ml-3 text-xl font-semibold">SnapfaceID</span>
              </div>
              <p className="text-gray-400 text-sm">
                Your personal safety companion for dating. Verify, review, and stay protected.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#features" className="hover:text-white transition">Facial Recognition</a></li>
                <li><a href="#features" className="hover:text-white transition">Guardian Protection</a></li>
                <li><a href="#features" className="hover:text-white transition">Phone Verification</a></li>
                <li><a href="#features" className="hover:text-white transition">Community Reviews</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">Terms & Conditions</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/contact" className="hover:text-white transition">Report Issue</Link></li>
                <li><Link href="/cancel-subscription" className="hover:text-white transition">Cancel Subscription</Link></li>
                <li><a href="mailto:support@snapfaceid.com" className="hover:text-white transition">support@snapfaceid.com</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2025 SnapfaceID. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
