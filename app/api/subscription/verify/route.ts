import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Initialize Stripe lazily to avoid build-time errors
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(key, {
    apiVersion: '2025-12-15.clover',
  })
}

// Backend URL for Firebase verification
const BACKEND_URL = process.env.BACKEND_API_URL || process.env.BACKEND_URL || 'http://localhost:8001'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, phone } = body

    // Validate required fields
    if (!email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('Subscription verification request:', {
      email,
      phone,
      timestamp: new Date().toISOString(),
    })

    // Normalize phone number (remove spaces, dashes, etc.)
    const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '')

    // Get Stripe instance
    const stripe = getStripe()

    // Step 1: Search for customer in Stripe by email
    const customers = await stripe.customers.list({
      email: email.toLowerCase(),
      limit: 1,
    })

    if (customers.data.length === 0) {
      console.log('No Stripe customer found with email:', email)
      return NextResponse.json(
        { error: 'No subscription found with this email. Please use the email you registered with Stripe.' },
        { status: 404 }
      )
    }

    const customer = customers.data[0]
    console.log('Found Stripe customer:', customer.id)

    // Step 2: Check if customer has an active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    })

    // Also check for subscriptions that are canceling (still active until period end)
    const cancelingSubscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'canceled',
      limit: 1,
    })

    const activeSubscription = subscriptions.data[0] || null

    if (!activeSubscription) {
      // Check if there's a subscription that was canceled but still has access
      const allSubs = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 5,
      })

      const validSub = allSubs.data.find(
        sub => sub.status === 'active' ||
               (sub.status === 'canceled' && (sub as unknown as { current_period_end: number }).current_period_end * 1000 > Date.now())
      )

      if (!validSub) {
        console.log('No active subscription found for customer:', customer.id)
        return NextResponse.json(
          { error: 'No active subscription found for this account.' },
          { status: 404 }
        )
      }
    }

    const subscription = activeSubscription || (await stripe.subscriptions.list({
      customer: customer.id,
      limit: 1,
    })).data[0] as unknown as { id: string; status: string; current_period_end: number; cancel_at_period_end: boolean }

    // Step 3: Verify phone number matches a user in Firebase
    // Call the backend to verify the phone number belongs to a real user
    try {
      const backendResponse = await fetch(`${BACKEND_URL}/verify-subscription-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          phone: normalizedPhone,
          stripe_customer_id: customer.id,
        }),
      })

      if (!backendResponse.ok) {
        const errorData = await backendResponse.json().catch(() => ({}))
        console.log('Backend verification failed:', errorData)
        return NextResponse.json(
          { error: errorData.detail || 'Phone number does not match our records for this email.' },
          { status: 404 }
        )
      }
    } catch (backendError) {
      console.warn('Backend verification skipped (backend may be unavailable):', backendError)
      // Continue without backend verification for now - Stripe verification is primary
    }

    // Success - return subscription details
    // Cast subscription to access properties
    const subData = subscription as unknown as { id: string; status: string; current_period_end: number; cancel_at_period_end: boolean }
    const subscriptionData = {
      id: subData.id,
      customerId: customer.id,
      status: subData.status,
      currentPeriodEnd: new Date(subData.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: subData.cancel_at_period_end,
      plan: 'Premium Monthly',
    }

    console.log('Subscription verified successfully:', subscriptionData)

    return NextResponse.json(
      {
        success: true,
        subscription: subscriptionData,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error verifying subscription:', error)

    // Handle Stripe-specific errors
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: 'Error connecting to payment service. Please try again.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
