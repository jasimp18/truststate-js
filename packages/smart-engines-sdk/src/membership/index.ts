/**
 * Membership Sub-Client
 *
 * Manages validator membership including applications, activation, and renewal.
 */
import type {
  MembershipApplicationRequest,
  MembershipApplicationResponse,
  ApplicationStatusResponse,
  MembershipStatusResponse,
  ActivationResponse,
  MembershipRenewalRequest,
  RenewalResponse,
  LeaveRequest,
  LeaveResponse,
  MembershipConfig,
  ApplicationListResponse,
  MembershipApplicationStatus,
} from './types';

export * from './types';

/**
 * HTTP client interface for making requests
 */
type HttpClient = {
  post<T>(path: string, body: unknown): Promise<T>;
  get<T>(path: string): Promise<T>;
};

/**
 * Membership Sub-Client
 *
 * Manages validator network membership including:
 * - Membership applications with deposit wallets
 * - Deposit verification and activation
 * - Membership renewal
 * - Graceful leave requests
 */
export class MembershipClient {
  constructor(private readonly http: HttpClient) {}

  /**
   * Submit a new membership application.
   * Creates a TSS-controlled deposit wallet and returns deposit instructions.
   */
  async submitApplication(
    request: MembershipApplicationRequest
  ): Promise<MembershipApplicationResponse> {
    return this.http.post('/membership/apply', request);
  }

  /**
   * Get membership application status by application ID
   */
  async getApplicationStatus(applicationId: string): Promise<ApplicationStatusResponse> {
    return this.http.get(`/membership/application/${encodeURIComponent(applicationId)}`);
  }

  /**
   * Get membership status by node ID
   */
  async getMembershipStatus(nodeId: string): Promise<MembershipStatusResponse> {
    return this.http.get(`/membership/status/${encodeURIComponent(nodeId)}`);
  }

  /**
   * Activate membership after deposit is confirmed.
   * This will mint the membership NFT and register the validator.
   */
  async activateMembership(applicationId: string): Promise<ActivationResponse> {
    return this.http.post(`/membership/activate/${encodeURIComponent(applicationId)}`, {});
  }

  /**
   * Renew membership by extending lock period
   */
  async renewMembership(request: MembershipRenewalRequest): Promise<RenewalResponse> {
    return this.http.post('/membership/renew', request);
  }

  /**
   * Request to leave the validator network.
   * Deposit will be released after lock period expires.
   */
  async requestLeave(request: LeaveRequest): Promise<LeaveResponse> {
    return this.http.post('/membership/leave', request);
  }

  /**
   * Get membership configuration (deposit amounts, lock periods, etc.)
   */
  async getConfig(): Promise<MembershipConfig> {
    return this.http.get('/membership/config');
  }

  /**
   * List all membership applications
   */
  async listApplications(): Promise<ApplicationListResponse> {
    return this.http.get('/membership/applications');
  }

  /**
   * List applications filtered by status
   */
  async listApplicationsByStatus(
    status: MembershipApplicationStatus
  ): Promise<ApplicationListResponse> {
    return this.http.get(`/membership/applications/status/${encodeURIComponent(status)}`);
  }
}
