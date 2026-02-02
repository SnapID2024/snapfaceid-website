'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Shield, Camera, Phone, Check, Loader2, AlertCircle, CheckCircle, ChevronDown, Search } from 'lucide-react';

// Country codes with phone number length requirements
const countryCodes = [
  // North America
  { code: '+1', country: 'US', name: 'United States', digits: 10 },
  { code: '+1', country: 'CA', name: 'Canada', digits: 10 },
  // Caribbean & Central America
  { code: '+52', country: 'MX', name: 'Mexico', digits: 10 },
  { code: '+53', country: 'CU', name: 'Cuba', digits: 8 },
  { code: '+1809', country: 'DO', name: 'Dominican Republic', digits: 7 },
  { code: '+1787', country: 'PR', name: 'Puerto Rico', digits: 7 },
  { code: '+502', country: 'GT', name: 'Guatemala', digits: 8 },
  { code: '+503', country: 'SV', name: 'El Salvador', digits: 8 },
  { code: '+504', country: 'HN', name: 'Honduras', digits: 8 },
  { code: '+505', country: 'NI', name: 'Nicaragua', digits: 8 },
  { code: '+506', country: 'CR', name: 'Costa Rica', digits: 8 },
  { code: '+507', country: 'PA', name: 'Panama', digits: 8 },
  { code: '+509', country: 'HT', name: 'Haiti', digits: 8 },
  { code: '+1876', country: 'JM', name: 'Jamaica', digits: 7 },
  { code: '+1868', country: 'TT', name: 'Trinidad and Tobago', digits: 7 },
  // South America
  { code: '+54', country: 'AR', name: 'Argentina', digits: 10 },
  { code: '+55', country: 'BR', name: 'Brazil', digits: 11 },
  { code: '+56', country: 'CL', name: 'Chile', digits: 9 },
  { code: '+57', country: 'CO', name: 'Colombia', digits: 10 },
  { code: '+58', country: 'VE', name: 'Venezuela', digits: 10 },
  { code: '+51', country: 'PE', name: 'Peru', digits: 9 },
  { code: '+593', country: 'EC', name: 'Ecuador', digits: 9 },
  { code: '+591', country: 'BO', name: 'Bolivia', digits: 8 },
  { code: '+595', country: 'PY', name: 'Paraguay', digits: 9 },
  { code: '+598', country: 'UY', name: 'Uruguay', digits: 8 },
  // Europe
  { code: '+44', country: 'GB', name: 'United Kingdom', digits: 10 },
  { code: '+34', country: 'ES', name: 'Spain', digits: 9 },
  { code: '+33', country: 'FR', name: 'France', digits: 9 },
  { code: '+49', country: 'DE', name: 'Germany', digits: 11 },
  { code: '+39', country: 'IT', name: 'Italy', digits: 10 },
  { code: '+351', country: 'PT', name: 'Portugal', digits: 9 },
  { code: '+31', country: 'NL', name: 'Netherlands', digits: 9 },
  { code: '+32', country: 'BE', name: 'Belgium', digits: 9 },
  { code: '+41', country: 'CH', name: 'Switzerland', digits: 9 },
  { code: '+43', country: 'AT', name: 'Austria', digits: 10 },
  { code: '+46', country: 'SE', name: 'Sweden', digits: 9 },
  { code: '+47', country: 'NO', name: 'Norway', digits: 8 },
  { code: '+45', country: 'DK', name: 'Denmark', digits: 8 },
  { code: '+358', country: 'FI', name: 'Finland', digits: 9 },
  { code: '+353', country: 'IE', name: 'Ireland', digits: 9 },
  { code: '+48', country: 'PL', name: 'Poland', digits: 9 },
  { code: '+420', country: 'CZ', name: 'Czech Republic', digits: 9 },
  { code: '+36', country: 'HU', name: 'Hungary', digits: 9 },
  { code: '+40', country: 'RO', name: 'Romania', digits: 9 },
  { code: '+30', country: 'GR', name: 'Greece', digits: 10 },
  { code: '+380', country: 'UA', name: 'Ukraine', digits: 9 },
  { code: '+7', country: 'RU', name: 'Russia', digits: 10 },
  // Asia
  { code: '+81', country: 'JP', name: 'Japan', digits: 10 },
  { code: '+82', country: 'KR', name: 'South Korea', digits: 10 },
  { code: '+86', country: 'CN', name: 'China', digits: 11 },
  { code: '+91', country: 'IN', name: 'India', digits: 10 },
  { code: '+62', country: 'ID', name: 'Indonesia', digits: 11 },
  { code: '+63', country: 'PH', name: 'Philippines', digits: 10 },
  { code: '+66', country: 'TH', name: 'Thailand', digits: 9 },
  { code: '+84', country: 'VN', name: 'Vietnam', digits: 9 },
  { code: '+60', country: 'MY', name: 'Malaysia', digits: 9 },
  { code: '+65', country: 'SG', name: 'Singapore', digits: 8 },
  { code: '+852', country: 'HK', name: 'Hong Kong', digits: 8 },
  { code: '+886', country: 'TW', name: 'Taiwan', digits: 9 },
  { code: '+971', country: 'AE', name: 'United Arab Emirates', digits: 9 },
  { code: '+972', country: 'IL', name: 'Israel', digits: 9 },
  { code: '+90', country: 'TR', name: 'Turkey', digits: 10 },
  { code: '+966', country: 'SA', name: 'Saudi Arabia', digits: 9 },
  { code: '+92', country: 'PK', name: 'Pakistan', digits: 10 },
  { code: '+880', country: 'BD', name: 'Bangladesh', digits: 10 },
  // Oceania
  { code: '+61', country: 'AU', name: 'Australia', digits: 9 },
  { code: '+64', country: 'NZ', name: 'New Zealand', digits: 9 },
  // Africa
  { code: '+27', country: 'ZA', name: 'South Africa', digits: 9 },
  { code: '+20', country: 'EG', name: 'Egypt', digits: 10 },
  { code: '+234', country: 'NG', name: 'Nigeria', digits: 10 },
  { code: '+254', country: 'KE', name: 'Kenya', digits: 9 },
  { code: '+212', country: 'MA', name: 'Morocco', digits: 9 },
  { code: '+213', country: 'DZ', name: 'Algeria', digits: 9 },
  { code: '+216', country: 'TN', name: 'Tunisia', digits: 8 },
  { code: '+233', country: 'GH', name: 'Ghana', digits: 9 },
];

const premiumFeatures = [
  {
    icon: Camera,
    title: 'Biometric Safety Check',
    description: 'Verify that your date matches their profile photos with AI-powered biometric verification.',
  },
  {
    icon: Shield,
    title: 'Guardian Protection',
    description: 'Real-time protection during dates with automatic alerts to your trusted contacts.',
  },
  {
    icon: Phone,
    title: 'Priority Support',
    description: '24/7 priority customer support for all your safety needs.',
  },
];

type FlowStep = 'phone_input' | 'checking' | 'not_found' | 'already_premium' | 'payment' | 'success';

export default function GetPremiumPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]); // US by default
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [flowStep, setFlowStep] = useState<FlowStep>('phone_input');
  const [userId, setUserId] = useState<string | null>(null);
  const [accessCode, setAccessCode] = useState<string | null>(null);

  // Country search dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get the expected digits for the selected country
  const expectedDigits = selectedCountry.digits;

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return countryCodes;
    const search = countrySearch.toLowerCase();
    return countryCodes.filter(
      (country) =>
        country.name.toLowerCase().includes(search) ||
        country.country.toLowerCase().includes(search) ||
        country.code.includes(search)
    );
  }, [countrySearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setCountrySearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check for payment success on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('payment_success');
    const sessionId = urlParams.get('session_id');
    const code = urlParams.get('code');

    if (paymentSuccess === 'true' && sessionId && code) {
      setAccessCode(code);
      setFlowStep('success');
      // Clean URL
      window.history.replaceState({}, '', '/get-premium');
    }
  }, []);

  const formatPhoneForDisplay = (phone: string) => {
    // Remove non-digits
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return phone;
  };

  const handleSubmit = async () => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    if (!cleanPhone || cleanPhone.length !== expectedDigits) {
      setError(`Please enter a valid ${expectedDigits}-digit phone number for ${selectedCountry.name}`);
      return;
    }

    setIsLoading(true);
    setError('');
    setFlowStep('checking');

    try {
      // Check user subscription status in Firebase
      const response = await fetch('/api/check-user-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: `${selectedCountry.code}${cleanPhone}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setFlowStep('not_found');
        } else {
          throw new Error(data.error || 'Failed to check subscription status');
        }
        return;
      }

      setUserId(data.userId);

      if (data.subscriptionStatus === 'active' || data.subscriptionStatus === 'premium') {
        setFlowStep('already_premium');
      } else {
        // User has free membership - redirect to Stripe checkout
        setFlowStep('payment');
        await initiateStripeCheckout(data.userId, `${selectedCountry.code}${cleanPhone}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setFlowStep('phone_input');
    } finally {
      setIsLoading(false);
    }
  };

  const initiateStripeCheckout = async (uid: string, phone: string) => {
    try {
      const response = await fetch('/api/premium-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: uid,
          phone: phone,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment initialization failed');
      setFlowStep('phone_input');
    }
  };

  const resetFlow = () => {
    setFlowStep('phone_input');
    setError('');
    setPhoneNumber('');
    setUserId(null);
    setAccessCode(null);
    setSelectedCountry(countryCodes[0]); // Reset to US
    setCountrySearch('');
    setIsDropdownOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#3D1A54] via-[#6A1B9A] to-[#8E24AA] py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Get Premium Access
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8">
              Unlock all safety features and protect yourself while dating.
            </p>

            {/* Main Card */}
            <div className="bg-white rounded-3xl p-8 max-w-md mx-auto shadow-2xl">

              {/* Step: Phone Input */}
              {flowStep === 'phone_input' && (
                <>
                  <div className="text-center mb-6">
                    <div className="text-5xl font-bold text-[#6A1B9A]">$9.99</div>
                    <div className="text-gray-500">per month</div>
                  </div>

                  <ul className="space-y-3 mb-6 text-left">
                    <li className="flex items-center gap-3">
                      <Check size={20} className="text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">Biometric identity verification</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check size={20} className="text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">Guardian real-time protection</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check size={20} className="text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">Create reports with verification</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check size={20} className="text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">Entry to Tesla Model 3 giveaway</span>
                    </li>
                  </ul>

                  {/* Phone Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                      Enter your phone number
                    </label>
                    <div className="flex gap-2">
                      {/* Searchable Country Dropdown */}
                      <div className="relative" ref={dropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className="px-3 py-3 border border-gray-300 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#6A1B9A] focus:border-transparent text-sm flex items-center gap-1 min-w-[100px]"
                        >
                          <span>{selectedCountry.code}</span>
                          <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isDropdownOpen && (
                          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg z-50 w-64 max-h-80 overflow-hidden">
                            {/* Search Input */}
                            <div className="p-2 border-b border-gray-200">
                              <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                  type="text"
                                  placeholder="Search country..."
                                  value={countrySearch}
                                  onChange={(e) => setCountrySearch(e.target.value)}
                                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6A1B9A] focus:border-transparent"
                                  autoFocus
                                />
                              </div>
                            </div>

                            {/* Country List */}
                            <div className="overflow-y-auto max-h-56">
                              {filteredCountries.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                  No countries found
                                </div>
                              ) : (
                                filteredCountries.map((country) => (
                                  <button
                                    key={`${country.code}-${country.country}`}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCountry(country);
                                      setPhoneNumber('');
                                      setIsDropdownOpen(false);
                                      setCountrySearch('');
                                    }}
                                    className={`w-full px-4 py-2 text-left text-sm hover:bg-purple-50 flex items-center justify-between ${
                                      selectedCountry.code === country.code && selectedCountry.country === country.country
                                        ? 'bg-purple-100 text-[#6A1B9A]'
                                        : 'text-gray-700'
                                    }`}
                                  >
                                    <span>{country.name}</span>
                                    <span className="text-gray-500">{country.code}</span>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <input
                        type="tel"
                        placeholder={`${expectedDigits} digits`}
                        value={phoneNumber}
                        onChange={(e) => {
                          // Only allow digits and limit to expected length
                          const digits = e.target.value.replace(/\D/g, '').slice(0, expectedDigits);
                          setPhoneNumber(digits);
                        }}
                        maxLength={expectedDigits}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#6A1B9A] focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-left">
                      {selectedCountry.name} - {expectedDigits} digits required
                    </p>
                  </div>

                  {error && (
                    <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm mb-4 flex items-center gap-2">
                      <AlertCircle size={16} />
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="w-full bg-[#6A1B9A] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#5A1580] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Checking...
                      </>
                    ) : (
                      'Submit'
                    )}
                  </button>

                  <p className="text-xs text-gray-500 mt-4">
                    By subscribing, you agree to our{' '}
                    <a href="/terms" className="text-[#6A1B9A] underline">Terms of Service</a>
                    {' '}and{' '}
                    <a href="/privacy" className="text-[#6A1B9A] underline">Privacy Policy</a>
                  </p>
                </>
              )}

              {/* Step: Checking */}
              {flowStep === 'checking' && (
                <div className="py-8 text-center">
                  <Loader2 className="animate-spin mx-auto mb-4 text-[#6A1B9A]" size={48} />
                  <p className="text-gray-600 font-medium">Checking your account...</p>
                  <p className="text-gray-500 text-sm mt-2">Please wait</p>
                </div>
              )}

              {/* Step: User Not Found */}
              {flowStep === 'not_found' && (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={32} className="text-orange-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Account Not Found</h3>
                  <p className="text-gray-600 mb-6">
                    We couldn't find an account with this phone number. Please download the app and register first.
                  </p>
                  <div className="space-y-3">
                    <a
                      href="https://apps.apple.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-[#6A1B9A] text-white py-3 rounded-xl font-semibold hover:bg-[#5A1580] transition-colors"
                    >
                      Download App
                    </a>
                    <button
                      onClick={resetFlow}
                      className="w-full border-2 border-gray-300 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Try Another Number
                    </button>
                  </div>
                </div>
              )}

              {/* Step: Already Premium */}
              {flowStep === 'already_premium' && (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">You're Already Premium!</h3>
                  <p className="text-gray-600 mb-6">
                    Great news! Your account already has an active Premium subscription. Open the app to enjoy all features.
                  </p>
                  <button
                    onClick={resetFlow}
                    className="w-full border-2 border-gray-300 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Go Back
                  </button>
                </div>
              )}

              {/* Step: Payment (redirecting) */}
              {flowStep === 'payment' && (
                <div className="py-8 text-center">
                  <Loader2 className="animate-spin mx-auto mb-4 text-[#6A1B9A]" size={48} />
                  <p className="text-gray-600 font-medium">Redirecting to payment...</p>
                  <p className="text-gray-500 text-sm mt-2">You'll be redirected to Stripe to complete your purchase</p>
                </div>
              )}

              {/* Step: Success - Show Access Code */}
              {flowStep === 'success' && accessCode && (
                <div className="py-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Payment Successful!</h3>
                  <p className="text-gray-600 mb-6">
                    Your Premium subscription is now active. Use the code below to activate Premium in the app:
                  </p>

                  {/* Access Code Display */}
                  <div className="bg-gradient-to-r from-[#6A1B9A] to-[#8E24AA] rounded-2xl p-6 mb-6">
                    <p className="text-white/80 text-sm mb-2">Your Access Code</p>
                    <div className="text-4xl font-mono font-bold text-white tracking-widest">
                      {accessCode}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 text-left">
                    <p className="text-sm font-semibold text-gray-800 mb-2">How to activate:</p>
                    <ol className="text-sm text-gray-600 space-y-1">
                      <li>1. Open the SnapfaceID app</li>
                      <li>2. Go to Profile → Activate Premium</li>
                      <li>3. Enter the code above</li>
                    </ol>
                  </div>

                  <button
                    onClick={resetFlow}
                    className="w-full mt-6 border-2 border-gray-300 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Features Section - Only show on phone input step */}
        {flowStep === 'phone_input' && (
          <section className="py-16 md:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Premium Features
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Everything you need to stay safe while dating
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {premiumFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
                  >
                    <div className="bg-purple-50 p-3 rounded-xl w-fit mb-4">
                      <feature.icon className="h-8 w-8 text-[#6A1B9A]" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
