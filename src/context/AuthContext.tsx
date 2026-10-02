import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User as FirebaseUser, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../firebase/config';
import { 
  FirestoreUser, 
  FirestoreBusiness, 
  FirestoreReview, 
  FirestorePost, 
  FirestoreActivity,
  syncUserProfile, 
  getUserBusinesses, 
  createBusinessWorkspace, 
  linkGbpLocationToBusiness,
  syncReviewsToFirestore,
  getBusinessReviews,
  updateReviewReplyInFirestore,
  saveBusinessPost,
  getBusinessPosts,
  getBusinessActivities,
  logBusinessActivity
} from '../services/firestoreService';
import { 
  GbpAccount, 
  GbpLocation, 
  GbpReview, 
  authorizeGoogleBusinessProfile, 
  fetchRealGbpAccounts, 
  fetchRealGbpLocations, 
  fetchRealGbpReviews, 
  publishRealReviewReply, 
  publishRealLocalPost,
  GbpApiResult
} from '../services/gbpService';
import { generateAiReviewResponse } from '../services/aiResponder';

interface AuthContextType {
  // Real Firebase Auth
  currentUser: FirebaseUser | null;
  userProfile: FirestoreUser | null;
  isLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;

  // Real Business Workspaces in Firestore
  businesses: FirestoreBusiness[];
  activeBusiness: FirestoreBusiness | null;
  setActiveBusiness: (biz: FirestoreBusiness) => void;
  createBusiness: (data: { name: string; primaryCategory: string; address: string }) => Promise<FirestoreBusiness | null>;
  refreshBusinesses: () => Promise<void>;

  // Real Google Business Profile Flow B
  gbpAccessToken: string | null;
  gbpAccounts: GbpAccount[];
  gbpLocations: GbpLocation[];
  isGbpAuthorizing: boolean;
  gbpApiError: string | null;
  connectGoogleBusinessProfile: () => Promise<boolean>;
  selectAndLinkLocation: (account: GbpAccount, location: GbpLocation) => Promise<boolean>;
  syncLiveReviewsFromGoogle: () => Promise<void>;

  // Real Reviews, Posts & AI Approval
  reviews: FirestoreReview[];
  posts: FirestorePost[];
  activities: FirestoreActivity[];
  draftAiReply: (reviewId: string) => Promise<string>;
  approveAndPublishReply: (reviewId: string, replyText: string) => Promise<{ success: boolean; error?: string }>;
  publishPost: (post: { title: string; summary: string; callToAction: any; actionUrl: string }) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<FirestoreUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Business workspace state
  const [businesses, setBusinesses] = useState<FirestoreBusiness[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<FirestoreBusiness | null>(null);

  // Google Business Profile live OAuth state
  const [gbpAccessToken, setGbpAccessToken] = useState<string | null>(null);
  const [gbpAccounts, setGbpAccounts] = useState<GbpAccount[]>([]);
  const [gbpLocations, setGbpLocations] = useState<GbpLocation[]>([]);
  const [isGbpAuthorizing, setIsGbpAuthorizing] = useState<boolean>(false);
  const [gbpApiError, setGbpApiError] = useState<string | null>(null);

  // Business data
  const [reviews, setReviews] = useState<FirestoreReview[]>([]);
  const [posts, setPosts] = useState<FirestorePost[]>([]);
  const [activities, setActivities] = useState<FirestoreActivity[]>([]);

  const clearAuthError = () => {
    setAuthError(null);
    setGbpApiError(null);
  };

  // Listen to real Firebase Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      if (user) {
        setCurrentUser(user);
        try {
          const profile = await syncUserProfile(user);
          setUserProfile(profile);

          // Load real user businesses from Firestore
          const userBiz = await getUserBusinesses(user.uid);
          setBusinesses(userBiz);

          if (userBiz.length > 0) {
            setActiveBusiness(userBiz[0]);
          } else {
            setActiveBusiness(null);
          }
        } catch (e: any) {
          console.error('Error synchronizing user with Firestore:', e);
          setAuthError(e.message);
        }
      } else {
        // Explicitly unauthenticated: NO automatic test user login!
        setCurrentUser(null);
        setUserProfile(null);
        setBusinesses([]);
        setActiveBusiness(null);
        setGbpAccessToken(null);
        setGbpAccounts([]);
        setGbpLocations([]);
        setReviews([]);
        setPosts([]);
        setActivities([]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // When active business changes, load its Firestore subcollections
  useEffect(() => {
    if (!activeBusiness) {
      setReviews([]);
      setPosts([]);
      setActivities([]);
      return;
    }

    const loadBusinessData = async () => {
      try {
        const [revs, psts, acts] = await Promise.all([
          getBusinessReviews(activeBusiness.id),
          getBusinessPosts(activeBusiness.id),
          getBusinessActivities(activeBusiness.id),
        ]);
        setReviews(revs);
        setPosts(psts);
        setActivities(acts);
      } catch (err) {
        console.error('Failed to load business data from Firestore:', err);
      }
    };

    loadBusinessData();
  }, [activeBusiness?.id]);

  // FLOW A: Real Google Sign-In with Firebase Authentication
  const signInWithGoogle = async (): Promise<boolean> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      if (result.user) {
        const profile = await syncUserProfile(result.user);
        setUserProfile(profile);
        const bizList = await getUserBusinesses(result.user.uid);
        setBusinesses(bizList);
        if (bizList.length > 0) {
          setActiveBusiness(bizList[0]);
        }
        setIsLoading(false);
        return true;
      }
    } catch (err: any) {
      console.error('Firebase Google Sign-In Error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError(err.message || 'Google Sign-In failed.');
      }
    }
    setIsLoading(false);
    return false;
  };

  // Real Sign-out
  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      setGbpAccessToken(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Real Business Creation in Firestore
  const createBusiness = async (data: { name: string; primaryCategory: string; address: string }): Promise<FirestoreBusiness | null> => {
    if (!currentUser) return null;
    setIsLoading(true);
    try {
      const newBiz = await createBusinessWorkspace(currentUser.uid, data);
      const updatedList = [newBiz, ...businesses];
      setBusinesses(updatedList);
      setActiveBusiness(newBiz);
      setIsLoading(false);
      return newBiz;
    } catch (err: any) {
      setAuthError(err.message);
      setIsLoading(false);
      return null;
    }
  };

  const refreshBusinesses = async () => {
    if (!currentUser) return;
    try {
      const bizList = await getUserBusinesses(currentUser.uid);
      setBusinesses(bizList);
      if (bizList.length > 0 && !activeBusiness) {
        setActiveBusiness(bizList[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // FLOW B: Connect Google Business Profile via Real Google OAuth
  const connectGoogleBusinessProfile = async (): Promise<boolean> => {
    if (!currentUser || !activeBusiness) {
      setAuthError('You must create or select a business workspace first.');
      return false;
    }

    setIsGbpAuthorizing(true);
    setGbpApiError(null);

    const { accessToken, error } = await authorizeGoogleBusinessProfile();

    if (error || !accessToken) {
      setGbpApiError(error || 'Failed to authorize Google Business Profile.');
      setIsGbpAuthorizing(false);
      return false;
    }

    setGbpAccessToken(accessToken);

    // Call real Google Business Profile Accounts API
    const accResult = await fetchRealGbpAccounts(accessToken);

    if (!accResult.success || !accResult.data) {
      setGbpApiError(
        accResult.error || 'Failed to retrieve Google Business Profile accounts. Ensure Google My Business API is enabled in your Google Cloud Project.'
      );
      setIsGbpAuthorizing(false);
      return false;
    }

    setGbpAccounts(accResult.data);

    if (accResult.data.length === 0) {
      setGbpApiError('No Google Business Profile account found for this Google identity. Please create or verify a business in Google Business Profile first.');
      setIsGbpAuthorizing(false);
      return false;
    }

    // Fetch locations for primary account
    const primaryAccount = accResult.data[0];
    const locResult = await fetchRealGbpLocations(accessToken, primaryAccount.name);

    if (!locResult.success || !locResult.data) {
      setGbpApiError(locResult.error || 'Failed to fetch business locations from Google Business Information API.');
      setIsGbpAuthorizing(false);
      return false;
    }

    setGbpLocations(locResult.data);
    setIsGbpAuthorizing(false);
    return true;
  };

  // Select location & bind to Firestore
  const selectAndLinkLocation = async (account: GbpAccount, location: GbpLocation): Promise<boolean> => {
    if (!activeBusiness || !gbpAccessToken) return false;
    setIsLoading(true);
    try {
      await linkGbpLocationToBusiness(activeBusiness.id, {
        accountId: account.name,
        accountName: account.accountName,
        locationId: location.name,
        locationName: location.title,
        scopes: 'https://www.googleapis.com/auth/business.manage',
      });

      // Update local state
      setActiveBusiness({
        ...activeBusiness,
        gbpConnected: true,
        gbpLocationId: location.name,
        gbpLocationName: location.title,
      });

      // Fetch real Google reviews if available
      const revResult = await fetchRealGbpReviews(gbpAccessToken, account.name, location.name);
      if (revResult.success && revResult.data && revResult.data.length > 0) {
        const firestoreReviews: FirestoreReview[] = revResult.data.map((r) => ({
          id: r.reviewId,
          authorName: r.reviewer.displayName || 'Google User',
          authorPhotoUrl: r.reviewer.profilePhotoUrl,
          rating: r.starRating === 'FIVE' ? 5 : r.starRating === 'FOUR' ? 4 : r.starRating === 'THREE' ? 3 : r.starRating === 'TWO' ? 2 : 1,
          comment: r.comment || '',
          createTime: r.createTime,
          replyText: r.reviewReply?.comment,
          replyTime: r.reviewReply?.updateTime,
          status: r.reviewReply ? 'replied' : 'pending',
          googleReviewId: r.reviewId,
        }));
        await syncReviewsToFirestore(activeBusiness.id, firestoreReviews);
        setReviews(firestoreReviews);
      }

      // Refresh activity log
      const acts = await getBusinessActivities(activeBusiness.id);
      setActivities(acts);

      setIsLoading(false);
      return true;
    } catch (err: any) {
      setAuthError(err.message);
      setIsLoading(false);
      return false;
    }
  };

  // Sync live reviews from Google on demand
  const syncLiveReviewsFromGoogle = async () => {
    if (!activeBusiness || !activeBusiness.gbpLocationId || !gbpAccessToken) return;
    setIsLoading(true);
    try {
      const accountName = gbpAccounts[0]?.name || 'accounts/current';
      const locResult = await fetchRealGbpReviews(gbpAccessToken, accountName, activeBusiness.gbpLocationId);
      if (locResult.success && locResult.data) {
        const firestoreReviews: FirestoreReview[] = locResult.data.map((r) => ({
          id: r.reviewId,
          authorName: r.reviewer.displayName || 'Google User',
          authorPhotoUrl: r.reviewer.profilePhotoUrl,
          rating: r.starRating === 'FIVE' ? 5 : r.starRating === 'FOUR' ? 4 : r.starRating === 'THREE' ? 3 : r.starRating === 'TWO' ? 2 : 1,
          comment: r.comment || '',
          createTime: r.createTime,
          replyText: r.reviewReply?.comment,
          replyTime: r.reviewReply?.updateTime,
          status: r.reviewReply ? 'replied' : 'pending',
          googleReviewId: r.reviewId,
        }));
        await syncReviewsToFirestore(activeBusiness.id, firestoreReviews);
        setReviews(firestoreReviews);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // AI draft generation
  const draftAiReply = async (reviewId: string): Promise<string> => {
    const rev = reviews.find((r) => r.id === reviewId);
    if (!rev || !activeBusiness) return '';
    return await generateAiReviewResponse({
      businessName: activeBusiness.name,
      reviewerName: rev.authorName,
      rating: rev.rating,
      reviewComment: rev.comment,
    });
  };

  // Owner approval and real Google publishing
  const approveAndPublishReply = async (reviewId: string, replyText: string): Promise<{ success: boolean; error?: string }> => {
    if (!activeBusiness) return { success: false, error: 'No active business' };

    // If Google token is available and location connected, publish directly to Google
    if (gbpAccessToken && activeBusiness.gbpLocationId && gbpAccounts[0]) {
      const pubResult = await publishRealReviewReply(
        gbpAccessToken,
        gbpAccounts[0].name,
        activeBusiness.gbpLocationId,
        reviewId,
        replyText
      );

      if (!pubResult.success) {
        try {
          await logBusinessActivity(activeBusiness.id, {
            action: 'Google Review Reply Failed',
            details: pubResult.error || 'Google API rejected review reply',
            platform: 'web',
          });
          const acts = await getBusinessActivities(activeBusiness.id);
          setActivities(acts);
        } catch (logErr) {
          console.error(logErr);
        }
        return { success: false, error: pubResult.error || 'Google Business Profile rejected reply.' };
      }
    }

    // Update Firestore record
    try {
      await updateReviewReplyInFirestore(activeBusiness.id, reviewId, replyText);
      const updatedReviews = reviews.map((r) =>
        r.id === reviewId ? { ...r, replyText, replyTime: new Date().toISOString(), status: 'replied' as const } : r
      );
      setReviews(updatedReviews);
      await logBusinessActivity(activeBusiness.id, {
        action: 'Review Reply Approved & Published',
        details: `Published response to review ${reviewId}: "${replyText.slice(0, 80)}${replyText.length > 80 ? '...' : ''}"`,
        platform: 'web',
      });
      const acts = await getBusinessActivities(activeBusiness.id);
      setActivities(acts);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  // Real post publication
  const publishPost = async (post: { title: string; summary: string; callToAction: any; actionUrl: string }): Promise<{ success: boolean; error?: string }> => {
    if (!activeBusiness) return { success: false, error: 'No active business' };

    if (gbpAccessToken && activeBusiness.gbpLocationId && gbpAccounts[0]) {
      const pubResult = await publishRealLocalPost(
        gbpAccessToken,
        gbpAccounts[0].name,
        activeBusiness.gbpLocationId,
        {
          summary: `${post.title}\n\n${post.summary}`,
          callToAction: {
            actionType: post.callToAction === 'ORDER_ONLINE' ? 'ORDER' : post.callToAction === 'LEARN_MORE' ? 'LEARN_MORE' : 'CALL',
            url: post.actionUrl,
          },
        }
      );

      if (!pubResult.success) {
        try {
          await logBusinessActivity(activeBusiness.id, {
            action: 'Google Post Publish Failed',
            details: pubResult.error || 'Google API rejected local post',
            platform: 'web',
          });
          const acts = await getBusinessActivities(activeBusiness.id);
          setActivities(acts);
        } catch (logErr) {
          console.error(logErr);
        }
        return { success: false, error: pubResult.error || 'Google Post publish failed.' };
      }
    }

    try {
      const newPost = await saveBusinessPost(activeBusiness.id, {
        title: post.title,
        summary: post.summary,
        callToAction: post.callToAction,
        actionUrl: post.actionUrl,
        status: 'published',
        createTime: new Date().toISOString(),
      });
      setPosts([newPost, ...posts]);
      await logBusinessActivity(activeBusiness.id, {
        action: 'Google Post Published',
        details: `Published post: "${post.title}"`,
        platform: 'web',
      });
      const acts = await getBusinessActivities(activeBusiness.id);
      setActivities(acts);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isLoading,
        authError,
        clearAuthError,
        signInWithGoogle,
        logout,
        businesses,
        activeBusiness,
        setActiveBusiness,
        createBusiness,
        refreshBusinesses,
        gbpAccessToken,
        gbpAccounts,
        gbpLocations,
        isGbpAuthorizing,
        gbpApiError,
        connectGoogleBusinessProfile,
        selectAndLinkLocation,
        syncLiveReviewsFromGoogle,
        reviews,
        posts,
        activities,
        draftAiReply,
        approveAndPublishReply,
        publishPost,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
