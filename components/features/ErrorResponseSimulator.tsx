// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useGlobalState } from '../../contexts/GlobalStateContext';
import * as services from '../../services'; // Import the entire monolithic service object
import type { SystemVitals, ChaosVector } from '../../types'; // Assume these now exist in the real types.ts
import { ServerStackIcon, ExclamationTriangleIcon } from '../icons';

// --- SELF-CONTAINED VITALS MONITOR ---
const useSystemVitals = (isEngaged: boolean): SystemVitals | null => {
    const [vitals, setVitals] = useState<SystemVitals | null>(null);

    useEffect(() => {
        if (!isEngaged) {
            setVitals(null);
            return;
        }
        
        let eventCount = 0;
        const handleEvent = () => { eventCount++; };
        // window.addEventListener('engine_event', handleEvent); // Conceptual: listen to a global event bus

        const interval = setInterval(async () => {
            const memory = (performance as any).memory?.usedJSHeapSize / 1024 / 1024;
            setVitals({
                cpu: 0, // Cannot be measured accurately from browser JS
                memory: memory || 0,
                eventThroughput: eventCount,
            });
            eventCount = 0; // Reset for next second
        }, 1000);

        return () => {
            // window.removeEventListener('engine_event', handleEvent);
            clearInterval(interval);
        };
    }, [isEngaged]);
    
    return vitals;
};


// --- THE SELF-CONTAINED CHAOS ENGINE ---
const chaosEngine = {
    originalFunctions: new Map<string, Function>(),

    storeOriginal(key: string, func: Function) {
        if (!this.originalFunctions.has(key)) {
            this.originalFunctions.set(key, func);
        }
    },
    
    inject(vector: ChaosVector) {
        this.clear(); // Clear previous chaos before injecting a new one

        switch(vector) {
            case 'AI_SUBSTRATE_FAILURE':
                this.storeOriginal('generateContent', services.generateContent);
                (services as any).generateContent = () => { throw new Error("AI Substrate Failure: Chaos Probe Active"); };
                break;
            case 'VAULT_LOCKED':
                this.storeOriginal('isUnlocked', services.isUnlocked);
                (services as any).isUnlocked = () => false;
                break;
            case 'NETWORK_BLACKOUT':
                this.storeOriginal('fetch', window.fetch);
                (window as any).fetch = () => Promise.reject(new TypeError("Network Blackout: Chaos Probe Active"));
                break;
            case 'HIGH_LATENCY_STORM':
                this.storeOriginal('fetch', window.fetch);
                const originalFetch = this.originalFunctions.get('fetch') || window.fetch;
                (window as any).fetch = async (...args: any[]) => {
                    await new Promise(res => setTimeout(res, 2000 + Math.random() * 3000));
                    return originalFetch(...args);
                };
                break;
            // RENDER_STORM is too complex to inject from here without a global event bus.
        }
        services.logEvent('chaos_probe.engaged', { vector });
    },

    clear() {
        this.originalFunctions.forEach((originalFunc, key) => {
            const [obj, funcName] = key.includes('.') ? key.split('.') : ['window', key];
            if ((globalThis as any)[obj]) {
                (globalThis as any)[obj][funcName] = originalFunc;
            } else {
                 (services as any)[key] = originalFunc;
            }
        });
        this.originalFunctions.clear();
        services.logEvent('chaos_probe.disengaged');
    }
};


// --- THE COMPONENT ---
export const ErrorResponseSimulator: React.FC = () => {
    const [selectedVector, setSelectedVector] = useState<ChaosVector>('AI_SUBSTRATE_FAILURE');
    const [isEngaged, setIsEngaged] = useState(false);
    const vitals = useSystemVitals(isEngaged);
    
    // Ensure chaos is cleared on dismount
    useEffect(() => () => chaosEngine.clear(), []);

    const handleToggleChaos = useCallback(() => {
        const nextState = !isEngaged;
        setIsEngaged(nextState);
        if (nextState) {
            chaosEngine.inject(selectedVector);
        } else {
            chaosEngine.clear();
        }
    }, [isEngaged, selectedVector]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><ExclamationTriangleIcon /><span className="ml-3">Systemic Chaos & Resilience Probe</span></h1>
                <p className="text-text-secondary mt-1">Directly inject live, systemic failures to empirically validate the Engine's resilience.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                 <div className="flex flex-col gap-4">
                     <h3 className="text-xl font-bold">Chaos Vector Selection</h3>
                      <div className="bg-surface border rounded-lg p-4 space-y-3">
                         <select value={selectedVector} onChange={e => setSelectedVector(e.target.value as any)}
                            className="w-full p-3 bg-background border rounded font-mono" disabled={isEngaged}>
                            <option value="AI_SUBSTRATE_FAILURE">AI Substrate Failure</option>
                            <option value="VAULT_LOCKED">Vault Locked</option>
                            <option value="NETWORK_BLACKOUT">Network Blackout</option>
                            <option value="HIGH_LATENCY_STORM">High Latency Storm</option>
                         </select>
                      </div>
                       <div className="flex flex-col items-center gap-2 p-4 bg-surface border rounded-lg">
                            <label htmlFor="chaos-toggle" className={`relative inline-flex items-center cursor-pointer ${isEngaged ? 'animate-pulse' : ''}`}>
                                <input type="checkbox" id="chaos-toggle" className="sr-only peer" checked={isEngaged} onChange={handleToggleChaos} />
                                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
                            </label>
                            <span className={`font-bold text-lg ${isEngaged ? 'text-red-500' : 'text-text-secondary'}`}>{isEngaged ? "CHAOS PROBE ENGAGED" : "System Stable"}</span>
                        </div>
                 </div>
                <div className="flex flex-col min-h-0 gap-3">
                     <h3 className="text-xl font-bold">Live System Vitals</h3>
                      <div className="flex-grow bg-surface border rounded-lg p-4 space-y-3">
                        <VitalsDisplay vitals={vitals} />
                      </div>
                </div>
            </div>
        </div>
    );
};