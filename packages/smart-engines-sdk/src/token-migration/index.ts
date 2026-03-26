/**
 * Token Migration Sub-Client
 *
 * Manages token migration to TSS control.
 */

/**
 * Migration status
 */
export type MigrationStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

/**
 * Migration request
 */
export type MigrationRequest = {
  /** Chain where the token exists */
  chain: string;
  /** Token ID to migrate */
  tokenId: string;
  /** New threshold for TSS control */
  threshold?: number;
  /** Specific validators to include */
  validators?: string[];
};

/**
 * Migration response
 */
export type MigrationResponse = {
  success: boolean;
  migrationId: string;
  tokenId: string;
  chain: string;
  status: MigrationStatus;
  message: string;
};

/**
 * Migration status response
 */
export type MigrationStatusResponse = {
  migrationId: string;
  tokenId: string;
  chain: string;
  status: MigrationStatus;
  progress: number;
  steps: Array<{
    name: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    transactionId?: string;
    error?: string;
  }>;
  startedAt: string;
  completedAt?: string;
  error?: string;
};

/**
 * Migration list response
 */
export type MigrationListResponse = {
  count: number;
  migrations: Array<{
    migrationId: string;
    tokenId: string;
    chain: string;
    status: MigrationStatus;
    startedAt: string;
    completedAt?: string;
  }>;
};

/**
 * Token migrations response
 */
export type TokenMigrationsResponse = {
  tokenId: string;
  chain: string;
  migrations: Array<{
    migrationId: string;
    status: MigrationStatus;
    startedAt: string;
    completedAt?: string;
  }>;
};

/**
 * HTTP client interface for making requests
 */
type HttpClient = {
  post<T>(path: string, body: unknown): Promise<T>;
  get<T>(path: string): Promise<T>;
};

/**
 * Token Migration Sub-Client
 *
 * Manages token migration to TSS control including:
 * - Initiating migrations
 * - Tracking migration status
 * - Listing migration history
 */
export class TokenMigrationClient {
  constructor(private readonly http: HttpClient) {}

  /**
   * Migrate a token to TSS control
   */
  async migrate(request: MigrationRequest): Promise<MigrationResponse> {
    return this.http.post('/tokens/migrate', request);
  }

  /**
   * Get migration status by migration ID
   */
  async getStatus(migrationId: string): Promise<MigrationStatusResponse> {
    return this.http.get(`/tokens/migrations/${encodeURIComponent(migrationId)}`);
  }

  /**
   * List all migrations
   */
  async list(): Promise<MigrationListResponse> {
    return this.http.get('/tokens/migrations');
  }

  /**
   * Get all migrations for a specific token
   */
  async getTokenMigrations(chain: string, tokenId: string): Promise<TokenMigrationsResponse> {
    return this.http.get(
      `/tokens/${encodeURIComponent(chain)}/${encodeURIComponent(tokenId)}/migrations`
    );
  }
}
