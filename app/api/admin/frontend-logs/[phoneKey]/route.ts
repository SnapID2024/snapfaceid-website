import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://api.snapfaceid.com';

// Verificar token de admin
function validateAdminToken(token: string | null | undefined): boolean {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [, timestamp] = decoded.split(':');
    const tokenAge = Date.now() - parseInt(timestamp);
    return tokenAge < 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

// GET /api/admin/frontend-logs/[phoneKey] - Get logs for a specific phone
export async function GET(
  request: NextRequest,
  { params }: { params: { phoneKey: string } }
) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  if (!validateAdminToken(token)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const limit = searchParams.get('limit') || '100';

    let url = `${BACKEND_API_URL}/api/frontend-logs/${params.phoneKey}?limit=${limit}`;
    if (level) url += `&level=${level}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Failed to fetch logs' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/frontend-logs/[phoneKey] - Clear logs for a specific phone
export async function DELETE(
  request: NextRequest,
  { params }: { params: { phoneKey: string } }
) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  if (!validateAdminToken(token)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    const response = await fetch(`${BACKEND_API_URL}/api/frontend-logs/${params.phoneKey}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Failed to clear logs' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error clearing logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
