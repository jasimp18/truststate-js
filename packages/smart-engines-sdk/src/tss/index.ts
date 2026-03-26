/**
 * TSS (Threshold Signature Scheme) Sub-Client
 *
 * Provides access to TSS/MPC operations for multi-sig entity management.
 */
import type {
  EntityCreationOptions,
  EntityCreationResponse,
  ReshareRequest,
  ReshareResponse,
  EntityDetails,
  MPCSigningRequest,
  MPCSigningResponse,
  ValidatorListResponse,
  TSSStats,
  EntityListResponse,
  TSSHealthResponse,
  CeremonyListResponse,
  MultiSigStatusResponse,
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
 * TSS Sub-Client
 *
 * Manages Threshold Signature Scheme operations including:
 * - Multi-sig entity creation
 * - Key resharing for membership changes
 * - MPC transaction signing
 * - DKG ceremony monitoring
 */
export class TSSClient {
  constructor(private readonly http: HttpClient) {}

  /**
   * Create a multi-sig entity with TSS
   */
  async createEntity(options: EntityCreationOptions): Promise<EntityCreationResponse> {
    return this.http.post('/tss/entity/create', options);
  }

  /**
   * Reshare keys when cluster membership changes.
   * Redistributes secret shares WITHOUT changing public keys.
   */
  async reshareCluster(request: ReshareRequest): Promise<ReshareResponse> {
    return this.http.post('/tss/cluster/reshare', request);
  }

  /**
   * Get entity details by ID
   */
  async getEntity(entityId: string): Promise<EntityDetails> {
    return this.http.get(`/tss/entity/${encodeURIComponent(entityId)}`);
  }

  /**
   * Sign a Hedera transaction using MPC (key reconstruction)
   */
  async signHederaMPC(request: MPCSigningRequest): Promise<MPCSigningResponse> {
    return this.http.post('/tss/hedera/sign-mpc', request);
  }

  /**
   * Get known validators and their public keys
   */
  async getValidators(): Promise<ValidatorListResponse> {
    return this.http.get('/tss/validators');
  }

  /**
   * Force announcement of this node's public key
   */
  async announceKey(): Promise<{ success: boolean; message: string }> {
    return this.http.post('/tss/announce', {});
  }

  /**
   * Get TSS statistics
   */
  async getStats(): Promise<TSSStats> {
    return this.http.get('/tss/stats');
  }

  /**
   * List all TSS entities
   */
  async listEntities(): Promise<EntityListResponse> {
    return this.http.get('/tss/entities');
  }

  /**
   * TSS health check
   */
  async getHealth(): Promise<TSSHealthResponse> {
    return this.http.get('/tss/health');
  }

  /**
   * List DKG ceremonies and their statistics
   */
  async listCeremonies(): Promise<CeremonyListResponse> {
    return this.http.get('/tss/multisig/ceremonies');
  }

  /**
   * Get multi-sig transaction status by transaction ID
   */
  async getMultiSigStatus(txId: string): Promise<MultiSigStatusResponse> {
    return this.http.get(`/tss/multisig/transactions/${encodeURIComponent(txId)}`);
  }
}
