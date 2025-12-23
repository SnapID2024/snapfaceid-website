import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Precio del producto Single_verification: $1.50
const VERIFICATION_PRICE = 150; // en centavos

export async function POST(request: NextRequest) {
  console.log('[STRIPE-CHECKOUT] Starting checkout session creation...');

  try {
    const body = await request.json();
    const { personId, phone } = body;

    console.log('[STRIPE-CHECKOUT] Request body:', JSON.stringify(body));

    if (!personId) {
      console.log('[STRIPE-CHECKOUT] ERROR: Missing personId');
      return NextResponse.json({ error: 'Person ID is required' }, { status: 400 });
    }

    // Verificar que STRIPE_SECRET_KEY existe
    if (!process.env.STRIPE_SECRET_KEY) {
      console.log('[STRIPE-CHECKOUT] ERROR: STRIPE_SECRET_KEY not configured');
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    console.log('[STRIPE-CHECKOUT] Initializing Stripe with key:', process.env.STRIPE_SECRET_KEY?.substring(0, 10) + '...');

    // Inicializar Stripe dentro de la función
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // NEXT_PUBLIC_ vars may not work server-side on Vercel, use hardcoded URL
    const baseUrl = 'https://www.snapfaceid.com';
    const successUrl = `${baseUrl}/?verification_success=true&session_id={CHECKOUT_SESSION_ID}&person_id=${personId}`;
    const cancelUrl = `${baseUrl}/?verification_cancelled=true`;

    console.log('[STRIPE-CHECKOUT] Success URL:', successUrl);
    console.log('[STRIPE-CHECKOUT] Cancel URL:', cancelUrl);

    // Crear sesión de checkout de Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Single Verification',
              description: `View reviews for phone number verification`,
            },
            unit_amount: VERIFICATION_PRICE,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        person_id: personId,
        phone: phone || '',
        type: 'single_verification',
      },
    });

    console.log('[STRIPE-CHECKOUT] Session created successfully!');
    console.log('[STRIPE-CHECKOUT] Session ID:', session.id);
    console.log('[STRIPE-CHECKOUT] Checkout URL:', session.url);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('[STRIPE-CHECKOUT] ERROR:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to create checkout session', details: errorMessage }, { status: 500 });
  }
}
