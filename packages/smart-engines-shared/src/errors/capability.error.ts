/**
 * Capability-related errors for Smart Engines
 */
import { SmartEngineError, ErrorCode, ErrorContext } from './smart-engine.error';

/**
 * Error thrown when a requested capability is not supported on a chain
 */
export class UnsupportedCapabilityError extends SmartEngineError {
  constructor(
    public readonly chain: string,
    public readonly capability: string,
    public readonly alternatives?: string[]
  ) {
    const message = `Capability '${capability}' is not supported on chain '${chain}'`;
    const context: ErrorContext = {
      chain,
      capability,
      alternatives,
    };

    super(message, ErrorCode.VALIDATION_ERROR, 400, context, false);
    this.name = 'UnsupportedCapabilityError';
  }
}

/**
 * Error thrown when trying to use a capability that was not enabled on token creation
 */
export class CapabilityNotEnabledError extends SmartEngineError {
  constructor(
    public readonly tokenId: string,
    public readonly capability: string
  ) {
    const message = `Capability '${capability}' was not enabled for token '${tokenId}'`;
    const context: ErrorContext = {
      tokenId,
      capability,
    };

    super(message, ErrorCode.VALIDATION_ERROR, 400, context, false);
    this.name = 'CapabilityNotEnabledError';
  }
}

/**
 * Error thrown when capability validation fails
 */
export class CapabilityValidationError extends SmartEngineError {
  constructor(
    message: string,
    public readonly capabilities: string[],
    public readonly chain: string
  ) {
    const context: ErrorContext = {
      capabilities,
      chain,
    };

    super(message, ErrorCode.VALIDATION_ERROR, 400, context, false);
    this.name = 'CapabilityValidationError';
  }
}
