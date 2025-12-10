# SnapfaceID Website - Quick Deployment Guide

## Pre-Deployment Checklist

### 1. Get Required API Keys

Before deploying, you need to obtain the following API keys:

#### Firebase (Required)
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Create a new project: "SnapfaceID"
3. Enable **Realtime Database**
4. Go to Project Settings > General
5. Add a Web App and copy the config values
6. Enable **Authentication** (Email/Password)

#### Stripe (Required for subscription features)
1. Visit [Stripe Dashboard](https://dashboard.stripe.com/)
2. Go to Developers > API Keys
3. Copy Test keys (use Live keys for production)
4. Set up products and pricing plans

#### Google Maps (Required for Admin Dashboard)
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Maps JavaScript API"
4. Create an API Key
5. Restrict the key to your domain: `snapfaceid.com` and `www.snapfaceid.com`

### 2. Prepare Environment Variables

Create a `.env.local` file (copy from `.env.example`):

```bash
cp .env.example .env.local
```

Fill in all the values you obtained above.

### 3. Test Locally

```bash
npm install
npm run dev
```

Visit http://localhost:3000 and verify:
- [ ] Home page loads correctly
- [ ] Contact form works
- [ ] Subscription cancellation flow works
- [ ] Admin login works (use credentials from .env.local)
- [ ] Admin dashboard displays (even if no data yet)

## Deployment to Vercel

### Step 1: Push to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial website setup"

# Create a new repository on GitHub: snapfaceid-website
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/snapfaceid-website.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "Add New Project"
4. Import your `snapfaceid-website` repository
5. Configure:
   - Framework Preset: **Next.js**
   - Root Directory: `./` (or specify if nested)
   - Build Command: `npm run build`
   - Output Directory: `.next`

6. **Add Environment Variables**:
   - Click "Environment Variables"
   - Add ALL variables from your `.env.local`:
     - NEXT_PUBLIC_FIREBASE_API_KEY
     - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
     - NEXT_PUBLIC_FIREBASE_DATABASE_URL
     - NEXT_PUBLIC_FIREBASE_PROJECT_ID
     - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
     - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
     - NEXT_PUBLIC_FIREBASE_APP_ID
     - STRIPE_SECRET_KEY
     - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
     - ADMIN_USERNAME
     - ADMIN_PASSWORD
     - NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

7. Click "Deploy"
8. Wait 2-3 minutes for build to complete

### Step 3: Configure Custom Domain

1. In Vercel dashboard, go to your project
2. Go to Settings > Domains
3. Click "Add Domain"
4. Enter: `snapfaceid.com`
5. Click "Add"
6. Enter: `www.snapfaceid.com`
7. Click "Add"

Vercel will show you DNS records to configure.

### Step 4: Update DNS in GoDaddy

1. Log in to [GoDaddy](https://godaddy.com)
2. Go to "My Products" > Domain Management
3. Click "DNS" next to `snapfaceid.com`

4. **Add/Update A Record** (for root domain):
   - Type: `A`
   - Name: `@`
   - Value: `76.76.19.19` (Vercel IP)
   - TTL: `600` (or 1 Hour)

5. **Add/Update CNAME Record** (for www):
   - Type: `CNAME`
   - Name: `www`
   - Value: `cname.vercel-dns.com`
   - TTL: `600`

6. Click "Save"

### Step 5: Wait for DNS Propagation

- DNS changes can take 1-48 hours to propagate
- Check status: [whatsmydns.net](https://www.whatsmydns.net/)
- Vercel will automatically issue SSL certificate once DNS is configured

## Post-Deployment Tasks

### 1. Verify All Pages Work

Visit your live site and test:
- ✓ https://www.snapfaceid.com
- ✓ https://www.snapfaceid.com/contact
- ✓ https://www.snapfaceid.com/cancel-subscription
- ✓ https://www.snapfaceid.com/admin
- ✓ https://www.snapfaceid.com/admin/dashboard

### 2. Configure Firebase Security Rules

Update Realtime Database rules to restrict access:

```json
{
  "rules": {
    "guardian_alerts": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$alertId": {
        ".validate": "newData.hasChildren(['userId', 'userName', 'status', 'currentLocation'])",
        "currentLocation": {
          ".validate": "newData.hasChildren(['latitude', 'longitude', 'timestamp'])"
        }
      }
    }
  }
}
```

### 3. Set Up Stripe Webhooks

1. In Stripe Dashboard, go to Developers > Webhooks
2. Click "Add endpoint"
3. URL: `https://www.snapfaceid.com/api/webhooks/stripe`
4. Events to listen:
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy webhook secret and add to Vercel env vars as `STRIPE_WEBHOOK_SECRET`

### 4. Test Admin Dashboard

1. Go to https://www.snapfaceid.com/admin
2. Login with your ADMIN_USERNAME and ADMIN_PASSWORD
3. Verify dashboard loads
4. Test with sample Guardian alert data in Firebase

### 5. Connect Mobile App to Website

Update your React Native app to send Guardian alerts to Firebase:

```javascript
// In your mobile app
import { getDatabase, ref, set } from 'firebase/database'

const activateGuardian = async (userInfo, dateInfo) => {
  const db = getDatabase()
  const alertId = `alert_${userInfo.id}_${Date.now()}`

  await set(ref(db, `guardian_alerts/${alertId}`), {
    userId: userInfo.id,
    userName: userInfo.name,
    userPhone: userInfo.phone,
    userPhotoUrl: userInfo.photoUrl,
    datePhotoUrl: dateInfo.photoUrl,
    dateName: dateInfo.name,
    datePhone: dateInfo.phone,
    dateLocation: dateInfo.location,
    activatedAt: new Date().toISOString(),
    lastCheckIn: new Date().toISOString(),
    status: 'active',
    currentLocation: {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      timestamp: new Date().toISOString()
    },
    locationHistory: []
  })
}
```

## Monitoring and Maintenance

### Set Up Monitoring

1. **Vercel Analytics** (Built-in):
   - Automatically enabled
   - View in Vercel dashboard > Analytics

2. **Error Tracking** (Recommended: Sentry):
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```

3. **Uptime Monitoring** (Recommended: UptimeRobot):
   - Sign up at [uptimerobot.com](https://uptimerobot.com)
   - Monitor: https://www.snapfaceid.com
   - Alert via email/SMS if site goes down

### Regular Maintenance

- Check admin dashboard daily for Guardian alerts
- Monitor Firebase usage (Spark plan has limits)
- Review Stripe transactions weekly
- Update dependencies monthly: `npm update`
- Backup Firebase data regularly

## Security Best Practices

### Immediate Actions

1. **Change Default Credentials**:
   - Update ADMIN_USERNAME and ADMIN_PASSWORD in Vercel
   - Use strong, unique passwords

2. **Restrict API Keys**:
   - Google Maps: Restrict to your domains only
   - Firebase: Enable App Check
   - Stripe: Use webhook secrets

3. **Enable Rate Limiting**:
   - Consider adding Vercel WAF (paid plan)
   - Or use Cloudflare in front of Vercel

### Recommended Upgrades

1. Implement proper JWT authentication for admin
2. Add 2FA for admin dashboard
3. Set up automated backups
4. Enable audit logging for admin actions
5. Implement CAPTCHA on contact form

## Troubleshooting

### Build Fails on Vercel
- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Ensure Node version compatibility (v18+ recommended)

### Admin Dashboard Not Loading
- Check browser console for errors
- Verify Google Maps API key is valid and enabled
- Check Firebase configuration

### DNS Not Resolving
- Wait 24-48 hours for propagation
- Use [dig](https://toolbox.googleapps.com/apps/dig/) to check records
- Verify A record points to `76.76.19.19`

### Firebase Permission Denied
- Check security rules
- Verify user is authenticated
- Check Firebase console logs

## Support

For deployment issues:
- Vercel: [vercel.com/support](https://vercel.com/support)
- Firebase: [firebase.google.com/support](https://firebase.google.com/support)
- GitHub Issues: [Your repository]/issues

## Costs

Estimated monthly costs:
- Vercel: **$0** (Hobby plan - 100GB bandwidth)
- Firebase: **$0-25** (Spark/Blaze plan - based on usage)
- Google Maps: **$0-200** (free $200 monthly credit)
- Stripe: **2.9% + $0.30** per transaction
- Domain: **$12/year** (GoDaddy)

Total: **~$0-25/month** for small to medium traffic

## Scaling

When you outgrow free tiers:
- Vercel Pro: $20/month (1TB bandwidth)
- Firebase Blaze: Pay-as-you-go
- Consider CDN for images (Cloudinary, etc.)
- Database optimization and indexing
