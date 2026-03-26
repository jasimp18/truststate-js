/**
 * Validator Discovery Client
 *
 * Discover smart-engine validators by reading the HCS validator registry topic.
 * Provides methods to list validators and select random validators for connection.
 */

import { MirrorNodeClient, MIRROR_NODE_URLS } from './mirror-node';

/**
 * Network endpoints for validator connectivity
 */
export interface ValidatorNetworkEndpoints {
  /** HTTP API endpoint (e.g., https://validator.example.com:3000) */
  apiEndpoint: string;
  /** NATS endpoint for peer-to-peer messaging */
  natsEndpoint?: string;
  /** Public IP for NAT traversal */
  publicIp?: string;
  /** NATS port if different from default */
  natsPort?: number;
}

/**
 * Validator metadata
 */
export interface ValidatorMetadata {
  /** Human-readable description */
  description?: string;
  /** Version string */
  version?: string;
  /** Tags for categorization */
  tags?: string[];
  /** Author/operator name */
  author?: string;
}

/**
 * Validator registry entry parsed from HCS
 */
export interface ValidatorInfo {
  /** Validator consensus timestamp (unique ID) */
  validatorTimestamp: string;
  /** Node ID (e.g., validator-1) */
  nodeId: string;
  /** Validator type */
  type: 'consensus' | 'tokens' | 'accounts' | 'network';
  /** Network endpoints for connectivity */
  networkEndpoints?: ValidatorNetworkEndpoints;
  /** Public key for peer authentication (Ed25519 hex) */
  publicKey?: string;
  /** Membership NFT serial number */
  membershipNftSerial?: number;
  /** Supported blockchain capabilities */
  capabilities?: string[];
  /** Validator metadata */
  metadata: ValidatorMetadata;
  /** When registered */
  registeredAt: string;
  /** Message type */
  messageType?: 'validator.join' | 'validator.leave' | 'validator.update';
}

/**
 * Validator discovery configuration
 */
export interface ValidatorDiscoveryConfig {
  /** Hedera network (mainnet, testnet, previewnet) */
  network: 'mainnet' | 'testnet' | 'previewnet';
  /** HCS topic ID for validator registry */
  registryTopicId: string;
  /** Cache TTL in milliseconds (default: 60000 = 1 minute) */
  cacheTtlMs?: number;
  /** Custom mirror node URL (optional) */
  mirrorNodeUrl?: string;
  /** Allow HTTP (insecure) connections - only for local development */
  allowInsecure?: boolean;
}

/**
 * Cached validators data
 */
interface ValidatorCache {
  validators: ValidatorInfo[];
  lastUpdated: number;
}

/**
 * Validator Discovery Client
 *
 * Discovers validators by reading the HCS validator registry topic
 * via Hedera mirror node API.
 *
 * @example
 * ```typescript
 * const discovery = new ValidatorDiscoveryClient({
 *   network: 'testnet',
 *   registryTopicId: '0.0.123456',
 * });
 *
 * const validators = await discovery.getValidators();
 * const randomValidator = await discovery.getRandomValidator();
 * ```
 */
export class ValidatorDiscoveryClient {
  private readonly mirrorNode: MirrorNodeClient;
  private readonly registryTopicId: string;
  private readonly cacheTtlMs: number;
  private cache: ValidatorCache | null = null;

  constructor(config: ValidatorDiscoveryConfig) {
    const mirrorNodeUrl = config.mirrorNodeUrl || MIRROR_NODE_URLS[config.network];
    if (!mirrorNodeUrl) {
      throw new Error(`Unknown network: ${config.network}`);
    }

    this.mirrorNode = new MirrorNodeClient({
      baseUrl: mirrorNodeUrl,
      allowInsecure: config.allowInsecure,
    });
    this.registryTopicId = config.registryTopicId;
    this.cacheTtlMs = config.cacheTtlMs ?? 60000; // 1 minute default
  }

  /**
   * Get all active validators from the registry
   *
   * Results are cached for efficiency. Use `forceRefresh` to bypass cache.
   *
   * @param forceRefresh - Force refresh from mirror node
   * @returns List of active validators
   */
  async getValidators(forceRefresh = false): Promise<ValidatorInfo[]> {
    // Return cached data if valid
    if (!forceRefresh && this.cache && this.isCacheValid()) {
      return this.cache.validators;
    }

    // Fetch from mirror node
    const messages = await this.mirrorNode.getAllTopicMessages(
      this.registryTopicId,
      500 // Max messages to fetch
    );

    // Parse and deduplicate validators
    const validatorMap = new Map<string, ValidatorInfo>();
    const leftValidators = new Set<string>();

    // Process messages (newest first since we fetch desc order)
    for (const msg of messages) {
      try {
        const content = MirrorNodeClient.decodeMessage(msg.message);
        const entry = JSON.parse(content) as ValidatorInfo;

        // Track leave events
        if (entry.messageType === 'validator.leave') {
          leftValidators.add(entry.nodeId);
          continue;
        }

        // Skip if validator has left
        if (leftValidators.has(entry.nodeId)) {
          continue;
        }

        // Keep only the latest entry per nodeId
        if (!validatorMap.has(entry.nodeId)) {
          validatorMap.set(entry.nodeId, entry);
        }
      } catch {
        // Skip unparseable messages
        continue;
      }
    }

    const validators = Array.from(validatorMap.values());

    // Update cache
    this.cache = {
      validators,
      lastUpdated: Date.now(),
    };

    return validators;
  }

  /**
   * Get validators with API endpoints available
   *
   * @param forceRefresh - Force refresh from mirror node
   * @returns Validators with apiEndpoint configured
   */
  async getValidatorsWithEndpoints(forceRefresh = false): Promise<ValidatorInfo[]> {
    const validators = await this.getValidators(forceRefresh);
    return validators.filter((v) => v.networkEndpoints?.apiEndpoint);
  }

  /**
   * Get a random validator from the registry
   *
   * @param forceRefresh - Force refresh from mirror node
   * @returns Random validator info or null if none available
   */
  async getRandomValidator(forceRefresh = false): Promise<ValidatorInfo | null> {
    const validators = await this.getValidatorsWithEndpoints(forceRefresh);

    if (validators.length === 0) {
      return null;
    }

    // Use crypto.getRandomValues for cryptographically secure random selection
    const randomBytes = new Uint32Array(1);
    crypto.getRandomValues(randomBytes);
    const randomIndex = randomBytes[0] % validators.length;
    return validators[randomIndex];
  }

  /**
   * Get a random validator API endpoint URL
   *
   * @param forceRefresh - Force refresh from mirror node
   * @returns Random validator API URL or null if none available
   */
  async getRandomValidatorUrl(forceRefresh = false): Promise<string | null> {
    const validator = await this.getRandomValidator(forceRefresh);
    return validator?.networkEndpoints?.apiEndpoint ?? null;
  }

  /**
   * Get validator by node ID
   *
   * @param nodeId - Validator node ID (e.g., 'validator-1')
   * @param forceRefresh - Force refresh from mirror node
   * @returns Validator info or null if not found
   */
  async getValidatorByNodeId(nodeId: string, forceRefresh = false): Promise<ValidatorInfo | null> {
    const validators = await this.getValidators(forceRefresh);
    return validators.find((v) => v.nodeId === nodeId) ?? null;
  }

  /**
   * Get validators by capability
   *
   * @param capability - Required capability (e.g., 'hedera', 'xrpl', 'dkg')
   * @param forceRefresh - Force refresh from mirror node
   * @returns Validators with the specified capability
   */
  async getValidatorsByCapability(
    capability: string,
    forceRefresh = false
  ): Promise<ValidatorInfo[]> {
    const validators = await this.getValidatorsWithEndpoints(forceRefresh);
    return validators.filter((v) => v.capabilities?.includes(capability));
  }

  /**
   * Clear the validator cache
   */
  clearCache(): void {
    this.cache = null;
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    if (!this.cache) return false;
    return Date.now() - this.cache.lastUpdated < this.cacheTtlMs;
  }
}
