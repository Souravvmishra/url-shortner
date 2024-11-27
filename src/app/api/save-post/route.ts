import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/services/firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const accessToken = authHeader.split(' ')[1];

    // Get post data from request body
    const post = await request.json();
    // Save post to Firestore
    const postRef = doc(firestore, 'saved_posts', post.id);
    await setDoc(postRef, {
      ...post,
      saved_at: new Date().toISOString(),
      access_token: accessToken
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error saving post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
