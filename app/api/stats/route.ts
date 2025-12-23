import { NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'https://api-sports-bellacruz.ngrok.pro';

// Cache the stats for 5 minutes to avoid hitting the backend too frequently
let cachedStats: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    // Check cache
    if (cachedStats && Date.now() - cachedStats.timestamp < CACHE_DURATION) {
      return NextResponse.json(cachedStats.data);
    }

    // Fetch fresh stats from backend
    const response = await fetch(`${BACKEND_API_URL}/api/public-stats`);

    if (!response.ok) {
      throw new Error('Failed to fetch stats from backend');
    }

    const data = await response.json();

    // Update cache
    cachedStats = {
      data,
      timestamp: Date.now(),
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Stats API error:', error);

    // Return cached data if available, even if expired
    if (cachedStats) {
      return NextResponse.json(cachedStats.data);
    }

    // Return default values if no cache available
    return NextResponse.json({
      registered_users: 0,
      total_reviews: 0,
      reviews_with_photos: 0,
      remote_reviews: 0,
    });
  }
}
