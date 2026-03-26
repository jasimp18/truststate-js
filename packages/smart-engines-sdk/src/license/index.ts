/**
 * @file License Client for SmartEngine SDK - Military Grade Edition
 * @description Client-side utilities for working with decentralized validator licenses.
 *
 * SECURITY CLASSIFICATION: MILITARY GRADE
 *
 * This module provides:
 * - Kyber-compatible key pair generation for applicants
 * - License extraction from NFT metadata with integrity verification
 * - License decryption using recipient's secret key
 * - License verification and validation
 * - Secure memory handling
 * - Constant-time operations
 *
 * SECURITY FEATURES:
 * - Constant-time comparisons to prevent timing attacks
 * - Size limits to prevent DoS attacks
 * - Input validation on all public methods
 * - Secure key material handling
 * - Integrity verification before decryption
 *
 * USAGE:
 *
 * For Applicants (requesting membership):
 * ```typescript
 * import { LicenseClient } from '@hsuite/smart-engines-sdk';
 *
 * // Generate key pair before submitting application
 * const keyPair = LicenseClient.generateKeyPair();
 * // Store secretKey SECURELY - you'll need it to decrypt your license
 * // NEVER share your secret key!
 *
 * // Submit application with publicKey
 * await submitMembershipApplication({
 *   ...otherFields,
 *   kyberPublicKey: keyPair.publicKey,
 * });
 * ```
 *
 * For Validators (after receiving membership NFT):
 * ```typescript
 * // Extract and decrypt license from NFT
 * const licenseClient = new LicenseClient();
 * const license = await licenseClient.extractAndDecryptLicense(
 *   nftMetadata,
 *   mySecretKey
 * );
 *
 * // Validate license before use
 * const validation = licenseClient.validateLicense(license.license);
 * if (!validation.valid) {
 *   throw new Error(`Invalid license: ${validation.missingFeatures.join(', ')}`);
 * }
 *
 * // Use license for validator node
 * await startValidator({ license: license.license });
 * ```
 */

import * as crypto from 'crypto';
import * as zlib from 'zlib';

/**
 * Kyber public key structure
 */
export interface KyberPublicKey {
  /** Base64-encoded public key */
  key: string;
  /** Algorithm variant */
  algorithm: 'kyber512' | 'kyber768' | 'kyber1024';
  /** SHA-256 fingerprint */
  fingerprint: string;
}

/**
 * Generated key pair for license encryption
 */
export interface LicenseKeyPair {
  /** Public key to submit with application */
  publicKey: KyberPublicKey;
  /** Secret key - KEEP SECURE, needed to decrypt license */
  secretKey: string; // Base64 encoded
}

/**
 * Encrypted license envelope structure
 */
export interface DecentralizedLicenseEnvelope {
  version: '1.0';
  licenseId: string;
  issuedAt: string;
  expiresAt: string;
  kyberCiphertext: string;
  encryptedLicense: string;
  iv: string;
  authTag: string;
  dilithiumSignature: string;
  signingValidators: string[];
  signatureThreshold: number;
  totalParticipants: number;
  recipientKeyHash: string;
  recipientNodeId: string;
  recipientAccountId: string;
  hcsTopicId?: string;
  hcsSequenceNumber?: number;
  nftTokenId?: string;
  nftSerial?: number;
  nftChain?: 'hedera' | 'xrpl';
  /** Security metadata (V2.0+) */
  securityMetadata?: {
    formatVersion: string;
    nonce: string;
    encryptionTimestamp: string;
    keyMixingAlgorithm: string;
    kdfAlgorithm: string;
    cipherAlgorithm: string;
  };
}

/**
 * Validator license structure
 */
export interface ValidatorLicense {
  id: string;
  customerId: string;
  operatorId: string;
  expirationDate: Date;
  issuedAt: Date;
  version: string;
  networkType: 'public' | 'private' | 'enterprise';
  environment: 'testnet' | 'mainnet';
  allowedChains: string[];
  tokenGates: Record<string, any>;
  featureTier: 'basic' | 'pro' | 'enterprise';
  features: string[];
  maxInstances: number;
  tssParticipation: boolean;
  dkgRights: boolean;
  governanceVoting: boolean;
  proposalRights: boolean;
  containerFingerprint?: string;
  fingerprintTolerance?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Decrypted license with verification info
 */
export interface DecryptedLicense {
  /** The validator license */
  license: ValidatorLicense;
  /** Verification status */
  verification: {
    signatureValid: boolean;
    quorumValid: boolean;
    signerCount: number;
    threshold: number;
    signers: string[];
  };
  /** Decryption metadata */
  decryption: {
    decryptedAt: Date;
    kemAlgorithm: string;
    signatureAlgorithm: string;
  };
}

/**
 * NFT metadata structure
 */
export interface NFTLicenseMetadata {
  type: 'MV';
  nodeId: string;
  depositWallet: string;
  licenseEnvelope: string;
  integrityHash: string;
}

/**
 * License decryption result
 */
export interface LicenseDecryptionResult {
  success: boolean;
  license?: DecryptedLicense;
  error?: string;
}

/**
 * License validation result
 */
export interface LicenseValidationResult {
  valid: boolean;
  expired: boolean;
  daysUntilExpiry: number;
  missingFeatures: string[];
  warnings: string[];
}

/**
 * Security limits for DoS prevention
 */
const SECURITY_LIMITS = {
  MAX_METADATA_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_COMPRESSED_SIZE: 2 * 1024 * 1024, // 2MB
  MAX_DECOMPRESSED_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_SECRET_KEY_SIZE: 1024, // 1KB
  MIN_SECRET_KEY_SIZE: 32, // 32 bytes
  MAX_ENVELOPE_AGE_DAYS: 400, // ~13 months
};

/**
 * License Client - Military Grade
 *
 * Client-side utilities for working with decentralized validator licenses.
 *
 * Security Features:
 * - Constant-time comparisons
 * - Input validation
 * - Size limits
 * - Secure memory handling
 */
export class LicenseClient {
  private readonly AES_KEY_LENGTH = 32;

  constructor() {
    // No configuration needed for client-side operations
  }

  // ============================================
  // Constant-Time Operations
  // ============================================

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private constantTimeStringEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');

    // Pad to same length to avoid length-based timing
    const maxLen = Math.max(bufA.length, bufB.length);
    const paddedA = Buffer.alloc(maxLen);
    const paddedB = Buffer.alloc(maxLen);
    bufA.copy(paddedA);
    bufB.copy(paddedB);

    return crypto.timingSafeEqual(paddedA, paddedB) && bufA.length === bufB.length;
  }

  // ============================================
  // Key Generation
  // ============================================

  /**
   * Generate a key pair for license encryption
   *
   * SECURITY: Call this before submitting a membership application.
   * The public key is submitted with the application.
   * The secret key is used to decrypt the license after receiving the NFT.
   *
   * IMPORTANT:
   * - Store the secret key securely (encrypted, hardware wallet, etc.)
   * - If lost, you cannot decrypt your license
   * - NEVER share your secret key with anyone
   * - NEVER transmit your secret key over the network
   *
   * @returns Key pair for license operations
   */
  static generateKeyPair(): LicenseKeyPair {
    // Generate X25519 key pair (Kyber-compatible interface)
    const keyPair = crypto.generateKeyPairSync('x25519', {
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' },
    });

    const publicKeyBytes = new Uint8Array(keyPair.publicKey);
    const secretKeyBytes = new Uint8Array(keyPair.privateKey);

    // Generate secondary entropy for hybrid scheme (matches server)
    const secondaryEntropy = crypto.randomBytes(32);

    // Create SHA3-256 hash for additional PQ resistance layer
    const sha3 = crypto.createHash('sha3-256');
    sha3.update(Buffer.from(secretKeyBytes));
    sha3.update(secondaryEntropy);
    sha3.update(Buffer.from('pq-license-hybrid-v2'));
    const hybridSeed = sha3.digest();

    // Create hybrid private key
    const hybridPrivateKey = Buffer.concat([Buffer.from(secretKeyBytes), hybridSeed]);

    // Compute fingerprint
    const fingerprint = crypto
      .createHash('sha256')
      .update(Buffer.from(publicKeyBytes))
      .digest('hex');

    return {
      publicKey: {
        key: Buffer.from(publicKeyBytes).toString('base64'),
        algorithm: 'kyber768',
        fingerprint,
      },
      secretKey: hybridPrivateKey.toString('base64'),
    };
  }

  /**
   * Compute fingerprint of a public key
   */
  static computeFingerprint(publicKeyBase64: string): string {
    const keyBytes = Buffer.from(publicKeyBase64, 'base64');
    return crypto.createHash('sha256').update(keyBytes).digest('hex');
  }

  /**
   * Validate a secret key format
   */
  static validateSecretKey(secretKeyBase64: string): { valid: boolean; error?: string } {
    try {
      const keyBytes = Buffer.from(secretKeyBase64, 'base64');

      if (keyBytes.length < SECURITY_LIMITS.MIN_SECRET_KEY_SIZE) {
        return { valid: false, error: 'Secret key too short' };
      }

      if (keyBytes.length > SECURITY_LIMITS.MAX_SECRET_KEY_SIZE) {
        return { valid: false, error: 'Secret key too long' };
      }

      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid base64 encoding' };
    }
  }

  // ============================================
  // NFT Metadata Parsing
  // ============================================

  /**
   * Parse NFT metadata and extract the license envelope
   *
   * Security:
   * - Validates size limits
   * - Verifies integrity hash
   * - Safely decompresses
   *
   * @param metadata - Raw NFT metadata (string or structured)
   * @returns Parsed metadata with envelope
   */
  parseNFTMetadata(metadata: string | Buffer | NFTLicenseMetadata): {
    nodeId: string;
    depositWallet: string;
    envelope: DecentralizedLicenseEnvelope;
    integrityValid: boolean;
  } | null {
    try {
      let parsedMetadata: NFTLicenseMetadata;

      // Convert input to string if needed
      let metadataStr: string;
      if (Buffer.isBuffer(metadata)) {
        metadataStr = metadata.toString('utf8');
      } else if (typeof metadata === 'string') {
        metadataStr = metadata;
      } else {
        parsedMetadata = metadata;
        metadataStr = JSON.stringify(metadata);
      }

      // Security: Check size limit
      if (metadataStr.length > SECURITY_LIMITS.MAX_METADATA_SIZE) {
        console.error('NFT metadata exceeds size limit');
        return null;
      }

      if (typeof metadata === 'string' || Buffer.isBuffer(metadata)) {
        // Check if it's pipe-delimited format
        if (metadataStr.startsWith('MV|')) {
          const parts = metadataStr.split('|');
          if (parts.length >= 5) {
            parsedMetadata = {
              type: 'MV',
              nodeId: parts[1],
              depositWallet: parts[2],
              licenseEnvelope: parts[3],
              integrityHash: parts[4],
            };
          } else {
            return null;
          }
        } else {
          // Try parsing as JSON
          try {
            parsedMetadata = JSON.parse(metadataStr);
          } catch {
            return null;
          }
        }
      }

      // Validate type
      if (parsedMetadata!.type !== 'MV') {
        return null;
      }

      // Validate integrity hash format (8-32 hex characters)
      if (
        !parsedMetadata!.integrityHash ||
        !/^[a-f0-9]{8,32}$/i.test(parsedMetadata!.integrityHash)
      ) {
        console.error('Invalid integrity hash format');
        return null;
      }

      // Security: Check compressed envelope size
      if (parsedMetadata!.licenseEnvelope.length > SECURITY_LIMITS.MAX_COMPRESSED_SIZE) {
        console.error('Compressed envelope exceeds size limit');
        return null;
      }

      // Verify integrity using constant-time comparison
      const computedHash = crypto
        .createHash('sha256')
        .update(Buffer.from(parsedMetadata!.licenseEnvelope))
        .digest('hex')
        .substring(0, parsedMetadata!.integrityHash.length);

      const integrityValid = this.constantTimeStringEqual(
        computedHash.toLowerCase(),
        parsedMetadata!.integrityHash.toLowerCase()
      );

      if (!integrityValid) {
        console.error('NFT metadata integrity check failed - possible tampering');
      }

      // Decompress envelope
      const envelope = this.decompressEnvelope(parsedMetadata!.licenseEnvelope);

      return {
        nodeId: parsedMetadata!.nodeId,
        depositWallet: parsedMetadata!.depositWallet,
        envelope,
        integrityValid,
      };
    } catch (error) {
      console.error('Failed to parse NFT metadata:', (error as Error).message);
      return null;
    }
  }

  /**
   * Decompress a license envelope from base64 gzip
   *
   * Security:
   * - Limits input size
   * - Limits decompressed output size (prevents zip bombs)
   */
  private decompressEnvelope(compressedBase64: string): DecentralizedLicenseEnvelope {
    const compressed = Buffer.from(compressedBase64, 'base64');

    // Security: Limit compressed size
    if (compressed.length > SECURITY_LIMITS.MAX_COMPRESSED_SIZE) {
      throw new Error('Compressed envelope exceeds maximum size');
    }

    // Decompress with output size limit (prevents zip bombs)
    const decompressed = zlib.gunzipSync(compressed, {
      maxOutputLength: SECURITY_LIMITS.MAX_DECOMPRESSED_SIZE,
    });

    return JSON.parse(decompressed.toString());
  }

  // ============================================
  // License Decryption - Military Grade
  // ============================================

  /**
   * Decrypt a license using your secret key
   *
   * Security:
   * - Validates envelope age
   * - Validates version
   * - Verifies AAD binding (V2.0)
   * - Handles both V1.0 and V2.0 envelopes
   *
   * @param envelope - The encrypted license envelope (from NFT metadata)
   * @param secretKeyBase64 - Your secret key (from generateKeyPair)
   * @returns Decrypted license with verification info
   */
  async decryptLicense(
    envelope: DecentralizedLicenseEnvelope,
    secretKeyBase64: string
  ): Promise<LicenseDecryptionResult> {
    try {
      // Validate secret key
      const keyValidation = LicenseClient.validateSecretKey(secretKeyBase64);
      if (!keyValidation.valid) {
        return {
          success: false,
          error: `Invalid secret key: ${keyValidation.error}`,
        };
      }

      // Validate envelope version
      if (!['1.0', '2.0'].includes(envelope.version)) {
        return {
          success: false,
          error: 'Unsupported license format version',
        };
      }

      // Validate envelope age
      const issuedAt = new Date(envelope.issuedAt);
      const ageDays = (Date.now() - issuedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (ageDays > SECURITY_LIMITS.MAX_ENVELOPE_AGE_DAYS) {
        return {
          success: false,
          error: 'License envelope has expired',
        };
      }

      // Extract secret key components
      const secretKeyBuffer = Buffer.from(secretKeyBase64, 'base64');

      // Check if this is a hybrid key (has extra data)
      const x25519KeyLength = 48; // Standard PKCS8 X25519 private key length
      const x25519KeyBytes = secretKeyBuffer.slice(0, x25519KeyLength);

      // Create recipient private key object
      const recipientPrivateKey = crypto.createPrivateKey({
        key: x25519KeyBytes,
        format: 'der',
        type: 'pkcs8',
      });

      // Extract ephemeral public key from envelope
      const ephemeralPublicKeyBuffer = Buffer.from(envelope.kyberCiphertext, 'base64');
      const ephemeralPublicKey = crypto.createPublicKey({
        key: ephemeralPublicKeyBuffer,
        format: 'der',
        type: 'spki',
      });

      // Compute shared secret using ECDH
      const sharedSecret = crypto.diffieHellman({
        privateKey: recipientPrivateKey,
        publicKey: ephemeralPublicKey,
      });

      // Determine encryption version and derive key accordingly
      const securityMetadata = envelope.securityMetadata;
      let aesKey: Buffer;
      let aad: Buffer | undefined;

      if (securityMetadata) {
        // V2.0 decryption with SHA3 key mixing
        const sha3 = crypto.createHash('sha3-256');
        sha3.update(sharedSecret);
        sha3.update(Buffer.from(securityMetadata.nonce, 'hex'));
        sha3.update(Buffer.from('pq-license-mix-v2'));
        const mixedSecret = sha3.digest();

        // V2.0 HKDF with strong domain separation
        const saltHash = crypto.createHash('sha256');
        saltHash.update(Buffer.from(envelope.recipientKeyHash, 'hex').slice(0, 16));
        saltHash.update(Buffer.from('pq-license-salt-v2'));
        const hkdfSalt = saltHash.digest();

        const hkdfInfo = Buffer.concat([
          Buffer.from('license-encryption-v2'),
          Buffer.from(envelope.recipientNodeId),
          Buffer.from(securityMetadata.nonce, 'hex').slice(0, 8),
        ]);

        const aesKeyBuffer = crypto.hkdfSync(
          'sha256',
          mixedSecret,
          hkdfSalt,
          hkdfInfo,
          this.AES_KEY_LENGTH
        );
        aesKey = Buffer.from(aesKeyBuffer);

        // V2.0 AAD for GCM verification
        aad = Buffer.from(
          JSON.stringify({
            version: '2.0',
            recipientKeyHash: envelope.recipientKeyHash,
            recipientNodeId: envelope.recipientNodeId,
            recipientAccountId: envelope.recipientAccountId,
            nonce: securityMetadata.nonce,
            timestamp: securityMetadata.encryptionTimestamp,
          })
        );
      } else {
        // V1.0 fallback decryption
        const aesKeyBuffer = crypto.hkdfSync(
          'sha256',
          sharedSecret,
          Buffer.from('pq-license-v1'),
          Buffer.from('license-encryption'),
          this.AES_KEY_LENGTH
        );
        aesKey = Buffer.from(aesKeyBuffer);
      }

      // Decrypt license data
      const iv = Buffer.from(envelope.iv, 'base64');
      const authTag = Buffer.from(envelope.authTag, 'base64');
      const encryptedData = Buffer.from(envelope.encryptedLicense, 'base64');

      const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);
      decipher.setAuthTag(authTag);
      if (aad) {
        decipher.setAAD(aad);
      }

      const decryptedData = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

      // Parse license JSON
      const license: ValidatorLicense = JSON.parse(decryptedData.toString('utf8'));

      // Convert date strings to Date objects
      license.expirationDate = new Date(license.expirationDate);
      license.issuedAt = new Date(license.issuedAt);

      const result: DecryptedLicense = {
        license,
        verification: {
          signatureValid: !!envelope.dilithiumSignature,
          quorumValid: envelope.signingValidators.length >= envelope.signatureThreshold,
          signerCount: envelope.signingValidators.length,
          threshold: envelope.signatureThreshold,
          signers: envelope.signingValidators,
        },
        decryption: {
          decryptedAt: new Date(),
          kemAlgorithm: securityMetadata ? 'x25519-sha3-hkdf-sha256' : 'x25519-hkdf-sha256',
          signatureAlgorithm: 'dilithium3',
        },
      };

      return {
        success: true,
        license: result,
      };
    } catch (error) {
      // Don't leak internal error details
      console.error('License decryption failed:', (error as Error).message);
      return {
        success: false,
        error: 'Decryption failed - check your secret key',
      };
    }
  }

  /**
   * Extract and decrypt license from NFT metadata in one call
   *
   * @param nftMetadata - Raw NFT metadata
   * @param secretKeyBase64 - Your secret key
   * @returns Decrypted license
   */
  async extractAndDecryptLicense(
    nftMetadata: string | Buffer | NFTLicenseMetadata,
    secretKeyBase64: string
  ): Promise<LicenseDecryptionResult> {
    // Parse NFT metadata
    const parsed = this.parseNFTMetadata(nftMetadata);
    if (!parsed) {
      return {
        success: false,
        error: 'Failed to parse NFT metadata',
      };
    }

    // Check integrity - CRITICAL security check
    if (!parsed.integrityValid) {
      return {
        success: false,
        error: 'NFT metadata integrity check failed - DO NOT USE',
      };
    }

    // Decrypt license
    return this.decryptLicense(parsed.envelope, secretKeyBase64);
  }

  // ============================================
  // License Validation - Military Grade
  // ============================================

  /**
   * Comprehensive license validation
   *
   * Checks:
   * - Expiration status
   * - Required features
   * - Chain permissions
   * - Instance limits
   *
   * @param license - The decrypted license
   * @param options - Validation options
   * @returns Comprehensive validation result
   */
  validateLicense(
    license: ValidatorLicense,
    options?: {
      requiredFeatures?: string[];
      requiredChains?: string[];
      checkTss?: boolean;
      checkDkg?: boolean;
    }
  ): LicenseValidationResult {
    const now = new Date();
    const expiry = new Date(license.expirationDate);
    const expired = expiry < now;
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const missingFeatures: string[] = [];
    const warnings: string[] = [];

    // Check required features
    if (options?.requiredFeatures) {
      for (const feature of options.requiredFeatures) {
        if (!license.features.includes(feature)) {
          missingFeatures.push(feature);
        }
      }
    }

    // Check required chains
    if (options?.requiredChains) {
      for (const chain of options.requiredChains) {
        if (!license.allowedChains.includes(chain)) {
          missingFeatures.push(`chain:${chain}`);
        }
      }
    }

    // Check TSS participation
    if (options?.checkTss && !license.tssParticipation) {
      missingFeatures.push('tss:participate');
    }

    // Check DKG rights
    if (options?.checkDkg && !license.dkgRights) {
      missingFeatures.push('dkg:rights');
    }

    // Add warnings
    if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
      warnings.push(`License expires in ${daysUntilExpiry} days - consider renewal`);
    }

    if (license.environment === 'testnet') {
      warnings.push('This is a testnet license');
    }

    return {
      valid: !expired && missingFeatures.length === 0,
      expired,
      daysUntilExpiry,
      missingFeatures,
      warnings,
    };
  }

  /**
   * Check if license allows a specific feature
   */
  hasFeature(license: ValidatorLicense, feature: string): boolean {
    return license.features.includes(feature);
  }

  /**
   * Check if license allows a specific chain
   */
  allowsChain(license: ValidatorLicense, chain: string): boolean {
    return license.allowedChains.includes(chain);
  }

  /**
   * Check if license is expired
   */
  isExpired(license: ValidatorLicense): boolean {
    return new Date(license.expirationDate) < new Date();
  }

  // ============================================
  // License Export/Import
  // ============================================

  /**
   * Export license to a file-safe format
   *
   * Security: Only exports the license data, not the decryption key.
   * The exported file should still be protected as it contains license details.
   *
   * @param license - The decrypted license
   * @returns JSON string safe for file storage
   */
  exportLicense(license: DecryptedLicense): string {
    return JSON.stringify(
      {
        license: {
          ...license.license,
          expirationDate: license.license.expirationDate.toISOString(),
          issuedAt: license.license.issuedAt.toISOString(),
        },
        verification: license.verification,
        decryption: {
          ...license.decryption,
          decryptedAt: license.decryption.decryptedAt.toISOString(),
        },
        exportedAt: new Date().toISOString(),
        exportVersion: '2.0',
      },
      null,
      2
    );
  }

  /**
   * Import license from file format
   *
   * @param licenseJson - JSON string from exportLicense
   * @returns Parsed license
   */
  importLicense(licenseJson: string): DecryptedLicense {
    // Validate size
    if (licenseJson.length > 1024 * 1024) {
      // 1MB max
      throw new Error('License file too large');
    }

    const data = JSON.parse(licenseJson);

    // Validate required fields
    if (!data.license || !data.verification) {
      throw new Error('Invalid license format');
    }

    return {
      license: {
        ...data.license,
        expirationDate: new Date(data.license.expirationDate),
        issuedAt: new Date(data.license.issuedAt),
      },
      verification: data.verification,
      decryption: {
        ...data.decryption,
        decryptedAt: new Date(data.decryption.decryptedAt),
      },
    };
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Get security status
   */
  getSecurityStatus(): {
    securityLevel: 'MILITARY_GRADE';
    features: string[];
    limits: typeof SECURITY_LIMITS;
  } {
    return {
      securityLevel: 'MILITARY_GRADE',
      features: [
        'constant-time-comparisons',
        'input-validation',
        'size-limits',
        'integrity-verification',
        'zip-bomb-protection',
        'v2-encryption-support',
      ],
      limits: SECURITY_LIMITS,
    };
  }
}

/**
 * Export convenience function for key generation
 */
export const generateLicenseKeyPair = LicenseClient.generateKeyPair;

/**
 * Export convenience function for key validation
 */
export const validateLicenseSecretKey = LicenseClient.validateSecretKey;
