import React from 'react';
import Header from './components/Header';
import Footer from './components/Footer';

const WEB_HEADER_URL = 'https://d64gsuwffb70l.cloudfront.net/6834a8f25630f332851529fb_1765418803872_0552b83a.png';

const features = [
  {
    icon: 'camera',
    title: 'Facial Recognition',
    description: 'Verify that your date matches their profile photos with our advanced AI-powered facial recognition technology.',
    gradient: 'from-purple-50 to-purple-100',
  },
  {
    icon: 'phone',
    title: 'Phone Verification',
    description: "Ensure authenticity with verified phone numbers. Know you're talking to a real person.",
    gradient: 'from-orange-50 to-orange-100',
  },
  {
    icon: 'shield',
    title: 'Guardian Protection',
    description: "Activate Guardian mode during dates. Your trusted contacts will be notified if you don't check in.",
    gradient: 'from-purple-50 to-purple-100',
  },
  {
    icon: 'star',
    title: 'Community Reviews',
    description: 'Read and share anonymous reviews about dating experiences. Help others stay safe.',
    gradient: 'from-orange-50 to-orange-100',
  },
  {
    icon: 'alert',
    title: 'Report & Alert',
    description: 'Report suspicious behavior and help protect the community. Your safety is our priority.',
    gradient: 'from-purple-50 to-purple-100',
  },
  {
    icon: 'search',
    title: 'Profile Search',
    description: 'Search and verify profiles before meeting. Make informed decisions about your dates.',
    gradient: 'from-orange-50 to-orange-100',
  },
];

const steps = [
  {
    number: 1,
    title: 'Search',
    description: "Look up your date's profile using their photo or phone number.",
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

const FeatureIcon = ({ icon }: { icon: string }) => {
  const iconMap: { [key: string]: React.ReactElement } = {
    camera: (
      <svg className="h-8 w-8 text-[#6A1B9A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    phone: (
      <svg className="h-8 w-8 text-[#6A1B9A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    shield: (
      <svg className="h-8 w-8 text-[#6A1B9A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    star: (
      <svg className="h-8 w-8 text-[#6A1B9A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    alert: (
      <svg className="h-8 w-8 text-[#6A1B9A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    search: (
      <svg className="h-8 w-8 text-[#6A1B9A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  };
  return iconMap[icon] || null;
};

export default function Home() {
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
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
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
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
              </svg>
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
                  <FeatureIcon icon={feature.icon} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
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
                <div
                  className={`${step.color} text-white w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg`}
                >
                  {step.number}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
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
                <div className="text-white/80 text-lg">{stat.label}</div>
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
            <a
              href="/contact"
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/10 transition-all duration-200"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
