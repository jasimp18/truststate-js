/**
 * Custom error classes for Smart Engines
 */

export const ErrorCode = {
  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Chain-specific errors
  CHAIN_NOT_SUPPORTED: 'CHAIN_NOT_SUPPORTED',
  CHAIN_CONNECTION_ERROR: 'CHAIN_CONNECTION_ERROR',
  CHAIN_TIMEOUT: 'CHAIN_TIMEOUT',

  // Transaction errors
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  TRANSACTION_TIMEOUT: 'TRANSACTION_TIMEOUT',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  INVALID_TRANSACTION: 'INVALID_TRANSACTION',

  // Account errors
  ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',
  ACCOUNT_CREATION_FAILED: 'ACCOUNT_CREATION_FAILED',
  INVALID_ACCOUNT_ID: 'INVALID_ACCOUNT_ID',

  // Wallet errors
  WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
  WALLET_ENCRYPTION_ERROR: 'WALLET_ENCRYPTION_ERROR',
  WALLET_DECRYPTION_ERROR: 'WALLET_DECRYPTION_ERROR',
  INVALID_PRIVATE_KEY: 'INVALID_PRIVATE_KEY',

  // Token errors
  TOKEN_NOT_FOUND: 'TOKEN_NOT_FOUND',
  TOKEN_CREATION_FAILED: 'TOKEN_CREATION_FAILED',
  INSUFFICIENT_TOKEN_BALANCE: 'INSUFFICIENT_TOKEN_BALANCE',
  TRUST_LINE_REQUIRED: 'TRUST_LINE_REQUIRED',
  TOKEN_NOT_ASSOCIATED: 'TOKEN_NOT_ASSOCIATED',
  TOKEN_PAUSED: 'TOKEN_PAUSED',
  ACCOUNT_FROZEN: 'ACCOUNT_FROZEN',
  KYC_NOT_GRANTED: 'KYC_NOT_GRANTED',

  // Signature/Auth errors
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  NONCE_MISMATCH: 'NONCE_MISMATCH',

  // Contract errors
  CONTRACT_REVERT: 'CONTRACT_REVERT',
  CONTRACT_NOT_FOUND: 'CONTRACT_NOT_FOUND',
  GAS_ERROR: 'GAS_ERROR',

  // Infrastructure errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',
  EVENT_BUS_ERROR: 'EVENT_BUS_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface ErrorContext {
  [key: string]: any;
}

/**
 * Base Smart Engine Error
 */
export class SmartEngineError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly statusCode: number = 500,
    public readonly context?: ErrorContext,
    public readonly isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'SmartEngineError';
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        context: this.context,
        isRetryable: this.isRetryable,
      },
    };
  }
}

/**
 * Validation Error
 */
export class ValidationError extends SmartEngineError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, context, false);
    this.name = 'ValidationError';
  }
}

/**
 * Chain Error
 */
export class ChainError extends SmartEngineError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.CHAIN_CONNECTION_ERROR,
    context?: ErrorContext,
    isRetryable: boolean = true
  ) {
    super(message, code, 503, context, isRetryable);
    this.name = 'ChainError';
  }
}

/**
 * Transaction Error
 */
export class TransactionError extends SmartEngineError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.TRANSACTION_FAILED,
    context?: ErrorContext,
    isRetryable: boolean = false
  ) {
    super(message, code, 400, context, isRetryable);
    this.name = 'TransactionError';
  }
}

/**
 * Wallet Error
 */
export class WalletError extends SmartEngineError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.WALLET_NOT_FOUND,
    context?: ErrorContext
  ) {
    super(message, code, 404, context, false);
    this.name = 'WalletError';
  }
}

/**
 * Account Error
 */
export class AccountError extends SmartEngineError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.ACCOUNT_NOT_FOUND,
    context?: ErrorContext
  ) {
    super(message, code, 404, context, false);
    this.name = 'AccountError';
  }
}

/**
 * Token Error
 */
export class TokenError extends SmartEngineError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.TOKEN_NOT_FOUND,
    context?: ErrorContext
  ) {
    super(message, code, 404, context, false);
    this.name = 'TokenError';
  }
}

/**
 * Infrastructure Error
 */
export class InfrastructureError extends SmartEngineError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.EXTERNAL_SERVICE_ERROR,
    context?: ErrorContext,
    isRetryable: boolean = true
  ) {
    super(message, code, 503, context, isRetryable);
    this.name = 'InfrastructureError';
  }
}
