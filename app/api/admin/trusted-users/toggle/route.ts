import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://api.snapfaceid.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { odId, phone, setTrusted } = body;

    if (!odId || !phone) {
      return NextResponse.json({
        success: false,
        error: 'User ID and phone required'
      }, { status: 400 });
    }

    // Call backend to toggle trusted status
    const response = await fetch(`${BACKEND_API_URL}/api/admin/trusted-users/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ odId, phone, setTrusted }),
    });

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error toggling trusted status:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error'
    }, { status: 500 });
  }
}
