import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const LAST_UPDATED = '2026-01-04';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-grow py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Privacy Policy</h1>
          <p className="text-gray-600 mb-10">Last updated: {LAST_UPDATED}</p>

          <div className="space-y-8">
            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Overview</h2>
              <p className="text-gray-700 leading-relaxed">
                <strong>This service is operated by BELLACRUZ ONLINE LLC.</strong>
              </p>
              <p className="text-gray-700 leading-relaxed">
                SnapfaceID is a personal safety platform. This Privacy Policy explains what information we collect, how
                we use it, and how we share it when you use our website, mobile application, and Guardian safety
                features.
              </p>
            </section>

            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Information We Collect</h2>
              <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                {`Depending on how you use SnapfaceID, we may collect:

• Account and profile information you provide (for example: phone number and username)
• Photos you upload (for example: selfies used for verification, and photos provided for Guardian alerts)
• Guardian-related information (for example: addresses, date phone number, and safety check-in timestamps)
• Approximate or precise location information when you enable location permissions for Guardian
• Subscription information needed to provide paid features (payments are processed by Stripe)
• Logs and metadata needed to operate, secure, and debug the service`}
              </div>
            </section>

            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">How We Use Information</h2>
              <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                {`We use information to:

• Provide the core app features (verification, reports, and Guardian)
• Deliver safety alerts and generate Guardian emergency flyers
• Maintain the security and integrity of the platform and prevent fraud
• Provide customer support and handle complaints/requests
• Comply with legal obligations and enforce our Terms of Service`}
              </div>
            </section>

            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Messaging (SMS/MMS) and Guardian Alerts</h2>
              <p className="text-gray-700 leading-relaxed">
                If you activate Guardian, the app may send SMS/MMS alerts to your designated emergency contact when an
                emergency is triggered or a safety check-in fails. Those messages may include a link to an emergency
                flyer image and date details (such as last known location/address and a date phone number).
              </p>
              <p className="text-gray-700 leading-relaxed">
                SMS/MMS delivery is provided by Twilio. To deliver messages, we share the destination phone number and
                the message content/media link with Twilio.
              </p>
            </section>

            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Authorization to Contact Emergency Services (911)</h2>
              <p className="text-gray-700 leading-relaxed">
                By using the Guardian feature, you expressly authorize BELLACRUZ ONLINE LLC to contact emergency services (911) on your behalf if:
              </p>
              <ul className="text-gray-700 list-disc list-inside space-y-1">
                <li>You fail to respond to safety check-in notifications within the designated time period</li>
                <li>You manually trigger an emergency alert</li>
                <li>We reasonably believe you may be in imminent danger</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                When contacting emergency services, we may share your personal information including: real-time or last known GPS coordinates, photographs of you and/or your date, contact information, and any other relevant information collected through the Guardian feature.
              </p>
            </section>

            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Authorization to Contact Your Emergency Contacts</h2>
              <p className="text-gray-700 leading-relaxed">
                By designating an emergency contact in the Guardian feature, you expressly authorize BELLACRUZ ONLINE LLC to contact that person via SMS/MMS in emergency situations. The information shared with your emergency contact may include:
              </p>
              <ul className="text-gray-700 list-disc list-inside space-y-1">
                <li>Your identification selfie</li>
                <li>Your last known location/address</li>
                <li>Phone number and photo of your date (if provided)</li>
                <li>Emergency flyer with relevant details</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                You confirm that you have obtained prior consent from your emergency contact to receive these safety alerts on your behalf.
              </p>
            </section>

            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Authorization to Contact Your Date</h2>
              <p className="text-gray-700 leading-relaxed">
                By providing the phone number of the person you are meeting (your "date") in the Guardian feature, you expressly authorize BELLACRUZ ONLINE LLC to contact that person in the following circumstances:
              </p>
              <ul className="text-gray-700 list-disc list-inside space-y-1">
                <li>When you trigger an emergency alert</li>
                <li>When you fail to complete a safety check-in</li>
                <li>When law enforcement or emergency services request contact information</li>
                <li>When we reasonably believe contacting your date may help ensure your safety</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                The purpose of contacting your date is exclusively for safety verification and emergency response. We may share limited information with your date, such as notifying them of an emergency situation or requesting confirmation of your safety status.
              </p>
            </section>

            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">How We Share Information</h2>
              <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                {`We may share information with service providers to operate SnapfaceID, including:

• Firebase/Google (infrastructure, database, and storage)
• Luxand (biometric verification processing when you use identity verification)
• Stripe (subscription and payment processing)
• Twilio (SMS/MMS delivery for Guardian alerts)

We may also share information if required by law, to protect user safety, or to enforce our Terms.`}
              </div>
            </section>

            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Children</h2>
              <p className="text-gray-700 leading-relaxed">
                SnapfaceID is intended for adults. We do not knowingly collect information from individuals under 18.
              </p>
            </section>

            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">SMS/MMS Consent and Communications</h2>
              <p className="text-gray-700 leading-relaxed">
                By providing your phone number and using our services, you consent to receive SMS and MMS messages from BELLACRUZ ONLINE LLC related to:
              </p>
              <ul className="text-gray-700 list-disc list-inside space-y-1">
                <li>Account verification and security alerts</li>
                <li>Guardian safety notifications and emergency alerts</li>
                <li>Service notifications and updates</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                <strong>Message frequency varies.</strong> Message and data rates may apply.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Reply <strong>STOP</strong> to unsubscribe from non-essential messages. Reply <strong>HELP</strong> for assistance.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Note: You cannot opt out of Guardian emergency alerts while an active Guardian session is in progress, as these are critical safety communications.
              </p>
            </section>

            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Contact</h2>
              <p className="text-gray-700 leading-relaxed">
                For privacy questions or requests, contact us at{' '}
                <a className="text-[#6A1B9A] hover:underline" href="mailto:bellacruzcompany@gmail.com">
                  bellacruzcompany@gmail.com
                </a>
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                <strong>BELLACRUZ ONLINE LLC</strong><br />
                Email: bellacruzcompany@gmail.com
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

