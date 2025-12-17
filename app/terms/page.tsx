import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const TERMS_SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: `By registering and/or subscribing to our service, you accept the following terms and conditions in their entirety. Using this application implies your binding consent to these policies. If you do not agree with any term, you must not use this application.`,
  },
  {
    title: '2. Service Description',
    body: `This application is a PERSONAL SAFETY platform for women in dating situations. It allows users to:
• Search information by phone number
• Verify identities through facial recognition
• Share personal experiences about interactions with other people
• Activate Guardian protection during encounters

The purpose is exclusively personal safety and prevention of risky situations.`,
  },
  {
    title: '3. Account and Device Binding',
    body: `IMPORTANT WARNING: Your account is PERMANENTLY linked to the device where you register.

• One phone number = One single account
• One device = One single account
• If you uninstall the application, you WILL LOSE access to your account
• If you uninstall the application, you WILL LOSE your active subscription
• It is NOT possible to transfer accounts between devices
• It is NOT possible to recover accounts after uninstalling

This measure exists to prevent fraud and protect the integrity of the platform.`,
  },
  {
    title: '4. Subscription, Payments and Refunds',
    body: `PREMIUM SUBSCRIPTION ($9.99 USD/month):
• Required to create reviews with facial verification
• Access to facial recognition searches
• Access to Guardian function

NO REFUND POLICY:
• Payments are NOT refundable under any circumstances
• If you uninstall the application, charges will continue until YOU cancel the subscription
• It is YOUR responsibility to cancel the subscription before uninstalling
• We can stop future charges upon request, but we DO NOT refund charges already made
• No refunds for partial periods, uninstallation, device change, or any other reason

To cancel your subscription: Profile > Cancel Subscription, OR write to us at bellacruzcompany@gmail.com`,
  },
  {
    title: '5. Review System',
    body: `REVIEW RULES:
• You can only leave ONE review per person (for life)
• You have 7 days to edit your review for free
• After 7 days, the review becomes PERMANENT
• After 7 days, you CANNOT edit the review
• After 7 days, you can only DELETE your own review by paying $20 USD
• You cannot create multiple reviews about the same person

CONTENT RESPONSIBILITY:
• YOU are the sole legal responsible for the content of your reviews
• Reviews must be based on real and truthful experiences
• False or defamatory reviews may result in legal action AGAINST YOU
• We reserve the right to remove content that violates these terms`,
  },
  {
    title: '6. User-Generated Content',
    body: `DISCLAIMER:

Reviews and comments on this platform are PERSONAL OPINIONS of individual users. Bella Cruz Company does NOT verify, endorse, or guarantee the accuracy of any review.

Bella Cruz Company acts solely as a technological intermediary and is NOT responsible for:
• False or inaccurate information posted by users
• Damages derived from decisions based on reviews
• Disputes between users or between users and reviewed persons
• Consequences of encounters organized using this application

Users who post reviews are the SOLE legal responsible for their content.`,
  },
  {
    title: '7. Rights of Reviewed Persons',
    body: `If you appear on our platform and are NOT a registered user, you have the right to:
• Request information about what data exists about you
• Dispute information you consider false or inaccurate
• Request deletion of data for valid reasons

To exercise these rights:
1. Send email to bellacruzcompany@gmail.com
2. Include proof of identity (selfie + ID document)
3. Specify your request

Review process:
• We will verify your identity (up to 30 days)
• The information of the review author will NEVER be revealed
• We will evaluate the request according to our policies
• We will notify you of the decision by email`,
  },
  {
    title: '8. Use of Facial Recognition',
    body: `By using the facial search function, you acknowledge and accept that:

• Photographs are processed through third-party services (Luxand Cloud API)
• Biometric data is stored to allow future searches
• By uploading a photo of another person, YOU declare that:
  - You have the legal right to share that image
  - The photographed person is over 18 years old
  - You assume ALL legal responsibility for the use of that image
  - The photo was obtained in a context without expectation of privacy

NOTICE: Residents of Illinois, Texas, and Washington have additional rights under state biometric data laws.`,
  },
  {
    title: '9. Guardian Function',
    body: `By activating Guardian, you authorize:

• Collection of your precise GPS location
• Storage of addresses and encounter data
• In case of emergency, automatic sending to your contact of:
  - Your identification selfie
  - Encounter address
  - Phone number of your date
  - Photo of your date (if provided)

IMPORTANT:
• Your emergency contact will receive this information via SMS/MMS
• Once the alert is activated, it CANNOT be revoked
• By providing your contact's number, you confirm having their authorization
• Guardian is an ASSISTANCE tool, it does NOT guarantee safety
• Guardian does NOT replace emergency services (911)`,
  },
  {
    title: '10. Third-Party Services',
    body: `Your information is shared with the following providers to operate the service:

• Luxand Cloud API: Facial recognition processing
• Stripe: Payment and subscription processing
• Twilio: SMS/MMS alert sending (Guardian)
• Firebase/Google: Infrastructure and storage

Each provider has its own privacy policy. By using our application, you also accept their terms of service.`,
  },
  {
    title: '11. Limitation of Liability',
    body: `TO THE MAXIMUM EXTENT PERMITTED BY LAW:

• Bella Cruz Company does NOT guarantee the safety of any encounter
• We do NOT verify the identity of users or reviewed persons
• We are NOT responsible for encounters that result in physical, emotional, or financial harm
• We do NOT guarantee continuous availability of the service
• We are NOT responsible for loss of data, account, or subscription

YOU ASSUME ALL RISK associated with encounters organized after using this application.

INDEMNIFICATION: You agree to indemnify and hold harmless Bella Cruz Company, its directors, employees, and affiliates, from any claim, demand, damage, or expense (including legal fees) resulting from your use of the platform or content you post.`,
  },
  {
    title: '12. Age Restrictions',
    body: `This application is EXCLUSIVELY for users over 18 years old.

By registering, you confirm that:
• You are 18 years old or older
• You will NOT upload photos of minors
• You will NOT create reviews about minors

Any content related to minors will be immediately removed and may result in:
• Permanent account suspension
• Report to corresponding authorities
• Legal action`,
  },
  {
    title: '13. Cancellation and Termination',
    body: `YOU CAN:
• Cancel your subscription at any time from your Profile
• Request cancellation by email to bellacruzcompany@gmail.com
• Cancellation stops FUTURE charges (does not refund past charges)

WE CAN:
• Suspend or terminate your account for terms violation
• Remove content that violates our policies
• Modify or discontinue the service with prior notice

WHEN UNINSTALLING THE APP:
• You lose access to your account PERMANENTLY
• You lose your active subscription
• Charges continue until YOU cancel
• There are NO refunds`,
  },
  {
    title: '14. Modifications',
    body: `We reserve the right to modify these terms at any time. Significant changes will be notified through the application. Continued use after modifications constitutes acceptance of the new terms.`,
  },
  {
    title: '15. Governing Law',
    body: `These terms are governed by the laws of the State of Florida, United States. Any dispute will be resolved in Florida courts. By using this application, you consent to the exclusive jurisdiction of said courts.`,
  },
  {
    title: '16. Contact',
    body: `For questions, cancellations, or requests:

Email: bellacruzcompany@gmail.com

For requests from reviewed persons:
Email: bellacruzcompany@gmail.com
Subject: 'Information Request - Reviewed Person'`,
  },
];

const FINAL_NOTE = `By pressing 'Accept and Pay' or by registering, you confirm that:

✓ You have read and understood these Terms and Conditions in their entirety
✓ You are over 18 years old
✓ You accept the permanent binding of your account to this device
✓ You understand that there are NO refunds under any circumstances
✓ You understand that uninstalling the app results in loss of account and subscription
✓ You assume all responsibility for the content you post`;

const LAST_UPDATED = '2025-12-17';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-grow py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Terms of Service</h1>
          <p className="text-gray-600 mb-10">Last updated: {LAST_UPDATED}</p>

          <div className="space-y-8">
            {TERMS_SECTIONS.map((section) => (
              <section key={section.title} className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">{section.title}</h2>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{section.body}</p>
              </section>
            ))}

            <section className="bg-purple-50 border border-purple-200 rounded-2xl p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Final Note</h2>
              <p className="text-gray-800 whitespace-pre-line leading-relaxed">{FINAL_NOTE}</p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
