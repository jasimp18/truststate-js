/**
 * Circuit Breaker Pattern Implementation
 *
 * Protects against cascading failures by temporarily blocking requests
 * to a failing service and allowing it time to recover.
 */

export enum CircuitBreakerState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Too many failures, blocking requests
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

/**
 * Logger interface for circuit breaker events
 */
export interface ICircuitBreakerLogger {
  log(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

/**
 * Default no-op logger (silent operation)
 */
const noOpLogger: ICircuitBreakerLogger = {
  log: () => {},
  warn: () => {},
  error: () => {},
};

export interface CircuitBreakerOptions {
  failureThreshold: number; // Number of failures before opening
  successThreshold: number; // Number of successes to close from half-open
  timeout: number; // Time to wait before trying half-open (ms)
  monitoringPeriod: number; // Time window for failure counting (ms)
  logger?: ICircuitBreakerLogger; // Optional logger for state changes
}

export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private nextAttempt: number = Date.now();
  private recentFailures: number[] = [];
  private readonly logger: ICircuitBreakerLogger;

  constructor(
    private readonly name: string,
    private readonly options: CircuitBreakerOptions = {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000, // 1 minute
      monitoringPeriod: 120000, // 2 minutes
    }
  ) {
    this.logger = options.logger ?? noOpLogger;
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error(
          `Circuit breaker [${this.name}] is OPEN. Service unavailable. Retry after ${new Date(this.nextAttempt).toISOString()}`
        );
      }

      // Try half-open
      this.state = CircuitBreakerState.HALF_OPEN;
      this.successCount = 0;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;

      if (this.successCount >= this.options.successThreshold) {
        this.state = CircuitBreakerState.CLOSED;
        this.successCount = 0;
        this.logger.log(`Circuit breaker [${this.name}] is now CLOSED`);
      }
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    const now = Date.now();
    this.recentFailures.push(now);

    // Remove old failures outside monitoring period
    this.recentFailures = this.recentFailures.filter(
      (timestamp) => now - timestamp < this.options.monitoringPeriod
    );

    this.failureCount = this.recentFailures.length;

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      // Failed during recovery test, open again
      this.state = CircuitBreakerState.OPEN;
      this.nextAttempt = now + this.options.timeout;
      this.logger.warn(`Circuit breaker [${this.name}] failed recovery test, reopening`);
    } else if (this.failureCount >= this.options.failureThreshold) {
      // Too many failures, open the circuit
      this.state = CircuitBreakerState.OPEN;
      this.nextAttempt = now + this.options.timeout;
      this.logger.error(
        `Circuit breaker [${this.name}] is now OPEN due to ${this.failureCount} failures`
      );
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Get failure count
   */
  getFailureCount(): number {
    return this.failureCount;
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.recentFailures = [];
    this.logger.log(`Circuit breaker [${this.name}] manually reset`);
  }

  /**
   * Get status for monitoring
   */
  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttempt:
        this.state === CircuitBreakerState.OPEN ? new Date(this.nextAttempt).toISOString() : null,
    };
  }
}

/**
 * Circuit Breaker Manager
 *
 * Manages multiple circuit breakers for different services
 */
export class CircuitBreakerManager {
  private breakers = new Map<string, CircuitBreaker>();

  /**
   * Get or create a circuit breaker
   */
  getBreaker(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, options));
    }
    return this.breakers.get(name)!;
  }

  /**
   * Execute with circuit breaker
   */
  async execute<T>(
    name: string,
    fn: () => Promise<T>,
    options?: CircuitBreakerOptions
  ): Promise<T> {
    const breaker = this.getBreaker(name, options);
    return breaker.execute(fn);
  }

  /**
   * Get all circuit breaker statuses
   */
  getAllStatuses() {
    return Array.from(this.breakers.values()).map((breaker) => breaker.getStatus());
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach((breaker) => breaker.reset());
  }
}

// Global instance
export const circuitBreakerManager = new CircuitBreakerManager();
