import { NextRequest, NextResponse } from 'next/server'

// Backend URL for Guardian data
const BACKEND_URL = process.env.BACKEND_API_URL || process.env.BACKEND_URL || 'http://localhost:8001'

// Simple token validation (matches the token format from login)
function validateAdminToken(token: string | null | undefined): boolean {
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

    // Get admin credentials for backend authentication
    const adminUser = process.env.ADMIN_USERNAME || 'admin'
    const adminPass = process.env.ADMIN_PASSWORD || ''
    const backendToken = `${adminUser}:${adminPass}`

    // Fetch Guardian history from backend
    const response = await fetch(`${BACKEND_URL}/guardian/admin/history`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${backendToken}`,
      },
    })

    if (!response.ok) {
      // If backend endpoint doesn't exist yet, return empty data
      if (response.status === 404) {
        console.log('Guardian history endpoint not found, returning empty list')
        return NextResponse.json({ history: [], count: 0 })
      }
      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error fetching guardian history:', error)

    // Return empty data if backend is not available
    return NextResponse.json({
      history: [],
      count: 0,
      message: 'Unable to fetch history. Backend may be offline.',
    })
  }
}
