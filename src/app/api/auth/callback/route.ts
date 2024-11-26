import { NextRequest, NextResponse } from 'next/server';

// Get environment variables
const APP_ID = process.env.INSTAGRAM_APP_ID;
const APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI;
const FRONTEND_URL = process.env.FRONTEND_URL;

export async function GET(request: NextRequest) {
  try {
    // Get authorization code from URL params
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: "Authorization code not provided" },
        { status: 400 }
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: APP_ID,
        client_secret: APP_SECRET,
        redirect_uri: REDIRECT_URI,
        code: code,
        grant_type: 'authorization_code'
      } as Record<string, string>)
    });

    if (!tokenResponse.ok) {
      throw new Error(`Instagram API error: ${tokenResponse.statusText}`);
    }

    const data = await tokenResponse.json();

    if (!data.access_token) {
      throw new Error('No access token received from Instagram');
    }

    // Redirect to frontend with access token as URL parameter
    // The frontend will handle storing it in localStorage
    if (!FRONTEND_URL) {
      throw new Error('FRONTEND_URL environment variable is not set');
    }
        
    const redirectUrl = new URL(FRONTEND_URL);
    redirectUrl.searchParams.set('access_token', data.access_token);
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Instagram auth error:', error);
    
    // Log error details but don't expose them to client
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Detailed error:', errorMessage);
    
    return NextResponse.json(
      { error: "Authentication failed. Please try again." },
      { status: 500 }
    );
  }
}
