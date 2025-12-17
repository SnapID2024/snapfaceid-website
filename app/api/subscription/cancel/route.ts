import { NextRequest, NextResponse } from 'next/server'

// Backend URL for cancellation
const BACKEND_URL = process.env.BACKEND_API_URL || process.env.BACKEND_URL || 'http://localhost:8001'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, phone, reason, feedback } = body

    // Validate required fields
    if (!email || !phone || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('Subscription cancellation request:', {
      email,
      phone,
      reason,
      timestamp: new Date().toISOString(),
    })

    // Call backend API to cancel subscription
    const backendResponse = await fetch(`${BACKEND_URL}/stripe/cancel-subscription-website`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, phone, reason, feedback }),
    })

    const backendData = await backendResponse.json()

    if (!backendResponse.ok) {
      console.error('Backend cancellation failed:', backendData)
      return NextResponse.json(
        { error: backendData.detail || 'Failed to cancel subscription' },
        { status: backendResponse.status }
      )
    }

    console.log('Subscription canceled successfully:', backendData)

    return NextResponse.json(
      {
        success: true,
        message: backendData.message || 'Subscription canceled successfully',
        canceledAt: new Date().toISOString(),
        accessUntil: backendData.period_end_formatted || 'End of billing period',
        periodEnd: backendData.period_end,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error canceling subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again or contact support.' },
      { status: 500 }
    )
  }
}
