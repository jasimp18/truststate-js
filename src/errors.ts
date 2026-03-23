/**
 * Custom error class for TrustState API failures.
 */
export class TrustStateError extends Error {
  /** HTTP status code returned by the API (0 if not an HTTP error). */
  public readonly statusCode: number;

  constructor(message: string, statusCode = 0) {
    super(message);
    this.name = "TrustStateError";
    this.statusCode = statusCode;
    // Maintain proper prototype chain in transpiled ES5
    Object.setPrototypeOf(this, TrustStateError.prototype);
  }
}
