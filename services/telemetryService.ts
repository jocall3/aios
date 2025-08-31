import { openDB, DBSchema } from 'idb';
import type { ChrononTimestamp, CognitiveSignature, SystemEntropyState } from '../types';

// --- SELF-CONTAINED TYPES FOR THIS MODULE ---
type LogLevel = 'event' | 'error' | 'performance' | 'anomaly';

interface ChronicleEntry {
    id: string; // ULID for time-sortable IDs
    timestamp: ChrononTimestamp;
    level: LogLevel;
    signature: CognitiveSignature;
    entropy: SystemEntropyState;
    eventName: string;
    payload: Record<string, any>;
    causalEventId?: string; // Link to the preceding event
    durationMs?: number;
}

interface ChronicleDB extends DBSchema {
    'system-chronicle': {
        key: string;
        value: ChronicleEntry;
        indexes: { 'by-timestamp': ChrononTimestamp; 'by-level': LogLevel; };
    };
}

// --- MODULE STATE AND CONFIGURATION ---
const isTelemetryEnabled = true;
let dbPromise: Promise<IDBDatabase<ChronicleDB>>;
const PII_REDACTION_REGEX = /"?(email|password|token|secret|key)"?\s*:\s*".*?"/gi;

// --- DATABASE INITIALIZATION ---
const initializeChronicle = () => {
    if (dbPromise) return dbPromise;
    dbPromise = openDB<ChronicleDB>('engine-chronicle-db', 1, {
        upgrade(db) {
            const store = db.createObjectStore('system-chronicle', { keyPath: 'id' });
            store.createIndex('by-timestamp', 'timestamp');
            store.createIndex('by-level', 'level');
        },
    });
    return dbPromise;
};

// --- PRIVATE HELPERS ---
const generateULID = (timestamp: number = Date.now()) => {
    const timeStr = timestamp.toString(36).padStart(10, '0');
    const randomStr = Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
    return `${timeStr}${randomStr}`.substring(0, 26);
};

const redactPayload = (payload: Record<string, any>): Record<string, any> => {
    const jsonString = JSON.stringify(payload);
    const redactedString = jsonString.replace(PII_REDACTION_REGEX, '"$1": "[REDACTED]"');
    try {
        const sanitized = JSON.parse(redactedString);
         // Final truncation pass for overly verbose data that isn't PII
        for (const key in sanitized) {
            if (typeof sanitized[key] === 'string' && sanitized[key].length > 1000) {
                sanitized[key] = `${sanitized[key].substring(0, 250)}... (truncated)`;
            }
        }
        return sanitized;
    } catch {
        return { parsing_error: "Could not redact payload." };
    }
};

const writeToChronicle = async (entry: Omit<ChronicleEntry, 'id' | 'timestamp'>) => {
    if (!isTelemetryEnabled) return;
    try {
        const db = await initializeChronicle();
        const fullEntry: ChronicleEntry = {
            ...entry,
            id: generateULID(),
            timestamp: BigInt(Date.now()),
        };
        await db.put('system-chronicle', fullEntry);
    } catch (e) {
        // Fallback to console if DB fails
        console.error("ChronicleDB Write Failure:", e);
    }
};


// --- EXPORTED API ---

export const logEvent = (
    eventName: string,
    payload: Record<string, any> = {},
    causalEventId?: string
) => {
  const sanitizedPayload = redactPayload(payload);
  
  writeToChronicle({
      level: 'event',
      eventName,
      payload: sanitizedPayload,
      causalEventId,
      signature: 'sig_cognitron::active_user_placeholder', // Would be fetched from global state
      entropy: 0.1, // Placeholder for SystemEntropyState
  });

  console.log(`%c[EVENT]%c ${eventName}`, 'color: #84cc16; font-weight: bold;', 'color: inherit;', sanitizedPayload);
};

export const logError = (
    error: Error,
    context: Record<string, any> = {},
    causalEventId?: string
) => {
  const sanitizedContext = redactPayload(context);
  const errorPayload = {
      message: error.message,
      stack: error.stack,
      context: sanitizedContext,
  };
  
  writeToChronicle({
      level: 'error',
      eventName: 'SystemError',
      payload: errorPayload,
      causalEventId,
      signature: 'sig_cognitron::active_user_placeholder',
      entropy: 0.8,
  });

  console.error(`%c[ERROR]%c ${error.message}`, 'color: #ef4444; font-weight: bold;', 'color: inherit;', errorPayload);

  // AUTOMATED SELF-CORRECTION HOOK (Conceptual)
  // import { synthesizeExploitSuite } from './FaultInjectionAI';
  // if (error.stack) {
  //     synthesizeExploitSuite(error.stack, sanitizedContext.code || '');
  // }
};

export const measurePerformance = async <T>(
  metricName: string,
  operation: () => Promise<T>,
  causalEventId?: string
): Promise<T> => {
  const start = performance.now();
  try {
    const result = await operation();
    const duration = performance.now() - start;

    writeToChronicle({
      level: 'performance',
      eventName: metricName,
      payload: {},
      durationMs: duration,
      causalEventId,
      signature: 'sig_cognitron::active_user_placeholder',
      entropy: 0.1,
    });
    console.log(`%c[PERF]%c ${metricName}`, 'color: #3b82f6; font-weight: bold;', 'color: inherit;', { duration: `${duration.toFixed(2)}ms` });
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    if (error instanceof Error) {
        logError(error, { failedMetric: metricName, durationMs: duration }, causalEventId);
    }
    throw error;
  }
};

// Example of the background analyzer
const startChronicleAnalyzer = () => {
    // This would run in a Web Worker to avoid blocking the main thread
    console.log("CONCEPT: Chronicle Analyzer worker would be spawned here to monitor DB for anomalies.");
};

startChronicleAnalyzer();