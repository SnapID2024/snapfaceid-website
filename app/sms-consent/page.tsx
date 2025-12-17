import React from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';

const LAST_UPDATED = '2025-12-17';

const SAMPLE_MESSAGE = `SnapfaceID Guardian Alert: <USER_NAME> may be in danger. Last location: <ADDRESS>. Date phone: <DATE_PHONE>. Flyer: <FLYER_URL>. If urgent, call 911. Reply STOP to opt out, HELP for help.`;

export default function SmsConsentPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-grow py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">SMS/MMS Consent (Guardian Alerts)</h1>
          <p className="text-gray-600 mb-10">Last updated: {LAST_UPDATED}</p>

          <div className="space-y-8">
            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">What messages we send</h2>
              <p className="text-gray-700 leading-relaxed">
                SnapfaceID sends <strong>transactional safety alerts</strong> via SMS/MMS for the Guardian feature.
                These messages are event-driven (emergency triggered or failed safety check-in) and are not marketing or
                promotional messages.
              </p>
            </section>

            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Who receives messages</h2>
              <p className="text-gray-700 leading-relaxed">
                Messages are sent to a <strong>user-designated emergency contact</strong> provided by the user inside
                the app.
              </p>
            </section>

            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">How consent is collected</h2>
              <p className="text-gray-700 leading-relaxed">
                The user adds an emergency contact in the app. By providing the contact&apos;s phone number, the user
                confirms they have the emergency contact&apos;s authorization to receive Guardian safety alerts (see{' '}
                <Link className="text-[#6A1B9A] hover:underline" href="/terms">
                  Terms of Service
                </Link>
                , Guardian section).
              </p>
            </section>

            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Message content</h2>
              <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                {`Depending on the emergency, messages may include:

• The user’s last known location/address
• The date phone number and basic date details
• A link to an emergency flyer image hosted on HTTPS

We recommend the recipient call 911 if the situation appears urgent.`}
              </div>
            </section>

            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Opt-out / Help</h2>
              <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                {`You can opt out at any time by replying STOP.
For help, reply HELP or contact support.`}
              </div>
              <p className="text-gray-700 leading-relaxed">
                Support:{' '}
                <a className="text-[#6A1B9A] hover:underline" href="mailto:bellacruzcompany@gmail.com">
                  bellacruzcompany@gmail.com
                </a>{' '}
                or{' '}
                <Link className="text-[#6A1B9A] hover:underline" href="/contact">
                  https://www.snapfaceid.com/contact
                </Link>
                .
              </p>
            </section>

            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Sample message</h2>
              <pre className="bg-gray-100 rounded-xl p-4 overflow-x-auto text-sm text-gray-800 whitespace-pre-wrap">
                {SAMPLE_MESSAGE}
              </pre>
            </section>

            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Related policies</h2>
              <div className="text-gray-700 leading-relaxed">
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <Link className="text-[#6A1B9A] hover:underline" href="/privacy">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link className="text-[#6A1B9A] hover:underline" href="/terms">
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

