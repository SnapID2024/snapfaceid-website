import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Premium subscription product ID - configure via environment variable
// Falls back to the default product ID if not set (SnapFaceID TEST account)
const PREMIUM_PRODUCT_ID = process.env.STRIPE_PREMIUM_PRODUCT_ID || 'prod_TuIHuHPVsrs5h6';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, phone } = body;

    console.log('[PREMIUM-CHECKOUT] Starting checkout for userId:', userId);

    if (!userId || !phone) {
      return NextResponse.json({ error: 'User ID and phone are required' }, { status: 400 });
    }

    // Verify Stripe key exists
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('[PREMIUM-CHECKOUT] STRIPE_SECRET_KEY not configured');
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Get the active price for the premium product
    const prices = await stripe.prices.list({
      product: PREMIUM_PRODUCT_ID,
      active: true,
      limit: 1,
    });

    if (prices.data.length === 0) {
      console.error('[PREMIUM-CHECKOUT] No active price found for product:', PREMIUM_PRODUCT_ID);
      return NextResponse.json({ error: 'Subscription product not found' }, { status: 500 });
    }

    const priceId = prices.data[0].id;
    console.log('[PREMIUM-CHECKOUT] Using price ID:', priceId);

    // Generate a unique access code (6 characters)
    const timestamp = Date.now().toString(36).toUpperCase().slice(-3);
    const random = Math.random().toString(36).toUpperCase().slice(2, 5);
    const accessCode = `${timestamp}${random}`;

    console.log('[PREMIUM-CHECKOUT] Generated access code:', accessCode);

    // Base URL for redirects - ensure we always have a valid URL
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    // Validate and fallback if needed
    if (!baseUrl || !baseUrl.startsWith('https://')) {
      console.log('[PREMIUM-CHECKOUT] NEXT_PUBLIC_BASE_URL invalid or missing, using default');
      baseUrl = 'https://www.snapfaceid.com';
    }

    console.log('[PREMIUM-CHECKOUT] Using base URL:', baseUrl);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/get-premium?payment_success=true&session_id={CHECKOUT_SESSION_ID}&code=${accessCode}`,
      cancel_url: `${baseUrl}/get-premium?payment_cancelled=true`,
      metadata: {
        userId: userId,
        phone: phone,
        accessCode: accessCode,
        source: 'website_premium',
      },
      subscription_data: {
        metadata: {
          userId: userId,
          phone: phone,
          accessCode: accessCode,
          source: 'website_premium',
        },
      },
    });

    console.log('[PREMIUM-CHECKOUT] Session created:', session.id);
    console.log('[PREMIUM-CHECKOUT] Checkout URL:', session.url);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('[PREMIUM-CHECKOUT] Error:', error);

    // Provide more detailed error information for debugging
    let errorMessage = 'Unknown error';
    let errorType = 'unknown';

    if (error instanceof Stripe.errors.StripeError) {
      errorMessage = error.message;
      errorType = error.type;
      console.error('[PREMIUM-CHECKOUT] Stripe error type:', error.type);
      console.error('[PREMIUM-CHECKOUT] Stripe error code:', error.code);

      // Check for common issues
      if (error.code === 'resource_missing') {
        errorMessage = `Product or price not found. Make sure product ${PREMIUM_PRODUCT_ID} exists in your Stripe account and has an active price.`;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    console.error('[PREMIUM-CHECKOUT] Product ID used:', PREMIUM_PRODUCT_ID);
    console.error('[PREMIUM-CHECKOUT] Stripe key prefix:', process.env.STRIPE_SECRET_KEY?.substring(0, 12) + '...');

    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        details: errorMessage,
        type: errorType,
        productId: PREMIUM_PRODUCT_ID
      },
      { status: 500 }
    );
  }
}
