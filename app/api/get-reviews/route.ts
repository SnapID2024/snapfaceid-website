import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://api-sports-bellacruz.ngrok.pro';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, personId } = await request.json();

    if (!sessionId || !personId) {
      return NextResponse.json({ error: 'Session ID and Person ID are required' }, { status: 400 });
    }

    // Inicializar Stripe dentro de la función
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    // Verificar que el pago fue exitoso en Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 402 });
    }

    // Verificar que el person_id coincide
    if (session.metadata?.person_id !== personId) {
      return NextResponse.json({ error: 'Invalid verification' }, { status: 403 });
    }

    // Obtener las reviews del backend
    const response = await fetch(`${BACKEND_API_URL}/api/public-get-reviews?person_id=${encodeURIComponent(personId)}`);

    if (!response.ok) {
      throw new Error('Failed to fetch reviews from backend');
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      reviews: data.reviews || [],
      personInfo: data.person_info || {},
    });

  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json({ error: 'Failed to retrieve reviews' }, { status: 500 });
  }
}
