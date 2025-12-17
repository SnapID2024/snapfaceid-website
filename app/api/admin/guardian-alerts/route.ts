import { NextRequest, NextResponse } from 'next/server'

// Backend URL for Guardian data
const BACKEND_URL = process.env.BACKEND_API_URL || process.env.BACKEND_URL || 'http://localhost:8001'

// Simple token validation (matches the token format from login)
function validateAdminToken(token: string | null): boolean {
  if (!token) return false
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [username, timestamp] = decoded.split(':')
    // Token valid for 24 hours
    const tokenAge = Date.now() - parseInt(timestamp)
    return tokenAge < 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate admin token
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!validateAdminToken(token)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch active Guardian sessions from backend
    const response = await fetch(`${BACKEND_URL}/admin/guardian-alerts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Token': token || '',
      },
    })

    if (!response.ok) {
      // If backend endpoint doesn't exist yet, return mock data for now
      if (response.status === 404) {
        console.log('Guardian alerts endpoint not found, returning empty list')
        return NextResponse.json({ alerts: [], total: 0 })
      }
      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error fetching guardian alerts:', error)

    // Return empty data if backend is not available
    return NextResponse.json({
      alerts: [],
      total: 0,
      message: 'Unable to fetch live data. Backend may be offline.',
    })
  }
}
