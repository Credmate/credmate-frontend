type VerificationType = 'aadhar' | 'pan' | 'gst';

type VerificationStatus = 'pending' | 'verified' | 'failed' | 'not_started';

type UserPlan =
  | 'FREE'
  | 'PRO_INDIVIDUAL'
  | 'PRO_BUSINESS'
  | 'PRIORITY_BUSINESS';

interface VerificationState {
  status: VerificationStatus;
  lastAttempt?: string;
  message?: string;
}

interface ProfileData {
  // Core user data from login
  id: string;
  name: string;
  email?: string | null;
  phoneNumber: string;
  date_of_birth?: string;
  businessType: string;
  profileImageUrl: string | null;
  aadhaarNumber: string | null;
  panNumber: string | null;
  plan: UserPlan; // maps to UserPlan type
  planPrice?: number | null;
  referralCode?: string;
  status: 'ACTIVE' | 'INACTIVE';
  metadata?: any | null;
  createdAt?: string;
  updatedAt?: string;

  // credit score
  credmate_score?: number;
  cibil_score?: number;
  credit_score_enabled?: boolean;

  // Profile component fields
  address?: string;
  bio?: string;
  gstNo?: string;

  // Verification states
  verifications: {
    aadhar: { status: 'not_started' };
    pan: { status: 'not_started' };
    gst: { status: 'not_started' };
  };
}

export type {
  VerificationType,
  VerificationStatus,
  UserPlan,
  VerificationState,
  ProfileData,
};
