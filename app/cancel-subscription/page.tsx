'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function CancelSubscriptionPage() {
  const [step, setStep] = useState<'verify' | 'reason' | 'confirm' | 'success'>('verify')
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    reason: '',
    feedback: '',
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)
    setError('')

    try {
      // TODO: Implement API call to verify user and get subscription info
      const response = await fetch('/api/subscription/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone,
        }),
      })

      if (response.ok) {
        setStep('reason')
      } else {
        setError('Could not find an active subscription with this information.')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = async () => {
    setIsProcessing(true)
    setError('')

    try {
      // TODO: Implement Stripe subscription cancellation
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone,
          reason: formData.reason,
          feedback: formData.feedback,
        }),
      })

      if (response.ok) {
        setStep('success')
      } else {
        setError('Failed to cancel subscription. Please contact support.')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
                S
              </div>
              <span className="text-2xl font-bold text-primary">SnapfaceID</span>
            </Link>
            <Link href="/" className="text-gray-700 hover:text-primary transition">
              Back to Home
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Cancel Subscription
          </h1>
          <p className="text-xl text-gray-600">
            We're sorry to see you go. Please follow the steps below to cancel your subscription.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${step === 'verify' ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step !== 'verify' ? 'bg-green-500 text-white' : 'bg-primary text-white'
              }`}>
                {step !== 'verify' ? '✓' : '1'}
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Verify</span>
            </div>
            <div className="flex-1 h-1 mx-2 bg-gray-300">
              <div className={`h-full transition-all ${
                step !== 'verify' ? 'bg-green-500 w-full' : 'w-0'
              }`} />
            </div>
            <div className={`flex items-center ${
              step === 'reason' || step === 'confirm' || step === 'success' ? 'text-primary' : 'text-gray-400'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step === 'confirm' || step === 'success' ? 'bg-green-500 text-white' :
                step === 'reason' ? 'bg-primary text-white' : 'bg-gray-300 text-white'
              }`}>
                {step === 'confirm' || step === 'success' ? '✓' : '2'}
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Reason</span>
            </div>
            <div className="flex-1 h-1 mx-2 bg-gray-300">
              <div className={`h-full transition-all ${
                step === 'confirm' || step === 'success' ? 'bg-green-500 w-full' : 'w-0'
              }`} />
            </div>
            <div className={`flex items-center ${
              step === 'confirm' || step === 'success' ? 'text-primary' : 'text-gray-400'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step === 'success' ? 'bg-green-500 text-white' :
                step === 'confirm' ? 'bg-primary text-white' : 'bg-gray-300 text-white'
              }`}>
                {step === 'success' ? '✓' : '3'}
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Confirm</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Step 1: Verify Account */}
          {step === 'verify' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Verify Your Account</h2>
              <p className="text-gray-600 mb-6">
                Please enter your account information to verify your subscription.
              </p>

              {/* Important notice about Stripe email */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <span className="text-blue-500 text-xl mr-3">ℹ️</span>
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Important</h4>
                    <p className="text-blue-800 text-sm">
                      Please use the <strong>same email address</strong> you used when you subscribed through Stripe.
                      This is the email where you receive your payment receipts.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleVerify} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Stripe Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder="your-stripe-email@example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">The email you used when subscribing to SnapfaceID Premium</p>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                    placeholder="+1 (234) 567-890"
                  />
                  <p className="text-xs text-gray-500 mt-1">The phone number registered in your SnapfaceID account</p>
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-primary text-white py-4 rounded-lg font-semibold text-lg hover:bg-primary-dark transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Verifying...' : 'Continue'}
                </button>
              </form>
            </div>
          )}

          {/* Step 2: Reason for Cancellation */}
          {step === 'reason' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Why are you canceling?</h2>
              <p className="text-gray-600 mb-6">
                Your feedback helps us improve SnapfaceID for everyone.
              </p>
              <div className="space-y-4">
                {[
                  { value: 'too-expensive', label: 'Too expensive' },
                  { value: 'not-using', label: 'Not using the app enough' },
                  { value: 'found-partner', label: 'Found a partner / No longer dating' },
                  { value: 'technical-issues', label: 'Technical issues' },
                  { value: 'missing-features', label: 'Missing features I need' },
                  { value: 'safety-concerns', label: 'Safety or privacy concerns' },
                  { value: 'other', label: 'Other reason' },
                ].map((reason) => (
                  <label
                    key={reason.value}
                    className={`block p-4 border-2 rounded-lg cursor-pointer transition ${
                      formData.reason === reason.value
                        ? 'border-primary bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reason.value}
                      checked={formData.reason === reason.value}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      className="mr-3"
                    />
                    <span className="font-medium">{reason.label}</span>
                  </label>
                ))}
              </div>
              <div className="mt-6">
                <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Feedback (Optional)
                </label>
                <textarea
                  id="feedback"
                  value={formData.feedback}
                  onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
                  placeholder="Tell us more about your experience..."
                />
              </div>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setStep('verify')}
                  className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-lg font-semibold text-lg hover:bg-gray-300 transition"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  disabled={!formData.reason}
                  className="flex-1 bg-primary text-white py-4 rounded-lg font-semibold text-lg hover:bg-primary-dark transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm Cancellation */}
          {step === 'confirm' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Confirm Cancellation</h2>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-yellow-900 mb-3">Before you cancel:</h3>
                <ul className="space-y-2 text-yellow-800">
                  <li>✓ Your subscription will remain active until the end of your billing period</li>
                  <li>✓ You'll lose access to Guardian protection and real-time safety features</li>
                  <li>✓ All your reviews and ratings will remain visible to the community</li>
                  <li>✓ You can reactivate your subscription anytime</li>
                </ul>
              </div>

              {/* Free account information */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-green-900 mb-3">Good news: You can continue as a Free User!</h3>
                <p className="text-green-800 mb-3">
                  After your billing period ends, your account will automatically convert to a <strong>Free account</strong>.
                  You'll still be able to:
                </p>
                <ul className="space-y-2 text-green-800">
                  <li>• Access the app and browse profiles</li>
                  <li>• View reviews and ratings from the community</li>
                  <li>• Search by phone number (limited searches)</li>
                  <li>• Upgrade back to Premium anytime</li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-6">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('reason')}
                  className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-lg font-semibold text-lg hover:bg-gray-300 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isProcessing}
                  className="flex-1 bg-red-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : 'Cancel Subscription'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white text-4xl mx-auto mb-6">
                ✓
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Subscription Canceled</h2>
              <p className="text-lg text-gray-600 mb-6">
                Your subscription has been successfully canceled. You'll continue to have access
                to premium features until the end of your billing period.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-left">
                <h3 className="font-bold text-blue-900 mb-2">What happens next?</h3>
                <ul className="space-y-2 text-blue-800">
                  <li>• A confirmation email has been sent to {formData.email}</li>
                  <li>• Your Premium access continues until the end of your billing period</li>
                  <li>• No further charges will be made</li>
                  <li>• After that, your account will convert to a <strong>Free account</strong></li>
                  <li>• You can continue using the app with Free features</li>
                  <li>• You can reactivate Premium anytime</li>
                </ul>
              </div>
              <div className="space-y-3">
                <Link
                  href="/"
                  className="block w-full bg-primary text-white py-4 rounded-lg font-semibold text-lg hover:bg-primary-dark transition"
                >
                  Return to Home
                </Link>
                <Link
                  href="/contact"
                  className="block w-full bg-gray-200 text-gray-700 py-4 rounded-lg font-semibold text-lg hover:bg-gray-300 transition"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Help Section */}
        {step !== 'success' && (
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Having trouble canceling?
              <Link href="/contact" className="text-primary font-semibold hover:underline ml-1">
                Contact our support team
              </Link>
            </p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 SnapfaceID. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
