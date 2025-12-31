import { NextRequest, NextResponse } from 'next/server';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://api.snapfaceid.com';

// Fallback phone number (will be overridden by Firebase)
const DEFAULT_TRUSTED_PHONE = '+17864490937';

// In-memory store for verification codes (with expiration)
// In production, this should be in Redis or similar
const verificationCodes: Map<string, { code: string; expires: number }> = new Map();

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function getTrustedPhone(): Promise<string> {
  try {
    // Try to get from backend/Firebase
    const response = await fetch(`${BACKEND_API_URL}/api/security-config`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();
      if (data.trustedPhone) {
        return data.trustedPhone;
      }
    }
  } catch (error) {
    console.error('Error fetching trusted phone:', error);
  }

  return DEFAULT_TRUSTED_PHONE;
}

async function sendSMS(to: string, body: string): Promise<boolean> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.error('Twilio credentials not configured');
    return false;
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: TWILIO_PHONE_NUMBER,
        Body: body,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Twilio error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'send') {
      // Generate and send code
      const code = generateCode();
      const sessionId = crypto.randomUUID();

      // Store code with 5 minute expiration
      verificationCodes.set(sessionId, {
        code,
        expires: Date.now() + 5 * 60 * 1000,
      });

      // Clean up expired codes
      for (const [key, value] of verificationCodes.entries()) {
        if (value.expires < Date.now()) {
          verificationCodes.delete(key);
        }
      }

      // Get trusted phone number
      const trustedPhone = await getTrustedPhone();

      // Send SMS
      const sent = await sendSMS(
        trustedPhone,
        `SnapfaceID: Tu código de verificación es ${code}. Válido por 5 minutos.`
      );

      if (!sent) {
        return NextResponse.json({
          success: false,
          error: 'Failed to send SMS'
        }, { status: 500 });
      }

      // Return session ID (not the code!)
      return NextResponse.json({
        success: true,
        sessionId,
        // Mask the phone number for display
        phoneMask: trustedPhone.replace(/(\+\d{1,3})\d{6}(\d{4})/, '$1******$2'),
      });
    }

    if (action === 'verify') {
      const { sessionId, code } = body;

      const stored = verificationCodes.get(sessionId);

      if (!stored) {
        return NextResponse.json({
          verified: false,
          error: 'Session expired or invalid'
        }, { status: 400 });
      }

      if (stored.expires < Date.now()) {
        verificationCodes.delete(sessionId);
        return NextResponse.json({
          verified: false,
          error: 'Code expired'
        }, { status: 400 });
      }

      if (stored.code !== code) {
        return NextResponse.json({
          verified: false,
          error: 'Invalid code'
        }, { status: 401 });
      }

      // Code is valid, delete it
      verificationCodes.delete(sessionId);

      return NextResponse.json({ verified: true });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error) {
    console.error('Error in send-code API:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error'
    }, { status: 500 });
  }
}
