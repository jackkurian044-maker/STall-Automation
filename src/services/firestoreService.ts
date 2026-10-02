import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase/config';

export interface FirestoreUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  role: 'owner' | 'manager' | 'staff';
  createdAt: string;
}

export interface FirestoreBusiness {
  id: string;
  name: string;
  primaryCategory: string;
  address: string;
  ownerId: string;
  createdAt: string;
  updatedAt?: string;
  gbpConnected?: boolean;
  gbpLocationId?: string;
  gbpLocationName?: string;
}

export interface FirestoreReview {
  id: string;
  authorName: string;
  authorPhotoUrl?: string;
  rating: number;
  comment: string;
  createTime: string;
  replyText?: string;
  replyTime?: string;
  status: 'pending' | 'replied' | 'flagged';
  googleReviewId?: string;
}

export interface FirestorePost {
  id: string;
  title: string;
  summary: string;
  callToAction: 'ORDER_ONLINE' | 'LEARN_MORE' | 'CALL_NOW' | 'SIGN_UP';
  actionUrl: string;
  status: 'draft' | 'scheduled' | 'published';
  createTime: string;
  googlePostId?: string;
}

export interface FirestoreActivity {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  actorEmail: string;
  platform: string;
}

/**
 * Ensures user document exists in users/{userId}
 */
export async function syncUserProfile(user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null }): Promise<FirestoreUser> {
  const userRef = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as FirestoreUser;
    }

    const newUser: FirestoreUser = {
      id: user.uid,
      email: user.email || '',
      name: user.displayName || user.email?.split('@')[0] || 'Store Owner',
      avatarUrl: user.photoURL || '',
      role: 'owner',
      createdAt: new Date().toISOString(),
    };

    await setDoc(userRef, newUser);
    return newUser;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    throw error;
  }
}

/**
 * Loads businesses owned by the current user
 */
export async function getUserBusinesses(userId: string): Promise<FirestoreBusiness[]> {
  const businessesRef = collection(db, 'businesses');
  try {
    const q = query(businessesRef, where('ownerId', '==', userId));
    const querySnapshot = await getDocs(q);
    const businesses: FirestoreBusiness[] = [];
    querySnapshot.forEach((docSnap) => {
      businesses.push({ id: docSnap.id, ...(docSnap.data() as any) });
    });
    return businesses;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'businesses');
    throw error;
  }
}

/**
 * Creates a real business workspace in Firestore
 */
export async function createBusinessWorkspace(
  userId: string, 
  data: { name: string; primaryCategory: string; address: string }
): Promise<FirestoreBusiness> {
  const businessesRef = collection(db, 'businesses');
  try {
    const docRef = await addDoc(businessesRef, {
      name: data.name,
      primaryCategory: data.primaryCategory,
      address: data.address,
      ownerId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      gbpConnected: false,
    });

    // Also add member record
    const memberRef = doc(db, 'businesses', docRef.id, 'members', userId);
    await setDoc(memberRef, {
      userId,
      email: auth.currentUser?.email || '',
      role: 'owner',
      addedAt: new Date().toISOString(),
    });

    // Log creation in activity
    await logBusinessActivity(docRef.id, {
      action: 'Business Workspace Created',
      details: `Initialized Store Automation workspace for "${data.name}"`,
      platform: 'web',
    });

    return {
      id: docRef.id,
      name: data.name,
      primaryCategory: data.primaryCategory,
      address: data.address,
      ownerId: userId,
      createdAt: new Date().toISOString(),
      gbpConnected: false,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'businesses');
    throw error;
  }
}

/**
 * Updates Google Business Profile connection metadata in Firestore
 */
export async function linkGbpLocationToBusiness(
  businessId: string,
  connection: {
    accountId: string;
    accountName: string;
    locationId: string;
    locationName: string;
    scopes: string;
  }
) {
  try {
    // Save to subcollection
    const connRef = doc(db, 'businesses', businessId, 'googleConnections', 'primary');
    await setDoc(connRef, {
      id: 'primary',
      ...connection,
      status: 'connected',
      authorizedAt: new Date().toISOString(),
    });

    // Update business summary flag
    const bizRef = doc(db, 'businesses', businessId);
    await updateDoc(bizRef, {
      gbpConnected: true,
      gbpLocationId: connection.locationId,
      gbpLocationName: connection.locationName,
      updatedAt: new Date().toISOString(),
    });

    await logBusinessActivity(businessId, {
      action: 'Google Business Profile Connected',
      details: `Bound location "${connection.locationName}" (${connection.locationId}) to workspace`,
      platform: 'web',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `businesses/${businessId}/googleConnections/primary`);
    throw error;
  }
}

/**
 * Saves real Google reviews to Firestore subcollection
 */
export async function syncReviewsToFirestore(businessId: string, reviews: FirestoreReview[]) {
  try {
    for (const rev of reviews) {
      const revRef = doc(db, 'businesses', businessId, 'reviews', rev.id);
      await setDoc(revRef, rev, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `businesses/${businessId}/reviews`);
    throw error;
  }
}

/**
 * Fetches reviews from Firestore
 */
export async function getBusinessReviews(businessId: string): Promise<FirestoreReview[]> {
  const reviewsRef = collection(db, 'businesses', businessId, 'reviews');
  try {
    const snap = await getDocs(reviewsRef);
    const reviews: FirestoreReview[] = [];
    snap.forEach((d) => {
      reviews.push({ id: d.id, ...(d.data() as any) });
    });
    return reviews;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `businesses/${businessId}/reviews`);
    throw error;
  }
}

/**
 * Updates review response in Firestore
 */
export async function updateReviewReplyInFirestore(businessId: string, reviewId: string, replyText: string) {
  const revRef = doc(db, 'businesses', businessId, 'reviews', reviewId);
  try {
    await updateDoc(revRef, {
      replyText,
      replyTime: new Date().toISOString(),
      status: 'replied',
    });

    await logBusinessActivity(businessId, {
      action: 'Review Reply Published',
      details: `Published approved reply to review ${reviewId}: "${replyText.substring(0, 60)}..."`,
      platform: 'web',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `businesses/${businessId}/reviews/${reviewId}`);
    throw error;
  }
}

/**
 * Saves a published Google post to Firestore
 */
export async function saveBusinessPost(businessId: string, post: Omit<FirestorePost, 'id'>): Promise<FirestorePost> {
  const postsRef = collection(db, 'businesses', businessId, 'posts');
  try {
    const docRef = await addDoc(postsRef, post);
    await logBusinessActivity(businessId, {
      action: 'Google Post Published',
      details: `Published post "${post.title}" to Google Business Profile`,
      platform: 'web',
    });
    return { id: docRef.id, ...post };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `businesses/${businessId}/posts`);
    throw error;
  }
}

/**
 * Fetches posts from Firestore
 */
export async function getBusinessPosts(businessId: string): Promise<FirestorePost[]> {
  const postsRef = collection(db, 'businesses', businessId, 'posts');
  try {
    const snap = await getDocs(postsRef);
    const posts: FirestorePost[] = [];
    snap.forEach((d) => {
      posts.push({ id: d.id, ...(d.data() as any) });
    });
    return posts;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `businesses/${businessId}/posts`);
    throw error;
  }
}

/**
 * Logs activity to Firestore subcollection
 */
export async function logBusinessActivity(businessId: string, data: { action: string; details: string; platform?: string }) {
  const actRef = collection(db, 'businesses', businessId, 'activity');
  try {
    await addDoc(actRef, {
      action: data.action,
      details: data.details,
      timestamp: new Date().toISOString(),
      actorEmail: auth.currentUser?.email || 'authenticated_user',
      platform: data.platform || 'web',
    });
  } catch (error) {
    // Activity logging shouldn't crash app if permission error, but we log it
    console.warn('Activity logging warning:', error);
  }
}

/**
 * Fetches activities from Firestore
 */
export async function getBusinessActivities(businessId: string): Promise<FirestoreActivity[]> {
  const actRef = collection(db, 'businesses', businessId, 'activity');
  try {
    const snap = await getDocs(actRef);
    const activities: FirestoreActivity[] = [];
    snap.forEach((d) => {
      activities.push({ id: d.id, ...(d.data() as any) });
    });
    // Sort descending by timestamp
    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `businesses/${businessId}/activity`);
    throw error;
  }
}
