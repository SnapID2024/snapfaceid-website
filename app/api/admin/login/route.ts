import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Missing username or password' },
        { status: 400 }
      )
    }

    // TODO: Implement proper authentication
    // This is a SIMPLE example for development - MUST be replaced with secure authentication
    // In production:
    // 1. Hash passwords with bcrypt
    // 2. Store admin credentials in database
    // 3. Use JWT tokens with expiration
    // 4. Implement 2FA for admin access
    // 5. Rate limit login attempts
    // 6. Log all admin access attempts

    // For development only - REPLACE THIS
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme123'

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Generate a simple token (REPLACE with proper JWT in production)
      const token = Buffer.from(`${username}:${Date.now()}`).toString('base64')

      // Log successful login
      console.log('Admin login successful:', {
        username,
        timestamp: new Date().toISOString(),
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      })

      return NextResponse.json(
        {
          success: true,
          token,
          message: 'Authentication successful'
        },
        { status: 200 }
      )
    } else {
      // Log failed login attempt
      console.warn('Failed admin login attempt:', {
        username,
        timestamp: new Date().toISOString(),
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      })

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Error processing admin login:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
