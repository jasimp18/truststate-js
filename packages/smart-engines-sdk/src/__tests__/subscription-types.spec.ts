import {
  SubscriptionTierName,
  SubscriptionTierInfo,
  SubscriptionRequest,
  SubscriptionConfig,
  SubscriptionStatusResponse,
} from '../subscription';

describe('Subscription Types', () => {
  describe('SubscriptionTierName', () => {
    it('should accept valid tier names', () => {
      const freeTestnet: SubscriptionTierName = 'free_testnet';
      const starter: SubscriptionTierName = 'starter';
      const professional: SubscriptionTierName = 'professional';
      const enterprise: SubscriptionTierName = 'enterprise';

      expect(freeTestnet).toBe('free_testnet');
      expect(starter).toBe('starter');
      expect(professional).toBe('professional');
      expect(enterprise).toBe('enterprise');
    });
  });

  describe('SubscriptionTierInfo', () => {
    it('should have all required fields', () => {
      const tierInfo: SubscriptionTierInfo = {
        name: 'starter',
        displayName: 'Starter',
        description: 'Basic tier for getting started',
        priceUsd: 0,
        depositAmount: '1000',
        apiCallsPerDay: 1000,
        supportedNetworks: ['hedera'],
        features: ['Basic API access', 'Community support'],
      };

      expect(tierInfo.name).toBe('starter');
      expect(tierInfo.displayName).toBe('Starter');
      expect(tierInfo.description).toBe('Basic tier for getting started');
      expect(tierInfo.priceUsd).toBe(0);
      expect(tierInfo.depositAmount).toBe('1000');
      expect(tierInfo.apiCallsPerDay).toBe(1000);
      expect(tierInfo.supportedNetworks).toEqual(['hedera']);
      expect(tierInfo.features).toEqual(['Basic API access', 'Community support']);
    });

    it('should support multiple networks', () => {
      const tierInfo: SubscriptionTierInfo = {
        name: 'enterprise',
        displayName: 'Enterprise',
        description: 'Full access tier',
        priceUsd: 499,
        depositAmount: '10000',
        apiCallsPerDay: 100000,
        supportedNetworks: ['hedera', 'xrpl'],
        features: ['Unlimited API access', 'Priority support', 'Custom integrations'],
      };

      expect(tierInfo.supportedNetworks).toContain('hedera');
      expect(tierInfo.supportedNetworks).toContain('xrpl');
      expect(tierInfo.supportedNetworks).toHaveLength(2);
    });
  });

  describe('SubscriptionRequest', () => {
    it('should include tier selection fields', () => {
      const request: SubscriptionRequest = {
        appId: 'test-app-123',
        appName: 'Test App',
        developerAccountId: '0.0.12345',
        chain: 'hedera',
        selectedTier: 'professional',
        selectedNetworks: ['hedera', 'xrpl'],
        logoUrl: 'https://example.com/logo.png',
        appDescription: 'A test application',
        metadata: { version: '1.0.0' },
      };

      expect(request.selectedTier).toBe('professional');
      expect(request.selectedNetworks).toEqual(['hedera', 'xrpl']);
      expect(request.logoUrl).toBe('https://example.com/logo.png');
    });

    it('should allow request without optional fields', () => {
      const request: SubscriptionRequest = {
        appId: 'test-app-456',
        appName: 'Minimal App',
        developerAccountId: '0.0.67890',
        chain: 'xrpl',
        selectedTier: 'starter',
        selectedNetworks: ['xrpl'],
      };

      expect(request.logoUrl).toBeUndefined();
      expect(request.appDescription).toBeUndefined();
      expect(request.metadata).toBeUndefined();
    });
  });

  describe('SubscriptionConfig', () => {
    it('should include availableTiers', () => {
      const config: SubscriptionConfig = {
        subscriptionDepositAmount: '5000',
        lockDurationDays: 90,
        renewalWindowDays: 30,
        hsuiteTokenIds: {
          hedera: '0.0.1234567',
          xrpl: 'HSUITE.issuer',
        },
        availableTiers: [
          {
            name: 'free_testnet',
            displayName: 'Free Testnet',
            description: 'Free tier for testnet only',
            priceUsd: 0,
            depositAmount: '0',
            apiCallsPerDay: 1000,
            supportedNetworks: ['hedera'],
            features: ['Testnet access'],
          },
          {
            name: 'professional',
            displayName: 'Professional',
            description: 'Professional tier',
            priceUsd: 150,
            depositAmount: '15000000000',
            apiCallsPerDay: 100000,
            supportedNetworks: ['hedera', 'xrpl'],
            features: ['Extended access', 'Priority support'],
          },
        ],
      };

      expect(config.availableTiers).toHaveLength(2);
      expect(config.availableTiers[0].name).toBe('free_testnet');
      expect(config.availableTiers[1].name).toBe('professional');
    });
  });

  describe('SubscriptionStatusResponse', () => {
    it('should include tier-related fields', () => {
      const response: SubscriptionStatusResponse = {
        appId: 'test-app-789',
        hasSubscription: true,
        subscriptionId: 'sub-123',
        appName: 'Active App',
        status: 'active',
        tier: 'enterprise',
        selectedNetworks: ['hedera', 'xrpl'],
        apiCallsToday: 5000,
        apiCallsLimit: 100000,
        expiresAt: '2026-12-31T23:59:59Z',
        createdAt: '2026-01-01T00:00:00Z',
      };

      expect(response.tier).toBe('enterprise');
      expect(response.selectedNetworks).toEqual(['hedera', 'xrpl']);
      expect(response.apiCallsToday).toBe(5000);
      expect(response.apiCallsLimit).toBe(100000);
    });

    it('should allow response without tier fields (backwards compatibility)', () => {
      const response: SubscriptionStatusResponse = {
        appId: 'legacy-app',
        hasSubscription: true,
        status: 'active',
      };

      expect(response.tier).toBeUndefined();
      expect(response.selectedNetworks).toBeUndefined();
      expect(response.apiCallsToday).toBeUndefined();
      expect(response.apiCallsLimit).toBeUndefined();
    });

    it('should handle not_found status', () => {
      const response: SubscriptionStatusResponse = {
        appId: 'unknown-app',
        hasSubscription: false,
        status: 'not_found',
      };

      expect(response.hasSubscription).toBe(false);
      expect(response.status).toBe('not_found');
    });
  });
});
