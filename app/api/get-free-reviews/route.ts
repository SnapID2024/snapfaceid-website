import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://api-sports-bellacruz.ngrok.pro';

export async function POST(request: NextRequest) {
  try {
    const { personId } = await request.json();

    if (!personId) {
      return NextResponse.json({ error: 'Person ID is required' }, { status: 400 });
    }

    // Obtener las reviews del backend (sin verificar pago - es gratis cuando no hay foto)
    const response = await fetch(`${BACKEND_API_URL}/api/public-get-reviews?person_id=${encodeURIComponent(personId)}`);

    if (!response.ok) {
      throw new Error('Failed to fetch reviews from backend');
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      reviews: data.reviews || [],
      personInfo: data.person_info || {},
    });

  } catch (error) {
    console.error('Get free reviews error:', error);
    return NextResponse.json({ error: 'Failed to retrieve reviews' }, { status: 500 });
  }
}
