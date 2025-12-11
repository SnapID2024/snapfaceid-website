'use client';

import React from 'react';
import Link from 'next/link';
import Header from './components/Header';
import Footer from './components/Footer';
import { Camera, Phone, Shield, Star, AlertTriangle, Search, Apple, Play } from 'lucide-react';

const WEB_HEADER_URL = 'https://d64gsuwffb70l.cloudfront.net/6834a8f25630f332851529fb_1765418803872_0552b83a.png';

const features = [
  {
    icon: Camera,
    title: 'Facial Recognition',
    description: 'Verify that your date matches their profile photos with our advanced AI-powered facial recognition technology.',
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
    title: 'Community Reviews',
    description: 'Read and share anonymous reviews about dating experiences. Help others stay safe.',
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
    title: 'Profile Search',
    description: 'Search and verify profiles before meeting. Make informed decisions about your dates.',
    gradient: 'from-orange-50 to-orange-100',
  },
];

const steps = [
  {
    number: 1,
    title: 'Search',
    description: 'Look up your date\'s profile using their photo or phone number.',
    color: 'bg-[#6A1B9A]',
  },
  {
    number: 2,
    title: 'Verify',
    description: 'Check their verification status and read community reviews.',
    color: 'bg-[#FF5722]',
  },
  {
    number: 3,
    title: 'Activate Guardian',
    description: 'Turn on Guardian mode and set your check-in intervals.',
    color: 'bg-[#6A1B9A]',
  },
  {
    number: 4,
    title: 'Date Safely',
    description: 'Enjoy your date knowing you have protection in place.',
    color: 'bg-[#FF5722]',
  },
];

const stats = [
  { value: '50K+', label: 'Users' },
  { value: '100K+', label: 'Safe Dates' },
  { value: '10K+', label: 'Reviews' },
];

const Home: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Banner */}
      <section className="bg-[#3D1A54]">
        <img
          src={WEB_HEADER_URL}
          alt="SnapfaceID - Your Personal Safety Companion for Dating"
          className="w-full h-auto object-cover"
        />
      </section>

      {/* Value Proposition */}
      <section className="bg-gradient-to-b from-[#3D1A54] to-[#6A1B9A] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Your Personal Safety Companion for Dating
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto mb-10">
            Verify identities, share reviews, and stay protected while meeting new people.
            SnapfaceID helps you date with confidence and peace of mind.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://apps.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white text-[#3D1A54] px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <Apple size={24} />
              <div className="text-left">
                <div className="text-xs">Download on the</div>
                <div className="text-lg font-bold">App Store</div>
              </div>
            </a>
            <a
              href="https://play.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-[#FF5722] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#E64A19] transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <Play size={24} fill="currentColor" />
              <div className="text-left">
                <div className="text-xs">Get it on</div>
                <div className="text-lg font-bold">Google Play</div>
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
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
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
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-[#6A1B9A] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-white/80 text-lg">
                  {stat.label}
                </div>
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
            Download now and start verifying your dates.
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
    </div>
  );
};

export default Home;
