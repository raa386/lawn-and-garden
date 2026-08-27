import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging, isSupported } from 'firebase/messaging';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  vapidKey?: string;
}

// Default / fallback configuration updated with your exact web App ID and Sender ID
export const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || 'AIzaSyC077NOj3mvbysSUo6FY-alFrWu7HazioA',
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || 'gardencare-app.firebaseapp.com',
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || 'maintenance-4bd5b',
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || 'maintenance-4bd5b.appspot.com',
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '349596939584',
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || '1:349596939584:web:7a01168de94394325cf6a5',
  vapidKey: (import.meta as any).env?.VITE_FIREBASE_VAPID_KEY || '',
};

const STORAGE_KEY_CONFIG = 'gardencare_firebase_custom_config_v1';
const STORAGE_KEY_TOKEN = 'gardencare_fcm_token_v1';
const STORAGE_KEY_TOKEN_TIME = 'gardencare_fcm_token_timestamp_v1';

/**
 * Retrieves the current Firebase configuration from localStorage or Vite env vars
 */
export function getActiveFirebaseConfig(): FirebaseConfig {
  try {
    const custom = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (custom) {
      const parsed = JSON.parse(custom);
      return {
        ...DEFAULT_FIREBASE_CONFIG,
        ...parsed,
      };
    }
  } catch (e) {
    console.warn('Failed to parse custom Firebase config:', e);
  }
  return DEFAULT_FIREBASE_CONFIG;
}

/**
 * Saves a user-customized Firebase configuration into localStorage
 */
export function saveActiveFirebaseConfig(config: Partial<FirebaseConfig>): FirebaseConfig {
  const current = getActiveFirebaseConfig();
  const updated: FirebaseConfig = {
    apiKey: config.apiKey?.trim() || current.apiKey,
    authDomain: config.authDomain?.trim() || current.authDomain,
    projectId: config.projectId?.trim() || current.projectId,
    storageBucket: config.storageBucket?.trim() || current.storageBucket,
    messagingSenderId: config.messagingSenderId?.trim() || current.messagingSenderId,
    appId: config.appId?.trim() || current.appId,
    vapidKey: config.vapidKey?.trim() || current.vapidKey,
  };
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(updated));
  return updated;
}

/**
 * Checks if Firebase has the minimal required keys set up
 */
export function isFirebaseConfigured(): boolean {
  const cfg = getActiveFirebaseConfig();
  return Boolean(cfg.apiKey && cfg.projectId && cfg.messagingSenderId && cfg.appId);
}

/**
 * Helper to check if current client is an iOS device (iPhone, iPad, iPod)
 */
export function isIosDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  return /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
}

/**
 * Helper to check if the web app is running in Standalone PWA mode (added to iOS Home Screen)
 */
export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    (window.navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

let firebaseAppInstance: FirebaseApp | null = null;
let messagingInstance: Messaging | null = null;

/**
 * Initializes or returns existing Firebase App instance
 */
export function getOrInitFirebaseApp(): FirebaseApp {
  const config = getActiveFirebaseConfig();
  const existingApps = getApps();

  if (existingApps.length > 0) {
    firebaseAppInstance = getApp();
    return firebaseAppInstance;
  }

  firebaseAppInstance = initializeApp({
    apiKey: config.apiKey || 'AIzaSyC077NOj3mvbysSUo6FY-alFrWu7HazioA',
    authDomain: config.authDomain || 'gardencare-app.firebaseapp.com',
    projectId: config.projectId || 'maintenance-4bd5b',
    storageBucket: config.storageBucket || 'maintenance-4bd5b.appspot.com',
    messagingSenderId: config.messagingSenderId || '349596939584',
    appId: config.appId || '1:349596939584:web:7a01168de94394325cf6a5',
  });

  return firebaseAppInstance;
}

/**
 * Safe initializer for Firebase Messaging in browser environment
 */
export async function getMessagingService(): Promise<Messaging | null> {
  const supported = await isSupported().catch(() => false);
  if (!supported) {
    console.warn('Firebase Messaging is not supported in this browser environment.');
    return null;
  }

  if (!messagingInstance) {
    const app = getOrInitFirebaseApp();
    messagingInstance = getMessaging(app);
  }

  return messagingInstance;
}

export interface PushRegistrationResult {
  success: boolean;
  token?: string;
  permission: NotificationPermission | 'unsupported';
  error?: string;
  isIos: boolean;
  isStandalone: boolean;
}

/**
 * Requests browser notification permission and retrieves FCM registration token
 */
export async function registerForPushNotifications(customVapidKey?: string): Promise<PushRegistrationResult> {
  const isIos = isIosDevice();
  const isStandalone = isStandalonePwa();

  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return {
      success: false,
      permission: 'unsupported',
      error: 'Push notifications are not supported in this browser or environment.',
      isIos,
      isStandalone,
    };
  }

  // iOS Safari Requirement: Web Push ONLY works when added to Home Screen (iOS 16.4+)
  if (isIos && !isStandalone) {
    return {
      success: false,
      permission: Notification.permission,
      error:
        'On iOS (iPhone), Web Push notifications require adding this app to your Home Screen first. Tap the Share button in Safari, select "Add to Home Screen", then open GardenCare from your Home Screen to enable reminders.',
      isIos,
      isStandalone,
    };
  }

  try {
    // 1. Request Notification Permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        permission,
        error: permission === 'denied' ? 'Notification permission was denied by user.' : 'Notification permission was dismissed.',
        isIos,
        isStandalone,
      };
    }

    // 2. Register / Ensure firebase-messaging-sw.js is registered
    const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });
    await navigator.serviceWorker.ready;

    // 3. Obtain Firebase Messaging instance
    const messaging = await getMessagingService();
    if (!messaging) {
      return {
        success: true,
        permission,
        token: undefined,
        error: 'Notification permission granted, but Firebase Messaging is not supported or configured.',
        isIos,
        isStandalone,
      };
    }

    const config = getActiveFirebaseConfig();
    const vapidKey = customVapidKey || config.vapidKey || undefined;

    // 4. Retrieve FCM Token
    let token: string | undefined;
    try {
      token = await getToken(messaging, {
        vapidKey: vapidKey || undefined,
        serviceWorkerRegistration: swRegistration,
      });

      if (token) {
        localStorage.setItem(STORAGE_KEY_TOKEN, token);
        localStorage.setItem(STORAGE_KEY_TOKEN_TIME, new Date().toISOString());
      }
    } catch (tokenErr: any) {
      console.warn('FCM getToken error:', tokenErr);
      return {
        success: true,
        permission,
        error: `Permission granted! Note: FCM token acquisition returned: ${tokenErr?.message || 'Check your VAPID Key and Firebase Config'}.`,
        isIos,
        isStandalone,
      };
    }

    return {
      success: true,
      token,
      permission,
      isIos,
      isStandalone,
    };
  } catch (err: any) {
    console.error('Error during push registration:', err);
    return {
      success: false,
      permission: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
      error: err?.message || 'Failed to complete push notification registration.',
      isIos,
      isStandalone,
    };
  }
}

/**
 * Gets cached FCM Token from localStorage
 */
export function getSavedFcmToken(): { token: string | null; timestamp: string | null } {
  if (typeof window === 'undefined') return { token: null, timestamp: null };
  return {
    token: localStorage.getItem(STORAGE_KEY_TOKEN),
    timestamp: localStorage.getItem(STORAGE_KEY_TOKEN_TIME),
  };
}

/**
 * Clears saved FCM token from storage
 */
export function clearSavedFcmToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_TOKEN_TIME);
}

/**
 * Listen for foreground push messages while the app is actively open
 */
export function setupForegroundMessageListener(
  onReceive: (payload: { title?: string; body?: string; data?: any }) => void
): () => void {
  let unsubscribe: (() => void) | null = null;

  getMessagingService().then((messaging) => {
    if (messaging) {
      unsubscribe = onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        onReceive({
          title: payload.notification?.title || payload.data?.title || '🌱 Garden & Lawn Care Alert',
          body: payload.notification?.body || payload.data?.body || 'New care reminder triggered.',
          data: payload.data,
        });
      });
    }
  });

  return () => {
    if (unsubscribe) unsubscribe();
  };
}
