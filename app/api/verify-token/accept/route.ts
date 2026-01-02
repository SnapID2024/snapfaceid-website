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

    // Obtener IP del cliente para logging
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';

    // Aceptar acuerdo y obtener perfil del backend
    const response = await fetch(`${BACKEND_API_URL}/api/verify-access-token/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        client_ip: ip,
        user_agent: request.headers.get('user-agent') || 'unknown',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Error loading profile' },
        { status: response.status }
      );
    }

    // Retornar perfil completo
    return NextResponse.json({
      success: true,
      profile: data.profile,
      expiresInSeconds: data.expires_in_seconds,
    });

  } catch (error) {
    console.error('Error accepting agreement:', error);
    return NextResponse.json(
      { error: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}
