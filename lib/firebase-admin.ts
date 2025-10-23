
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

let firebaseApp: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK
 * Uses the service account key file from FIREBASE_ADMIN_KEY_PATH environment variable
 */
export function initializeFirebaseAdmin(): admin.app.App {
  // Return existing app if already initialized
  if (firebaseApp) {
    return firebaseApp;
  }

  // Check if already initialized
  if (admin.apps.length > 0) {
    firebaseApp = admin.apps[0] as admin.app.App;
    return firebaseApp;
  }

  try {
    const keyPath = process.env.FIREBASE_ADMIN_KEY_PATH;
    
    if (!keyPath) {
      throw new Error(
        'FIREBASE_ADMIN_KEY_PATH environment variable not set. ' +
        'Please add your Firebase Admin SDK service account key file and set the path in .env'
      );
    }

    // Resolve the full path (handle both relative and absolute paths)
    const fullPath = path.isAbsolute(keyPath) 
      ? keyPath 
      : path.join(process.cwd(), keyPath);

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      throw new Error(
        `Firebase Admin SDK key file not found at: ${fullPath}\n` +
        'Please download your service account key from Firebase Console and place it at this location.'
      );
    }

    // Read and parse the service account key
    const serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

    // Initialize Firebase Admin
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
}

/**
 * Get Firebase Admin instance (initializes if needed)
 */
export function getFirebaseAdmin(): admin.app.App {
  if (!firebaseApp) {
    return initializeFirebaseAdmin();
  }
  return firebaseApp;
}

/**
 * Get Firebase Messaging instance
 */
export function getMessaging(): admin.messaging.Messaging {
  const app = getFirebaseAdmin();
  return admin.messaging(app);
}

/**
 * Check if Firebase Admin is properly configured
 */
export function isFirebaseConfigured(): boolean {
  try {
    const keyPath = process.env.FIREBASE_ADMIN_KEY_PATH;
    console.log('[Firebase Config Check] FIREBASE_ADMIN_KEY_PATH:', keyPath);
    
    if (!keyPath) {
      console.log('[Firebase Config Check] ❌ Environment variable not set');
      return false;
    }

    const fullPath = path.isAbsolute(keyPath) 
      ? keyPath 
      : path.join(process.cwd(), keyPath);

    console.log('[Firebase Config Check] Full path:', fullPath);
    console.log('[Firebase Config Check] process.cwd():', process.cwd());
    
    const exists = fs.existsSync(fullPath);
    console.log('[Firebase Config Check] File exists:', exists);
    
    if (exists) {
      console.log('[Firebase Config Check] ✅ Firebase is configured');
    } else {
      console.log('[Firebase Config Check] ❌ File does not exist at path');
    }
    
    return exists;
  } catch (error: any) {
    console.error('[Firebase Config Check] ❌ Error:', error.message);
    return false;
  }
}
