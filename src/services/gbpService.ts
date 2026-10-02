import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase/config';

export interface GbpAccount {
  name: string; // e.g. "accounts/123456789"
  accountName: string; // Display name
  type: string;
  role: string;
  verificationState?: string;
}

export interface GbpLocation {
  name: string; // e.g. "locations/987654321"
  title: string;
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string;
    administrativeArea?: string;
    postalCode?: string;
  };
  websiteUri?: string;
  phoneNumbers?: {
    primaryPhone?: string;
  };
  categories?: {
    primaryCategory?: {
      displayName?: string;
    };
  };
  regularHours?: any;
}

export interface GbpReview {
  reviewId: string;
  reviewer: {
    displayName: string;
    profilePhotoUrl?: string;
  };
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';
  comment?: string;
  createTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

export interface GbpApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  googleStatus?: number;
  rawError?: any;
}

/**
 * FLOW B: Requests Google Business Profile authorization (business.manage scope)
 * Returns the Google Access Token directly from Google's OAuth consent
 */
export async function authorizeGoogleBusinessProfile(): Promise<{ accessToken: string | null; error: string | null }> {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/business.manage');
    provider.setCustomParameters({
      prompt: 'consent',
      access_type: 'offline',
    });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || null;

    if (!accessToken) {
      return { accessToken: null, error: 'Google OAuth succeeded but no access token was returned for Google Business Profile.' };
    }

    return { accessToken, error: null };
  } catch (err: any) {
    console.error('GBP OAuth Error:', err);
    if (err.code === 'auth/popup-closed-by-user') {
      return { accessToken: null, error: 'Authorization was cancelled (popup closed by user).' };
    }
    return { accessToken: null, error: err.message || 'Google Business Profile OAuth failed.' };
  }
}

/**
 * Calls Google Business Profile Account Management API via secure backend proxy
 * GET /api/gbp/accounts
 */
export async function fetchRealGbpAccounts(accessToken: string): Promise<GbpApiResult<GbpAccount[]>> {
  try {
    const res = await fetch('/api/gbp/accounts', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data.error?.message || `Google API Error HTTP ${res.status}`;
      return {
        success: false,
        error: `HTTP ${res.status} [${data.error?.status || 'ERROR'}]: ${errMsg}`,
        googleStatus: res.status,
        rawError: data,
      };
    }

    const accounts: GbpAccount[] = data.accounts || [];
    return {
      success: true,
      data: accounts,
      googleStatus: res.status,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Network error connecting to Google API: ${err.message}`,
    };
  }
}

/**
 * Calls Google Business Information API via secure backend proxy
 * GET /api/gbp/locations
 */
export async function fetchRealGbpLocations(accessToken: string, accountName: string): Promise<GbpApiResult<GbpLocation[]>> {
  try {
    const url = `/api/gbp/locations?accountName=${encodeURIComponent(accountName)}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data.error?.message || `Google API Error HTTP ${res.status}`;
      return {
        success: false,
        error: `HTTP ${res.status} [${data.error?.status || 'ERROR'}]: ${errMsg}`,
        googleStatus: res.status,
        rawError: data,
      };
    }

    const locations: GbpLocation[] = data.locations || [];
    return {
      success: true,
      data: locations,
      googleStatus: res.status,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Network error connecting to Google Business API: ${err.message}`,
    };
  }
}

/**
 * Calls Google Business Profile Reviews API via secure backend proxy
 * GET /api/gbp/reviews
 */
export async function fetchRealGbpReviews(
  accessToken: string, 
  accountName: string, 
  locationName: string
): Promise<GbpApiResult<GbpReview[]>> {
  try {
    const url = `/api/gbp/reviews?accountName=${encodeURIComponent(accountName)}&locationName=${encodeURIComponent(locationName)}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();

    if (!res.ok) {
      const errDetails = data.error?.message || `Google API Error HTTP ${res.status}`;
      return {
        success: false,
        error: `HTTP ${res.status} [${data.error?.status || 'ERROR'}]: ${errDetails}`,
        googleStatus: res.status,
        rawError: data,
      };
    }

    const reviews: GbpReview[] = data.reviews || [];
    return {
      success: true,
      data: reviews,
      googleStatus: res.status,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Network error: ${err.message}`,
    };
  }
}

/**
 * Publishes reply to customer review on Google Maps/Search via secure backend proxy
 * PUT /api/gbp/reviews/reply
 */
export async function publishRealReviewReply(
  accessToken: string,
  accountName: string,
  locationName: string,
  reviewId: string,
  replyText: string
): Promise<GbpApiResult<{ comment: string }>> {
  try {
    const res = await fetch('/api/gbp/reviews/reply', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountName,
        locationName,
        reviewId,
        comment: replyText,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const errDetails = data.error?.message || `Google Review Reply Error HTTP ${res.status}`;
      return {
        success: false,
        error: `HTTP ${res.status} [${data.error?.status || 'ERROR'}]: ${errDetails}`,
        googleStatus: res.status,
        rawError: data,
      };
    }

    return {
      success: true,
      data,
      googleStatus: res.status,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Network error publishing review reply: ${err.message}`,
    };
  }
}

/**
 * Publishes Google Business Profile Local Post via secure backend proxy
 * POST /api/gbp/posts
 */
export async function publishRealLocalPost(
  accessToken: string,
  accountName: string,
  locationName: string,
  post: {
    summary: string;
    callToAction?: {
      actionType: 'LEARN_MORE' | 'ORDER' | 'CALL' | 'SIGN_UP';
      url?: string;
    };
  }
): Promise<GbpApiResult<any>> {
  try {
    const res = await fetch('/api/gbp/posts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountName,
        locationName,
        summary: post.summary,
        callToAction: post.callToAction,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const errDetails = data.error?.message || `Google Post Publish Error HTTP ${res.status}`;
      return {
        success: false,
        error: `HTTP ${res.status} [${data.error?.status || 'ERROR'}]: ${errDetails}`,
        googleStatus: res.status,
        rawError: data,
      };
    }

    return {
      success: true,
      data,
      googleStatus: res.status,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Network error publishing post: ${err.message}`,
    };
  }
}
