import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getMessaging, Messaging, Message } from 'firebase-admin/messaging';

let adminApp: App | null = null;
let adminMessaging: Messaging | null = null;

/**
 * Returns a lazily initialized Firebase Admin Messaging instance
 * using FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY
 */
export function getFirebaseAdminMessaging(): { messaging: Messaging | null; error?: string } {
  if (adminMessaging) {
    return { messaging: adminMessaging };
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    const missing: string[] = [];
    if (!projectId) missing.push('FIREBASE_PROJECT_ID');
    if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
    if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');
    return {
      messaging: null,
      error: `Missing Firebase Admin credentials: ${missing.join(', ')}`,
    };
  }

  try {
    // Handle escaped newlines in private key if stored as a single-line environment variable
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    // Strip surrounding quotes if present from dotenv strings
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1).replace(/\\n/g, '\n');
    }

    const existingApps = getApps();
    if (existingApps.length > 0) {
      adminApp = existingApps[0];
    } else {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }

    adminMessaging = getMessaging(adminApp);
    return { messaging: adminMessaging };
  } catch (err: any) {
    console.error('Error initializing Firebase Admin SDK:', err);
    return {
      messaging: null,
      error: `Failed to initialize Firebase Admin SDK: ${err?.message || err}`,
    };
  }
}

export interface PushNotificationPayload {
  tokenOrTopic: string;
  title: string;
  body: string;
  dataPayload?: Record<string, string>;
  actionUrl?: string;
}

export interface PushNotificationResult {
  sent: boolean;
  messageId?: string;
  message: string;
  rawResponse?: any;
}

/**
 * Dispatches a push notification via modern FCM HTTP v1 using Firebase Admin SDK
 */
export async function sendModernFcmPush(
  payload: PushNotificationPayload
): Promise<PushNotificationResult> {
  const { messaging, error } = getFirebaseAdminMessaging();

  if (!messaging || error) {
    return {
      sent: false,
      message: `Push notification constructed successfully. (FCM HTTP v1 requires FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables to dispatch live to device). ${error || ''}`.trim(),
    };
  }

  const { tokenOrTopic, title, body, dataPayload, actionUrl = '/' } = payload;

  try {
    const isTopic = tokenOrTopic.startsWith('/topics/') || tokenOrTopic.startsWith('topics/');
    const topicName = isTopic ? tokenOrTopic.replace(/^\/?topics\//, '') : null;

    const fcmMessage: Message = {
      notification: {
        title,
        body,
      },
      data: {
        url: actionUrl,
        timestamp: new Date().toISOString(),
        ...(dataPayload || {}),
      },
      webpush: {
        notification: {
          title,
          body,
          icon: '/icons/icon-192.svg',
          badge: '/icons/icon-192.svg',
          requireInteraction: false,
          actions: [
            {
              action: 'open_app',
              title: 'View Garden Schedule',
            },
          ],
        },
        fcmOptions: {
          link: actionUrl,
        },
      },
      ...(topicName ? { topic: topicName } : { token: tokenOrTopic }),
    };

    const messageId = await messaging.send(fcmMessage);
    return {
      sent: true,
      messageId,
      message: `FCM HTTP v1 push notification dispatched successfully via Firebase Admin SDK (${topicName ? 'Topic: ' + topicName : 'Device Token'}). Message ID: ${messageId}`,
      rawResponse: { messageId },
    };
  } catch (err: any) {
    console.error('Firebase Admin FCM HTTP v1 dispatch error:', err);
    return {
      sent: false,
      message: `FCM HTTP v1 send error: ${err?.message || err}`,
      rawResponse: err,
    };
  }
}
