// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

/**
 * ==================================================================================
 * ==                                                                              ==
 * ==          ASYMMETRIC IDENTITY & ZERO-KNOWLEDGE PROTOCOL SUBSTRATE             ==
 * ==                                                                              ==
 * ==      This file contains the full cryptographic stack for the Reality         ==
 * ==        Engine, including identity management, secure channel key             ==
 * ==            exchange, and zero-knowledge proof concepts.                      ==
 * ==                                                                              ==
 * ==================================================================================
 * @license SPDX-License-Identifier: Apache-2.0
 */

// --- SECTION I: ORIGINAL SYMMETRIC PRIMITIVES (UNCHANGED & INTERNALIZED) ---
// These are the correct, foundational building blocks. They will be used by the
// more advanced systems below but are no longer the primary public API.

const KEY_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const PBKDF2_ALGORITHM = 'PBKDF2';
const PBKDF2_HASH = 'SHA-256';
const PBKDF2_ITERATIONS = 300000;
const SALT_LENGTH_BYTES = 16;
const IV_LENGTH_BYTES = 12;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

// Fix: Add missing utility function.
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

export const deriveKey = async (password: string, salt: ArrayBuffer): Promise<CryptoKey> => {
    const masterKey = await crypto.subtle.importKey('raw',textEncoder.encode(password),{ name: PBKDF2_ALGORITHM },false,['deriveKey']);
    return await crypto.subtle.deriveKey({ name: PBKDF2_ALGORITHM, salt, iterations: PBKDF2_ITERATIONS, hash: PBKDF2_HASH, }, masterKey, { name: KEY_ALGORITHM, length: KEY_LENGTH }, true, ['encrypt', 'decrypt']);
};

export const generateSalt = (): ArrayBuffer => {
    return crypto.getRandomValues(new Uint8Array(SALT_LENGTH_BYTES)).buffer;
};

export const encrypt = async (plaintext: string, key: CryptoKey): Promise<{ ciphertext: ArrayBuffer, iv: Uint8Array }> => {
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
    const encodedPlaintext = textEncoder.encode(plaintext);
    const ciphertext = await crypto.subtle.encrypt({ name: KEY_ALGORITHM, iv, }, key, encodedPlaintext);
    return { ciphertext, iv };
};

export const decrypt = async (ciphertext: ArrayBuffer, key: CryptoKey, iv: Uint8Array): Promise<string> => {
    const decrypted = await crypto.subtle.decrypt({ name: KEY_ALGORITHM, iv, }, key, ciphertext);
    return textDecoder.decode(decrypted);
};


// ==================================================================================
// ==       SECTION II: ASYMMETRIC IDENTITY & SIGNATURES                           ==
// ==================================================================================

const ECDSA_PARAMS: EcdsaParams = { name: 'ECDSA', hash: { name: 'SHA-384' } };
const EC_KEY_GEN_PARAMS: EcKeyGenParams = { name: 'ECDH', namedCurve: 'P-384' };

export type IdentityKeyPair = CryptoKeyPair;

/**
 * Forges a new cryptographic identity for an Architect, consisting of a private
 * signing key and a public verification key.
 * @returns A promise resolving to a new `CryptoKeyPair`.
 */
export const generateIdentityKeyPair = (): Promise<IdentityKeyPair> => {
    return crypto.subtle.generateKey(EC_KEY_GEN_PARAMS, true, ['deriveKey', 'deriveBits']);
};

/**
 * Signs an arbitrary data payload with an Architect's private key, creating an
 * immutable, verifiable proof of origin and integrity.
 * @param privateKey The Architect's private `CryptoKey`.
 * @param data The data to be signed, as a string.
 * @returns An `ArrayBuffer` containing the cryptographic signature.
 */
export const signData = async (privateKey: CryptoKey, data: string): Promise<ArrayBuffer> => {
    const encodedData = textEncoder.encode(data);
    return crypto.subtle.sign(ECDSA_PARAMS, privateKey, encodedData);
};

/**
 * Verifies a signature against a data payload and an Architect's public key.
 * @param publicKey The Architect's public `CryptoKey`.
 * @param signature The `ArrayBuffer` of the signature to verify.
 * @param data The original data that was signed.
 * @returns A promise resolving to `true` if the signature is valid, `false` otherwise.
 */
export const verifySignature = async (publicKey: CryptoKey, signature: ArrayBuffer, data: string): Promise<boolean> => {
    const encodedData = textEncoder.encode(data);
    return crypto.subtle.verify(ECDSA_PARAMS, publicKey, signature, encodedData);
};


// ==================================================================================
// ==        SECTION III: SECURE CHANNEL ESTABLISHMENT (ECDH KEY EXCHANGE)         ==
// ==================================================================================

/**
 * Establishes a secure, ephemeral communication channel between two parties.
 * It uses the Elliptic Curve Diffie-Hellman algorithm to derive a shared secret,
 * which is then used as a key for symmetric AES-GCM encryption.
 * @param privateKey The local party's private identity key.
 * @param peerPublicKey The public key of the remote party.
 * @returns An object containing `encrypt` and `decrypt` functions bound to the new shared key.
 */
export const establishSecureChannel = async (privateKey: CryptoKey, peerPublicKey: CryptoKey) => {
    const sharedSecret = await crypto.subtle.deriveKey(
        { name: 'ECDH', public: peerPublicKey },
        privateKey,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );

    return {
        encrypt: (plaintext: string) => encrypt(plaintext, sharedSecret),
        decrypt: (ciphertext: ArrayBuffer, iv: Uint8Array) => decrypt(ciphertext, sharedSecret, iv)
    };
};


// ==================================================================================
// ==           SECTION IV: ZERO-KNOWLEDGE PROOF SYSTEM (CONCEPTUAL)               ==
// ==================================================================================

export type ZeroKnowledgeProof = {
    proof: ArrayBuffer;
    publicInputs: string[];
};

/**
 * CONCEPTUAL IMPLEMENTATION: Generates a proof that the Engine possesses knowledge of
 * a secret (e.g., a decrypted API key) without revealing the secret itself.
 * @param secret The plaintext secret.
 * @returns A simplified, conceptual ZeroKnowledgeProof object.
 */
export const generateProofOfKnowledge = async (secret: string): Promise<ZeroKnowledgeProof> => {
    // THIS IS A CONCEPTUAL, SIMPLIFIED IMPLEMENTATION of a ZKP.
    // Real ZKPs (like zk-SNARKs) are vastly more complex. This simulates the intent.

    const secretBuffer = textEncoder.encode(secret);
    
    // The "proof" is a hash of the secret combined with a random salt.
    const salt = generateSalt();
    const combined = new Uint8Array(secretBuffer.byteLength + salt.byteLength);
    combined.set(new Uint8Array(secretBuffer), 0);
    combined.set(new Uint8Array(salt), secretBuffer.byteLength);
    
    const proofBuffer = await crypto.subtle.digest('SHA-256', combined);

    return {
        proof: proofBuffer,
        // Fix: Call the arrayBufferToBase64 function.
        publicInputs: [arrayBufferToBase64(salt)], // The public input is the salt
    };
};

/**
 * CONCEPTUAL IMPLEMENTATION: Verifies a proof of knowledge against the original secret.
 */
export const verifyProofOfKnowledge = async (secret: string, proof: ZeroKnowledgeProof): Promise<boolean> => {
    // In a real ZKP, this would happen without the verifier knowing the `secret`.
    // We simulate it by regenerating the proof and comparing hashes.
    
    const salt = Uint8Array.from(atob(proof.publicInputs[0]), c => c.charCodeAt(0)).buffer;
    const secretBuffer = textEncoder.encode(secret);

    const combined = new Uint8Array(secretBuffer.byteLength + salt.byteLength);
    combined.set(new Uint8Array(secretBuffer), 0);
    combined.set(new Uint8Array(salt), secretBuffer.byteLength);
    
    const expectedProof = await crypto.subtle.digest('SHA-256', combined);

    // Fix: Call the arrayBufferToBase64 function.
    return arrayBufferToBase64(proof.proof) === arrayBufferToBase64(expectedProof);
};