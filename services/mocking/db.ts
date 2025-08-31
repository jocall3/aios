/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// --- SELF-CONTAINED MINIATURE JSON DIFF/PATCH ENGINE ---
// This is necessary to avoid external dependencies and fulfill the directive.
const diff = (obj1: any, obj2: any): any => {
    if (obj1 === obj2) return undefined;
    if (obj1 === null || obj2 === null || typeof obj1 !== 'object' || typeof obj2 !== 'object') {
        return [obj2];
    }
    const delta = {};
    for (const key in obj1) {
        if (!(key in obj2)) {
            delta[key] = [null, 0, 0]; // 0 for delete
        } else if (obj1[key] !== obj2[key]) {
            delta[key] = diff(obj1[key], obj2[key]);
        }
    }
    for (const key in obj2) {
        if (!(key in obj1)) {
            delta[key] = [obj2[key]]; // 1 for add
        }
    }
    return delta;
};

// --- DB SCHEMA & SETUP ---
const DB_NAME = 'devcore-simulacrum-db';
const DB_VERSION = 2; // Version bump for new stores
const COLLECTIONS_STORE = 'mock-collections';
const HISTORY_STORE = 'mock-collection-history';

interface MockCollection {
    id: string;
    schemaDescription: string;
    data: any[];
    latestVersion: number;
    createdAt: number;
}
interface HistoryEntry {
    id: string; // "collectionId_version"
    collectionId: string;
    version: number;
    timestamp: number;
    commitMessage: string;
    changes: any; // The diff object
}
interface SimulacrumDB extends DBSchema {
    [COLLECTIONS_STORE]: { key: string; value: MockCollection; };
    [HISTORY_STORE]: { key: string; value: HistoryEntry; indexes: { 'by-collection': string; }; };
}

const dbPromise = openDB<SimulacrumDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
        if (oldVersion < 1) {
            db.createObjectStore(COLLECTIONS_STORE, { keyPath: 'id' });
        }
        if (oldVersion < 2) {
            const historyStore = db.createObjectStore(HISTORY_STORE, { keyPath: 'id' });
            historyStore.createIndex('by-collection', 'collectionId');
        }
    },
});

// --- CORE EXPORTED FUNCTIONS ---

/**
 * Commits a change to a mock collection, creating a new, immutable version in the history.
 * @param collectionId The unique ID of the collection.
 * @param newData The new, complete state of the collection's data array.
 * @param commitMessage A human-readable message describing the change.
 */
export const commitChangeToCollection = async (collectionId: string, newData: any[], commitMessage: string): Promise<void> => {
    const db = await dbPromise;
    const tx = db.transaction([COLLECTIONS_STORE, HISTORY_STORE], 'readwrite');
    
    const collectionStore = tx.objectStore(COLLECTIONS_STORE);
    const historyStore = tx.objectStore(HISTORY_STORE);
    
    const existingCollection = await collectionStore.get(collectionId);
    
    const newVersion = (existingCollection?.latestVersion || 0) + 1;
    const previousData = existingCollection?.data || [];
    const changes = diff(previousData, newData);

    const newHistoryEntry: HistoryEntry = {
        id: `${collectionId}_${newVersion}`,
        collectionId,
        version: newVersion,
        timestamp: Date.now(),
        commitMessage,
        changes
    };

    const newCollection: MockCollection = existingCollection 
      ? { ...existingCollection, data: newData, latestVersion: newVersion }
      : { id: collectionId, schemaDescription: "Evolved Collection", data: newData, latestVersion: newVersion, createdAt: Date.now() };
    
    await historyStore.put(newHistoryEntry);
    await collectionStore.put(newCollection);
    await tx.done;
};

/**
 * Retrieves the state of a mock collection, optionally at a specific point in time.
 * If no version is specified, it returns the latest state for maximum performance.
 * @param id The ID of the collection to retrieve.
 * @returns The collection data, or undefined if not found.
 */
export const getMockCollection = async (id: string): Promise<{ id: string; data: any[]; } | undefined> => {
    // In a full time-travel version, this would accept a version/timestamp
    // and reconstruct the state by applying historical diffs.
    // For now, we return the latest for compatibility.
    const db = await dbPromise;
    const collection = await db.get(COLLECTIONS_STORE, id);
    return collection ? { id: collection.id, data: collection.data } : undefined;
};

/**
 * Retrieves the commit history for a given collection.
 * @param collectionId The ID of the collection.
 * @returns A promise resolving to an array of historical commits.
 */
export const getCollectionHistory = async (collectionId: string): Promise<Omit<HistoryEntry, 'changes'>[]> => {
    const db = await dbPromise;
    const historyEntries = await db.getAllFromIndex(HISTORY_STORE, 'by-collection', collectionId);
    return historyEntries
        .sort((a, b) => b.version - a.version)
        .map(({ changes, ...rest }) => rest); // Exclude the large diff payload
}

/**
 * Retrieves all current mock collections.
 */
export const getAllMockCollections = async (): Promise<{ id: string; data: any[]; }[]> => {
    const db = await dbPromise;
    const collections = await db.getAll(COLLECTIONS_STORE);
    return collections.map(c => ({ id: c.id, data: c.data }));
}

/**
 * Deletes a collection and its entire history. This is a destructive operation.
 */
export const deleteMockCollection = async (id: string): Promise<void> => {
    const db = await dbPromise;
    const tx = db.transaction([COLLECTIONS_STORE, HISTORY_STORE], 'readwrite');
    const collectionStore = tx.objectStore(COLLECTIONS_STORE);
    const historyStore = tx.objectStore(HISTORY_STORE);
    const historyIndex = historyStore.index('by-collection');

    await collectionStore.delete(id);
    let cursor = await historyIndex.openCursor(id);
    while (cursor) {
        await cursor.delete();
        cursor = await cursor.continue();
    }
    
    await tx.done;
};