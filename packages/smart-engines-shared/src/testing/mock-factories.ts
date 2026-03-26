/**
 * Mock Factories
 *
 * Factory functions for creating mock objects used in tests
 */
import * as crypto from 'crypto';

/**
 * Create a mock authentication challenge
 */
export function createMockChallenge(overrides: Partial<MockChallenge> = {}): MockChallenge {
  return {
    id: crypto.randomUUID(),
    message: 'Sign this message to authenticate',
    walletAddress: `0.0.${Math.floor(Math.random() * 1000000)}`,
    chain: 'hedera',
    expiresAt: Math.floor(Date.now() / 1000) + 300,
    nonce: crypto.randomBytes(16).toString('hex'),
    ...overrides,
  };
}

export type MockChallenge = {
  id: string;
  message: string;
  walletAddress: string;
  chain: string;
  expiresAt: number;
  nonce: string;
};

/**
 * Create a mock authentication result
 */
export function createMockAuthResult(overrides: Partial<MockAuthResult> = {}): MockAuthResult {
  return {
    authenticated: true,
    walletAddress: `0.0.${Math.floor(Math.random() * 1000000)}`,
    chain: 'hedera',
    appId: 'test-app',
    permissions: [],
    ...overrides,
  };
}

export type MockAuthResult = {
  authenticated: boolean;
  walletAddress: string;
  chain: string;
  appId: string;
  permissions: string[];
};

/**
 * Create a mock document
 */
export function createMockDocument(overrides: Partial<MockDocument> = {}): MockDocument {
  const now = new Date();
  return {
    _id: crypto.randomUUID(),
    _collection: 'default',
    _createdAt: now,
    _updatedAt: now,
    _version: 1,
    data: {},
    ...overrides,
  };
}

export type MockDocument = {
  _id: string;
  _collection: string;
  _createdAt: Date;
  _updatedAt: Date;
  _version: number;
  data: Record<string, unknown>;
};

/**
 * Create a mock state transition
 */
export function createMockStateTransition(
  overrides: Partial<MockStateTransition> = {}
): MockStateTransition {
  return {
    transitionId: crypto.randomUUID(),
    operation: 'INSERT',
    collection: 'default',
    documentId: crypto.randomUUID(),
    stateRoot: crypto.randomBytes(32).toString('hex'),
    previousRoot: crypto.randomBytes(32).toString('hex'),
    timestamp: Date.now(),
    proof: {
      leaf: crypto.randomBytes(32).toString('hex'),
      path: [],
      root: crypto.randomBytes(32).toString('hex'),
    },
    ...overrides,
  };
}

export type MockStateTransition = {
  transitionId: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  collection: string;
  documentId: string;
  stateRoot: string;
  previousRoot: string;
  timestamp: number;
  proof: {
    leaf: string;
    path: { direction: 'left' | 'right'; hash: string }[];
    root: string;
  };
};

/**
 * Create a mock Merkle proof
 */
export function createMockMerkleProof(overrides: Partial<MockMerkleProof> = {}): MockMerkleProof {
  return {
    leafIndex: 0,
    leafHash: crypto.randomBytes(32),
    proof: [],
    root: crypto.randomBytes(32),
    ...overrides,
  };
}

export type MockMerkleProof = {
  leafIndex: number;
  leafHash: Buffer;
  proof: { position: 'left' | 'right'; hash: Buffer }[];
  root: Buffer;
};

/**
 * Create a mock host attestation
 */
export function createMockHostAttestation(
  overrides: Partial<MockHostAttestation> = {}
): MockHostAttestation {
  return {
    hostId: crypto.randomUUID(),
    publicKey: crypto.randomBytes(32),
    status: 'verified',
    successfulAttestations: 10,
    failedAttestations: 0,
    registeredAt: new Date(Date.now() - 86400000),
    lastVerifiedAt: new Date(),
    expiresAt: new Date(Date.now() + 86400000),
    ...overrides,
  };
}

export type MockHostAttestation = {
  hostId: string;
  publicKey: Buffer;
  status: 'pending' | 'verified' | 'failed' | 'revoked';
  successfulAttestations: number;
  failedAttestations: number;
  registeredAt: Date;
  lastVerifiedAt?: Date;
  expiresAt?: Date;
};

/**
 * Create a mock function definition
 */
export function createMockFunction(overrides: Partial<MockFunction> = {}): MockFunction {
  return {
    id: crypto.randomUUID(),
    name: 'testFunction',
    code: 'module.exports = async (args) => { return args; }',
    runtime: 'javascript',
    entryPoint: 'handler',
    status: 'active',
    owner: `0.0.${Math.floor(Math.random() * 1000000)}`,
    deployedAt: new Date(),
    ...overrides,
  };
}

export type MockFunction = {
  id: string;
  name: string;
  code: string;
  runtime: 'javascript' | 'typescript' | 'wasm';
  entryPoint: string;
  status: 'deploying' | 'active' | 'inactive' | 'error';
  owner: string;
  deployedAt: Date;
};

/**
 * Create a mock file metadata
 */
export function createMockFileMetadata(
  overrides: Partial<MockFileMetadata> = {}
): MockFileMetadata {
  return {
    cid: `Qm${crypto.randomBytes(22).toString('base64').slice(0, 44).replace(/[+/=]/g, 'a')}`,
    filename: 'test-file.txt',
    mimeType: 'text/plain',
    size: 1024,
    uploadedAt: new Date(),
    owner: `0.0.${Math.floor(Math.random() * 1000000)}`,
    pinned: true,
    encrypted: false,
    ...overrides,
  };
}

export type MockFileMetadata = {
  cid: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  owner: string;
  pinned: boolean;
  encrypted: boolean;
};

/**
 * Create a mock subscription
 */
export function createMockSubscription(
  overrides: Partial<MockSubscription> = {}
): MockSubscription {
  return {
    id: crypto.randomUUID(),
    channel: 'test-channel',
    subscriber: `0.0.${Math.floor(Math.random() * 1000000)}`,
    subscribedAt: new Date(),
    messageCount: 0,
    ...overrides,
  };
}

export type MockSubscription = {
  id: string;
  channel: string;
  subscriber: string;
  subscribedAt: Date;
  messageCount: number;
};

/**
 * Create a mock message
 */
export function createMockMessage(overrides: Partial<MockMessage> = {}): MockMessage {
  return {
    id: crypto.randomUUID(),
    channel: 'test-channel',
    type: 'broadcast',
    sender: `0.0.${Math.floor(Math.random() * 1000000)}`,
    payload: { data: 'test' },
    timestamp: new Date(),
    ...overrides,
  };
}

export type MockMessage = {
  id: string;
  channel: string;
  type: 'broadcast' | 'direct' | 'presence' | 'system';
  sender: string;
  payload: unknown;
  timestamp: Date;
};
