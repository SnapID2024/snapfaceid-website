import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://api-sports-bellacruz.ngrok.pro';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    console.log('[CHECK-SUBSCRIPTION] Checking phone:', phone);

    // Call the backend API to check user subscription
    const response = await fetch(`${BACKEND_API_URL}/api/check-user-by-phone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.log('[CHECK-SUBSCRIPTION] Backend response:', response.status, data);
      return NextResponse.json(
        { error: data.detail || data.error || 'User not found' },
        { status: response.status }
      );
    }

    console.log('[CHECK-SUBSCRIPTION] Found user:', data.user_id);
    console.log('[CHECK-SUBSCRIPTION] Subscription status:', data.subscription_status);

    return NextResponse.json({
      userId: data.user_id,
      subscriptionStatus: data.subscription_status || 'free',
      phone: data.phone,
    });

  } catch (error) {
    console.error('[CHECK-SUBSCRIPTION] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}
