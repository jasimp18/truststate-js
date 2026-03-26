/**
 * Type Guard Utilities
 *
 * Provides type-safe utility functions for runtime type checking.
 * Use these instead of `as Error` casting for better error handling.
 */

/**
 * Type guard to check if a value is an Error instance
 *
 * @param value - The value to check
 * @returns True if value is an Error
 *
 * @example
 * ```typescript
 * try {
 *   // some operation
 * } catch (error) {
 *   if (isError(error)) {
 *     console.log(error.message); // TypeScript knows error is Error
 *   }
 * }
 * ```
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Type guard to check if a value is a string
 *
 * @param value - The value to check
 * @returns True if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard to check if a value is a number
 *
 * @param value - The value to check
 * @returns True if value is a number (and not NaN)
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

/**
 * Type guard to check if a value is a non-null object
 *
 * @param value - The value to check
 * @returns True if value is a non-null object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard to check if a value is an array
 *
 * @param value - The value to check
 * @returns True if value is an array
 */
export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Type guard to check if a value is null or undefined
 *
 * @param value - The value to check
 * @returns True if value is null or undefined
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Type guard to check if a value is defined (not null or undefined)
 *
 * @param value - The value to check
 * @returns True if value is defined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Safely extract error message from an unknown error
 *
 * Handles various error types including Error instances, strings,
 * and objects with a message property.
 *
 * @param error - The unknown error value
 * @param defaultMessage - Default message if error cannot be parsed (default: 'Unknown error')
 * @returns The error message string
 *
 * @example
 * ```typescript
 * try {
 *   // some operation
 * } catch (error) {
 *   logger.error(`Operation failed: ${getErrorMessage(error)}`);
 * }
 * ```
 */
export function getErrorMessage(error: unknown, defaultMessage = 'Unknown error'): string {
  if (isError(error)) {
    return error.message;
  }

  if (isString(error)) {
    return error;
  }

  if (isObject(error) && 'message' in error && isString(error.message)) {
    return error.message;
  }

  return defaultMessage;
}

/**
 * Safely extract error stack trace from an unknown error
 *
 * @param error - The unknown error value
 * @returns The error stack trace or undefined
 */
export function getErrorStack(error: unknown): string | undefined {
  if (isError(error)) {
    return error.stack;
  }
  return undefined;
}

/**
 * Convert an unknown error to a proper Error instance
 *
 * Useful when you need to ensure you have an Error object
 * for logging or re-throwing.
 *
 * @param error - The unknown error value
 * @returns An Error instance
 *
 * @example
 * ```typescript
 * try {
 *   // some operation
 * } catch (error) {
 *   throw toError(error); // Always throws a proper Error
 * }
 * ```
 */
export function toError(error: unknown): Error {
  if (isError(error)) {
    return error;
  }

  return new Error(getErrorMessage(error));
}

/**
 * Assert that a condition is true, throw an error otherwise
 *
 * Type narrowing assertion for TypeScript.
 *
 * @param condition - The condition to assert
 * @param message - Error message if assertion fails
 * @throws Error if condition is false
 *
 * @example
 * ```typescript
 * const value: string | undefined = getValue();
 * assertDefined(value, 'Value must be defined');
 * // TypeScript now knows value is string
 * console.log(value.toUpperCase());
 * ```
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message = 'Value is null or undefined'
): asserts value is T {
  if (!isDefined(value)) {
    throw new Error(message);
  }
}

/**
 * Assert that a condition is true
 *
 * @param condition - The condition to assert
 * @param message - Error message if assertion fails
 * @throws Error if condition is false
 */
export function assert(condition: boolean, message = 'Assertion failed'): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
