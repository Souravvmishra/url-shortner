import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { firestore } from '@/services/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Get environment variables
const APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN;

// Verify webhook signature
function verifySignature(payload: string, signature: string | null): boolean {
  if (!signature) {
    console.log('No signature provided for webhook verification');
    return false;
  }
  if (!APP_SECRET) {
    console.log('No app secret configured for webhook verification');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', APP_SECRET)
    .update(payload)
    .digest('hex');
    
  const isValid = `sha256=${expectedSignature}` === signature;
  console.log('Webhook signature verification:', isValid ? 'valid' : 'invalid');
  return isValid;
}

// Handle GET requests for webhook verification
export async function GET(request: NextRequest) {
  console.log('Received webhook verification request');
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  console.log('Webhook verification params:', { mode, token, challenge });

  // Verify webhook subscription
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verification successful');
    return new NextResponse(challenge);
  }

  console.log('Webhook verification failed');
  return NextResponse.json({ error: 'Invalid verification request' }, { status: 403 });
}

// Handle POST requests for webhook events
export async function POST(request: NextRequest) {
  try {
    console.log('Received webhook event');
    const signature = request.headers.get('x-hub-signature-256');
    const body = await request.text();

    // Verify webhook signature
    if (!verifySignature(body, signature)) {
      console.log('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const data = JSON.parse(body);
    console.log('Webhook payload:', data);

    // Process Instagram webhook events
    if (data.object === 'instagram') {
      console.log('Processing Instagram webhook events');
      for (const entry of data.entry) {
        // Handle comments
        if (entry.changes) {
          console.log('Processing comment events');
          for (const change of entry.changes) {
            if (change.field === 'comments') {
              console.log('Comment event:', change.value);
              
              // Get the Instagram user who made the comment
              const commenterId = change.value.from.id;
              const mediaOwnerId = change.value.media.owner.id;

              // Get access token from Firestore
              const userRef = doc(firestore, 'instagram_users', mediaOwnerId);
              const userDoc = await getDoc(userRef);
              
              if (userDoc.exists()) {
                const accessToken = userDoc.data().access_token;

                // Send message to commenter
                const response = await fetch(`https://graph.instagram.com/v21.0/${mediaOwnerId}/messages`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    recipient: {
                      id: commenterId
                    },
                    message: {
                      text: "meetings made super easy\nhttps://meetman.codestam.com"
                    }
                  })
                });

                if (!response.ok) {
                  console.error('Failed to send message:', await response.text());
                } else {
                  console.log('Successfully sent message to commenter');
                }
              }
            }
          }
        }

        // Handle messaging events
        if (entry.messaging) {
          console.log('Processing messaging events');
          for (const event of entry.messaging) {
            const senderId = event.sender.id;
            const recipientId = event.recipient.id;
            const timestamp = event.timestamp;

            if (event.message) {
              console.log('Message event:', {
                senderId,
                recipientId,
                messageId: event.message.mid,
                text: event.message.text,
                attachments: event.message.attachments,
                timestamp
              });
            } else if (event.reaction) {
              console.log('Reaction event:', {
                senderId,
                recipientId,
                messageId: event.reaction.mid,
                action: event.reaction.action,
                reaction: event.reaction.reaction,
                timestamp
              });
            } else if (event.postback) {
              console.log('Postback event:', {
                senderId,
                recipientId,
                messageId: event.postback.mid,
                title: event.postback.title,
                payload: event.postback.payload,
                timestamp
              });
            }
          }
        }
      }
    }

    console.log('Webhook processing completed successfully');
    return new NextResponse('EVENT_RECEIVED', { status: 200 });

  } catch (error) {
    console.error('Webhook error:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
