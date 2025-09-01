/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Fix: Rename import to avoid shadowing global `crypto` object
import * as cryptoUtils from './cryptoService.ts';
import * as db from './dbService.ts';
import type { EncryptedData, ChrononTimestamp, FeatureId, VaultAccessLog } from '../types.ts';

// --- SELF-CONTAINED TYPE AUGMENTATIONS FOR THIS MODULE ---
interface EphemeralEncryptedData extends EncryptedData {
    expiresAt: number; // Unix timestamp in milliseconds
}

// This type was missing, adding it here based on usage.
// interface VaultAccessLog {
//     timestamp: ChrononTimestamp;
//     credentialId: string;
//     requestingFeature: FeatureId;
//     proof: string;
// }

// --- MODULE STATE ---
let sessionKey: CryptoKey | null = null;
const sessionProofs: Map<string, { proof: string, expires: number }> = new Map();

// --- PRIVATE HELPERS ---
const generateEnvironmentalSalt = async (): Promise<string> => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    const renderer = gl ? gl.getParameter(gl.RENDERER) : 'no-webgl';
    const timezone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    const entropy = `${navigator.userAgent}|${navigator.language}|${renderer}|${timezone}`;
    const buffer = new TextEncoder().encode(entropy);
    // Fix: Use global `crypto.subtle`
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
};

const generateProof = async (id: string): Promise<string> => {
    const timestamp = Date.now().toString();
    const proofMaterial = new TextEncoder().encode(`${id}::${timestamp}`);
    // Fix: Use global `crypto.subtle`
    const hashBuffer = await crypto.subtle.digest('SHA-256', proofMaterial);
    return `proof_${Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')}`;
};


// --- ORIGINAL EXPORTS (Preserved) ---
export const isUnlocked = (): boolean => {
    return sessionKey !== null;
};

export const lockVault = (): void => {
    sessionKey = null;
    sessionProofs.clear();
};

export const isVaultInitialized = async (): Promise<boolean> => {
    const salt = await db.getVaultData('pbkdf2-salt');
    return !!salt;
};

export const resetVault = async (): Promise<void> => {
    await db.clearAllData(); // This assumes clearAllData exists and clears all necessary stores.
    lockVault();
};

export const listCredentials = async (): Promise<string[]> => {
    return db.getAllEncryptedTokenIds();
};


// --- REFORGED & AUGMENTED EXPORTS ---
export const initializeVault = async (masterPassword: string): Promise<void> => {
    if (await isVaultInitialized()) {
        throw new Error("Vault is already initialized.");
    }
    const salt = cryptoUtils.generateSalt();
    const envSalt = await generateEnvironmentalSalt();
    const combinedPassword = `${masterPassword}::${envSalt}`;
    
    await db.saveVaultData('pbkdf2-salt', salt);
    // Also save a hash of the env salt to verify on unlock
    // Fix: Use global `crypto.subtle`
    const envSaltHashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(envSalt));
    const envSaltHash = Array.from(new Uint8Array(envSaltHashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    await db.saveVaultData('env-salt-hash', envSaltHash);
    
    sessionKey = await cryptoUtils.deriveKey(combinedPassword, salt);
};

export const unlockVault = async (masterPassword: string): Promise<void> => {
    const salt = await db.getVaultData('pbkdf2-salt');
    const expectedHash = await db.getVaultData('env-salt-hash');
    if (!salt || !expectedHash) {
        throw new Error("Vault not initialized.");
    }

    const currentEnvSalt = await generateEnvironmentalSalt();
    // Fix: Use global `crypto.subtle`
    const currentEnvSaltHashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(currentEnvSalt));
    const currentEnvSaltHash = Array.from(new Uint8Array(currentEnvSaltHashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    if (currentEnvSaltHash !== expectedHash) {
        throw new Error("Environmental lock mismatch. This vault is tied to a different device or browser profile.");
    }
    
    const combinedPassword = `${masterPassword}::${currentEnvSalt}`;
    
    try {
        sessionKey = await cryptoUtils.deriveKey(combinedPassword, salt);
    } catch (e) {
        console.error("Key derivation failed, likely incorrect password", e);
        throw new Error("Invalid Master Password.");
    }
};

export const saveCredential = async (id: string, plaintext: string): Promise<void> => {
    if (!sessionKey) throw new Error("Vault is locked.");
    
    const { ciphertext, iv } = await cryptoUtils.encrypt(plaintext, sessionKey);
    const encryptedData: EncryptedData = { id, ciphertext, iv };
    await db.saveEncryptedToken(encryptedData);
};

export const forgeTemporalCredential = async (id: string, plaintext: string, ttlSeconds: number): Promise<void> => {
    if (!sessionKey) throw new Error("Vault is locked.");

    const expirationTimestamp = Date.now() + (ttlSeconds * 1000);
    const dataWithTimestamp = JSON.stringify({ plaintext, expiresAt: expirationTimestamp });

    const { ciphertext, iv } = await cryptoUtils.encrypt(dataWithTimestamp, sessionKey);
    const encryptedData: EncryptedData = { id, ciphertext, iv }; // Stored using same structure, expiration is hidden within payload
    await db.saveEncryptedToken(encryptedData);
};

export const getDecryptedCredential = async (id: string, requestingFeature: FeatureId = 'unknown'): Promise<string | null> => {
    if (!sessionKey) throw new Error("Vault is locked.");
    
    const encryptedData = await db.getEncryptedToken(id);
    if (!encryptedData) return null;

    try {
        const decryptedPayload = await cryptoUtils.decrypt(encryptedData.ciphertext, sessionKey, encryptedData.iv);
        
        // This is where we handle both normal and temporal credentials
        let parsedPayload;
        try {
            parsedPayload = JSON.parse(decryptedPayload);
        } catch {
            // It's a legacy, simple string credential
            parsedPayload = { plaintext: decryptedPayload, expiresAt: null };
        }
        
        if (parsedPayload.expiresAt && Date.now() > parsedPayload.expiresAt) {
            console.warn(`Temporal credential "${id}" has expired. Purging.`);
            // Fix: Call the newly added deleteEncryptedToken method
            await db.deleteEncryptedToken(id); 
            return null;
        }

        // --- Log access and generate proof ---
        const proof = await generateProof(id);
        const logEntry: Omit<VaultAccessLog, 'id'> = {
            timestamp: BigInt(Date.now()),
            credentialId: id,
            requestingFeature,
            proof
        };
        // Fix: Call the newly added saveVaultAccessLog method
        await db.saveVaultAccessLog(logEntry); 
        sessionProofs.set(id, { proof, expires: Date.now() + 5000 }); // Proof is valid for 5 seconds

        return parsedPayload.plaintext;

    } catch (e) {
        console.error(`Decryption failed for ${id}`, e);
        lockVault();
        throw new Error("Decryption failed. Vault has been relocked for security.");
    }
};

export const validateProof = (id: string, proof: string): boolean => {
    const storedProof = sessionProofs.get(id);
    if (!storedProof || storedProof.proof !== proof || Date.now() > storedProof.expires) {
        return false;
    }
    // A proof can only be used once.
    sessionProofs.delete(id);
    return true;
};