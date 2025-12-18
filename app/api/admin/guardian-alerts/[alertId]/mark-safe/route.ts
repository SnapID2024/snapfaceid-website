import { NextRequest, NextResponse } from 'next/server'

// Backend URL
const BACKEND_URL = process.env.BACKEND_API_URL || process.env.BACKEND_URL || 'http://localhost:8001'

// Simple token validation
function validateAdminToken(token: string | null | undefined): boolean {
  if (!token) return false
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [username, timestamp] = decoded.split(':')
    const tokenAge = Date.now() - parseInt(timestamp)
    return tokenAge < 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
) {
  try {
    const { alertId } = await params

    // Validate admin token
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!validateAdminToken(token)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Call backend to mark alert as safe
    const response = await fetch(`${BACKEND_URL}/admin/guardian-alerts/${alertId}/mark-safe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Token': token || '',
      },
    })

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error marking alert as safe:', error)
    return NextResponse.json(
      { error: 'Failed to mark alert as safe' },
      { status: 500 }
    )
  }
}
