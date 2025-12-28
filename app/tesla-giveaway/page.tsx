'use client';

import Link from 'next/link';

const LOGO_URL = 'https://d64gsuwffb70l.cloudfront.net/6834a8f25630f332851529fb_1765418801539_cd77434c.png';

export default function TeslaGiveawayPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src={LOGO_URL} alt="SnapFace ID" className="h-10 w-10 rounded-xl" />
            <span className="text-xl font-bold text-white">SnapFace ID</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-red-600/20 border border-red-500/30 rounded-full px-4 py-2 mb-6">
              <span className="text-red-400 font-semibold">Official Giveaway Rules</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Win 1 of 3 <span className="text-red-500">TESLA Model 3</span>
            </h1>
            <p className="text-xl text-gray-400">
              Read the official rules and conditions for our Tesla giveaway
            </p>
          </div>
          <div className="flex-1 flex justify-center">
            <img
              src="/tesla-model-3.png"
              alt="Tesla Model 3"
              className="w-full max-w-md drop-shadow-2xl"
            />
          </div>
        </div>

        {/* Rules Sections */}
        <div className="space-y-8">

          {/* How It Works */}
          <section className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🎯</span>
              <h2 className="text-2xl font-bold">How It Works</h2>
            </div>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-green-500 mt-1">✓</span>
                <span>When you pay for a Premium subscription ($9.99/month), you automatically receive <strong className="text-white">1 ticket</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 mt-1">✓</span>
                <span>The ticket enters you into the giveaway — it does <strong className="text-red-400">NOT</strong> guarantee you win</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 mt-1">✓</span>
                <span><strong className="text-white">3 winners</strong> will be selected when we reach 30,000 Premium users</span>
              </li>
            </ul>
          </section>

          {/* Date and Selection */}
          <section className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🗓️</span>
              <h2 className="text-2xl font-bold">Date & Selection Method</h2>
            </div>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-blue-500 mt-1">•</span>
                <span><strong className="text-white">Giveaway Date:</strong> When we reach 30,000 active Premium subscribers</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-500 mt-1">•</span>
                <span><strong className="text-white">Selection Method:</strong> Certified random selection / Notary public verification</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-500 mt-1">•</span>
                <span><strong className="text-white">Announcement:</strong> Via in-app display and push notification to all participants</span>
              </li>
            </ul>
          </section>

          {/* Requirements */}
          <section className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">✅</span>
              <h2 className="text-2xl font-bold">Eligibility Requirements</h2>
            </div>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-green-500 mt-1">✓</span>
                <span>Must be an <strong className="text-white">active Premium subscriber</strong> at the time of the drawing</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 mt-1">✓</span>
                <span>Account must be <strong className="text-white">verified with a valid phone number</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 mt-1">✓</span>
                <span>Must reside in a <strong className="text-white">country where Tesla vehicles can be exported/imported</strong></span>
              </li>
            </ul>
          </section>

          {/* Important Conditions */}
          <section className="bg-red-900/20 rounded-2xl p-6 border border-red-700/50">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">⚠️</span>
              <h2 className="text-2xl font-bold text-red-400">Important Conditions</h2>
            </div>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-red-500 mt-1">!</span>
                <span>Your ticket is <strong className="text-white">valid only while your subscription is active</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 mt-1">!</span>
                <span>If you cancel your subscription, <strong className="text-red-400">you lose your giveaway ticket</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 mt-1">!</span>
                <span><strong className="text-white">No additional payments</strong> are required to claim the prize</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 mt-1">!</span>
                <span><strong className="text-white">Taxes</strong> on the prize are the <strong className="text-red-400">winner's responsibility</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 mt-1">!</span>
                <span><strong className="text-white">Export/import costs</strong> for the vehicle are the <strong className="text-red-400">winner's responsibility</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 mt-1">!</span>
                <span><strong className="text-white">Identity verification</strong> is required to claim the prize</span>
              </li>
            </ul>
          </section>

          {/* Organizer Info */}
          <section className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">📄</span>
              <h2 className="text-2xl font-bold">Organizer Information</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-gray-300">
              <div>
                <p className="text-sm text-gray-500 mb-1">Company</p>
                <p className="text-white font-semibold">Bellacruz Online LLC</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Contact Email</p>
                <a href="mailto:bellacruzcompany@gmail.com" className="text-blue-400 hover:text-blue-300 font-semibold">
                  bellacruzcompany@gmail.com
                </a>
              </div>
            </div>
          </section>

          {/* Your Guarantees */}
          <section className="bg-green-900/20 rounded-2xl p-6 border border-green-700/50">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🔒</span>
              <h2 className="text-2xl font-bold text-green-400">Your Guarantees</h2>
            </div>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-green-500 mt-1">✓</span>
                <span>Keep your subscription active until the delivery process is complete <strong className="text-white">(usually 5 weeks)</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 mt-1">✓</span>
                <span>You will receive confirmation via <strong className="text-white">SMS or text message</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 mt-1">✓</span>
                <span>You can <strong className="text-white">verify your ticket</strong> in your app profile</span>
              </li>
            </ul>
          </section>

        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-2">Ready to Enter?</h3>
            <p className="text-red-200 mb-6">Download SnapFace ID and subscribe to Premium to get your ticket!</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://apps.apple.com/app/snapface-id"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-black hover:bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                App Store
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.snapfaceid"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-black hover:bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                </svg>
                Google Play
              </a>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-gray-500 text-sm mt-8">
          Last updated: December 2024 | These rules are subject to change. Check back for updates.
        </p>
      </main>
    </div>
  );
}
