/**
 * Validator Templates
 *
 * Pre-configured validator templates for common use cases.
 * Use these as starting points and customize as needed.
 */
import {
  TokenValidatorRules,
  AccountValidatorRules,
  TopicValidatorRules,
} from '../interfaces/validators.interface';

/**
 * Validator Templates
 *
 * Pre-configured templates with granular operations, limits, and key conditions.
 */
export class ValidatorTemplates {
  /**
   * Simple Token - Owner-controlled with basic mint/burn/transfer
   * Use for: Personal tokens, test tokens, simple applications
   */
  static SIMPLE_TOKEN(): TokenValidatorRules {
    return {
      version: '3.0',
      type: 'token',
      created: new Date().toISOString(),
      defaultSecurity: 'none',
      defaultController: 'owner',
      operations: {
        mint: { enabled: true },
        burn: { enabled: true, allowHolderBurn: true },
        transfer: { enabled: true },
        pause: { enabled: true },
        update: { enabled: true },
      },
      keys: {
        admin: {}, // Uses defaults: enabled=true, security='none', controller='owner'
        supply: {},
        pause: {},
      },
      metadata: {
        version: '1.0.0',
        description: 'Simple owner-controlled token with basic operations',
        tags: ['simple', 'owner-controlled'],
      },
    };
  }

  /**
   * Regulated Token - Full compliance with limits and KYC
   * Use for: Security tokens, regulated assets, compliant DeFi
   */
  static REGULATED_TOKEN(): TokenValidatorRules {
    return {
      version: '3.0',
      type: 'token',
      created: new Date().toISOString(),
      defaultSecurity: 'full',
      defaultController: 'dao',
      operations: {
        mint: {
          enabled: true,
          requiresApproval: true,
          limits: { maxPerTransaction: '100000', dailyLimit: '500000', cooldownSeconds: 600 },
        },
        burn: {
          enabled: true,
          requiresApproval: true,
          limits: { maxPerTransaction: '50000', dailyLimit: '200000' },
        },
        transfer: {
          enabled: true,
          controller: 'owner', // Override: owner can transfer
          requiresKyc: true,
          blacklistEnabled: true,
          limits: { maxPerTransaction: '250000' },
        },
        freeze: { enabled: true, requiresMultisig: true },
        pause: { enabled: true },
        wipe: { enabled: true, requiresApproval: true },
        grantKyc: { enabled: true, controller: 'owner' },
        revokeKyc: { enabled: true, controller: 'owner' },
      },
      keys: {
        admin: { requiresApproval: true },
        supply: { requiresApproval: true },
        freeze: { requiresApproval: true },
        pause: {},
        wipe: { requiresApproval: true },
        kyc: { controller: 'owner' }, // Override: owner controls KYC
      },
      metadata: {
        version: '1.0.0',
        description: 'Fully regulated token with KYC, limits, and DAO governance',
        tags: ['regulated', 'compliance', 'kyc', 'limits'],
      },
    };
  }

  /**
   * DAO Governed Token - Community governance with voting
   * Use for: Governance tokens, protocol tokens, community tokens
   */
  static DAO_GOVERNED_TOKEN(): TokenValidatorRules {
    return {
      version: '3.0',
      type: 'token',
      created: new Date().toISOString(),
      defaultSecurity: 'partial',
      defaultController: 'dao',
      operations: {
        mint: {
          enabled: true,
          requiresApproval: true,
          limits: { maxPerTransaction: '1000000', monthlyLimit: '10000000' },
        },
        burn: { enabled: true, requiresApproval: true },
        transfer: { enabled: true, controller: 'owner' }, // Override: owner can transfer
        pause: { enabled: true, emergencyOnly: true },
        update: { enabled: true, requiresApproval: true },
      },
      keys: {
        admin: { requiresApproval: true },
        supply: { requiresApproval: true },
        pause: {},
      },
      governance: {
        proposalThreshold: '1000',
        votingThreshold: '1',
        votingPeriodSeconds: 259200, // 3 days
        timelockSeconds: 86400, // 1 day
        quorumPercentage: 10,
      },
      metadata: {
        version: '1.0.0',
        description: 'DAO-governed token with on-chain voting and timelock',
        tags: ['dao', 'governance', 'voting', 'decentralized'],
      },
    };
  }

  /**
   * NFT Collection - Creator-controlled with royalties
   * Use for: Art, collectibles, gaming assets
   */
  static NFT_COLLECTION(): TokenValidatorRules {
    return {
      version: '3.0',
      type: 'token',
      created: new Date().toISOString(),
      defaultSecurity: 'none',
      defaultController: 'owner',
      operations: {
        mint: { enabled: true, limits: { totalLimit: '10000' } }, // Max collection size
        burn: { enabled: true, allowHolderBurn: true },
        transfer: { enabled: true },
        update: { enabled: true },
      },
      keys: {
        admin: {},
        supply: {},
      },
      fees: {
        royalty: [
          {
            enabled: true,
            numerator: 5,
            denominator: 100, // 5% royalty
            feeCollectorAccountId: '', // To be filled
          },
        ],
      },
      metadata: {
        version: '1.0.0',
        description: 'NFT collection with royalty support',
        tags: ['nft', 'collection', 'royalty'],
      },
    };
  }

  /**
   * Escrow Account - Multi-sig controlled with transfer limits
   * Use for: Escrow services, payment holds, conditional transfers
   */
  static ESCROW_ACCOUNT(): AccountValidatorRules {
    return {
      version: '3.0',
      type: 'account',
      created: new Date().toISOString(),
      defaultSecurity: 'partial',
      defaultController: 'dao',
      operations: {
        transfer: {
          enabled: true,
          requiresApproval: true,
          limits: { maxPerTransaction: '50000', dailyLimit: '200000', cooldownSeconds: 3600 },
        },
        update: { enabled: true, requiresApproval: true },
        delete: { enabled: false },
      },
      keys: {
        admin: { threshold: 2 },
        signing: { threshold: 2 },
      },
      metadata: {
        version: '1.0.0',
        description: 'Multi-sig escrow account with transfer limits',
        tags: ['escrow', 'multisig', 'limits'],
      },
    };
  }

  /**
   * Treasury Account - DAO-controlled treasury
   * Use for: Protocol treasuries, DAO funds, community pools
   */
  static TREASURY_ACCOUNT(): AccountValidatorRules {
    return {
      version: '3.0',
      type: 'account',
      created: new Date().toISOString(),
      defaultSecurity: 'full',
      defaultController: 'dao',
      operations: {
        transfer: {
          enabled: true,
          requiresApproval: true,
          limits: { maxPerTransaction: '100000', weeklyLimit: '500000' },
        },
        update: { enabled: true, requiresApproval: true },
        delete: { enabled: false },
        approveAllowance: { enabled: true, requiresApproval: true },
      },
      keys: {
        admin: { requiresApproval: true },
        signing: { requiresApproval: true },
      },
      governance: {
        proposalThreshold: '10000',
        votingPeriodSeconds: 432000, // 5 days
        timelockSeconds: 172800, // 2 days
        quorumPercentage: 20,
      },
      metadata: {
        version: '1.0.0',
        description: 'DAO-controlled treasury account with governance',
        tags: ['treasury', 'dao', 'governance'],
      },
    };
  }

  /**
   * Public Topic - Open topic for announcements
   * Use for: Public announcements, community messages, broadcasts
   */
  static PUBLIC_TOPIC(): TopicValidatorRules {
    return {
      version: '3.0',
      type: 'topic',
      created: new Date().toISOString(),
      defaultSecurity: 'none',
      defaultController: 'owner',
      operations: {
        submit: { enabled: true },
        update: { enabled: true },
        delete: { enabled: true },
      },
      keys: {
        admin: {},
        submit: { enabled: false }, // Open submit - no key required
      },
      metadata: {
        version: '1.0.0',
        description: 'Public topic with open message submission',
        tags: ['public', 'open', 'announcements'],
      },
    };
  }

  /**
   * Token-Gated Topic - Private topic requiring token ownership
   * Use for: Exclusive communities, premium content, member-only channels
   */
  static TOKEN_GATED_TOPIC(): TopicValidatorRules {
    return {
      version: '3.0',
      type: 'topic',
      created: new Date().toISOString(),
      defaultSecurity: 'partial',
      defaultController: 'dao',
      operations: {
        submit: { enabled: true, controller: 'owner' }, // Token ownership verified at validation
        update: { enabled: true, requiresApproval: true },
        delete: { enabled: false },
      },
      keys: {
        admin: {},
        submit: {},
      },
      tokenGates: {
        fungibles: { tokens: [] }, // To be filled with required token
        nonFungibles: { tokens: [] },
        timeRange: null,
      },
      metadata: {
        version: '1.0.0',
        description: 'Token-gated private topic',
        tags: ['private', 'token-gated', 'exclusive'],
      },
    };
  }

  // =============================================================================
  // DAO Templates
  // =============================================================================

  /**
   * DAO Topic - Main DAO configuration topic
   * Use for: Core DAO configuration, voting rules, membership settings
   */
  static DAO_TOPIC(): TopicValidatorRules {
    return {
      version: '3.0',
      type: 'topic',
      created: new Date().toISOString(),
      defaultSecurity: 'partial',
      defaultController: 'dao',
      operations: {
        submit: { enabled: true },
        update: { enabled: true, allowedFields: ['memo'] },
        delete: { enabled: false },
      },
      keys: {
        admin: {},
        submit: {},
      },
      customInterface: {
        interfaceName: 'dao',
        properties: {
          tokenId: 'string',
          tokenControlledBySmartnodes: 'boolean',
          votingRules: {
            threshold: 'number',
            quorum: 'number',
            minVotingPeriod: 'number',
            tokenWeighted: 'boolean',
          },
          membershipNftId: 'string',
          proposals: 'string',
          daoMetadata: 'string',
        },
      },
      metadata: {
        version: '1.0.0',
        description: 'Main DAO configuration topic with voting rules and membership',
        tags: ['dao', 'governance', 'configuration'],
      },
    };
  }

  /**
   * DAO Proposal Topic - For DAO proposals with token gating
   * Use for: Governance proposals, community votes, decision-making
   */
  static DAO_PROPOSAL_TOPIC(): TopicValidatorRules {
    return {
      version: '3.0',
      type: 'topic',
      created: new Date().toISOString(),
      defaultSecurity: 'full',
      defaultController: 'dao',
      operations: {
        submit: { enabled: true },
        update: { enabled: true, allowedFields: ['memo'] },
        delete: { enabled: false },
      },
      keys: {
        admin: {},
        submit: {},
      },
      tokenGates: {
        fungibles: { tokens: [] }, // To be filled with DAO governance token
        nonFungibles: { tokens: [] }, // To be filled with membership NFT
        timeRange: null,
      },
      customInterface: {
        interfaceName: 'Proposal',
        properties: {
          title: 'string',
          description: 'string',
          content: 'string',
          author: 'string',
          created_at: 'string',
          votes: 'string',
          options: 'array',
          start_date: 'string',
          end_date: 'string',
          snapshot: 'object',
          type: 'string',
        },
      },
      metadata: {
        version: '1.0.0',
        description: 'DAO proposal topic with token gating for governance voting',
        tags: ['dao', 'proposal', 'voting', 'token-gated'],
      },
    };
  }

  /**
   * DAO Metadata Topic - For DAO metadata (immutable after creation)
   * Use for: DAO branding, social links, static configuration
   */
  static DAO_METADATA_TOPIC(): TopicValidatorRules {
    return {
      version: '3.0',
      type: 'topic',
      created: new Date().toISOString(),
      defaultSecurity: 'full',
      defaultController: 'dao',
      operations: {
        submit: { enabled: true },
        update: { enabled: true, allowedFields: [] }, // Empty = no updates allowed (immutable)
        delete: { enabled: false },
      },
      keys: {
        admin: {},
        submit: {},
      },
      customInterface: {
        interfaceName: 'daoMetadata',
        properties: {
          name: 'string',
          description: 'string',
          status: 'string',
          image: 'string',
          banner: 'string',
          socials: {
            discord: 'string',
            twitter: 'string',
            website: 'string',
          },
        },
      },
      metadata: {
        version: '1.0.0',
        description: 'Immutable DAO metadata topic for branding and social links',
        tags: ['dao', 'metadata', 'immutable', 'branding'],
      },
    };
  }

  /**
   * Token-Gated DAO Topic - DAO topic requiring NFT membership
   * Use for: Premium DAOs, exclusive governance, membership-based organizations
   */
  static TOKEN_GATED_DAO_TOPIC(): TopicValidatorRules {
    return {
      version: '3.0',
      type: 'topic',
      created: new Date().toISOString(),
      defaultSecurity: 'full',
      defaultController: 'dao',
      operations: {
        submit: { enabled: true },
        update: { enabled: true, allowedFields: ['memo'] },
        delete: { enabled: false },
      },
      keys: {
        admin: {},
        submit: {},
      },
      tokenGates: {
        fungibles: { tokens: [] },
        nonFungibles: { tokens: [] }, // To be filled with membership NFT
        timeRange: null,
      },
      customInterface: {
        interfaceName: 'dao',
        properties: {
          tokenId: 'string',
          tokenControlledBySmartnodes: 'boolean',
          votingRules: {
            threshold: 'number',
            quorum: 'number',
            minVotingPeriod: 'number',
            tokenWeighted: 'boolean',
          },
          membershipNftId: 'string',
          proposals: 'string',
          daoMetadata: 'string',
        },
      },
      metadata: {
        version: '1.0.0',
        description: 'Token-gated DAO configuration topic requiring NFT membership',
        tags: ['dao', 'governance', 'token-gated', 'nft-membership'],
      },
    };
  }

  /**
   * Get all available templates
   */
  static getAll() {
    return {
      tokens: {
        SIMPLE_TOKEN: this.SIMPLE_TOKEN(),
        REGULATED_TOKEN: this.REGULATED_TOKEN(),
        DAO_GOVERNED_TOKEN: this.DAO_GOVERNED_TOKEN(),
        NFT_COLLECTION: this.NFT_COLLECTION(),
      },
      accounts: {
        ESCROW_ACCOUNT: this.ESCROW_ACCOUNT(),
        TREASURY_ACCOUNT: this.TREASURY_ACCOUNT(),
      },
      topics: {
        PUBLIC_TOPIC: this.PUBLIC_TOPIC(),
        TOKEN_GATED_TOPIC: this.TOKEN_GATED_TOPIC(),
      },
      dao: {
        DAO_TOPIC: this.DAO_TOPIC(),
        DAO_PROPOSAL_TOPIC: this.DAO_PROPOSAL_TOPIC(),
        DAO_METADATA_TOPIC: this.DAO_METADATA_TOPIC(),
        TOKEN_GATED_DAO_TOPIC: this.TOKEN_GATED_DAO_TOPIC(),
      },
    };
  }

  /**
   * List available template names
   */
  static listTemplates() {
    return {
      tokens: ['SIMPLE_TOKEN', 'REGULATED_TOKEN', 'DAO_GOVERNED_TOKEN', 'NFT_COLLECTION'],
      accounts: ['ESCROW_ACCOUNT', 'TREASURY_ACCOUNT'],
      topics: ['PUBLIC_TOPIC', 'TOKEN_GATED_TOPIC'],
      dao: ['DAO_TOPIC', 'DAO_PROPOSAL_TOPIC', 'DAO_METADATA_TOPIC', 'TOKEN_GATED_DAO_TOPIC'],
    };
  }

  /**
   * Get template by type and name
   */
  static getTemplate(
    templateType: 'tokens' | 'accounts' | 'topics' | 'dao',
    templateName: string
  ): TokenValidatorRules | AccountValidatorRules | TopicValidatorRules | undefined {
    const all = this.getAll();
    const category = all[templateType];
    if (category && templateName in category) {
      return category[templateName as keyof typeof category];
    }
    return undefined;
  }

  /**
   * Customize a template with overrides
   */
  static customize<T extends TokenValidatorRules | AccountValidatorRules | TopicValidatorRules>(
    template: T,
    overrides: Partial<T>
  ): T {
    return {
      ...template,
      ...overrides,
      created: new Date().toISOString(), // Always update created timestamp
      metadata: {
        ...template.metadata,
        ...(overrides.metadata || {}),
      },
    } as T;
  }
}
