import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  increment,
  writeBatch,
  Timestamp,
  DocumentSnapshot,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import { generateQRId, generateActivationCode } from './id-generator';
import { buildRedirectURL } from './qr-utils';

// Types
export interface QRCodeRecord {
  id: string; // Firestore document ID
  ownerId: string;
  qrId: string;
  activationCode: string;
  redirectUrl: string;
  destinationUrl: string;
  status: 'inactive' | 'active' | 'disabled';
  scanCount: number;
  createdAt: Timestamp;
  activatedAt: Timestamp | null;
  updatedAt: Timestamp;
}

export type PlanTier = 'free' | 'starter' | 'business';

export interface UserRecord {
  email: string;
  displayName: string;
  createdAt: Timestamp;
  plan?: PlanTier;
  planUpdatedAt?: Timestamp;
}

export const PLAN_LIMITS: Record<PlanTier, {
  qrLimit: number;
  name: string;
  badge: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
}> = {
  free: {
    qrLimit: 3,
    name: 'Free Trial',
    badge: 'Free',
    priceMonthly: 0,
    priceYearly: 0,
    features: ['3 Dynamic QR Codes', 'Basic Scan Tracking', 'Standard Resolution PNG', 'Mobile Redirects'],
  },
  starter: {
    qrLimit: 20,
    name: 'Starter Pro',
    badge: 'Popular',
    priceMonthly: 299,
    priceYearly: 999,
    features: ['20 Dynamic QR Codes', 'Google Review Standee Templates', 'High-Res SVG & PNG', 'Instant Live Analytics', 'Batch Print Support'],
  },
  business: {
    qrLimit: 999999,
    name: 'Business VIP',
    badge: 'Unlimited',
    priceMonthly: 799,
    priceYearly: 2499,
    features: ['Unlimited Dynamic QRs', 'All Standee & NFC Templates', 'Custom Logo & Branding', 'Priority Support', 'Full CSV & ZIP Export'],
  },
};

// Collection references
const qrCodesCollection = collection(db, 'qrCodes');
const usersCollection = collection(db, 'users');

/**
 * Create a user document in Firestore
 */
export async function createUserDocument(
  uid: string,
  email: string,
  displayName: string = ''
): Promise<void> {
  await setDoc(doc(usersCollection, uid), {
    email,
    displayName: displayName || email.split('@')[0],
    plan: 'free',
    createdAt: Timestamp.now(),
  }, { merge: true });
}

/**
 * Get user document
 */
export async function getUserDocument(uid: string): Promise<UserRecord | null> {
  const docSnap = await getDoc(doc(usersCollection, uid));
  if (docSnap.exists()) {
    return docSnap.data() as UserRecord;
  }
  return null;
}

/**
 * Get user plan and usage status
 */
export async function getUserPlanAndUsage(userId: string): Promise<{
  plan: PlanTier;
  planName: string;
  qrLimit: number;
  qrUsed: number;
  remaining: number;
  canGenerate: boolean;
}> {
  const [userDoc, qrsSnapshot] = await Promise.all([
    getUserDocument(userId),
    getDocs(query(qrCodesCollection, where('ownerId', '==', userId))),
  ]);

  const plan: PlanTier = (userDoc?.plan as PlanTier) || 'free';
  const planInfo = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  const qrLimit = planInfo.qrLimit;
  const qrUsed = qrsSnapshot.size;
  const remaining = Math.max(0, qrLimit - qrUsed);

  return {
    plan,
    planName: planInfo.name,
    qrLimit,
    qrUsed,
    remaining,
    canGenerate: qrUsed < qrLimit,
  };
}

/**
 * Update user plan (e.g. on upgrade)
 */
export async function updateUserPlan(uid: string, plan: PlanTier): Promise<void> {
  await setDoc(doc(usersCollection, uid), {
    plan,
    planUpdatedAt: Timestamp.now(),
  }, { merge: true });
}

/**
 * Generate QR codes in bulk using batched writes
 * Firestore batch limit is 500 per batch
 */
export async function generateBulkQRCodes(
  ownerId: string,
  count: number,
  onProgress?: (current: number, total: number) => void
): Promise<QRCodeRecord[]> {
  const records: QRCodeRecord[] = [];
  const batchSize = 500;
  const totalBatches = Math.ceil(count / batchSize);
  
  // Pre-generate all unique IDs and activation codes
  const qrIds = new Set<string>();
  const activationCodes = new Set<string>();
  
  while (qrIds.size < count) {
    qrIds.add(generateQRId());
  }
  while (activationCodes.size < count) {
    activationCodes.add(generateActivationCode());
  }
  
  const qrIdArray = Array.from(qrIds);
  const actCodeArray = Array.from(activationCodes);
  
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const batch = writeBatch(db);
    const start = batchIndex * batchSize;
    const end = Math.min(start + batchSize, count);
    
    for (let i = start; i < end; i++) {
      const docRef = doc(qrCodesCollection);
      const qrId = qrIdArray[i];
      const now = Timestamp.now();
      
      const record: QRCodeRecord = {
        id: docRef.id,
        ownerId,
        qrId,
        activationCode: actCodeArray[i],
        redirectUrl: buildRedirectURL(qrId),
        destinationUrl: '',
        status: 'inactive',
        scanCount: 0,
        createdAt: now,
        activatedAt: null,
        updatedAt: now,
      };
      
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...firestoreData } = record;
      batch.set(docRef, firestoreData);
      records.push(record);
    }
    
    await batch.commit();
    onProgress?.(end, count);
  }
  
  return records;
}

/**
 * Get all QR codes for a user
 */
export async function getUserQRCodes(
  ownerId: string,
  statusFilter?: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _lastDoc?: DocumentSnapshot,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _pageSize: number = 20
): Promise<{ records: QRCodeRecord[]; lastVisible: DocumentSnapshot | null }> {
  // Query by ownerId only to avoid requiring Firestore composite indexes
  const q = query(qrCodesCollection, where('ownerId', '==', ownerId));
  const snapshot = await getDocs(q);
  
  let records: QRCodeRecord[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as QRCodeRecord[];
  
  // Sort in-memory by createdAt descending
  records.sort((a, b) => {
    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return timeB - timeA;
  });
  
  // Filter by status in-memory
  if (statusFilter && statusFilter !== 'all') {
    records = records.filter((r) => r.status === statusFilter);
  }
  
  return { records, lastVisible: null };
}

/**
 * Get a single QR code by Firestore document ID
 */
export async function getQRCodeById(docId: string): Promise<QRCodeRecord | null> {
  const docSnap = await getDoc(doc(qrCodesCollection, docId));
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as QRCodeRecord;
  }
  return null;
}

/**
 * Get a QR code by its qrId field (e.g., QR-8F42K9)
 */
export async function getQRCodeByQRId(qrId: string): Promise<QRCodeRecord | null> {
  const q = query(qrCodesCollection, where('qrId', '==', qrId), limit(1));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as QRCodeRecord;
}

/**
 * Get a QR code by its activation code
 */
export async function getQRCodeByActivationCode(
  activationCode: string
): Promise<QRCodeRecord | null> {
  const q = query(
    qrCodesCollection,
    where('activationCode', '==', activationCode),
    limit(1)
  );
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as QRCodeRecord;
}

/**
 * Activate a QR code
 */
export async function activateQRCode(docId: string): Promise<void> {
  await updateDoc(doc(qrCodesCollection, docId), {
    status: 'active',
    activatedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

/**
 * Deactivate a QR code
 */
export async function deactivateQRCode(docId: string): Promise<void> {
  await updateDoc(doc(qrCodesCollection, docId), {
    status: 'disabled',
    updatedAt: Timestamp.now(),
  });
}

/**
 * Update destination URL
 */
export async function updateDestinationUrl(
  docId: string,
  destinationUrl: string
): Promise<void> {
  await updateDoc(doc(qrCodesCollection, docId), {
    destinationUrl,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Increment scan count
 */
export async function incrementScanCount(docId: string): Promise<void> {
  await updateDoc(doc(qrCodesCollection, docId), {
    scanCount: increment(1),
    updatedAt: Timestamp.now(),
  });
}

/**
 * Delete a QR code
 */
export async function deleteQRCode(docId: string): Promise<void> {
  await deleteDoc(doc(qrCodesCollection, docId));
}

/**
 * Get dashboard stats for a user
 */
export async function getDashboardStats(ownerId: string): Promise<{
  total: number;
  active: number;
  inactive: number;
  disabled: number;
  totalScans: number;
}> {
  const q = query(qrCodesCollection, where('ownerId', '==', ownerId));
  const snapshot = await getDocs(q);
  
  let active = 0;
  let inactive = 0;
  let disabled = 0;
  let totalScans = 0;
  
  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    if (data.status === 'active') active++;
    else if (data.status === 'inactive') inactive++;
    else if (data.status === 'disabled') disabled++;
    totalScans += data.scanCount || 0;
  });
  
  return {
    total: snapshot.size,
    active,
    inactive,
    disabled,
    totalScans,
  };
}

/**
 * Search QR codes by ID
 */
export async function searchQRCodes(
  ownerId: string,
  searchTerm: string
): Promise<QRCodeRecord[]> {
  // Firestore doesn't support full-text search, so we fetch user's QRs and filter client-side
  const q = query(qrCodesCollection, where('ownerId', '==', ownerId));
  const snapshot = await getDocs(q);
  
  const term = searchTerm.toUpperCase();
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as QRCodeRecord)
    .filter(
      (record) =>
        record.qrId.toUpperCase().includes(term) ||
        record.activationCode.toUpperCase().includes(term) ||
        (record.destinationUrl && record.destinationUrl.toLowerCase().includes(searchTerm.toLowerCase()))
    );
}

/**
 * Record a scan event
 */
export async function recordScan(qrDocId: string, userAgent: string): Promise<void> {
  const scansCollection = collection(db, 'qrCodes', qrDocId, 'scans');
  const scanDoc = doc(scansCollection);
  
  await setDoc(scanDoc, {
    timestamp: Timestamp.now(),
    userAgent,
    deviceType: detectDeviceType(userAgent),
  });
  
  await incrementScanCount(qrDocId);
}

/**
 * Simple device type detection from user agent
 */
function detectDeviceType(userAgent: string): string {
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  return 'desktop';
}
