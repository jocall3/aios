/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// No new types are imported or created. Uses only primitives.

// --- SELF-CONTAINED TYPES FOR THIS MODULE'S INTERNAL USE ---
type LogLevel = 'event' | 'error' | 'performance' | 'anomaly';

interface ChronicleEntry {
    id: string; // Unique ID for this entry
    timestamp: number;
    level: LogLevel;
    eventName: string;
    payload: Record<string, any>;
    causalEventId?: string; // ID of the event that caused this one
    durationMs?: number;
}

// --- MODULE STATE AND CONFIGURATION ---
const isTelemetryEnabled = true;
const CHRONICLE_MAX_SIZE = 1000; // Limit in-memory log to prevent memory leaks
const ANALYSIS_INTERVAL_MS = 15000; // Run analyzer every 15 seconds

let chronicle: ChronicleEntry[] = [];
const performanceMetrics: Record<string, { samples: number[]; avg: number; stdDev: number; }> = {};
let analyzerInterval: number | null = null;

// --- PRIVATE HELPERS ---
const generateEventId = () => `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const sanitizePayload = (payload: Record<string, any>): Record<string, any> => {
    try {
        const jsonString = JSON.stringify(payload);
        // This regex is a simple, safe way to find keys associated with sensitive data.
        const redactedString = jsonString.replace(/"(email|password|token|secret|key|authorization)"\s*:\s*".*?"/gi, '"$1":"[REDACTED]"');
        const sanitized = JSON.parse(redactedString);
        for (const key in sanitized) {
            if (typeof sanitized[key] === 'string' && sanitized[key].length > 500) {
                sanitized[key] = `${sanitized[key].substring(0, 100)}... (truncated)`;
            }
        }
        return sanitized;
    } catch {
        return { sanitization_error: "Payload could not be processed." };
    }
};

const writeToChronicle = (entry: Omit<ChronicleEntry, 'id' | 'timestamp'>): string => {
    if (!isTelemetryEnabled) return '';
    
    const newEntry: ChronicleEntry = {
        ...entry,
        id: generateEventId(),
        timestamp: Date.now(),
    };
    
    chronicle.push(newEntry);
    if (chronicle.length > CHRONICLE_MAX_SIZE) {
        chronicle.shift(); // Maintain max size
    }
    return newEntry.id;
};


// --- EXPORTED API (ORIGINAL INTERFACE PRESERVED) ---

export const logEvent = (eventName: string, payload: Record<string, any> = {}, causalEventId?: string): string => {
  const sanitizedPayload = sanitizePayload(payload);
  console.log(`%c[EVENT]%c ${eventName}`, 'color: #84cc16; font-weight: bold;', 'color: inherit;', sanitizedPayload);
  return writeToChronicle({ level: 'event', eventName, payload: sanitizedPayload, causalEventId });
};

export const logError = (error: Error, context: Record<string, any> = {}, causalEventId?: string): string => {
  const sanitizedContext = sanitizePayload(context);
  const errorPayload = { message: error.message, stack: error.stack, context: sanitizedContext };
  console.error(`%c[ERROR]%c ${error.message}`, 'color: #ef4444; font-weight: bold;', 'color: inherit;', { error, context: sanitizedContext });
  return writeToChronicle({ level: 'error', eventName: error.name || 'SystemError', payload: errorPayload, causalEventId });
};

export const measurePerformance = async <T>(metricName: string, operation: () => Promise<T>, causalEventId?: string): Promise<T> => {
  const start = performance.now();
  let eventId = '';
  try {
    const result = await operation();
    const duration = performance.now() - start;
    
    console.log(`%c[PERF]%c ${metricName}`, 'color: #3b82f6; font-weight: bold;', 'color: inherit;', { duration: `${duration.toFixed(2)}ms` });
    eventId = writeToChronicle({ level: 'performance', eventName: metricName, payload: {}, causalEventId, durationMs: duration });
    
    // Live analysis hook
    analyzeSinglePerformanceMetric(metricName, duration, eventId);
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    if (error instanceof Error) {
        logError(error, { failedMetric: metricName, durationMs: duration }, causalEventId);
    }
    throw error;
  }
};


// --- NEWLY FORGED SELF-DIAGNOSTIC & TRACING FUNCTIONS ---

const analyzeSinglePerformanceMetric = (metricName: string, duration: number, eventId: string) => {
    if (!performanceMetrics[metricName]) {
        performanceMetrics[metricName] = { samples: [], avg: 0, stdDev: 0 };
    }
    const metric = performanceMetrics[metricName];
    metric.samples.push(duration);
    if (metric.samples.length > 50) metric.samples.shift(); // Keep a rolling window of 50 samples

    // Recalculate stats
    const n = metric.samples.length;
    metric.avg = metric.samples.reduce((a, b) => a + b, 0) / n;
    metric.stdDev = Math.sqrt(metric.samples.map(x => Math.pow(x - metric.avg, 2)).reduce((a, b) => a + b) / n);

    // Check for anomaly
    if (n > 10 && duration > metric.avg + 3 * metric.stdDev) {
        const anomalyMessage = `Performance Anomaly: "${metricName}" took ${duration.toFixed(0)}ms, which is >3σ from the average of ${metric.avg.toFixed(0)}ms.`;
        console.warn(`%c[ANOMALY]%c ${anomalyMessage}`, 'color: #f97316; font-weight: bold;', 'color: inherit;');
        writeToChronicle({
            level: 'anomaly',
            eventName: 'PerformanceAnomalyDetected',
            payload: { message: anomalyMessage, metric: metricName, value: duration, average: metric.avg, stdDev: metric.stdDev },
            causalEventId: eventId,
        });
    }
};

/**
 * Traces the causal chain of events leading to a specific event ID.
 * @param eventId The ID of the event to trace back from.
 * @returns An array of ChronicleEntry objects representing the causal chain.
 */
export const traceCausality = (eventId: string): ChronicleEntry[] => {
    const chain: ChronicleEntry[] = [];
    const eventMap = new Map(chronicle.map(e => [e.id, e]));
    let currentEvent = eventMap.get(eventId);

    while (currentEvent) {
        chain.unshift(currentEvent);
        if (!currentEvent.causalEventId) break;
        currentEvent = eventMap.get(currentEvent.causalEventId);
    }

    return chain;
};


// --- INITIALIZATION of the background analyzer ---
const startChronicleAnalyzer = () => {
    if (analyzerInterval) clearInterval(analyzerInterval);
    analyzerInterval = window.setInterval(() => {
        // This function would contain more complex, cross-event analysis
        const errorEvents = chronicle.filter(e => e.level === 'error' && e.timestamp > Date.now() - ANALYSIS_INTERVAL_MS);
        if(errorEvents.length > 5) {
             console.warn(`%c[ANOMALY]%c System Stability Anomaly: ${errorEvents.length} errors logged in the last 15 seconds.`, 'color: #f97316; font-weight: bold;', 'color: inherit;');
             writeToChronicle({ level: 'anomaly', eventName: 'ErrorRateSpike', payload: { errorCount: errorEvents.length } });
        }
    }, ANALYSIS_INTERVAL_MS);
};

if (isTelemetryEnabled) {
    startChronicleAnalyzer();
}