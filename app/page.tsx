import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
                S
              </div>
              <span className="text-2xl font-bold text-primary">SnapfaceID</span>
            </div>
            <div className="hidden md:flex space-x-6">
              <Link href="#features" className="text-gray-700 hover:text-primary transition">
                Features
              </Link>
              <Link href="#how-it-works" className="text-gray-700 hover:text-primary transition">
                How It Works
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-primary transition">
                Contact
              </Link>
              <Link href="/cancel-subscription" className="text-gray-700 hover:text-primary transition">
                Cancel Subscription
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Date Safely with <span className="text-primary">SnapfaceID</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            The #1 safety platform for women. Verify your dates with facial recognition,
            phone verification, and real-time Guardian protection.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#"
              className="inline-block bg-primary text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-dark transition shadow-lg"
            >
              Download on App Store
            </a>
            <a
              href="#"
              className="inline-block bg-secondary text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-secondary-dark transition shadow-lg"
            >
              Get it on Google Play
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Your Safety, Our Priority
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: Facial Recognition */}
            <div className="bg-purple-50 p-8 rounded-xl shadow-md hover:shadow-lg transition">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-3xl mb-4">
                📸
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Facial Recognition</h3>
              <p className="text-gray-600">
                Verify your date's identity with advanced facial recognition technology.
                Compare selfies to ensure you're meeting the right person.
              </p>
            </div>

            {/* Feature 2: Phone Verification */}
            <div className="bg-purple-50 p-8 rounded-xl shadow-md hover:shadow-lg transition">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center text-white text-3xl mb-4">
                📱
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Phone Verification</h3>
              <p className="text-gray-600">
                Request and verify your date's phone number. Check if numbers are legitimate
                and not disposable or fake accounts.
              </p>
            </div>

            {/* Feature 3: Guardian Protection */}
            <div className="bg-purple-50 p-8 rounded-xl shadow-md hover:shadow-lg transition">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-3xl mb-4">
                🛡️
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Guardian Protection</h3>
              <p className="text-gray-600">
                Activate real-time location tracking during your date. If you don't respond
                to check-ins, our team will monitor your safety and alert authorities if needed.
              </p>
            </div>

            {/* Feature 4: Community Reviews */}
            <div className="bg-purple-50 p-8 rounded-xl shadow-md hover:shadow-lg transition">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center text-white text-3xl mb-4">
                ⭐
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Community Reviews</h3>
              <p className="text-gray-600">
                Read and share experiences about dates. See preset reviews about behavior,
                safety concerns, and positive experiences from other users.
              </p>
            </div>

            {/* Feature 5: Report Suspicious Activity */}
            <div className="bg-purple-50 p-8 rounded-xl shadow-md hover:shadow-lg transition">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-3xl mb-4">
                🚨
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Report & Alert</h3>
              <p className="text-gray-600">
                Report dangerous individuals, scammers, or suspicious behavior.
                Help protect the community by sharing critical safety information.
              </p>
            </div>

            {/* Feature 6: Profile Verification */}
            <div className="bg-purple-50 p-8 rounded-xl shadow-md hover:shadow-lg transition">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center text-white text-3xl mb-4">
                ✓
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Profile Verification</h3>
              <p className="text-gray-600">
                Search for profiles by phone number, name, or photo. See verification status
                and safety ratings before meeting someone new.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            How SnapfaceID Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Search Profile</h3>
              <p className="text-gray-600">
                Search for your date using their phone number, name, or photo
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Verify Identity</h3>
              <p className="text-gray-600">
                Request selfie verification and check community reviews
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Activate Guardian</h3>
              <p className="text-gray-600">
                Enable real-time location tracking before meeting your date
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="text-xl font-bold mb-2">Date Safely</h3>
              <p className="text-gray-600">
                Meet with confidence knowing you're protected and monitored
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-primary py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center text-white">
            <div>
              <div className="text-5xl font-bold mb-2">50K+</div>
              <div className="text-xl">Verified Users</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">100K+</div>
              <div className="text-xl">Safe Dates</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">10K+</div>
              <div className="text-xl">Reviews Shared</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-purple-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Date Safely?
          </h2>
          <p className="text-xl text-white mb-8">
            Join thousands of women who trust SnapfaceID to keep them safe
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#"
              className="inline-block bg-white text-primary px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition shadow-lg"
            >
              Download Now
            </a>
            <Link
              href="/contact"
              className="inline-block bg-secondary text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-secondary-dark transition shadow-lg"
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
              <h3 className="text-xl font-bold mb-4">SnapfaceID</h3>
              <p className="text-gray-400">
                Your personal safety companion for dating
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition">Facial Recognition</a></li>
                <li><a href="#features" className="hover:text-white transition">Guardian Protection</a></li>
                <li><a href="#features" className="hover:text-white transition">Phone Verification</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">Terms & Conditions</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/contact" className="hover:text-white transition">Report Issue</Link></li>
                <li><Link href="/cancel-subscription" className="hover:text-white transition">Cancel Subscription</Link></li>
                <li><a href="#" className="hover:text-white transition">FAQ</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 SnapfaceID. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
