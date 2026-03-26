import { CircuitBreaker, CircuitBreakerState } from './circuit-breaker';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker('test-service', {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 1000,
      monitoringPeriod: 5000,
    });
  });

  describe('execute', () => {
    it('should execute function successfully', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await breaker.execute(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(breaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });

    it('should remain closed on single failure', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'));

      await expect(breaker.execute(fn)).rejects.toThrow('fail');
      expect(breaker.getState()).toBe(CircuitBreakerState.CLOSED);
      expect(breaker.getFailureCount()).toBe(1);
    });

    it('should open after threshold failures', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'));

      // Execute until threshold reached
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(fn)).rejects.toThrow();
      }

      expect(breaker.getState()).toBe(CircuitBreakerState.OPEN);
    });

    it('should reject immediately when open', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(fn)).rejects.toThrow();
      }

      // Now should reject immediately without calling function
      fn.mockClear();
      await expect(breaker.execute(fn)).rejects.toThrow('Circuit breaker');
      expect(fn).not.toHaveBeenCalled();
    });

    it('should transition to half-open after timeout', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(fn)).rejects.toThrow();
      }

      expect(breaker.getState()).toBe(CircuitBreakerState.OPEN);

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Next call should transition to half-open
      const result = await breaker.execute(fn);
      expect(result).toBe('success');
    });

    it('should close from half-open after success threshold', async () => {
      const fn = jest.fn();

      // Open circuit
      fn.mockRejectedValue(new Error('fail'));
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(fn)).rejects.toThrow();
      }

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Succeed enough times to close
      fn.mockResolvedValue('success');
      await breaker.execute(fn);
      await breaker.execute(fn);

      expect(breaker.getState()).toBe(CircuitBreakerState.CLOSED);
    });
  });

  describe('reset', () => {
    it('should reset circuit breaker to closed state', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(fn)).rejects.toThrow();
      }

      expect(breaker.getState()).toBe(CircuitBreakerState.OPEN);

      breaker.reset();

      expect(breaker.getState()).toBe(CircuitBreakerState.CLOSED);
      expect(breaker.getFailureCount()).toBe(0);
    });
  });

  describe('getStatus', () => {
    it('should return current status', () => {
      const status = breaker.getStatus();

      expect(status).toHaveProperty('name', 'test-service');
      expect(status).toHaveProperty('state', CircuitBreakerState.CLOSED);
      expect(status).toHaveProperty('failureCount', 0);
      expect(status).toHaveProperty('successCount', 0);
    });
  });
});
