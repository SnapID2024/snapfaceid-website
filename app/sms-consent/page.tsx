import React from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';

const LAST_UPDATED = '2025-12-23';

const SAMPLE_MESSAGE = `SnapfaceID Guardian Alert: <USER_NAME> may be in danger. Last location: <ADDRESS>. Date phone: <DATE_PHONE>. Flyer: <FLYER_URL>. If urgent, call 911. Reply STOP to opt out, HELP for help.`;

const CONSENT_LANGUAGE = `By entering your emergency contact's phone number and tapping "Start Guardian Session", you confirm that:

1. You have obtained express consent from your emergency contact to receive SMS/MMS safety alerts from SnapfaceID on your behalf.

2. Your emergency contact agrees to receive automated safety alert messages if you trigger an emergency or miss a safety check-in.

3. Message frequency: 1-3 messages per Guardian session (only during active emergencies).

4. Message and data rates may apply.

5. Reply STOP to opt out of future messages. Reply HELP for assistance.

6. Carrier participation may vary. T-Mobile is not liable for delayed or undelivered messages.`;

export default function SmsConsentPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-grow py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">SMS/MMS Consent (Guardian Alerts)</h1>
          <p className="text-gray-600 mb-10">Last updated: {LAST_UPDATED}</p>

          <div className="space-y-8">
            {/* PROMINENT OPT-IN SECTION */}
            <section className="bg-[#6A1B9A] text-white rounded-2xl p-6 md:p-8 shadow-lg space-y-4">
              <h2 className="text-xl md:text-2xl font-bold">Explicit Opt-In Requirement</h2>
              <p className="leading-relaxed">
                SnapfaceID requires <strong>explicit opt-in consent</strong> before any SMS/MMS messages are sent.
                Users must actively consent by completing the Guardian setup flow in our mobile app.
                <strong> No messages are sent without prior express consent.</strong>
              </p>
            </section>

            {/* IN-APP OPT-IN WORKFLOW */}
            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">In-App Opt-In Workflow</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The following consent flow is displayed to users in the SnapfaceID mobile app before they can start a Guardian session:
              </p>

              <div className="bg-gray-100 rounded-xl p-4 md:p-6 border-2 border-gray-300">
                <p className="text-sm text-gray-500 mb-3 font-semibold">EXACT CONSENT LANGUAGE SHOWN IN APP:</p>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-800 whitespace-pre-line text-sm leading-relaxed">
                    {CONSENT_LANGUAGE}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-[#6A1B9A] rounded bg-[#6A1B9A] flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700 font-medium">I agree to the SMS consent terms above</span>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  User must check this box before the &quot;Start Guardian Session&quot; button becomes active.
                </p>
              </div>
            </section>

            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">What messages we send</h2>
              <p className="text-gray-700 leading-relaxed">
                SnapfaceID sends <strong>transactional safety alerts</strong> via SMS/MMS for the Guardian feature.
                These messages are event-driven (emergency triggered or failed safety check-in) and are not marketing or
                promotional messages.
              </p>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Important:</strong> We do NOT send marketing, promotional, or advertising messages.
                  All SMS/MMS communications are strictly safety-related emergency alerts.
                </p>
              </div>
            </section>

            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Who receives messages</h2>
              <p className="text-gray-700 leading-relaxed">
                Messages are sent <strong>only</strong> to a <strong>user-designated emergency contact</strong> whose phone number
                is provided by the user inside the app. The user must confirm they have obtained consent from their emergency
                contact before adding their number.
              </p>
            </section>

            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">How consent is collected (Step-by-Step)</h2>
              <ol className="text-gray-700 leading-relaxed space-y-3 list-decimal pl-6">
                <li>User opens SnapfaceID app and navigates to Guardian feature</li>
                <li>User enters their emergency contact&apos;s phone number</li>
                <li>User is presented with the full SMS consent disclosure (shown above)</li>
                <li>User must check the consent checkbox confirming they have obtained their emergency contact&apos;s permission</li>
                <li>Only after checking the box can user tap &quot;Start Guardian Session&quot;</li>
                <li>Consent record is stored with timestamp in our database</li>
              </ol>
              <p className="text-gray-700 leading-relaxed mt-4">
                See our{' '}
                <Link className="text-[#6A1B9A] hover:underline font-medium" href="/terms">
                  Terms of Service
                </Link>{' '}
                (Guardian section) for complete legal terms.
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
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Message Frequency</h2>
              <p className="text-gray-700 leading-relaxed">
                <strong>1-3 messages per Guardian session.</strong> Messages are only sent during active safety monitoring sessions
                when an emergency is triggered or a check-in is missed. You will not receive messages outside of these events.
              </p>
            </section>

            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Opt-Out Instructions</h2>
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <p className="text-red-800 font-semibold text-lg mb-2">To stop receiving messages:</p>
                <p className="text-red-700 text-xl font-bold">Reply STOP to any message</p>
              </div>
              <p className="text-gray-700 leading-relaxed mt-4">
                You can opt out at any time by replying <strong>STOP</strong> to any SMS message you receive from us.
                You will receive a confirmation message and no further messages will be sent.
              </p>
              <p className="text-gray-700 leading-relaxed">
                For help, reply <strong>HELP</strong> to any message or contact our support team.
              </p>
            </section>

            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Contact Information</h2>
              <div className="text-gray-700 leading-relaxed space-y-2">
                <p><strong>Company:</strong> BELLACRUZ ONLINE LLC</p>
                <p><strong>Email:</strong>{' '}
                  <a className="text-[#6A1B9A] hover:underline" href="mailto:bellacruzcompany@gmail.com">
                    bellacruzcompany@gmail.com
                  </a>
                </p>
                <p><strong>Website:</strong>{' '}
                  <Link className="text-[#6A1B9A] hover:underline" href="/contact">
                    https://www.snapfaceid.com/contact
                  </Link>
                </p>
              </div>
            </section>

            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Carrier Disclosure</h2>
              <p className="text-gray-700 leading-relaxed">
                Message and data rates may apply. Carriers are not liable for delayed or undelivered messages.
                Carrier participation and message delivery are subject to network availability.
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

