# SnapfaceID Website

Official website for SnapfaceID - Personal Safety Dating App

## Features

- **Home Page**: Information about the app, features, and how it works
- **Contact Page**: User complaint and inquiry form
- **Subscription Cancellation**: Stripe-integrated subscription management portal
- **Admin Dashboard**: Real-time Guardian alert monitoring with Google Maps integration

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Firebase Realtime Database
- **Maps**: Google Maps API
- **Payments**: Stripe
- **Hosting**: Vercel (recommended)

## Project Structure

```
website/
├── app/
│   ├── page.tsx                    # Home page
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Global styles
│   ├── contact/
│   │   └── page.tsx                # Contact form
│   ├── cancel-subscription/
│   │   └── page.tsx                # Subscription cancellation
│   ├── admin/
│   │   ├── page.tsx                # Admin login
│   │   └── dashboard/
│   │       └── page.tsx            # Guardian monitoring dashboard
│   └── api/
│       ├── contact/
│       │   └── route.ts            # Contact form API
│       ├── subscription/
│       │   ├── verify/
│       │   │   └── route.ts        # Verify subscription
│       │   └── cancel/
│       │       └── route.ts        # Cancel subscription
│       └── admin/
│           └── login/
│               └── route.ts        # Admin authentication
├── lib/
│   └── firebase.ts                 # Firebase configuration
├── components/                     # Reusable components (future)
├── public/                         # Static assets
└── .env.example                    # Environment variables template
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd website
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your credentials:

#### Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Go to Project Settings > General
4. Scroll to "Your apps" and click the web icon (</>)
5. Copy the config values to your `.env.local`

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

#### Stripe Configuration
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to Developers > API keys
3. Copy your keys to `.env.local`

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

#### Google Maps API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "Maps JavaScript API"
4. Go to Credentials and create an API key
5. Restrict the key to your domain for security

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_api_key
```

#### Admin Access
Set a strong username and password for admin dashboard:

```env
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_secure_password
```

### 3. Firebase Realtime Database Setup

1. In Firebase Console, go to Realtime Database
2. Click "Create Database"
3. Choose location (preferably close to your users)
4. Start in "locked mode" or "test mode" (configure rules after)

#### Database Structure

The app expects this structure for Guardian alerts:

```json
{
  "guardian_alerts": {
    "alert_id_1": {
      "userId": "user123",
      "userName": "Jane Doe",
      "userPhone": "+1234567890",
      "userPhotoUrl": "https://...",
      "datePhotoUrl": "https://...",
      "dateName": "John Smith",
      "datePhone": "+0987654321",
      "dateLocation": "Restaurant XYZ, 123 Main St",
      "activatedAt": "2025-01-15T18:30:00Z",
      "lastCheckIn": "2025-01-15T19:15:00Z",
      "status": "active",
      "currentLocation": {
        "latitude": 40.7128,
        "longitude": -74.0060,
        "timestamp": "2025-01-15T19:15:00Z"
      },
      "locationHistory": [
        {
          "latitude": 40.7128,
          "longitude": -74.0060,
          "timestamp": "2025-01-15T18:30:00Z"
        }
      ]
    }
  }
}
```

#### Security Rules

Update your Firebase Realtime Database rules:

```json
{
  "rules": {
    "guardian_alerts": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$alertId": {
        ".validate": "newData.hasChildren(['userId', 'userName', 'status'])"
      }
    }
  }
}
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the website.

## Deployment to Vercel

### Option 1: Connect GitHub Repository (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Configure environment variables in Vercel dashboard
6. Click "Deploy"

### Option 2: Deploy via CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

### Configure Domain

#### Connect GoDaddy Domain (www.snapfaceid.com)

1. In Vercel dashboard, go to your project
2. Go to Settings > Domains
3. Add `snapfaceid.com` and `www.snapfaceid.com`
4. Vercel will provide DNS records

5. In GoDaddy:
   - Go to DNS Management for snapfaceid.com
   - Add/Update A record:
     - Type: A
     - Name: @
     - Value: 76.76.19.19 (Vercel IP)
     - TTL: 600
   - Add/Update CNAME record:
     - Type: CNAME
     - Name: www
     - Value: cname.vercel-dns.com
     - TTL: 600

6. Wait for DNS propagation (can take 24-48 hours)

### Environment Variables in Vercel

Add all variables from `.env.local` to Vercel:

1. Go to Project Settings > Environment Variables
2. Add each variable:
   - Firebase credentials
   - Stripe keys
   - Google Maps API key
   - Admin credentials
3. Deploy again to apply changes

## Integration with Mobile App

### Sending Guardian Alerts to Firebase

In your React Native app, when a user activates Guardian:

```javascript
import { getDatabase, ref, set, update } from 'firebase/database'

// When Guardian is activated
const activateGuardian = async (userId, dateInfo) => {
  const db = getDatabase()
  const alertId = `alert_${userId}_${Date.now()}`

  await set(ref(db, `guardian_alerts/${alertId}`), {
    userId: userId,
    userName: user.name,
    userPhone: user.phone,
    userPhotoUrl: user.photoUrl,
    datePhotoUrl: dateInfo.photoUrl,
    dateName: dateInfo.name,
    datePhone: dateInfo.phone,
    dateLocation: dateInfo.location,
    activatedAt: new Date().toISOString(),
    lastCheckIn: new Date().toISOString(),
    status: 'active',
    currentLocation: {
      latitude: currentLat,
      longitude: currentLng,
      timestamp: new Date().toISOString()
    },
    locationHistory: []
  })
}

// Update location every 10-30 seconds
const updateLocation = async (alertId, location) => {
  const db = getDatabase()
  const updates = {}

  updates[`guardian_alerts/${alertId}/currentLocation`] = {
    latitude: location.latitude,
    longitude: location.longitude,
    timestamp: new Date().toISOString()
  }

  updates[`guardian_alerts/${alertId}/lastCheckIn`] = new Date().toISOString()

  await update(ref(db), updates)
}

// Update status when user doesn't respond
const markNoResponse = async (alertId) => {
  const db = getDatabase()
  await update(ref(db, `guardian_alerts/${alertId}`), {
    status: 'no_response'
  })
}
```

## API Endpoints

### Contact Form
- **POST** `/api/contact`
- Body: `{ name, email, phone, subject, message }`

### Subscription Management
- **POST** `/api/subscription/verify`
  - Body: `{ email, phone }`
  - Returns subscription info

- **POST** `/api/subscription/cancel`
  - Body: `{ email, phone, reason, feedback }`
  - Cancels Stripe subscription

### Admin Authentication
- **POST** `/api/admin/login`
  - Body: `{ username, password }`
  - Returns auth token

## Security Considerations

### Production Checklist

- [ ] Change default admin credentials
- [ ] Implement proper JWT authentication
- [ ] Add rate limiting to API routes
- [ ] Enable CORS properly
- [ ] Restrict Firebase rules
- [ ] Add input validation
- [ ] Implement CSRF protection
- [ ] Enable 2FA for admin access
- [ ] Set up SSL/HTTPS (automatic with Vercel)
- [ ] Add logging and monitoring
- [ ] Restrict Google Maps API key to your domain
- [ ] Use Stripe webhook secrets for payment verification

## Monitoring and Analytics

### Recommended Services

- **Error Tracking**: [Sentry](https://sentry.io)
- **Analytics**: [Google Analytics](https://analytics.google.com) or [Plausible](https://plausible.io)
- **Uptime Monitoring**: [UptimeRobot](https://uptimerobot.com)
- **Performance**: Vercel Analytics (built-in)

## Future Enhancements

- [ ] Email notifications using SendGrid or Resend
- [ ] SMS alerts using Twilio
- [ ] Push notifications for admin when alerts trigger
- [ ] Export Guardian alert history
- [ ] Advanced filtering and search in dashboard
- [ ] User profile management
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Mobile responsive improvements
- [ ] Automated testing (Jest, Playwright)

## Support

For issues or questions:
- Email: support@snapfaceid.com
- Contact form: [www.snapfaceid.com/contact](https://www.snapfaceid.com/contact)

## License

Copyright © 2025 SnapfaceID. All rights reserved.
