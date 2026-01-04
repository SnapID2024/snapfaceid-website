import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const TERMS_SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: `These Terms of Service are provided by BELLACRUZ ONLINE LLC.

By registering and/or subscribing to our service, you accept the following terms and conditions in their entirety. Using this application implies your binding consent to these policies. If you do not agree with any term, you must not use this application.`,
  },
  {
    title: '2. Service Description',
    body: `This application is a PERSONAL SAFETY platform for women in dating situations. It allows users to:
• Verify information by phone number
• Verify identities through biometric safety check
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
• Required to create reports with identity verification
• Access to biometric identity verification
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
    title: '5. Report System',
    body: `REPORT RULES:
• You can only leave ONE report per person (for life)
• You have 7 days to edit your report for free
• After 7 days, the report becomes PERMANENT
• After 7 days, you CANNOT edit the report
• After 7 days, you can only DELETE your own report by paying $20 USD
• You cannot create multiple reports about the same person

CONTENT RESPONSIBILITY:
• YOU are the sole legal responsible for the content of your reports
• Reports must be based on real and truthful experiences
• False or defamatory reports may result in legal action AGAINST YOU
• We reserve the right to remove content that violates these terms`,
  },
  {
    title: '6. User-Generated Content',
    body: `DISCLAIMER:

Reports and comments on this platform are PERSONAL OPINIONS of individual users. Bellacruz Online LLC ("SnapfaceID") does NOT verify, endorse, or guarantee the accuracy of any report.

Bellacruz Online LLC ("SnapfaceID") acts solely as a technological intermediary and is NOT responsible for:
• False or inaccurate information posted by users
• Damages derived from decisions based on reports
• Disputes between users or between users and reported persons
• Consequences of encounters organized using this application

Users who post reports are the SOLE legal responsible for their content.`,
  },
  {
    title: '7. Rights of Reported Persons',
    body: `If you appear on our platform and are NOT a registered user, you have the right to:
• Request information about what data exists about you
• Dispute information you consider false or inaccurate
• Request deletion of data for valid reasons

To exercise these rights:
1. Send email to bellacruzcompany@gmail.com
2. Include proof of identity (selfie + ID document)
3. Specify your request

Verification process:
• We will verify your identity (up to 30 days)
• The information of the report author will NEVER be revealed
• We will evaluate the request according to our policies
• We will notify you of the decision by email`,
  },
  {
    title: '8. Use of Biometric Safety Check',
    body: `By using the biometric verification function, you acknowledge and accept that:

• Photographs are processed through third-party services (Luxand Cloud API)
• Biometric data is stored to allow future verifications
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
    title: '9A. AUTHORIZATION TO CONTACT EMERGENCY SERVICES (911)',
    body: `IMPORTANT - PLEASE READ CAREFULLY:

BY ACTIVATING THE GUARDIAN FEATURE AND SUBSCRIBING TO OUR PREMIUM SERVICE, YOU EXPRESSLY AND IRREVOCABLY AUTHORIZE BELLACRUZ ONLINE LLC ("SNAPFACEID") TO:

1. CONTACT EMERGENCY SERVICES ON YOUR BEHALF
• Contact 911 or other emergency services in your jurisdiction if we reasonably believe you may be in imminent danger
• This includes situations where you fail to respond to safety check-in notifications within the designated time period
• Provide emergency responders with your personal information, location data, photographs, and any other relevant information collected through the Guardian feature

2. SHARE YOUR INFORMATION WITH AUTHORITIES
• Transmit your real-time or last known GPS coordinates to emergency services
• Share photographs of you and/or your date with law enforcement
• Provide contact information of your date to authorities
• Disclose any other information we deem necessary to assist in locating you or ensuring your safety

3. ACT IN GOOD FAITH
• We will exercise reasonable judgment in determining when to contact emergency services
• The decision to contact 911 is made automatically when safety check-ins are not completed AND/OR manually by our monitoring team if available

LIMITATION OF LIABILITY FOR EMERGENCY SERVICES CONTACT:

YOU EXPRESSLY ACKNOWLEDGE AND AGREE THAT:

• Bellacruz Online LLC ("SnapfaceID") SHALL NOT BE LIABLE for any consequences, damages, costs, expenses, legal fees, fines, or penalties arising from our contact with emergency services on your behalf, including but not limited to:
  - False alarms or unnecessary emergency responses
  - Delayed or failed communication with emergency services
  - Inaccurate location data transmitted to authorities
  - Actions taken by emergency responders
  - Any charges or fines imposed by emergency services for false alarms
  - Embarrassment, reputational harm, or inconvenience

• YOU ASSUME FULL RESPONSIBILITY for:
  - The accuracy of all information you provide (location, contact details, photographs)
  - Ensuring your emergency contact information is current and valid
  - Responding to safety check-in notifications in a timely manner
  - Any legal consequences resulting from false or misleading information
  - Any costs associated with emergency response to false alarms

• IN NO EVENT shall Bellacruz Online LLC ("SnapfaceID") be liable for any failure to contact emergency services, delays in contacting emergency services, or any harm that occurs regardless of whether emergency services were contacted

USER ACKNOWLEDGMENTS:

By using the Guardian feature, you acknowledge and agree that:

✓ You grant express consent and authorization for us to contact 911 on your behalf
✓ You understand that emergency services may be dispatched to your location
✓ You accept full financial responsibility for any false alarm fees or penalties
✓ You release and hold harmless Bellacruz Online LLC ("SnapfaceID") from any liability related to emergency services contact
✓ You understand this authorization cannot be revoked once Guardian is activated for a session
✓ You confirm that all information provided is accurate and truthful
✓ You understand that communication failures may occur and we are not liable for such failures

INDEMNIFICATION:

You agree to INDEMNIFY, DEFEND, and HOLD HARMLESS Bellacruz Online LLC ("SnapfaceID"), its officers, directors, employees, agents, and affiliates from and against any and all claims, damages, losses, costs, and expenses (including reasonable attorney fees) arising from or related to:
• Our contact with emergency services on your behalf
• Any false alarm or unnecessary emergency response
• Inaccurate information you provided
• Your use or misuse of the Guardian feature
• Any violation of these terms`,
  },
  {
    title: '9B. AUTHORIZATION TO CONTACT YOUR DATE',
    body: `IMPORTANT - PLEASE READ CAREFULLY:

BY PROVIDING THE PHONE NUMBER OF THE PERSON YOU ARE MEETING ("YOUR DATE") IN THE GUARDIAN FEATURE, YOU EXPRESSLY AND IRREVOCABLY AUTHORIZE BELLACRUZ ONLINE LLC ("SNAPFACEID") TO:

1. CONTACT YOUR DATE DIRECTLY
• Send SMS/MMS messages to your date's phone number in emergency situations
• Call your date's phone number to verify your safety status
• Share limited information about the emergency situation with your date

2. CIRCUMSTANCES FOR CONTACT
We may contact your date when:
• You trigger an emergency alert manually
• You fail to complete a safety check-in within the designated time
• Law enforcement or emergency services request we contact your date
• We reasonably believe contacting your date may help ensure your safety or locate you

3. INFORMATION SHARED WITH YOUR DATE
When contacting your date, we may share:
• Notification that an emergency has been triggered
• Request for confirmation of your current safety status
• Basic information about the Guardian safety feature
• Contact information for emergency services if appropriate

4. PURPOSE AND LIMITATIONS
• Contact with your date is EXCLUSIVELY for safety verification and emergency response
• We will NOT share your personal details, photos, or location with your date
• We will NOT contact your date for any marketing, promotional, or non-safety purposes

LIABILITY DISCLAIMER:

YOU EXPRESSLY ACKNOWLEDGE AND AGREE THAT:
• Bellacruz Online LLC ("SnapfaceID") SHALL NOT BE LIABLE for any consequences arising from our contact with your date
• This includes any impact on your relationship, reputation, or personal situation
• You assume full responsibility for providing accurate contact information
• You confirm that contacting this person in an emergency is appropriate and desired

By using Guardian and providing your date's phone number, you confirm that:
✓ You consent to us contacting your date in emergency situations
✓ You understand your date may be contacted if you miss check-ins or trigger alerts
✓ You accept responsibility for any consequences of this contact
✓ You confirm the phone number provided belongs to the actual person you are meeting`,
  },
  {
    title: '10. Third-Party Services',
    body: `Your information is shared with the following providers to operate the service:

• Luxand Cloud API: Biometric verification processing
• Stripe: Payment and subscription processing
• Twilio: SMS/MMS alert sending (Guardian)
• Firebase/Google: Infrastructure and storage

Each provider has its own privacy policy. By using our application, you also accept their terms of service.`,
  },
  {
    title: '11. Limitation of Liability',
    body: `TO THE MAXIMUM EXTENT PERMITTED BY LAW:

• Bellacruz Online LLC ("SnapfaceID") does NOT guarantee the safety of any encounter
• We do NOT verify the identity of users or reported persons
• We are NOT responsible for encounters that result in physical, emotional, or financial harm
• We do NOT guarantee continuous availability of the service
• We are NOT responsible for loss of data, account, or subscription

YOU ASSUME ALL RISK associated with encounters organized after using this application.

INDEMNIFICATION: You agree to indemnify and hold harmless Bellacruz Online LLC ("SnapfaceID"), its directors, employees, and affiliates, from any claim, demand, damage, or expense (including legal fees) resulting from your use of the platform or content you post.`,
  },
  {
    title: '12. Age Restrictions',
    body: `This application is EXCLUSIVELY for users over 18 years old.

By registering, you confirm that:
• You are 18 years old or older
• You will NOT upload photos of minors
• You will NOT create reports about minors

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
    title: '16. Tesla Model 3 Giveaway - Official Rules',
    body: `OFFICIAL SWEEPSTAKES RULES

SPONSOR: Bellacruz Online LLC ("SnapfaceID")

ELIGIBILITY:
• Open to legal residents of the United States who are 18 years or older
• Must be a Premium subscriber at the time of the drawing
• Employees of Bellacruz Online LLC and their immediate family members are not eligible
• Void where prohibited by law

NO PURCHASE NECESSARY:
• Alternative method of entry available by sending a self-addressed stamped envelope to: Bellacruz Online LLC, Tesla Giveaway Entry, [Company Address]. One entry per envelope.
• Premium subscription provides automatic entry but is not required to participate

PRIZES:
• Three (3) Tesla Model 3 vehicles (Standard Range Plus or equivalent)
• Approximate Retail Value (ARV): $40,000 USD each
• Total ARV of all prizes: $120,000 USD

DRAWING:
• Drawing will occur when SnapfaceID reaches 30,000 registered Premium users
• If this threshold is not reached within 24 months from January 1, 2025, the drawing will occur on January 1, 2027
• Winners will be selected at random from all eligible entries
• Odds of winning depend on number of eligible entries received

WINNER NOTIFICATION:
• Winners will be notified via email and phone within 7 days of drawing
• Winners must respond within 30 days to claim prize
• Unclaimed prizes will be forfeited and re-drawn

TAXES:
• Winners are solely responsible for all federal, state, and local taxes
• Winners will receive IRS Form 1099 for prize value
• Prize may be subject to income tax withholding

GENERAL CONDITIONS:
• By participating, entrants agree to be bound by these Official Rules
• Sponsor reserves the right to modify, suspend, or terminate the sweepstakes
• Sponsor is not responsible for technical failures affecting entries
• By accepting prize, winner grants Sponsor permission to use winner's name and likeness for promotional purposes without additional compensation

PRIVACY:
• Personal information collected for this sweepstakes will be used in accordance with our Privacy Policy

For questions about the sweepstakes: bellacruzcompany@gmail.com`,
  },
  {
    title: '17. Contact',
    body: `For questions, cancellations, or requests:

BELLACRUZ ONLINE LLC
Email: bellacruzcompany@gmail.com

For requests from reported persons:
Email: bellacruzcompany@gmail.com
Subject: 'Information Request - Reported Person'`,
  },
];

const FINAL_NOTE = `By pressing 'Accept and Pay' or by registering, you confirm that:

✓ You have read and understood these Terms and Conditions in their entirety
✓ You are over 18 years old
✓ You accept the permanent binding of your account to this device
✓ You understand that there are NO refunds under any circumstances
✓ You understand that uninstalling the app results in loss of account and subscription
✓ You assume all responsibility for the content you post`;

const LAST_UPDATED = '2026-01-04';

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
