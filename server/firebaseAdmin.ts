import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth, DecodedIdToken } from 'firebase-admin/auth';

let db: Firestore | null = null;
let adminApp: App | null = null;
let isInitialized = false;

export function getFirestore(): Firestore | null {
  if (isInitialized) return db;

  try {
    const projectId =
      process.env.FIREBASE_PROJECT_ID ||
      process.env.GCLOUD_PROJECT ||
      'inner-aleph-9xctm';

    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    const apps = getApps();
    if (!apps.length) {
      if (clientEmail && privateKey) {
        adminApp = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        console.log('[FirebaseAdmin] Initialized with service account cert');
      } else {
        adminApp = initializeApp({
          projectId,
        });
        console.log('[FirebaseAdmin] Initialized with default credentials');
      }
    } else {
      adminApp = apps[0];
    }

    // Connect to Firestore
    try {
      const customDatabaseId = 'ai-studio-codecontestplatf-e3867e34-c64e-4b86-a00e-9742dea2721f';
      db = getAdminFirestore(adminApp, customDatabaseId);
    } catch {
      db = getAdminFirestore(adminApp);
    }

    isInitialized = true;
    return db;
  } catch (err: any) {
    console.warn('[FirebaseAdmin] Could not connect to remote Firestore credentials:', err.message);
    isInitialized = true;
    return null;
  }
}

export async function verifyIdToken(idToken: string): Promise<DecodedIdToken | null> {
  try {
    if (!adminApp) {
      getFirestore();
    }
    if (adminApp) {
      return await getAdminAuth(adminApp).verifyIdToken(idToken);
    }
    return null;
  } catch (err: any) {
    console.error('[FirebaseAdmin] verifyIdToken failed:', err.message);
    return null;
  }
}
