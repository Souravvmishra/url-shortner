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
    const { post, user } = await request.json();

    if (!post?.id || !user?.id) {
      return NextResponse.json(
        { error: 'Missing required post or user data' },
        { status: 400 }
      );
    }

    // Create document reference with user ID and post ID
    const postRef = doc(firestore, 'users', user.id, 'saved_posts', post.id);

    // Save post data
    await setDoc(postRef, {
      ...post,
      userId: user.id,
      saved_at: new Date().toISOString(),
      accessToken
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
