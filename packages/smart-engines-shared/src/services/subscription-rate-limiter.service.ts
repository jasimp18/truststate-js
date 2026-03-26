/**
 * Subscription Rate Limiter Service
 *
 * Tracks API calls per app per day based on subscription tier limits.
 * Uses in-memory storage with automatic daily reset scheduling.
 */

/**
 * Result of a rate limit check
 */
export type RateLimitResult = {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  resetsAt: Date;
};

/**
 * Usage statistics for an app
 */
export type UsageStats = {
  appId: string;
  used: number;
  limit: number;
  remaining: number;
  resetsAt: Date;
};

/**
 * Internal tracking entry for an app
 */
type AppUsageEntry = {
  used: number;
  limit: number;
  resetsAt: Date;
};

/**
 * Subscription Rate Limiter Service
 *
 * Provides rate limiting based on subscription tiers with daily limits.
 * Enterprise tier (Infinity limit) always allows requests.
 */
export class SubscriptionRateLimiterService {
  private readonly usage = new Map<string, AppUsageEntry>();
  private resetTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.scheduleNextReset();
  }

  /**
   * Check if a request is allowed and increment the counter if so
   *
   * @param appId - The application identifier
   * @param tier - The subscription tier name (for logging/tracking)
   * @param dailyLimit - The daily request limit (use Infinity for unlimited)
   * @returns RateLimitResult indicating if request is allowed and usage stats
   */
  checkLimit(appId: string, _tier: string, dailyLimit: number): RateLimitResult {
    const resetsAt = this.getNextResetTime();

    // Handle enterprise/unlimited tier
    if (dailyLimit === Infinity) {
      // Track usage for stats but always allow
      const entry = this.getOrCreateEntry(appId, Infinity, resetsAt);
      entry.used++;

      return {
        allowed: true,
        used: entry.used,
        limit: Infinity,
        remaining: Infinity,
        resetsAt,
      };
    }

    const entry = this.getOrCreateEntry(appId, dailyLimit, resetsAt);

    // Check if within limit
    if (entry.used >= entry.limit) {
      return {
        allowed: false,
        used: entry.used,
        limit: entry.limit,
        remaining: 0,
        resetsAt,
      };
    }

    // Increment and allow
    entry.used++;

    return {
      allowed: true,
      used: entry.used,
      limit: entry.limit,
      remaining: Math.max(0, entry.limit - entry.used),
      resetsAt,
    };
  }

  /**
   * Get current usage statistics for an app
   *
   * @param appId - The application identifier
   * @returns UsageStats or null if app has no usage data
   */
  getUsage(appId: string): UsageStats | null {
    const entry = this.usage.get(appId);
    if (!entry) {
      return null;
    }

    const resetsAt = this.getNextResetTime();

    return {
      appId,
      used: entry.used,
      limit: entry.limit,
      remaining: entry.limit === Infinity ? Infinity : Math.max(0, entry.limit - entry.used),
      resetsAt,
    };
  }

  /**
   * Reset all counters (called at midnight UTC)
   * Can also be called manually for testing
   */
  resetDaily(): void {
    this.usage.clear();
  }

  /**
   * Stop the reset timer (for cleanup/testing)
   */
  destroy(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }

  /**
   * Get or create a usage entry for an app
   */
  private getOrCreateEntry(appId: string, limit: number, resetsAt: Date): AppUsageEntry {
    let entry = this.usage.get(appId);
    if (!entry) {
      entry = { used: 0, limit, resetsAt };
      this.usage.set(appId, entry);
    } else {
      // Update limit if it changed (e.g., tier upgrade)
      entry.limit = limit;
      entry.resetsAt = resetsAt;
    }
    return entry;
  }

  /**
   * Calculate the next midnight UTC reset time
   */
  private getNextResetTime(): Date {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return tomorrow;
  }

  /**
   * Schedule the next daily reset at midnight UTC
   */
  private scheduleNextReset(): void {
    const now = new Date();
    const nextMidnight = this.getNextResetTime();
    const msUntilReset = nextMidnight.getTime() - now.getTime();

    this.resetTimer = setTimeout(() => {
      this.resetDaily();
      this.scheduleNextReset();
    }, msUntilReset);

    // Allow the process to exit even if this timer is pending
    if (this.resetTimer.unref) {
      this.resetTimer.unref();
    }
  }
}
