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

// POST /api/admin/delete-person - Delete a person completely
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!validateAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { phone, confirm } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    if (confirm !== 'DELETE') {
      return NextResponse.json({ error: 'Confirmation required' }, { status: 400 });
    }

    const response = await fetch(`${BACKEND_URL}/admin/delete-person`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getBackendAuthHeader(),
      },
      body: JSON.stringify({ phone, confirm }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('Error in delete-person:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
