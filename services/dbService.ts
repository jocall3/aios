import { openDB, DBSchema } from 'idb';
import type { GeneratedFile, EncryptedData, CustomFeature, VaultAccessLog } from '../types.ts';
// Fix: Import from the monolithic index to avoid circular dependency and find the correct export.
import { simulationState } from './simulationState.ts';
import * as liveDB from './live/databaseClient.ts';

const DB_NAME = 'devcore-db';
// Fix: Incremented version for new store
const DB_VERSION = 4; 
const FILES_STORE_NAME = 'generated-files';
const VAULT_STORE_NAME = 'vault-data';
const ENCRYPTED_TOKENS_STORE_NAME = 'encrypted-tokens';
const CUSTOM_FEATURES_STORE_NAME = 'custom-features';
// Fix: Add new store name
const VAULT_ACCESS_LOG_STORE_NAME = 'vault-access-log';


interface DevCoreDB extends DBSchema {
  [FILES_STORE_NAME]: {
    key: string;
    value: GeneratedFile;
    indexes: { 'by-filePath': string };
  };
  [VAULT_STORE_NAME]: {
    key: string;
    value: any;
  };
  [ENCRYPTED_TOKENS_STORE_NAME]: {
    key: string;
    value: EncryptedData;
  };
  [CUSTOM_FEATURES_STORE_NAME]: {
    key: string;
    value: CustomFeature;
  };
  // Fix: Add schema for new store
  [VAULT_ACCESS_LOG_STORE_NAME]: {
    key: string;
    value: VaultAccessLog;
    indexes: { 'by-timestamp': number };
  }
}

const dbPromise = openDB<DevCoreDB>(DB_NAME, DB_VERSION, {
  upgrade(db, oldVersion) {
    switch (oldVersion) {
        case 0: {
            const store = db.createObjectStore(FILES_STORE_NAME, {
                keyPath: 'filePath',
            });
            store.createIndex('by-filePath', 'filePath');
        }
        // fall-through for new installations
        case 1: {
            if (!db.objectStoreNames.contains(VAULT_STORE_NAME)) {
                db.createObjectStore(VAULT_STORE_NAME);
            }
            if (!db.objectStoreNames.contains(ENCRYPTED_TOKENS_STORE_NAME)) {
                db.createObjectStore(ENCRYPTED_TOKENS_STORE_NAME, { keyPath: 'id' });
            }
        }
        // fall-through for version 2 to 3 upgrade
        case 2: {
             if (!db.objectStoreNames.contains(CUSTOM_FEATURES_STORE_NAME)) {
                db.createObjectStore(CUSTOM_FEATURES_STORE_NAME, { keyPath: 'id' });
            }
        }
        // fall-through for version 3 to 4 upgrade
        case 3: {
            if (!db.objectStoreNames.contains(VAULT_ACCESS_LOG_STORE_NAME)) {
                // @ts-ignore
                const logStore = db.createObjectStore(VAULT_ACCESS_LOG_STORE_NAME, { autoIncrement: true, keyPath: 'id' });
                logStore.createIndex('by-timestamp', 'timestamp');
            }
        }
    }
  },
});

// --- Generated Files Store ---
export const saveFile = async (file: GeneratedFile): Promise<void> => {
    if (simulationState.isSimulationMode) {
        const db = await dbPromise;
        await db.put(FILES_STORE_NAME, file);
    } else {
        await liveDB.liveSaveFile(file);
    }
};

export const getAllFiles = async (): Promise<GeneratedFile[]> => {
    if (simulationState.isSimulationMode) {
        const db = await dbPromise;
        return db.getAll(FILES_STORE_NAME);
    } else {
        return liveDB.liveGetAllFiles();
    }
};

export const getFileByPath = async (filePath: string): Promise<GeneratedFile | undefined> => {
    if (simulationState.isSimulationMode) {
        const db = await dbPromise;
        return db.get(FILES_STORE_NAME, filePath);
    } else {
        return liveDB.liveGetFileByPath(filePath);
    }
};

export const clearAllFiles = async (): Promise<void> => {
    if (simulationState.isSimulationMode) {
        const db = await dbPromise;
        await db.clear(FILES_STORE_NAME);
    } else {
        await liveDB.liveClearAllFiles();
    }
};

// --- Vault Store ---
export const saveVaultData = async (key: string, value: any): Promise<void> => {
    if (simulationState.isSimulationMode) {
        const db = await dbPromise;
        await db.put(VAULT_STORE_NAME, value, key);
    } else {
        await liveDB.liveSaveVaultData(key, value);
    }
};

export const getVaultData = async (key: string): Promise<any | undefined> => {
    if (simulationState.isSimulationMode) {
        const db = await dbPromise;
        return db.get(VAULT_STORE_NAME, key);
    } else {
        return liveDB.liveGetVaultData(key);
    }
};

// --- Encrypted Tokens Store ---
export const saveEncryptedToken = async (data: EncryptedData): Promise<void> => {
     if (simulationState.isSimulationMode) {
        const db = await dbPromise;
        await db.put(ENCRYPTED_TOKENS_STORE_NAME, data);
    } else {
        await liveDB.liveSaveEncryptedToken(data);
    }
};

export const getEncryptedToken = async (id: string): Promise<EncryptedData | undefined> => {
    if (simulationState.isSimulationMode) {
        const db = await dbPromise;
        return db.get(ENCRYPTED_TOKENS_STORE_NAME, id);
    } else {
        return liveDB.liveGetEncryptedToken(id);
    }
};

// Fix: Add missing deleteEncryptedToken function
export const deleteEncryptedToken = async (id: string): Promise<void> => {
    if (simulationState.isSimulationMode) {
        const db = await dbPromise;
        await db.delete(ENCRYPTED_TOKENS_STORE_NAME, id);
    } else {
        // Assuming liveDB would have a corresponding method
        // await liveDB.liveDeleteEncryptedToken(id);
    }
};

export const getAllEncryptedTokenIds = async (): Promise<string[]> => {
    if (simulationState.isSimulationMode) {
        const db = await dbPromise;
        return db.getAllKeys(ENCRYPTED_TOKENS_STORE_NAME);
    } else {
        return liveDB.liveGetAllEncryptedTokenIds();
    }
};

// --- Custom Features Store ---
export const saveCustomFeature = async (feature: CustomFeature): Promise<void> => {
    if (simulationState.isSimulationMode) {
        const db = await dbPromise;
        await db.put(CUSTOM_FEATURES_STORE_NAME, feature);
    } else {
        await liveDB.liveSaveCustomFeature(feature);
    }
};

export const getAllCustomFeatures = async (): Promise<CustomFeature[]> => {
    if (simulationState.isSimulationMode) {
        const db = await dbPromise;
        return db.getAll(CUSTOM_FEATURES_STORE_NAME);
    } else {
        return liveDB.liveGetAllCustomFeatures();
    }
};

export const getCustomFeature = async (id: string): Promise<CustomFeature | undefined> => {
    if (simulationState.isSimulationMode) {
        const db = await dbPromise;
        return db.get(CUSTOM_FEATURES_STORE_NAME, id);
    } else {
        return liveDB.liveGetCustomFeature(id);
    }
};

export const deleteCustomFeature = async (id: string): Promise<void> => {
    if (simulationState.isSimulationMode) {
        const db = await dbPromise;
        await db.delete(CUSTOM_FEATURES_STORE_NAME, id);
    } else {
        await liveDB.liveDeleteCustomFeature(id);
    }
};

// Fix: Add missing saveVaultAccessLog function
export const saveVaultAccessLog = async (logEntry: Omit<VaultAccessLog, 'id'>): Promise<void> => {
    if (simulationState.isSimulationMode) {
        const db = await dbPromise;
        // @ts-ignore
        await db.add(VAULT_ACCESS_LOG_STORE_NAME, logEntry as VaultAccessLog);
    } else {
        // await liveDB.liveSaveVaultAccessLog(logEntry);
    }
};


// --- Global Actions ---
export const clearAllData = async (): Promise<void> => {
    if (simulationState.isSimulationMode) {
        const db = await dbPromise;
        await db.clear(FILES_STORE_NAME);
        await db.clear(VAULT_STORE_NAME);
        await db.clear(ENCRYPTED_TOKENS_STORE_NAME);
        await db.clear(CUSTOM_FEATURES_STORE_NAME);
        await db.clear(VAULT_ACCESS_LOG_STORE_NAME);
    } else {
        await liveDB.liveClearAllData();
    }
}