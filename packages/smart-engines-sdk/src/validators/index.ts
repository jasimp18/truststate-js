/**
 * Validators Sub-Client
 *
 * Manages V3 Hedera HCS validators for decentralized governance.
 */
import type {
  CreateProposalResponse,
  ValidatorReadResponse,
  ValidatorHealthResponse,
  ValidatorInfoResponse,
  TemplateListResponse,
  ValidatorTemplate,
  RegistryFilters,
  RegistryListResponse,
  RegistrySearchResponse,
  RegistryStatsResponse,
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
 * Validators Sub-Client
 *
 * Manages V3 Hedera HCS validators including:
 * - Token validators (mint, burn, transfer controls)
 * - Account validators (transfer limits, governance)
 * - Topic validators (message submission rules)
 * - Validator templates and registry
 */
export class ValidatorsClient {
  constructor(private readonly http: HttpClient) {}

  // ========== Topic (Consensus) Validators ==========

  /**
   * Create a topic validator (V3)
   */
  async addTopicValidator(rules: unknown): Promise<CreateProposalResponse> {
    return this.http.post('/validators/consensus', rules);
  }

  /**
   * Read a topic validator by consensus timestamp
   */
  async readTopicValidator(timestamp: string): Promise<ValidatorReadResponse> {
    return this.http.get(`/validators/consensus/${encodeURIComponent(timestamp)}`);
  }

  // ========== Token Validators ==========

  /**
   * Create a token validator (V3)
   */
  async addTokenValidator(rules: unknown): Promise<CreateProposalResponse> {
    return this.http.post('/validators/tokens', rules);
  }

  /**
   * Read a token validator by consensus timestamp
   */
  async readTokenValidator(timestamp: string): Promise<ValidatorReadResponse> {
    return this.http.get(`/validators/tokens/${encodeURIComponent(timestamp)}`);
  }

  // ========== Account Validators ==========

  /**
   * Create an account validator (V3)
   */
  async addAccountValidator(rules: unknown): Promise<CreateProposalResponse> {
    return this.http.post('/validators/accounts', rules);
  }

  /**
   * Read an account validator by consensus timestamp
   */
  async readAccountValidator(timestamp: string): Promise<ValidatorReadResponse> {
    return this.http.get(`/validators/accounts/${encodeURIComponent(timestamp)}`);
  }

  // ========== Health & Info ==========

  /**
   * Get validator system health
   */
  async getHealth(): Promise<ValidatorHealthResponse> {
    return this.http.get('/validators/health');
  }

  /**
   * Get validator system information
   */
  async getInfo(): Promise<ValidatorInfoResponse> {
    return this.http.get('/validators/info');
  }

  // ========== Templates ==========

  /**
   * List available V3 validator templates
   */
  async listTemplates(): Promise<TemplateListResponse> {
    return this.http.get('/validators/templates');
  }

  /**
   * Get a specific V3 validator template
   */
  async getTemplate(
    type: 'tokens' | 'accounts' | 'topics',
    name: string
  ): Promise<ValidatorTemplate> {
    return this.http.get(
      `/validators/templates/${encodeURIComponent(type)}/${encodeURIComponent(name)}`
    );
  }

  // ========== Registry ==========

  /**
   * List registered validators with optional filters
   */
  async listRegistry(filters?: RegistryFilters): Promise<RegistryListResponse> {
    const params = new URLSearchParams();
    if (filters?.type) params.set('type', filters.type);
    if (filters?.author) params.set('author', filters.author);
    if (filters?.tags) params.set('tags', filters.tags.join(','));

    const query = params.toString();
    return this.http.get(`/validators/registry${query ? `?${query}` : ''}`);
  }

  /**
   * Search validators by query
   */
  async searchRegistry(query: string): Promise<RegistrySearchResponse> {
    return this.http.get(`/validators/registry/search?q=${encodeURIComponent(query)}`);
  }

  /**
   * Get registry statistics
   */
  async getRegistryStats(): Promise<RegistryStatsResponse> {
    return this.http.get('/validators/registry/stats');
  }
}
