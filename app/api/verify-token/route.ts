import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://api.snapfaceid.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Validar token con el backend
    const response = await fetch(`${BACKEND_API_URL}/api/verify-access-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Invalid or expired token' },
        { status: response.status }
      );
    }

    // Retornar info del token (sin datos del perfil aún)
    return NextResponse.json({
      valid: true,
      tokenInfo: {
        user_id: data.user_id,
        username: data.username,
        user_phone: data.user_phone || '',
        person_id: data.person_id,
        expires_at: data.expires_at,
      },
      expiresInSeconds: data.expires_in_seconds,
    });

  } catch (error) {
    console.error('Error validating token:', error);
    return NextResponse.json(
      { error: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}
