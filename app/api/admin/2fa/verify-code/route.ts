import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://api-sports-bellacruz.ngrok.pro';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, code } = body;

    if (!username || !code) {
      return NextResponse.json(
        { error: 'Missing username or code' },
        { status: 400 }
      );
    }

    // Llamar al backend para verificar código 2FA
    const response = await fetch(`${BACKEND_API_URL}/admin/2fa/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, code }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Invalid code' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error verifying 2FA code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
