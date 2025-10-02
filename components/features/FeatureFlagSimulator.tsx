// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback, useEffect } from 'react';
import { getFlagConfiguration, updateFlagConfiguration } from '../../services/FeatureFlaggingService'; // Invented, but real
import type { FeatureFlag, FlagTargetingRule } from '../../types/FeatureFlagging'; // Invented
import { BeakerIcon, ShieldExclamationIcon } from '../icons';
import { LoadingSpinner } from '../shared';

const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

// --- COMPONENTS ---
const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

const FlagController: React.FC<{
    flag: FeatureFlag;
    onUpdate: (flagKey: string, updates: Partial<FeatureFlag>) => void;
}> = ({ flag, onUpdate }) => {
    // A simplified representation of a complex controller UI
    return (
        <div className="bg-background p-3 rounded-lg border">
            <div className="flex justify-between items-center">
                <p className="font-bold font-mono">{flag.key}</p>
                {flag.type === 'boolean' && 
                    <button onClick={() => onUpdate(flag.key, { enabled: !flag.enabled })} className={`px-2 py-0.5 text-xs rounded-full ${flag.enabled ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                        {flag.enabled ? 'ON' : 'OFF'}
                    </button>
                }
            </div>
            {flag.type === 'multivariate' && (
                 <select value={flag.variation} onChange={e => onUpdate(flag.key, { variation: e.target.value })} className="w-full text-xs p-1 mt-2 bg-surface border">
                     {flag.variations.map((v:any) => <option key={v}>{v}</option>)}
                 </select>
            )}
            {flag.type === 'percentage' && (
                 <input type="range" min="0" max="100" value={flag.rolloutPercentage} onChange={e => onUpdate(flag.key, {rolloutPercentage: parseInt(e.target.value)})} className="w-full mt-2"/>
            )}
        </div>
    );
};

export const FeatureFlagSimulator: React.FC = () => {
    const [flags, setFlags] = useState<FeatureFlag[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const fetchFlags = useCallback(async () => {
        setIsLoading(true);
        try {
            const liveFlags = await getFlagConfiguration();
            setFlags(liveFlags);
        } finally { setIsLoading(false); }
    }, []);
    
    useEffect(() => { fetchFlags(); }, [fetchFlags]);

    const handleUpdate = useCallback(async (flagKey: string, updates: Partial<FeatureFlag>) => {
        const originalFlags = [...flags];
        // Optimistic update
        setFlags(prev => prev.map(f => f.key === flagKey ? { ...f, ...updates } : f));
        try {
            await updateFlagConfiguration(flagKey, updates);
        } catch (e) {
            console.error("Failed to update flag", e);
            setFlags(originalFlags); // Revert on failure
        }
    }, [flags]);

    const handleHalt = () => {
        // This would make an API call to disable all flags
        setFlags(prev => prev.map(f => ({...f, enabled: false, rolloutPercentage: 0 })))
    };
    
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><BeakerIcon /><span className="ml-3">Live Feature Flag & Experimentation Command Console</span></h1>
                <p className="text-text-secondary mt-1">Manipulate the reality of your live user base. All actions are real and immediate.</p>
            </header>

            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-0">
                 <div className="lg:col-span-1 flex flex-col gap-3">
                     <div className="flex justify-between items-center">
                         <h3 className="text-xl font-bold">Flag Configuration</h3>
                         <button onClick={handleHalt} className="flex items-center gap-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg">
                             <ShieldExclamationIcon /> HALT ALL EXPERIMENTS
                         </button>
                    </div>
                     <div className="flex-grow bg-surface border rounded p-3 space-y-3 overflow-y-auto">
                        {isLoading && <div className="h-full w-full flex items-center justify-center"><LoadingSpinner/></div>}
                        {!isLoading && flags.map(flag => (
                            <FlagController key={flag.key} flag={flag} onUpdate={handleUpdate}/>
                        ))}
                     </div>
                 </div>

                 <div className="lg:col-span-2 flex flex-col min-h-0">
                     <h3 className="text-xl font-bold mb-3">Real-Time Impact Monitoring</h3>
                      <div className="flex-grow bg-surface border rounded-lg p-4 grid grid-cols-2 gap-4">
                         {/* This would be populated by a live websocket connection to a telemetry service */}
                         <div className="bg-background rounded p-2">
                             <p className="font-bold text-sm">System Health</p>
                             <p className="text-xs">Error Rate: 0.02%</p>
                         </div>
                         <div className="bg-background rounded p-2">
                            <p className="font-bold text-sm">Conversion Metrics</p>
                            <p className="text-xs">Signups/hr: 142</p>
                         </div>
                         <div className="col-span-2 bg-background rounded p-2">
                             <p className="font-bold text-sm">Live User Cohort Behavior</p>
                             <p className="font-mono text-xs mt-2 text-green-400">`new-dashboard` cohort showing 5.2% higher engagement time.</p>
                             <p className="font-mono text-xs text-red-400">`beta-feature` cohort shows 0.1% higher error rate.</p>
                         </div>
                     </div>
                 </div>
            </div>
        </div>
    );
};