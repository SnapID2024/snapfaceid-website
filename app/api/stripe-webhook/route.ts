import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://api-sports-bellacruz.ngrok.pro';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('[STRIPE-WEBHOOK] Missing signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('[STRIPE-WEBHOOK] Stripe not configured');
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('[STRIPE-WEBHOOK] Signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('[STRIPE-WEBHOOK] Received event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('[STRIPE-WEBHOOK] Checkout session completed:', session.id);

        const userId = session.metadata?.userId;
        const phone = session.metadata?.phone;
        const accessCode = session.metadata?.accessCode;

        if (userId && accessCode) {
          console.log('[STRIPE-WEBHOOK] Activating subscription for user:', userId);

          // Call backend to activate subscription
          try {
            const response = await fetch(`${BACKEND_API_URL}/api/activate-web-subscription`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: userId,
                phone: phone,
                access_code: accessCode,
                subscription_id: session.subscription as string,
                session_id: session.id,
              }),
            });

            if (response.ok) {
              console.log('[STRIPE-WEBHOOK] Subscription activated successfully');
            } else {
              const error = await response.json();
              console.error('[STRIPE-WEBHOOK] Failed to activate subscription:', error);
            }
          } catch (activationError) {
            console.error('[STRIPE-WEBHOOK] Error calling backend:', activationError);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('[STRIPE-WEBHOOK] Subscription cancelled:', subscription.id);

        const userId = subscription.metadata?.userId;
        if (userId) {
          // Call backend to cancel subscription
          try {
            await fetch(`${BACKEND_API_URL}/api/cancel-web-subscription`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: userId,
                subscription_id: subscription.id,
              }),
            });
            console.log('[STRIPE-WEBHOOK] User subscription cancelled:', userId);
          } catch (cancelError) {
            console.error('[STRIPE-WEBHOOK] Error cancelling subscription:', cancelError);
          }
        }
        break;
      }

      default:
        console.log('[STRIPE-WEBHOOK] Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('[STRIPE-WEBHOOK] Error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
