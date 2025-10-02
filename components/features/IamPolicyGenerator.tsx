// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { synthesizeIamPolicy, simulatePolicyBlastRadius } from '../../services/IAMWarfareAI'; // Invented AI Service
import type { IamPolicy, BlastRadiusReport } from '../../types/IAMWarfare'; // Invented Types
import { ShieldCheckIcon, ExclamationTriangleIcon } from '../icons';
import { LoadingSpinner, MarkdownRenderer } from '../shared';

// --- VISUALIZATION ---
const BlastRadiusGraph: React.FC<{ report: BlastRadiusReport }> = ({ report }) => {
    // A simplified 2D representation for the component
    return (
        <div className="p-2 space-y-2">
            <div>
                <p className="font-bold text-green-400">Intended Access</p>
                {report.intendedAccess.map(r => <p key={r.resource} className="text-xs font-mono">✓ {r.resource}</p>)}
            </div>
             <div className="pt-2 border-t border-border">
                <p className="font-bold text-red-500 flex items-center gap-1"><ExclamationTriangleIcon/> Unintended Access Detected!</p>
                {report.unintendedAccess.map(r => <p key={r.resource} className="text-xs font-mono">✗ {r.resource} ({r.permissions.join(', ')})</p>)}
            </div>
        </div>
    );
};

export const IamPolicyGenerator: React.FC = () => {
    const [description, setDescription] = useState('Allow read-only access to all production S3 buckets for the "auditor" role.');
    const [platform, setPlatform] = useState<'aws' | 'gcp'>('aws');
    const [policy, setPolicy] = useState<IamPolicy | null>(null);
    const [blastRadius, setBlastRadius] = useState<BlastRadiusReport | null>(null);
    const [isLoading, setIsLoading] = useState<Record<string,boolean>>({});

    const handleSynthesize = useCallback(async () => {
        setIsLoading({ synth: true });
        setPolicy(null); setBlastRadius(null);
        try {
            // In a real implementation, this would be fed the live, ingested cloud state.
            const synthesizedPolicy = await synthesizeIamPolicy(description, platform, { 'liveResourceNames': ['prod-customer-data', 'prod-static-assets', 'dev-test-bucket']});
            setPolicy(synthesizedPolicy);

            // Immediately kick off blast radius simulation
            setIsLoading({ plan: true });
            const report = await simulatePolicyBlastRadius(synthesizedPolicy);
            setBlastRadius(report);

        } finally { setIsLoading({}); }
    }, [description, platform]);
    
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><ShieldCheckIcon /><span className="ml-3">Live IAM Policy Synthesizer & Blast Radius Simulator</span></h1>
                <p className="text-text-secondary mt-1">Synthesize context-aware IAM policies and simulate their full consequences before deployment.</p>
            </header>
            
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                 <div className="flex flex-col gap-3 min-h-0">
                     <h3 className="text-xl font-bold">1. Define Policy Intent</h3>
                      <div className="bg-surface p-3 border rounded-lg flex-grow flex flex-col gap-3">
                        <select value={platform} onChange={e => setPlatform(e.target.value as any)} className="w-full p-2 bg-background border rounded">
                             <option value="aws">Amazon Web Services</option>
                             <option value="gcp">Google Cloud Platform</option>
                         </select>
                        <textarea value={description} onChange={e => setDescription(e.target.value)}
                                   className="flex-grow p-2 bg-background border rounded text-sm"/>
                         <button onClick={handleSynthesize} disabled={isLoading.synth || isLoading.plan} className="btn-primary w-full py-2">
                             {(isLoading.synth || isLoading.plan) ? <LoadingSpinner/> : "Synthesize & Simulate"}
                         </button>
                      </div>
                      <div className="h-48 flex-shrink-0">
                         <h3 className="text-xl font-bold">Synthesized Policy</h3>
                         <div className="flex-grow mt-2 bg-background border rounded overflow-auto h-full">
                            {policy && <MarkdownRenderer content={'```json\n'+JSON.stringify(policy,null,2)+'\n```'}/>}
                         </div>
                     </div>
                 </div>
                 
                 <div className="flex flex-col min-h-0">
                     <h3 className="text-xl font-bold">2. Blast Radius Simulation Report</h3>
                      <div className="flex-grow mt-3 bg-black/80 text-white border rounded-lg overflow-y-auto">
                        {isLoading.plan && <div className="h-full flex items-center justify-center"><LoadingSpinner/></div>}
                        {blastRadius && <BlastRadiusGraph report={blastRadius} />}
                     </div>
                 </div>

            </div>
        </div>
    );
};