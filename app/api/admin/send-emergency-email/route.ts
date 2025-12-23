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

export async function POST(request: NextRequest) {
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

    // Get request body
    const body = await request.json()

    // Validate recipient email
    if (!body.recipientEmail || !body.recipientEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Valid recipient email is required' },
        { status: 400 }
      )
    }

    // Get admin credentials for backend authentication
    const adminUser = process.env.ADMIN_USER || ''
    const adminPass = process.env.ADMIN_PASS || ''
    const backendToken = `${adminUser}:${adminPass}`

    // Send to backend
    const response = await fetch(`${BACKEND_URL}/guardian/admin/send-emergency-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${backendToken}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend error:', response.status, errorText)
      return NextResponse.json(
        { error: `Failed to send email: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Error sending emergency email:', error)
    return NextResponse.json(
      { error: 'Failed to send emergency email' },
      { status: 500 }
    )
  }
}
