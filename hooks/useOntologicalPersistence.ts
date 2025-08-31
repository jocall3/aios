import { useState, useCallback, useEffect } from 'react';
import { migrateDataSchema } from '../services/SchemaMigrationAI'; // Invented AI Service
import { db_readHistory, db_writeHistory, db_revertToTimestamp } from '../services/PalimpsestArchive'; // Invented DB Service
import type { RealityStratumID, ChrononTimestamp } from '../types';

interface PersistenceOptions {
    stratum: RealityStratumID;
    currentSchemaVersion: number;
}

type SetValue<T> = (value: T | ((previousState: T) => T)) => Promise<void>;
type RevertTo<T> = (timestamp: ChrononTimestamp) => Promise<T | null>;
type HistoryEntry<T> = [T, ChrononTimestamp];

/**
 * A hook for persisting state to the Engine's versioned, time-travel-capable, 
 * multi-reality ontological archive.
 * @param key The unique key for the data entity.
 * @param initialValue The initial value if no data exists.
 * @param options Configuration for persistence behavior.
 * @returns [value, setValue, history, revertTo]
 */
export const useOntologicalPersistence = <T,>(
    key: string,
    initialValue: T,
    options: Partial<PersistenceOptions> = {}
): readonly [T, SetValue<T>, readonly HistoryEntry<T>[], RevertTo<T>] => {
    const { stratum = 'STRATUM_BASELINE', currentSchemaVersion = 1 } = options;

    const [currentValue, setCurrentValue] = useState<T>(initialValue);
    const [history, setHistory] = useState<readonly HistoryEntry<T>[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initial load, migration, and history fetching logic.
    useEffect(() => {
        const initialize = async () => {
            const historyLog = await db_readHistory<T>(key, stratum);
            setHistory(historyLog);
            
            const latestEntry = historyLog[historyLog.length - 1];

            if (latestEntry) {
                const [latestData, , storedSchemaVersion] = latestEntry as any; // Assuming DB stores version
                
                if (storedSchemaVersion < currentSchemaVersion) {
                    try {
                        // AI-driven schema migration
                        const migratedData = await migrateDataSchema<T>(latestData, storedSchemaVersion, currentSchemaVersion, key);
                        setCurrentValue(migratedData);
                        // Persist the migrated version as a new history entry
                        await db_writeHistory(key, stratum, migratedData, currentSchemaVersion);
                    } catch (e) {
                        console.error(`SCHEMA MIGRATION FAILED for key "${key}". Reverting to initial value.`, e);
                        setCurrentValue(initialValue);
                    }
                } else {
                    setCurrentValue(latestData);
                }
            } else {
                setCurrentValue(initialValue);
            }
            setIsInitialized(true);
        };
        initialize();
    }, [key, stratum, initialValue, currentSchemaVersion]);
    
    const setValue: SetValue<T> = useCallback(async (value) => {
        if (!isInitialized) {
            console.warn("Attempted to set value before ontological persistence is initialized. Operation deferred.");
            // In a real scenario, you'd queue this operation.
            return;
        }

        const valueToStore = value instanceof Function ? value(currentValue) : value;
        setCurrentValue(valueToStore);
        
        try {
            const newHistoryLog = await db_writeHistory(key, stratum, valueToStore, currentSchemaVersion);
            setHistory(newHistoryLog);
        } catch (error) {
            console.error(`Error writing to Palimpsest Archive for key “${key}”:`, error);
        }
    }, [key, stratum, currentValue, currentSchemaVersion, isInitialized]);
    
    const revertTo: RevertTo<T> = useCallback(async (timestamp) => {
         if (!isInitialized) return null;

        try {
            const { newValue, newHistory } = await db_revertToTimestamp<T>(key, stratum, timestamp);
            if (newValue !== null) {
                setCurrentValue(newValue);
                setHistory(newHistory);
                return newValue;
            }
            return null;
        } catch (error) {
            console.error(`Error reverting state for key “${key}”:`, error);
            return null;
        }

    }, [key, stratum, isInitialized]);

    return [currentValue, setValue, history, revertTo] as const;
};