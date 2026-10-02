export type PlatformType = 'web' | 'android' | 'ios';

export interface LinkedIdentity {
  provider: 'google';
  sub: string;
  email: string;
  linkedAt: string;
  lastPlatform: PlatformType;
}

export interface PlatformSession {
  sessionId: string;
  platform: PlatformType;
  deviceInfo: string;
  ip: string;
  createdAt: string;
  lastActiveAt: string;
}

export interface GbpLocation {
  id: string;
  name: string;
  address: string;
  category: string;
  phone: string;
  website: string;
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  status: 'connected' | 'available';
  operatingHours: { [key: string]: string };
}

export interface StoreReview {
  id: string;
  authorName: string;
  authorPhotoUrl?: string;
  rating: number;
  comment: string;
  createTime: string;
  replyText?: string;
  replyTime?: string;
  status: 'replied' | 'pending' | 'flagged';
  platformOrigin: 'google_business_profile';
}

export interface StorePost {
  id: string;
  title: string;
  summary: string;
  callToAction: 'LEARN_MORE' | 'ORDER_ONLINE' | 'CALL_NOW' | 'SIGN_UP';
  actionUrl: string;
  status: 'published' | 'scheduled' | 'draft';
  createTime: string;
  viewCount: number;
  clickCount: number;
}

export interface StoreOffer {
  id: string;
  title: string;
  couponCode: string;
  discount: string;
  validThrough: string;
  status: 'active' | 'expired';
}

export interface StoreService {
  id: string;
  name: string;
  description: string;
  price: string;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  platform: PlatformType;
  action: string;
  details: string;
  actorEmail: string;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  role: 'owner' | 'manager';
  createdAt: string;
  identities: LinkedIdentity[];
  activeSessions: PlatformSession[];
  gbpConnection: {
    authorized: boolean;
    authorizedAt?: string;
    accountId?: string;
    accountName?: string;
    grantedScopes: string[];
    connectedLocationId?: string;
  };
  businesses: {
    id: string;
    name: string;
    primaryCategory: string;
    address: string;
  }[];
  locations: GbpLocation[];
  reviews: StoreReview[];
  posts: StorePost[];
  offers: StoreOffer[];
  services: StoreService[];
  automationRules: {
    autoReplyFiveStar: boolean;
    fiveStarTemplate: string;
    escalateCriticalReviews: boolean;
    syncHolidayHours: boolean;
    weeklyDigestNotification: boolean;
  };
  activityLog: ActivityEvent[];
}

export interface TestCaseResult {
  platform: 'web' | 'android' | 'ios' | 'e2e_pipeline';
  id: string;
  title: string;
  passed: boolean;
  durationMs: number;
  testCategory: 'UNIT TEST' | 'INTEGRATION TEST' | 'REAL API TEST' | 'DEVICE TEST' | 'END-TO-END TEST';
  executionLabel: 'REAL INTEGRATION TEST' | 'SIMULATED TEST';
  actualStatus: 'REAL' | 'PARTIAL' | 'SIMULATED' | 'NOT IMPLEMENTED';
  assertions: string[];
  details: string;
}
