/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { logEvent, logError } from '../telemetryService'; // Assumes the monolithic index exists

// --- SELF-CONTAINED TYPES FOR THIS SUBSTRATE ---

export interface QuantumEvent {
    name: string;
    startTime: number;
    entryType: 'mark' | 'measure' | 'jank' | 'synthetic';
    // --- N-Dimensional Cost ---
    chronons: number;       // The actual duration in milliseconds
    computationCost: number; // Estimated CPU blocking time, a proxy
    volitionCost: number;    // Estimated cost on user focus
}

// --- MODULE STATE ---
let isTracing = false;
let traceBuffer: PerformanceEntry[] = [];
let frameRequestId: number | null = null;
let lastFrameTimestamp: number = 0;

const TRACE_PREFIX = 'engine-trace-';
const JANK_THRESHOLD_MS = 34; // Corresponds to < 30 FPS


// --- CORE LOGIC: FRAME-RATE & JANK DETECTION ---
const jankDetectionLoop = (timestamp: number) => {
    if (!isTracing) {
        frameRequestId = null;
        return;
    }
    
    if (lastFrameTimestamp !== 0) {
        const delta = timestamp - lastFrameTimestamp;
        if (delta > JANK_THRESHOLD_MS) {
            // Found jank, inject a synthetic event into the buffer
            performance.mark(`${TRACE_PREFIX}JANK_DETECTED_END`);
            performance.measure(
                `${TRACE_PREFIX}JANK_DETECTED`,
                { start: lastFrameTimestamp, end: timestamp }
            );
        }
    }
    
    lastFrameTimestamp = timestamp;
    frameRequestId = requestAnimationFrame(jankDetectionLoop);
};

// --- HEURISTICS for estimating non-chronon costs ---
const estimateVolitionCost = (duration: number): number => {
    // Non-linear mapping: longer waits are exponentially more frustrating.
    if (duration < 50) return duration / 50; // Low cost for fast events
    return Math.pow(duration / 100, 2);
};

// --- EXPORTED API ---

/**
 * Initiates a high-resolution performance and cognitive load trace,
 * including automated jank detection. If a trace is already running,
 * it is automatically finalized and a new one begins.
 */
export const startTracing = (): void => {
    if (isTracing) {
        console.warn("Tracing already active. Finalizing previous trace and starting new one.");
        stopTracing(); // Finalize the previous trace
    }

    performance.clearMarks();
    performance.clearMeasures();
    traceBuffer = [];
    isTracing = true;
    lastFrameTimestamp = performance.now();
    frameRequestId = requestAnimationFrame(jankDetectionLoop);
    logEvent('trace.started');
};

/**
 * Finalizes the current performance trace, processes the raw data into
 * QuantumEvents, and returns the completed analysis.
 */
export const stopTracing = (): QuantumEvent[] => {
    if (!isTracing) {
        return [];
    }
    if (frameRequestId) {
        cancelAnimationFrame(frameRequestId);
        frameRequestId = null;
    }
    isTracing = false;

    const entries = performance.getEntries().filter(e => e.name.startsWith(TRACE_PREFIX));
    
    const quantumEvents = entries.map((entry): QuantumEvent => {
        const duration = entry.duration;
        const name = entry.name.replace(TRACE_PREFIX, '');
        const entryType = name.startsWith('JANK_') ? 'jank' : entry.entryType as 'mark' | 'measure';
        return {
            name,
            startTime: entry.startTime,
            entryType,
            chronons: duration,
            computationCost: duration, // Simplistic 1:1 mapping for this implementation
            volitionCost: estimateVolitionCost(duration)
        };
    });

    performance.clearMarks();
    performance.clearMeasures();
    logEvent('trace.stopped', { eventCount: quantumEvents.length });
    return quantumEvents;
};

/**
 * Places a high-resolution mark in the performance timeline.
 */
export const mark = (name: string): void => {
    if (!isTracing) return;
    performance.mark(`${TRACE_PREFIX}${name}`);
};

/**
 * Creates a measure between two marks, calculating the duration.
 */
export const measure = (name: string, startMark: string, endMark: string): void => {
    if (!isTracing) return;
    try {
        performance.measure(`${TRACE_PREFIX}${name}`, `${TRACE_PREFIX}${startMark}`, `${TRACE_PREFIX}${endMark}`);
    } catch (e) {
        logError(e as Error, { context: 'performance.measure', name, startMark, endMark });
    }
};

/**
 * Runs a function a few times to build a cost profile, then extrapolates
 * to predict the cost of a large number of iterations, returning a synthetic trace.
 * @param operation The synchronous function to analyze.
 * @param iterations The target number of iterations for the simulation.
 * @returns A promise resolving to an array of synthetic QuantumEvents.
 */
export const predictiveTrace = async (operation: () => void, iterations: number): Promise<QuantumEvent[]> => {
    const SAMPLE_COUNT = 5;
    if (iterations < SAMPLE_COUNT) throw new Error("Iterations must be greater than sample count.");
    
    const samples: number[] = [];
    for (let i = 0; i < SAMPLE_COUNT; i++) {
        const start = performance.now();
        operation();
        samples.push(performance.now() - start);
    }

    const avgDuration = samples.reduce((a, b) => a + b, 0) / SAMPLE_COUNT;
    const predictedTotalDuration = avgDuration * iterations;
    const predictedVolitionCost = estimateVolitionCost(predictedTotalDuration);
    
    logEvent('trace.predictive_analysis_complete', {
        operationName: operation.name || 'anonymous',
        predictedTotalDuration,
        predictedVolitionCost,
    });
    
    // Create a synthetic trace representing the full operation
    return [
        {
            name: `SYNTHETIC: ${operation.name || 'anonymous'} x ${iterations}`,
            startTime: 0,
            entryType: 'synthetic',
            chronons: predictedTotalDuration,
            computationCost: predictedTotalDuration,
            volitionCost: predictedVolitionCost,
        }
    ];
};