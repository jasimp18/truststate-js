import { SubscriptionRateLimiterService } from './subscription-rate-limiter.service';

describe('SubscriptionRateLimiterService', () => {
  let service: SubscriptionRateLimiterService;

  beforeEach(() => {
    service = new SubscriptionRateLimiterService();
  });

  afterEach(() => {
    service.destroy();
  });

  describe('checkLimit', () => {
    it('should allow requests within daily limit', () => {
      const result = service.checkLimit('app-1', 'basic', 100);

      expect(result.allowed).toBe(true);
      expect(result.used).toBe(1);
      expect(result.limit).toBe(100);
      expect(result.remaining).toBe(99);
      expect(result.resetsAt).toBeInstanceOf(Date);
    });

    it('should deny requests over daily limit', () => {
      const dailyLimit = 3;

      // Use up the limit
      service.checkLimit('app-1', 'basic', dailyLimit);
      service.checkLimit('app-1', 'basic', dailyLimit);
      service.checkLimit('app-1', 'basic', dailyLimit);

      // Next request should be denied
      const result = service.checkLimit('app-1', 'basic', dailyLimit);

      expect(result.allowed).toBe(false);
      expect(result.used).toBe(3);
      expect(result.limit).toBe(3);
      expect(result.remaining).toBe(0);
    });

    it('should always allow enterprise tier (unlimited)', () => {
      // Make many requests
      for (let i = 0; i < 100; i++) {
        const result = service.checkLimit('enterprise-app', 'enterprise', Infinity);
        expect(result.allowed).toBe(true);
        expect(result.limit).toBe(Infinity);
        expect(result.remaining).toBe(Infinity);
      }

      const finalResult = service.checkLimit('enterprise-app', 'enterprise', Infinity);
      expect(finalResult.allowed).toBe(true);
      expect(finalResult.used).toBe(101);
    });

    it('should track separate limits per app', () => {
      const result1 = service.checkLimit('app-1', 'basic', 10);
      const result2 = service.checkLimit('app-2', 'basic', 10);

      expect(result1.used).toBe(1);
      expect(result2.used).toBe(1);

      // Make more requests for app-1
      service.checkLimit('app-1', 'basic', 10);
      service.checkLimit('app-1', 'basic', 10);

      const result1After = service.checkLimit('app-1', 'basic', 10);
      const result2After = service.checkLimit('app-2', 'basic', 10);

      expect(result1After.used).toBe(4);
      expect(result2After.used).toBe(2);
    });

    it('should return correct reset time at next midnight UTC', () => {
      const result = service.checkLimit('app-1', 'basic', 100);

      const now = new Date();
      const expectedReset = new Date(now);
      expectedReset.setUTCDate(expectedReset.getUTCDate() + 1);
      expectedReset.setUTCHours(0, 0, 0, 0);

      expect(result.resetsAt.getTime()).toBe(expectedReset.getTime());
    });

    it('should handle limit being exactly reached', () => {
      const dailyLimit = 2;

      const result1 = service.checkLimit('app-1', 'basic', dailyLimit);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(1);

      const result2 = service.checkLimit('app-1', 'basic', dailyLimit);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(0);

      const result3 = service.checkLimit('app-1', 'basic', dailyLimit);
      expect(result3.allowed).toBe(false);
      expect(result3.remaining).toBe(0);
    });
  });

  describe('getUsage', () => {
    it('should return correct usage stats', () => {
      service.checkLimit('app-1', 'basic', 100);
      service.checkLimit('app-1', 'basic', 100);
      service.checkLimit('app-1', 'basic', 100);

      const usage = service.getUsage('app-1');

      expect(usage).not.toBeNull();
      expect(usage!.appId).toBe('app-1');
      expect(usage!.used).toBe(3);
      expect(usage!.limit).toBe(100);
      expect(usage!.remaining).toBe(97);
      expect(usage!.resetsAt).toBeInstanceOf(Date);
    });

    it('should return null for unknown app', () => {
      const usage = service.getUsage('unknown-app');
      expect(usage).toBeNull();
    });

    it('should return Infinity remaining for enterprise tier', () => {
      service.checkLimit('enterprise-app', 'enterprise', Infinity);

      const usage = service.getUsage('enterprise-app');

      expect(usage).not.toBeNull();
      expect(usage!.remaining).toBe(Infinity);
      expect(usage!.limit).toBe(Infinity);
    });
  });

  describe('resetDaily', () => {
    it('should reset all counters', () => {
      // Create some usage
      service.checkLimit('app-1', 'basic', 100);
      service.checkLimit('app-2', 'pro', 1000);

      expect(service.getUsage('app-1')).not.toBeNull();
      expect(service.getUsage('app-2')).not.toBeNull();

      // Reset
      service.resetDaily();

      // All usage should be cleared
      expect(service.getUsage('app-1')).toBeNull();
      expect(service.getUsage('app-2')).toBeNull();
    });

    it('should allow new requests after reset', () => {
      const dailyLimit = 2;

      // Exhaust the limit
      service.checkLimit('app-1', 'basic', dailyLimit);
      service.checkLimit('app-1', 'basic', dailyLimit);

      const exhaustedResult = service.checkLimit('app-1', 'basic', dailyLimit);
      expect(exhaustedResult.allowed).toBe(false);

      // Reset
      service.resetDaily();

      // Should be allowed again
      const afterResetResult = service.checkLimit('app-1', 'basic', dailyLimit);
      expect(afterResetResult.allowed).toBe(true);
      expect(afterResetResult.used).toBe(1);
    });
  });

  describe('limit updates', () => {
    it('should update limit when tier changes', () => {
      // Start with basic tier
      service.checkLimit('app-1', 'basic', 100);
      service.checkLimit('app-1', 'basic', 100);

      let usage = service.getUsage('app-1');
      expect(usage!.limit).toBe(100);
      expect(usage!.remaining).toBe(98);

      // Upgrade to pro tier
      service.checkLimit('app-1', 'pro', 1000);

      usage = service.getUsage('app-1');
      expect(usage!.limit).toBe(1000);
      expect(usage!.used).toBe(3);
      expect(usage!.remaining).toBe(997);
    });
  });
});
