import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getAdminApp } from './firebaseAdmin';

function db() {
  return getFirestore(getAdminApp(), process.env.FIREBASE_DATABASE_ID ?? 'gastos');
}

export async function verifyIdToken(token: string): Promise<DecodedIdToken | null> {
  try {
    return await getAuth(getAdminApp()).verifyIdToken(token);
  } catch {
    return null;
  }
}

export async function checkAiAccess(uid: string): Promise<boolean> {
  const snap = await db().collection('aiAccess').doc(uid).get();
  return snap.exists && snap.data()?.enabled === true;
}

export async function loadHouseholdData(uid: string) {
  const userSnap = await db().collection('users').doc(uid).get();
  const householdId = userSnap.data()?.householdId as string | undefined;
  if (!householdId) return null;

  const hhSnap = await db().collection('households').doc(householdId).get();
  if (!hhSnap.exists) return null;

  const data = hhSnap.data()!;
  if (!Array.isArray(data.members) || !(data.members as string[]).includes(uid)) return null;

  return { householdId, data };
}
