import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_API_URL || 'https://api.snapfaceid.com';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

function validateAdminToken(token: string | null | undefined): boolean {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [username, timestamp] = decoded.split(':');
    const tokenAge = Date.now() - parseInt(timestamp);
    return tokenAge < 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function getBackendAuthHeader(): string {
  return 'Basic ' + Buffer.from(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`).toString('base64');
}

// POST /api/admin/device-reset - Send verification code
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!validateAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, phone, code } = body;

    if (action === 'send-code') {
      // Send verification code
      const response = await fetch(`${BACKEND_URL}/admin/device-reset/send-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getBackendAuthHeader(),
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();
      return NextResponse.json(data, { status: response.status });

    } else if (action === 'verify') {
      // Verify code and reset device
      const response = await fetch(`${BACKEND_URL}/admin/device-reset/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getBackendAuthHeader(),
        },
        body: JSON.stringify({ phone, code }),
      });

      const data = await response.json();
      return NextResponse.json(data, { status: response.status });

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in device reset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
