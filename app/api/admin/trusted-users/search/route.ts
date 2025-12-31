import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://api.snapfaceid.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json({
        found: false,
        error: 'Phone number required'
      }, { status: 400 });
    }

    // Call backend to search for user
    const response = await fetch(`${BACKEND_API_URL}/api/admin/trusted-users/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error searching user:', error);
    return NextResponse.json({
      found: false,
      error: 'Server error'
    }, { status: 500 });
  }
}
