/**
 * BaaS Client
 *
 * SDK client for Backend-as-a-Service operations.
 * Provides access to auth, database, storage, functions, and messaging services.
 */

import type {
  BaasSupportedChain,
  DeployedAppInfo,
  BaasChallengeRequest,
  BaasChallengeResponse,
  BaasVerifyRequest,
  BaasAuthResult,
  BaasDocument,
  BaasInsertResult,
  BaasUpdateResult,
  BaasDeleteResult,
  BaasQueryOptions,
  BaasFileMetadata,
  BaasUploadResult,
  BaasFileInfo,
  BaasStorageUsage,
  BaasFunctionDeployRequest,
  BaasFunctionDeployResult,
  BaasFunctionResult,
  BaasFunctionInfo,
  BaasFunctionLog,
  BaasFunctionLogOptions,
  BaasMessage,
  BaasChannelConfig,
  BaasPresenceInfo,
  BaasHistoryOptions,
  BaasDeployRequest,
  BaasDeployResult,
  BaasAppListResponse,
} from './types';

/**
 * HTTP client interface for making requests
 */
type HttpClient = {
  post<T>(path: string, body: unknown): Promise<T>;
  get<T>(path: string): Promise<T>;
  put<T>(path: string, body: unknown): Promise<T>;
  delete<T>(path: string): Promise<T>;
};

/**
 * BaaS Client Options
 */
export type BaasClientOptions = {
  /** App ID for scoping operations */
  appId?: string;
};

/**
 * BaaS Sub-Client
 *
 * Manages Backend-as-a-Service operations including:
 * - App deployment and management
 * - Authentication via wallet signatures
 * - Database operations with Merkle proofs
 * - IPFS-based storage
 * - Serverless function deployment and invocation
 * - Real-time messaging
 */
export class BaasClient {
  private appId?: string;

  constructor(
    private readonly http: HttpClient,
    options?: BaasClientOptions
  ) {
    this.appId = options?.appId;
  }

  // ============================================================================
  // App Deployment
  // ============================================================================

  /**
   * Deploy a new BaaS application
   */
  async deployApp(request: BaasDeployRequest): Promise<BaasDeployResult> {
    return this.http.post('/baas/apps', request);
  }

  /**
   * List deployed applications
   */
  async listApps(): Promise<BaasAppListResponse> {
    return this.http.get('/baas/apps');
  }

  /**
   * Get application details
   */
  async getApp(appId: string): Promise<DeployedAppInfo> {
    return this.http.get(`/baas/apps/${encodeURIComponent(appId)}`);
  }

  /**
   * Delete an application
   */
  async deleteApp(appId: string): Promise<{ success: boolean }> {
    return this.http.delete(`/baas/apps/${encodeURIComponent(appId)}`);
  }

  // ============================================================================
  // Authentication
  // ============================================================================

  /**
   * Request an authentication challenge
   */
  async requestChallenge(request: BaasChallengeRequest): Promise<BaasChallengeResponse> {
    return this.http.post('/baas/auth/challenge', request);
  }

  /**
   * Verify a signed challenge and get auth token
   */
  async verifyChallenge(request: BaasVerifyRequest): Promise<BaasAuthResult> {
    return this.http.post('/baas/auth/verify', request);
  }

  /**
   * Authenticate with wallet signature
   * Combines challenge request and verification in one flow
   */
  async authenticate(
    chain: BaasSupportedChain,
    walletAddress: string,
    appId: string,
    signFn: (message: string) => Promise<string> | string,
    publicKey?: string
  ): Promise<BaasAuthResult> {
    const challenge = await this.requestChallenge({ chain, walletAddress, appId });
    const signature = await signFn(challenge.message);
    return this.verifyChallenge({
      challengeId: challenge.challengeId,
      signature,
      publicKey,
    });
  }

  // ============================================================================
  // Database Operations
  // ============================================================================

  /**
   * Insert a document into a collection
   */
  async dbInsert(
    collection: string,
    document: Record<string, unknown>,
    appId?: string
  ): Promise<BaasInsertResult> {
    const targetAppId = appId || this.appId;
    if (!targetAppId) throw new Error('appId required for database operations');
    return this.http.post(
      `/baas/database/${targetAppId}/${encodeURIComponent(collection)}`,
      document
    );
  }

  /**
   * Find documents in a collection
   */
  async dbFind(
    collection: string,
    query?: Record<string, unknown>,
    options?: BaasQueryOptions,
    appId?: string
  ): Promise<BaasDocument[]> {
    const targetAppId = appId || this.appId;
    if (!targetAppId) throw new Error('appId required for database operations');

    const params = new URLSearchParams();
    if (query) params.set('filter', JSON.stringify(query));
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.skip) params.set('skip', String(options.skip));
    if (options?.sort) params.set('sort', JSON.stringify(options.sort));
    if (options?.projection) params.set('projection', JSON.stringify(options.projection));

    const queryStr = params.toString();
    const url = `/baas/database/${targetAppId}/${encodeURIComponent(collection)}${queryStr ? `?${queryStr}` : ''}`;
    return this.http.get(url);
  }

  /**
   * Find a single document by ID
   */
  async dbFindOne(collection: string, id: string, appId?: string): Promise<BaasDocument | null> {
    const targetAppId = appId || this.appId;
    if (!targetAppId) throw new Error('appId required for database operations');
    return this.http.get(
      `/baas/database/${targetAppId}/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`
    );
  }

  /**
   * Update a document
   */
  async dbUpdate(
    collection: string,
    id: string,
    update: Record<string, unknown>,
    appId?: string
  ): Promise<BaasUpdateResult> {
    const targetAppId = appId || this.appId;
    if (!targetAppId) throw new Error('appId required for database operations');
    return this.http.put(
      `/baas/database/${targetAppId}/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`,
      update
    );
  }

  /**
   * Delete a document
   */
  async dbDelete(collection: string, id: string, appId?: string): Promise<BaasDeleteResult> {
    const targetAppId = appId || this.appId;
    if (!targetAppId) throw new Error('appId required for database operations');
    return this.http.delete(
      `/baas/database/${targetAppId}/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`
    );
  }

  // ============================================================================
  // Storage Operations
  // ============================================================================

  /**
   * Upload a file to storage
   * Note: For binary uploads, use the raw endpoint with multipart/form-data
   */
  async storageUpload(
    file: { content: string; encoding: 'base64' | 'utf8' },
    metadata?: BaasFileMetadata,
    appId?: string
  ): Promise<BaasUploadResult> {
    const targetAppId = appId || this.appId;
    if (!targetAppId) throw new Error('appId required for storage operations');
    return this.http.post(`/baas/storage/${targetAppId}/upload`, {
      content: file.content,
      encoding: file.encoding,
      ...metadata,
    });
  }

  /**
   * Download a file from storage
   */
  async storageDownload(
    cid: string,
    appId?: string
  ): Promise<{ content: string; encoding: string; metadata: BaasFileMetadata }> {
    const targetAppId = appId || this.appId;
    if (!targetAppId) throw new Error('appId required for storage operations');
    return this.http.get(`/baas/storage/${targetAppId}/${encodeURIComponent(cid)}`);
  }

  /**
   * Get file metadata
   */
  async storageGetMetadata(cid: string, appId?: string): Promise<BaasFileInfo> {
    const targetAppId = appId || this.appId;
    if (!targetAppId) throw new Error('appId required for storage operations');
    return this.http.get(`/baas/storage/${targetAppId}/${encodeURIComponent(cid)}/metadata`);
  }

  /**
   * List files in storage
   */
  async storageList(prefix?: string, appId?: string): Promise<BaasFileInfo[]> {
    const targetAppId = appId || this.appId;
    if (!targetAppId) throw new Error('appId required for storage operations');
    const params = prefix ? `?prefix=${encodeURIComponent(prefix)}` : '';
    return this.http.get(`/baas/storage/${targetAppId}/files${params}`);
  }

  /**
   * Delete a file from storage
   */
  async storageDelete(cid: string, appId?: string): Promise<{ success: boolean }> {
    const targetAppId = appId || this.appId;
    if (!targetAppId) throw new Error('appId required for storage operations');
    return this.http.delete(`/baas/storage/${targetAppId}/${encodeURIComponent(cid)}`);
  }

  /**
   * Get storage usage statistics
   */
  async storageUsage(appId?: string): Promise<BaasStorageUsage> {
    const targetAppId = appId || this.appId;
    if (!targetAppId) throw new Error('appId required for storage operations');
    return this.http.get(`/baas/storage/${targetAppId}/usage`);
  }

  // ============================================================================
  // Functions Operations
  // ============================================================================

  /**
   * Deploy a serverless function
   */
  async functionsDeploy(
    request: BaasFunctionDeployRequest,
    appId?: string
  ): Promise<BaasFunctionDeployResult> {
    const targetAppId = appId || this.appId;
    if (!targetAppId) throw new Error('appId required for functions operations');
    return this.http.post(`/baas/functions/${targetAppId}/deploy`, request);
  }

  /**
   * Invoke a function
   */
  async functionsInvoke(
    functionId: string,
    input: Record<string, unknown>,
    appId?: string
  ): Promise<BaasFunctionResult> {
    const targetAppId = appId || this.appId;
    if (!targetAppId) throw new Error('appId required for functions operations');
    return this.http.post(
      `/baas/functions/${targetAppId}/${encodeURIComponent(functionId)}/invoke`,
      input
    );
  }

  /**
   * List deployed functions
   */
  async functionsList(appId?: string): Promise<BaasFunctionInfo[]> {
    const targetAppId = appId || this.appId;
    if (!targetAppId) throw new Error('appId required for functions operations');
    return this.http.get(`/baas/functions/${targetAppId}`);
  }

  /**
   * Get function details
   */
  async functionsGet(functionId: string, appId?: string): Promise<BaasFunctionInfo> {
    const targetAppId = appId || this.appId;
    if (!targetAppId) throw new Error('appId required for functions operations');
    return this.http.get(`/baas/functions/${targetAppId}/${encodeURIComponent(functionId)}`);
  }

  /**
   * Get function logs
   */
  async functionsLogs(
    functionId: string,
    options?: BaasFunctionLogOptions,
    appId?: string
  ): Promise<BaasFunctionLog[]> {
    const targetAppId = appId || this.appId;
    if (!targetAppId) throw new Error('appId required for functions operations');

    const params = new URLSearchParams();
    if (options?.startTime) params.set('startTime', options.startTime);
    if (options?.endTime) params.set('endTime', options.endTime);
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.level) params.set('level', options.level);
    if (options?.requestId) params.set('requestId', options.requestId);

    const queryStr = params.toString();
    return this.http.get(
      `/baas/functions/${targetAppId}/${encodeURIComponent(functionId)}/logs${queryStr ? `?${queryStr}` : ''}`
    );
  }

  /**
   * Delete a function
   */
  async functionsDelete(functionId: string, appId?: string): Promise<{ success: boolean }> {
    const targetAppId = appId || this.appId;
    if (!targetAppId) throw new Error('appId required for functions operations');
    return this.http.delete(`/baas/functions/${targetAppId}/${encodeURIComponent(functionId)}`);
  }

  // ============================================================================
  // Messaging Operations
  // ============================================================================

  /**
   * Create a messaging channel
   */
  async messagingCreateChannel(
    config: BaasChannelConfig,
    appId?: string
  ): Promise<{ success: boolean; channel: string }> {
    const targetAppId = appId || this.appId;
    if (!targetAppId) throw new Error('appId required for messaging operations');
    return this.http.post(`/baas/messaging/${targetAppId}/channels`, config);
  }

  /**
   * List channels
   */
  async messagingListChannels(appId?: string): Promise<string[]> {
    const targetAppId = appId || this.appId;
    if (!targetAppId) throw new Error('appId required for messaging operations');
    return this.http.get(`/baas/messaging/${targetAppId}/channels`);
  }

  /**
   * Delete a channel
   */
  async messagingDeleteChannel(channel: string, appId?: string): Promise<{ success: boolean }> {
    const targetAppId = appId || this.appId;
    if (!targetAppId) throw new Error('appId required for messaging operations');
    return this.http.delete(
      `/baas/messaging/${targetAppId}/channels/${encodeURIComponent(channel)}`
    );
  }

  /**
   * Publish a message to a channel
   */
  async messagingPublish(
    channel: string,
    message: Record<string, unknown>,
    appId?: string
  ): Promise<{ messageId: string }> {
    const targetAppId = appId || this.appId;
    if (!targetAppId) throw new Error('appId required for messaging operations');
    return this.http.post(
      `/baas/messaging/${targetAppId}/channels/${encodeURIComponent(channel)}/publish`,
      { data: message }
    );
  }

  /**
   * Get channel presence information
   */
  async messagingPresence(channel: string, appId?: string): Promise<BaasPresenceInfo> {
    const targetAppId = appId || this.appId;
    if (!targetAppId) throw new Error('appId required for messaging operations');
    return this.http.get(
      `/baas/messaging/${targetAppId}/channels/${encodeURIComponent(channel)}/presence`
    );
  }

  /**
   * Get channel message history
   */
  async messagingHistory(
    channel: string,
    options?: BaasHistoryOptions,
    appId?: string
  ): Promise<BaasMessage[]> {
    const targetAppId = appId || this.appId;
    if (!targetAppId) throw new Error('appId required for messaging operations');

    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.before) params.set('before', options.before);
    if (options?.after) params.set('after', options.after);
    if (options?.startTime) params.set('startTime', options.startTime);
    if (options?.endTime) params.set('endTime', options.endTime);

    const queryStr = params.toString();
    return this.http.get(
      `/baas/messaging/${targetAppId}/channels/${encodeURIComponent(channel)}/history${queryStr ? `?${queryStr}` : ''}`
    );
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Set the default app ID for operations
   */
  setAppId(appId: string): void {
    this.appId = appId;
  }

  /**
   * Get the current app ID
   */
  getAppId(): string | undefined {
    return this.appId;
  }

  /**
   * BaaS health check
   */
  async getHealth(): Promise<{
    status: string;
    timestamp: string;
    services: Record<string, string>;
  }> {
    return this.http.get('/baas/health');
  }
}
