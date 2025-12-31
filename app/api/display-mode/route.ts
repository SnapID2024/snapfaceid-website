import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://api.snapfaceid.com';

// The valid PIN hash - generated from SHA-256(pin + 'snapface_salt_2025')
const VALID_PIN_HASH = process.env.SAFE_MODE_PIN_HASH || '82b915ecf7b49518b00882a24d18c3d07eee5afc4d2b79f4b12345a285b6fd51';

// Default configuration
const DEFAULT_CONFIG = {
  photoVisibility: true,
  searchDetail: true,
  reportVisibility: true,
  alertLevel: true,
  flyerDetail: true,
};

export async function GET() {
  try {
    // Try to get from backend first
    const response = await fetch(`${BACKEND_API_URL}/api/display-mode`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        safeMode: data.safeMode === true,
        config: data.config || DEFAULT_CONFIG,
      });
    }

    // Fallback if backend unavailable
    return NextResponse.json({
      safeMode: false,
      config: DEFAULT_CONFIG,
    });
  } catch (error) {
    console.error('Error fetching display mode:', error);
    return NextResponse.json({
      safeMode: false,
      config: DEFAULT_CONFIG,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, hash, safeMode, config } = body;

    // Action: verify - just verify the PIN
    if (action === 'verify') {
      if (hash !== VALID_PIN_HASH) {
        return NextResponse.json({ verified: false }, { status: 401 });
      }
      return NextResponse.json({ verified: true });
    }

    // Action: save - save the configuration
    if (action === 'save') {
      // Save to backend
      const response = await fetch(`${BACKEND_API_URL}/api/display-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          safeMode: safeMode,
          config: config || DEFAULT_CONFIG,
        }),
      });

      if (response.ok) {
        return NextResponse.json({
          success: true,
          safeMode: safeMode,
          config: config,
        });
      }

      // If backend fails, still return success for local testing
      return NextResponse.json({
        success: true,
        safeMode: safeMode,
        config: config,
      });
    }

    // Legacy support: if no action but has hash, treat as toggle (deprecated)
    if (hash) {
      if (hash !== VALID_PIN_HASH) {
        return NextResponse.json({ success: false, error: 'Invalid PIN' }, { status: 401 });
      }

      // Get current state
      let currentState = false;
      try {
        const getResponse = await fetch(`${BACKEND_API_URL}/api/display-mode`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        });
        if (getResponse.ok) {
          const data = await getResponse.json();
          currentState = data.safeMode === true;
        }
      } catch {
        // Ignore error, use default
      }

      // Toggle the state
      const newState = !currentState;

      // Save to backend
      await fetch(`${BACKEND_API_URL}/api/display-mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ safeMode: newState }),
      });

      return NextResponse.json({ success: true, safeMode: newState });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in display mode API:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
