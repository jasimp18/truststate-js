/**
 * Membership Types
 *
 * Types for validator membership management
 */

/**
 * Supported chains for membership deposits
 */
export type SupportedChain = 'hedera' | 'xrpl';

/**
 * Membership application statuses
 */
export type MembershipApplicationStatus =
  | 'pending_deposit'
  | 'deposit_received'
  | 'active'
  | 'expired'
  | 'leaving'
  | 'left'
  | 'banned';

/**
 * Membership application request
 */
export type MembershipApplicationRequest = {
  /** Applicant's node ID */
  nodeId: string;
  /** Applicant's account ID on the chosen chain */
  accountId: string;
  /** Chain for deposit (hedera or xrpl) */
  chain: SupportedChain;
  /** Applicant's public key */
  publicKey: string;
  /** Applicant's endpoint URL */
  endpoint: string;
  /** Accounts on other chains (optional) */
  chainAccounts?: Partial<Record<SupportedChain, string>>;
  /** Capabilities (optional) */
  capabilities?: string[];
};

/**
 * Membership application response
 */
export type MembershipApplicationResponse = {
  success: boolean;
  applicationId?: string;
  status?: MembershipApplicationStatus;
  depositInstructions?: {
    walletAddress: string;
    tokenId: string;
    amount: string;
    chain: string;
  };
  message: string;
};

/**
 * Application status response
 */
export type ApplicationStatusResponse = {
  applicationId: string;
  nodeId: string;
  status: MembershipApplicationStatus;
  depositWallet: {
    walletAddress: string;
    chain: string;
    depositAmount: string;
    actualDepositAmount?: string;
    status: string;
    lockedUntil?: string;
  } | null;
  membershipNftSerial?: number;
  expiresAt?: string;
  submittedAt: string;
  activatedAt?: string;
};

/**
 * Membership status response
 */
export type MembershipStatusResponse = {
  nodeId: string;
  hasMembership: boolean;
  isValid: boolean;
  application: {
    applicationId: string;
    status: MembershipApplicationStatus;
    expiresAt?: string;
    membershipNftSerial?: number;
  } | null;
};

/**
 * Membership activation response
 */
export type ActivationResponse = {
  success: boolean;
  applicationId?: string;
  status?: MembershipApplicationStatus;
  validatorEntry?: {
    nodeId: string;
    accountId: string;
    status: string;
    membershipExpiresAt?: string;
  };
  message: string;
};

/**
 * Membership renewal request
 */
export type MembershipRenewalRequest = {
  /** Node ID to renew */
  nodeId: string;
  /** Additional lock days (uses config default if not provided) */
  additionalDays?: number;
};

/**
 * Membership renewal response
 */
export type RenewalResponse = {
  success: boolean;
  nodeId: string;
  status?: MembershipApplicationStatus;
  newExpiresAt?: string;
  message: string;
};

/**
 * Leave request
 */
export type LeaveRequest = {
  /** Node ID requesting leave */
  nodeId: string;
  /** Address to receive released deposit */
  recipientAddress: string;
};

/**
 * Leave response
 */
export type LeaveResponse = {
  success: boolean;
  nodeId: string;
  depositReleasable: boolean;
  releaseableAt?: Date;
  message: string;
};

/**
 * Membership configuration
 */
export type MembershipConfig = {
  membershipDepositAmount: string;
  subscriptionDepositAmount: string;
  lockDurationDays: number;
  renewalWindowDays: number;
  hsuiteTokenIds: Record<string, string>;
};

/**
 * Application list response
 */
export type ApplicationListResponse = {
  count: number;
  applications: Array<{
    applicationId: string;
    nodeId: string;
    status: MembershipApplicationStatus;
    expiresAt?: string;
    submittedAt: string;
  }>;
};
