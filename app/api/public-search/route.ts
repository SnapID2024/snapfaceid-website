import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://api-sports-bellacruz.ngrok.pro';

export async function POST(request: NextRequest) {
  try {
    const { phone, countryCode } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Format phone number with country code
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = `${countryCode || '+1'}${cleanPhone}`;

    // Search in backend (public search - limited info)
    const response = await fetch(`${BACKEND_API_URL}/api/public-search-by-phone?phone=${encodeURIComponent(fullPhone)}`);

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ found: false, message: 'No person found with this phone number' });
      }
      throw new Error('Backend search failed');
    }

    const data = await response.json();

    // Return only limited info for public search
    return NextResponse.json({
      found: true,
      personId: data.person_id,
      photoUrl: data.most_recent_photo || data.photo || null,
      hasReviews: data.review_count > 0,
      reviewCount: data.review_count || 0,
    });

  } catch (error) {
    console.error('Public search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
