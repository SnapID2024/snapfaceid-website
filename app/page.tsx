'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from './components/Header';
import Footer from './components/Footer';
import { useSafeMode } from './context/SafeModeContext';
import { getConfigStore } from './lib/configStore';
import { DisplayConfig } from './components/SafeModeConfigModal';
import { Camera, Phone, Shield, Star, AlertTriangle, Search, Apple, Play, X, ChevronDown, Loader2 } from 'lucide-react';

const WEB_HEADER_URL = 'https://d64gsuwffb70l.cloudfront.net/6834a8f25630f332851529fb_1765418803872_0552b83a.png';

// Country codes for phone search
const countryCodes = [
  { code: '+1', country: 'US', flag: '🇺🇸' },
  { code: '+1', country: 'CA', flag: '🇨🇦' },
  { code: '+52', country: 'MX', flag: '🇲🇽' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+34', country: 'ES', flag: '🇪🇸' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+33', country: 'FR', flag: '🇫🇷' },
  { code: '+55', country: 'BR', flag: '🇧🇷' },
  { code: '+54', country: 'AR', flag: '🇦🇷' },
  { code: '+57', country: 'CO', flag: '🇨🇴' },
];

const features = [
  {
    icon: Camera,
    title: 'Biometric Safety Check',
    description: 'Verify that your date matches their profile photos with our advanced AI-powered biometric verification technology.',
    gradient: 'from-purple-50 to-purple-100',
  },
  {
    icon: Phone,
    title: 'Phone Verification',
    description: 'Ensure authenticity with verified phone numbers. Know you\'re talking to a real person.',
    gradient: 'from-orange-50 to-orange-100',
  },
  {
    icon: Shield,
    title: 'Guardian Protection',
    description: 'Activate Guardian mode during dates. Your trusted contacts will be notified if you don\'t check in.',
    gradient: 'from-purple-50 to-purple-100',
  },
  {
    icon: Star,
    title: 'Community Reports',
    description: 'Read and share anonymous reports about dating experiences. Help others stay safe.',
    gradient: 'from-orange-50 to-orange-100',
  },
  {
    icon: AlertTriangle,
    title: 'Report & Alert',
    description: 'Report suspicious behavior and help protect the community. Your safety is our priority.',
    gradient: 'from-purple-50 to-purple-100',
  },
  {
    icon: Search,
    title: 'Profile Verification',
    description: 'Verify profiles before meeting. Make informed decisions about your dates.',
    gradient: 'from-orange-50 to-orange-100',
  },
];

const steps = [
  { number: 1, title: 'Verify', description: 'Look up your date\'s profile using their photo or phone number.', color: 'bg-[#6A1B9A]' },
  { number: 2, title: 'Check Reports', description: 'Check their verification status and read community reports.', color: 'bg-[#FF5722]' },
  { number: 3, title: 'Activate Guardian', description: 'Turn on Guardian mode and set your check-in intervals.', color: 'bg-[#6A1B9A]' },
  { number: 4, title: 'Date Safely', description: 'Enjoy your date knowing you have protection in place.', color: 'bg-[#FF5722]' },
];

interface PlatformStats {
  registered_users: number;
  total_reviews: number;
  reviews_with_photos: number;
  remote_reviews: number;
}

interface SearchResult {
  found: boolean;
  personId?: string;
  photoUrl?: string;
  hasReviews?: boolean;
  reviewCount?: number;
}

interface Review {
  id: string;
  rating: number;
  review_text: string;
  review_preset_1?: number;
  review_preset_2?: number;
  review_type?: string;
  location?: string;
  date_created?: string;
  author_username: string;
  author_avatar_url?: string;
  author_preset_avatar_id?: number;
}

const Home: React.FC = () => {
  const { config } = useSafeMode();
  const [showSearchSection, setShowSearchSection] = useState(config.alertLevel);

  // Poll for config changes every 3 seconds
  useEffect(() => {
    setShowSearchSection(config.alertLevel);

    const pollConfig = async () => {
      try {
        const response = await fetch('/api/display-mode');
        if (response.ok) {
          const data = await response.json();
          if (data.config) {
            setShowSearchSection(data.config.alertLevel);
          }
        }
      } catch (error) {
        // Ignore errors
      }
    };

    // Poll every 3 seconds
    const interval = setInterval(pollConfig, 3000);

    // Also subscribe to local store for same-browser updates
    const store = getConfigStore();
    const unsubscribe = store.subscribe((newConfig: DisplayConfig) => {
      setShowSearchSection(newConfig.alertLevel);
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [config.alertLevel]);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<'result' | 'payment' | 'reviews'>('result');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);

  // Fetch platform stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        if (response.ok) {
          const data = await response.json();
          setPlatformStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, []);

  // Check for payment success on page load
  useEffect(() => {
    console.log('[PAGE] Checking URL for payment success...');
    console.log('[PAGE] Full URL:', window.location.href);

    const urlParams = new URLSearchParams(window.location.search);
    const verificationSuccess = urlParams.get('verification_success');
    const sessionId = urlParams.get('session_id');
    const personId = urlParams.get('person_id');

    console.log('[PAGE] URL Params:', { verificationSuccess, sessionId, personId });

    if (verificationSuccess === 'true' && sessionId && personId) {
      console.log('[PAGE] Payment success detected! Fetching reviews...');
      // Payment was successful, fetch reviews
      fetchReviewsAfterPayment(sessionId, personId);
      // Clean URL
      window.history.replaceState({}, '', '/');
    } else {
      console.log('[PAGE] No payment success in URL');
    }
  }, []);

  const fetchReviewsAfterPayment = async (sessionId: string, personId: string) => {
    setIsLoadingReviews(true);
    setShowModal(true);
    setModalStep('reviews');

    try {
      const response = await fetch('/api/get-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, personId }),
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        if (data.personInfo?.photo) {
          setSearchResult({
            found: true,
            personId,
            photoUrl: data.personInfo.photo,
            hasReviews: true,
            reviewCount: data.reviews?.length || 0,
          });
        }
      } else {
        alert('Failed to retrieve reviews. Please contact support.');
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      alert('Error loading reviews');
      setShowModal(false);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const handleSearch = async () => {
    if (!phoneNumber.trim()) return;

    setIsSearching(true);
    setSearchResult(null);

    try {
      const response = await fetch('/api/public-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber.replace(/\D/g, ''),
          countryCode: selectedCountry.code,
        }),
      });

      const data = await response.json();

      if (data.found) {
        setSearchResult(data);
        setShowModal(true);
        setModalStep('result');
      } else {
        setSearchResult({ found: false });
        setShowModal(true);
        setModalStep('result');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleViewReviews = async () => {
    console.log('[VIEW-REVIEWS] Starting...');
    console.log('[VIEW-REVIEWS] searchResult:', searchResult);

    if (!searchResult?.personId) {
      console.log('[VIEW-REVIEWS] ERROR: No personId');
      return;
    }

    // Si NO hay foto, mostrar reseñas GRATIS
    if (!searchResult.photoUrl) {
      console.log('[VIEW-REVIEWS] No photo - fetching FREE reviews');
      await fetchFreeReviews(searchResult.personId);
      return;
    }

    // Si HAY foto, cobrar $1.50
    console.log('[VIEW-REVIEWS] Has photo - initiating Stripe payment');
    try {
      const requestBody = {
        personId: searchResult.personId,
        phone: `${selectedCountry.code}${phoneNumber}`,
      };
      console.log('[VIEW-REVIEWS] Request body:', requestBody);

      const response = await fetch('/api/verification-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('[VIEW-REVIEWS] Response status:', response.status);
      const data = await response.json();
      console.log('[VIEW-REVIEWS] Response data:', data);

      if (data.url) {
        console.log('[VIEW-REVIEWS] Redirecting to Stripe:', data.url);
        window.location.href = data.url;
      } else {
        console.log('[VIEW-REVIEWS] ERROR: No URL in response');
        alert('Failed to initiate payment. Please try again.');
      }
    } catch (error) {
      console.error('[VIEW-REVIEWS] Payment error:', error);
      alert('Payment failed. Please try again.');
    }
  };

  const fetchFreeReviews = async (personId: string) => {
    console.log('[FREE-REVIEWS] Fetching reviews for personId:', personId);
    setIsLoadingReviews(true);
    setModalStep('reviews');

    try {
      const response = await fetch('/api/get-free-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId }),
      });

      console.log('[FREE-REVIEWS] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[FREE-REVIEWS] Reviews received:', data.reviews?.length || 0);
        console.log('[FREE-REVIEWS] Full data:', data);
        setReviews(data.reviews || []);
      } else {
        const errorData = await response.json();
        console.log('[FREE-REVIEWS] Error response:', errorData);
        alert('Failed to retrieve reviews.');
      }
    } catch (error) {
      console.error('[FREE-REVIEWS] Error:', error);
      alert('Error loading reviews');
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSearchResult(null);
    setReviews([]);
    setModalStep('result');
  };

  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star
        key={i}
        size={16}
        className={i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
      />
    ));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Tesla Model 3 Giveaway Promotional Banner */}
      <a href="/tesla-giveaway" className="block">
        <section className="bg-gradient-to-r from-[#FF5722] via-[#FF7043] to-[#FF5722] py-3 px-4 relative overflow-hidden cursor-pointer hover:from-[#E64A19] hover:via-[#FF5722] hover:to-[#E64A19] transition-all duration-300">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full -translate-x-10 -translate-y-10 animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full translate-x-16 translate-y-16 animate-pulse"></div>
          </div>

          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-bounce">🎉</span>
              <p className="text-white font-bold text-sm sm:text-base text-center">
                WIN A TESLA MODEL 3! Download the app & become Premium to enter the giveaway!
              </p>
              <span className="text-2xl animate-bounce hidden sm:inline">🎉</span>
            </div>
            <div className="flex gap-2">
              <span
                className="flex items-center gap-1 bg-white text-[#FF5722] px-3 py-1.5 rounded-lg font-semibold text-xs sm:text-sm hover:bg-gray-100 transition-all duration-200 hover:scale-105 shadow-lg"
              >
                <Apple size={16} />
                <span>iOS</span>
              </span>
              <span
                className="flex items-center gap-1 bg-white text-[#FF5722] px-3 py-1.5 rounded-lg font-semibold text-xs sm:text-sm hover:bg-gray-100 transition-all duration-200 hover:scale-105 shadow-lg"
              >
                <Play size={16} fill="currentColor" />
                <span>Android</span>
              </span>
            </div>
          </div>
        </section>
      </a>

      {/* Verified Identity Banner */}
      <section className="bg-[#3D1A54] py-8">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <img
            src="/verified-identity-banner.png"
            alt="Verified identity"
            className="w-full h-auto object-contain max-h-[320px] mx-auto"
          />
          <p className="text-white text-xs sm:text-lg md:text-2xl font-medium -mt-8 sm:whitespace-nowrap">
            Reports stick to verified identity — not just phone numbers.
          </p>
        </div>
      </section>

      {/* Platform Statistics Section */}
      <section className="bg-[#3D1A54] py-8 border-t border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
              Join Our Growing Safety Community
            </h2>
            <p className="text-white/70 text-sm">
              Real data. Real protection. Real peace of mind.
            </p>
          </div>

          {platformStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {/* Total Community Reports */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-6 text-center border border-white/20 hover:bg-white/15 transition-colors">
                <div className="text-3xl md:text-4xl font-bold text-[#FF5722] mb-1">
                  {platformStats.total_reviews.toLocaleString()}
                </div>
                <div className="text-white/80 text-xs md:text-sm font-medium">
                  Total Community Reports
                </div>
              </div>

              {/* Registered Users */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-6 text-center border border-white/20 hover:bg-white/15 transition-colors">
                <div className="text-3xl md:text-4xl font-bold text-[#FF5722] mb-1">
                  {platformStats.registered_users.toLocaleString()}
                </div>
                <div className="text-white/80 text-xs md:text-sm font-medium">
                  Registered Users
                </div>
              </div>

              {/* Reports with Verified Images */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-6 text-center border border-white/20 hover:bg-white/15 transition-colors">
                <div className="text-3xl md:text-4xl font-bold text-[#FF5722] mb-1">
                  {platformStats.reviews_with_photos.toLocaleString()}
                </div>
                <div className="text-white/80 text-xs md:text-sm font-medium">
                  Reports with Verified Images
                </div>
              </div>

              {/* Phone Interactions Documented */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-6 text-center border border-white/20 hover:bg-white/15 transition-colors">
                <div className="text-3xl md:text-4xl font-bold text-[#FF5722] mb-1">
                  {platformStats.remote_reviews.toLocaleString()}
                </div>
                <div className="text-white/80 text-xs md:text-sm font-medium">
                  Phone Interactions Documented
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Phone Search Section - Controlled by alertLevel config */}
      {showSearchSection && (
      <section className="bg-gradient-to-b from-[#3D1A54] to-[#6A1B9A] py-8 md:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Verify Before You Meet
            </h2>
            <p className="text-white/80 text-sm md:text-base">
              Search by phone number to see if someone has reports in our community. These are not photos extracted from social media apps like Facebook or Instagram - they are real photos taken during dates.
            </p>
          </div>

          {/* Search Box */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/20">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Country Code Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  className="flex items-center gap-2 bg-white text-gray-800 px-4 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors min-w-[100px]"
                >
                  <span className="text-xl">{selectedCountry.flag}</span>
                  <span>{selectedCountry.code}</span>
                  <ChevronDown size={16} />
                </button>

                {showCountryDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-60 overflow-y-auto">
                    {countryCodes.map((country, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedCountry(country);
                          setShowCountryDropdown(false);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 text-left"
                      >
                        <span className="text-xl">{country.flag}</span>
                        <span className="text-gray-800">{country.code}</span>
                        <span className="text-gray-500 text-sm">{country.country}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Phone Input */}
              <input
                type="tel"
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#FF5722]"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />

              {/* Search Button */}
              <button
                onClick={handleSearch}
                disabled={isSearching || !phoneNumber.trim()}
                className="flex items-center justify-center gap-2 bg-[#FF5722] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#E64A19] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Search size={20} />
                )}
                <span>{isSearching ? 'Searching...' : 'Search'}</span>
              </button>
            </div>

            <p className="text-white/60 text-xs mt-3 text-center">
              $1.50 to view reports if a match is found
            </p>
          </div>
        </div>
      </section>
      )}

      {/* Value Proposition - Compact */}
      <section className="bg-[#6A1B9A] py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-4">
            Your Personal Safety Companion for Dating
          </h1>
          <p className="text-base md:text-lg text-white/80 max-w-3xl mx-auto mb-6">
            Verify identities, share reports, and stay protected while meeting new people.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://apps.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white text-[#3D1A54] px-5 py-2.5 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <Apple size={22} />
              <div className="text-left">
                <div className="text-xs">Download on the</div>
                <div className="text-base font-bold">App Store</div>
              </div>
            </a>
            <a
              href="https://play.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-[#FF5722] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#E64A19] transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <Play size={22} fill="currentColor" />
              <div className="text-left">
                <div className="text-xs">Get it on</div>
                <div className="text-base font-bold">Google Play</div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Your Safety, Our Priority
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive features designed to keep you safe while dating
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`bg-gradient-to-br ${feature.gradient} p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1`}
              >
                <div className="bg-white p-3 rounded-xl w-fit mb-4 shadow-sm">
                  <feature.icon className="h-8 w-8 text-[#6A1B9A]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-gray-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How SnapfaceID Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Four simple steps to safer dating
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className={`${step.color} text-white w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg`}>
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-[#3D1A54] via-[#6A1B9A] to-[#FF5722] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Date Safely?
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-10">
            Join thousands of users who trust SnapfaceID for their dating safety.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://apps.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-[#6A1B9A] px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 hover:scale-105 shadow-lg"
            >
              Download Now
            </a>
            <Link
              href="/contact"
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/10 transition-all duration-200"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      {/* Search Result Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#6A1B9A] to-[#3D1A54] p-4 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">
                {modalStep === 'result' ? 'Search Result' : modalStep === 'payment' ? 'Payment' : 'Reports'}
              </h3>
              <button
                onClick={closeModal}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {modalStep === 'result' && searchResult && (
                <>
                  {searchResult.found ? (
                    <div className="text-center">
                      {/* Photo - solo si existe */}
                      {searchResult.photoUrl && (
                        <div className="mb-4">
                          <img
                            src={searchResult.photoUrl}
                            alt="Person"
                            className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-[#6A1B9A] shadow-lg"
                          />
                        </div>
                      )}

                      {/* Message - diferente según si hay foto o no */}
                      <div className="bg-purple-50 rounded-xl p-4 mb-4">
                        {searchResult.photoUrl ? (
                          <p className="text-gray-800 font-medium">
                            This phone number is linked to the person shown in the image above.
                          </p>
                        ) : (
                          <p className="text-gray-800 font-medium">
                            We found reports for this phone number but no photo available.
                          </p>
                        )}
                        {searchResult.reviewCount && searchResult.reviewCount > 0 && (
                          <p className="text-[#6A1B9A] font-bold mt-2">
                            {searchResult.reviewCount} report{searchResult.reviewCount !== 1 ? 's' : ''} available
                          </p>
                        )}
                      </div>

                      {/* Question */}
                      <p className="text-gray-700 font-semibold mb-4">
                        Would you like to see the reports we have?
                      </p>

                      {/* Buttons - precio diferente según si hay foto */}
                      <div className="flex gap-3">
                        <button
                          onClick={closeModal}
                          className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                        >
                          No, Thanks
                        </button>
                        <button
                          onClick={handleViewReviews}
                          className="flex-1 px-4 py-3 bg-[#FF5722] text-white rounded-xl font-semibold hover:bg-[#E64A19] transition-colors"
                        >
                          {searchResult.photoUrl ? 'Yes, View ($1.50)' : 'Yes, View (Free)'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search size={32} className="text-gray-400" />
                      </div>
                      <h4 className="text-xl font-bold text-gray-800 mb-2">No Results Found</h4>
                      <p className="text-gray-600">
                        We don't have any information about this phone number in our database.
                      </p>
                      <button
                        onClick={closeModal}
                        className="mt-6 px-6 py-3 bg-[#6A1B9A] text-white rounded-xl font-semibold hover:bg-[#5A1580] transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </>
              )}

              {modalStep === 'reviews' && (
                <div>
                  {isLoadingReviews ? (
                    <div className="text-center py-8">
                      <Loader2 className="animate-spin mx-auto mb-4 text-[#6A1B9A]" size={40} />
                      <p className="text-gray-600">Loading reports...</p>
                    </div>
                  ) : reviews.length > 0 ? (
                    <div>
                      {/* Person Photo - Centered at Top */}
                      {searchResult?.photoUrl && (
                        <div className="text-center mb-4">
                          <img
                            src={searchResult.photoUrl}
                            alt="Person"
                            className="w-20 h-20 rounded-full object-cover border-4 border-[#6A1B9A] shadow-lg mx-auto"
                          />
                          <p className="font-bold text-gray-800 mt-3">Verified Person</p>
                          <p className="text-sm text-gray-500">{reviews.length} report{reviews.length !== 1 ? 's' : ''}</p>
                          <div className="border-b border-gray-200 mt-4"></div>
                        </div>
                      )}

                      {/* Reviews List - ordenadas por fecha (más recientes primero) */}
                      <div className="space-y-4 max-h-[500px] overflow-y-auto">
                        {[...reviews]
                          .sort((a, b) => new Date(b.date_created || 0).getTime() - new Date(a.date_created || 0).getTime())
                          .map((review, idx) => {
                            // Determinar URL del avatar: custom URL > preset avatar > fallback
                            const getAvatarUrl = () => {
                              if (review.author_avatar_url) return review.author_avatar_url;
                              if (review.author_preset_avatar_id) return `/avatars/${review.author_preset_avatar_id}.png`;
                              return `https://ui-avatars.com/api/?name=${encodeURIComponent(review.author_username || 'A')}&background=6A1B9A&color=fff&size=80`;
                            };

                            return (
                          <div key={idx} className="bg-gray-50 rounded-xl p-4">
                            {/* Author Info with Avatar */}
                            <div className="flex items-center gap-3 mb-3">
                              {/* Avatar - mismo que en la app */}
                              <img
                                src={getAvatarUrl()}
                                alt={review.author_username || 'User'}
                                className="w-12 h-12 rounded-full object-cover border-2 border-[#6A1B9A]"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.author_username || 'A')}&background=6A1B9A&color=fff&size=80`;
                                }}
                              />
                              <div className="flex-1">
                                <p className="font-semibold text-gray-800">{review.author_username || 'Anonymous'}</p>
                                <div className="flex items-center gap-1">
                                  {renderStars(review.rating)}
                                </div>
                              </div>
                            </div>

                            {/* Review Text */}
                            {review.review_text && (
                              <p className="text-gray-700 text-sm mb-3 bg-white p-2 rounded-lg border border-gray-200">
                                {review.review_text}
                              </p>
                            )}

                            {/* Location and Date */}
                            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                              {review.location && (
                                <span className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-full">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  {review.location}
                                </span>
                              )}
                              {review.date_created && (
                                <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {new Date(review.date_created).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              )}
                              {review.review_type && (
                                <span className={`px-2 py-1 rounded-full ${review.review_type === 'inperson' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {review.review_type === 'inperson' ? 'In-Person' : 'Remote'}
                                </span>
                              )}
                            </div>
                          </div>
                            );
                          })}
                      </div>

                      <button
                        onClick={closeModal}
                        className="w-full mt-4 px-4 py-3 bg-[#6A1B9A] text-white rounded-xl font-semibold hover:bg-[#5A1580] transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600">No reports available for this person.</p>
                      <button
                        onClick={closeModal}
                        className="mt-4 px-6 py-3 bg-[#6A1B9A] text-white rounded-xl font-semibold"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-3 text-center">
              <p className="text-xs text-gray-500">
                Powered by SnapfaceID - Your Safety Companion
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
