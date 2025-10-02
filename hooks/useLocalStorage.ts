// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import { useState, useCallback, useEffect, useRef } from 'react';

// --- In-Memory Cache for fast, repeated access ---
const cache = new Map<string, any>();

// --- Self-Contained, Lightweight Checksum for Data Integrity ---
// Using CRC32 for its simplicity and performance. No external libraries.
const crc32Table = (() => {
    let c;
    const table = [];
    for(let n = 0; n < 256; n++){
        c = n;
        for(let k = 0; k < 8; k++){
            c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        table[n] = c;
    }
    return table;
})();

const calculateChecksum = (str: string): string => {
    let crc = 0 ^ (-1);
    for (let i = 0; i < str.length; i++ ) {
        crc = (crc >>> 8) ^ crc32Table[(crc ^ str.charCodeAt(i)) & 0xFF];
    }
    // Fix: Ensure the return type is a string as declared.
    return ((crc ^ (-1)) >>> 0).toString(16).padStart(8, '0');
};


// --- Advanced Serialization Engine ---
const serialize = (value: any): string => {
    if (value === undefined) return '__UNDEFINED__';
    if (value === null) return '__NULL__';
    if (typeof value === 'string') return `s:${value}`;
    if (typeof value === 'number') return `n:${value}`;
    if (typeof value === 'boolean') return `b:${value}`;
    if (value instanceof Date) return `d:${value.toISOString()}`;
    if (value instanceof Map) return `m:${JSON.stringify(Array.from(value.entries()))}`;
    if (value instanceof Set) return `e:${JSON.stringify(Array.from(value.values()))}`;
    return `j:${JSON.stringify(value)}`;
};

const deserialize = (storedValue: string): any => {
    if (storedValue === '__UNDEFINED__') return undefined;
    if (storedValue === '__NULL__') return null;

    const type = storedValue.substring(0, 2);
    const value = storedValue.substring(2);

    switch(type) {
        case 's:': return value;
        case 'n:': return Number(value);
        case 'b:': return value === 'true';
        case 'd:': return new Date(value);
        case 'm:': return new Map(JSON.parse(value));
        case 'e:': return new Set(JSON.parse(value));
        case 'j:': return JSON.parse(value);
        default: return value; // Fallback for old/unrecognized formats
    }
};

/**
 * A hyper-optimized, fault-tolerant hook for persisting state to localStorage.
 * It features an in-memory cache, intelligent serialization, data integrity checks,
 * and cross-tab synchronization.
 *
 * @param key The unique key for the localStorage entry.
 * @param initialValue The initial value to use if none is found or if data is corrupt.
 * @returns A stateful value, and a function to update it.
 */
export const useLocalStorage = <T,>(key: string, initialValue: T): readonly [T, (value: T | ((val: T) => T)) => void] => {

    const initializer = useRef((k: string) => {
        // 1. Check in-memory cache first for speed
        if (cache.has(k)) {
            return cache.get(k);
        }
        
        // 2. Check localStorage (disk I/O)
        try {
            const consent = window.localStorage.getItem('devcore_ls_consent');
            if (consent !== 'granted') return initialValue;

            const storedItem = window.localStorage.getItem(k);
            if (storedItem === null) return initialValue;
            
            const { data, checksum } = JSON.parse(storedItem);
            
            // 3. Verify data integrity
            if (calculateChecksum(data) !== checksum) {
                console.warn(`Checksum mismatch for localStorage key "${k}". Data may be corrupt. Reverting to initial value.`);
                window.localStorage.removeItem(k);
                return initialValue;
            }
            
            const value = deserialize(data);
            cache.set(k, value);
            return value;
        } catch (error) {
            console.warn(`Error reading localStorage key “${k}”:`, error);
            return initialValue;
        }
    });

    const [storedValue, setStoredValue] = useState<T>(() => initializer.current(key));

    const setValue = useCallback(
        (value: T | ((val: T) => T)) => {
            try {
                 const consent = window.localStorage.getItem('devcore_ls_consent');
                 if (consent !== 'granted') {
                    // Even if consent is not granted, we can still update the in-session state.
                    const valueToStore = value instanceof Function ? value(storedValue) : value;
                    setStoredValue(valueToStore);
                    cache.set(key, valueToStore);
                    return;
                }

                const valueToStore = value instanceof Function ? value(storedValue) : value;
                setStoredValue(valueToStore);
                cache.set(key, valueToStore);

                const serializedData = serialize(valueToStore);
                const checksum = calculateChecksum(serializedData);
                const itemToStore = JSON.stringify({ data: serializedData, checksum });
                
                window.localStorage.setItem(key, itemToStore);
                
                // Dispatch storage event for cross-tab sync
                window.dispatchEvent(new StorageEvent('storage', { key }));
                
            } catch (error) {
                console.warn(`Error setting localStorage key “${key}”:`, error);
            }
        },
        [key, storedValue]
    );

    // Cross-tab synchronization listener
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === key) {
                setStoredValue(initializer.current(key));
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key]);


    return [storedValue, setValue] as const;
};