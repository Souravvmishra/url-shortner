import { NextRequest, NextResponse } from 'next/server';

// Constants for API endpoints and fields
const INSTAGRAM_API_BASE = 'https://graph.instagram.com';
const USER_FIELDS = 'id,username,account_type,media_count';

export async function GET(request: NextRequest) {
  try {
    // Get access token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      return NextResponse.json(
        { error: "Not authenticated", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    // Helper function for API calls
    const fetchFromInstagram = async (endpoint: string, params: Record<string, string>) => {
      const queryString = new URLSearchParams({...params, access_token: accessToken}).toString();
      const response = await fetch(`${INSTAGRAM_API_BASE}${endpoint}?${queryString}`);
      
      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.statusText}`);
      }
      
      return response.json();
    };

    // Get user data
    const userData = await fetchFromInstagram('/me', {
      fields: USER_FIELDS
    });

    if (!userData.id) {
      return NextResponse.json(
        { error: "Failed to fetch user data", code: "USER_NOT_FOUND" },
        { status: 400 }
      );
    }

    // Get user's media
    const mediaData = await fetchFromInstagram(`/${userData.id}/media`, {
      fields: 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp'
    });

    // Cache headers for better performance
    const headers = {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
    };

    return NextResponse.json({
      user: userData,
      media: mediaData.data
    }, { 
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Error fetching Instagram user data:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Detailed error:', errorMessage);

    return NextResponse.json(
      { 
        error: "Internal server error",
        code: "INTERNAL_ERROR",
        message: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
