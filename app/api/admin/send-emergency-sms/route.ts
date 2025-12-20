import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://api-sports-bellacruz.ngrok.pro';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'snapface2024';

export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    // Simple token validation (in production, use proper JWT validation)
    const expectedToken = Buffer.from(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`).toString('base64');
    if (token !== expectedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { alertId, message, recipientPhone } = body;

    if (!alertId || !message || !recipientPhone) {
      return NextResponse.json(
        { error: 'Missing required fields: alertId, message, recipientPhone' },
        { status: 400 }
      );
    }

    // Call backend to send SMS via Twilio
    const response = await fetch(`${BACKEND_API_URL}/admin/send-emergency-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        alert_id: alertId,
        message: message,
        recipient_phone: recipientPhone,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Failed to send SMS' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error sending emergency SMS:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
