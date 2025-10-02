// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback, useMemo } from 'react';
import { executeAndProfileGraphqlQuery, synthesizeDataloader } from '../../services/GraphQLExecutionAI'; // Invented AI Service
import type { QueryProfile, ResolverTrace, DataLoaderPatch } from '../../types/GraphQLExecution'; // Invented
import { MagnifyingGlassIcon, BeakerIcon } from '../icons';
import { LoadingSpinner, MarkdownRenderer } from '../shared';

const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

// --- COMPONENTS ---
const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

// --- Reforged Component ---
const WaterfallTrace: React.FC<{ traces: ResolverTrace[] }> = ({ traces }) => {
    const maxTime = Math.max(...traces.map(t => t.startTime + t.duration));
    return (
        <div className="w-full h-full bg-black rounded p-2 text-xs font-mono">
            {traces.map(trace => (
                <div key={trace.path.join('.')} className="relative my-1 h-5 group">
                    <div className={`absolute h-full rounded transition-all duration-300 ${trace.isBatched ? 'bg-green-500/50' : trace.isNPlusOneCandidate ? 'bg-red-500/50' : 'bg-blue-500/50'}`}
                         style={{ left: `${(trace.startTime / maxTime) * 100}%`, width: `${(trace.duration / maxTime) * 100}%` }}
                    />
                    <p className="absolute left-1 top-0 h-full flex items-center text-white mix-blend-difference">{trace.path.join('.')} ({trace.duration.toFixed(0)}ms)</p>
                </div>
            ))}
        </div>
    );
};


export const GraphQLQueryProfiler: React.FC = () => {
    const [endpoint, setEndpoint] = useState('https://countries.trevorblades.com/'); // A live, public GraphQL API
    const [query, setQuery] = useState('query { continent(code:"EU"){ name countries { name capital } } }');
    const [profile, setProfile] = useState<QueryProfile | null>(null);
    const [patch, setPatch] = useState<DataLoaderPatch | null>(null);
    const [isLoading, setIsLoading] = useState<Record<string,boolean>>({});

    const handleProfile = useCallback(async () => {
        setIsLoading({ profile: true }); setProfile(null); setPatch(null);
        try {
            const result = await executeAndProfileGraphqlQuery(endpoint, query);
            setProfile(result);
            if(result.nPlusOneDetected) {
                 const generatedPatch = await synthesizeDataloader(query, result.traces.filter(t => t.isNPlusOneCandidate));
                 setPatch(generatedPatch);
            }
        } finally { setIsLoading({}); }
    }, [endpoint, query]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center">
                    <MagnifyingGlassIcon />
                    <span className="ml-3">GraphQL Query Execution & N+1 Annihilator Engine</span>
                </h1>
                <p className="text-text-secondary mt-1">Execute live queries, visualize resolver cascades, and synthesize DataLoader patches to annihilate N+1 bottlenecks.</p>
            </header>

            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 min-h-0">
                <div className="lg:col-span-2 flex flex-col gap-3 min-h-0">
                    <h3 className="text-xl font-bold">Query Constructor</h3>
                     <input value={endpoint} onChange={e => setEndpoint(e.target.value)} placeholder="GraphQL Endpoint URL" className="w-full p-2 bg-surface border rounded"/>
                     <textarea value={query} onChange={e => setQuery(e.target.value)} className="flex-grow p-2 bg-surface border rounded font-mono text-xs"/>
                    <button onClick={handleProfile} disabled={isLoading.profile} className="btn-primary w-full py-2">
                        {isLoading.profile ? <LoadingSpinner/> : 'Execute & Profile Query'}
                    </button>
                </div>

                <div className="lg:col-span-3 flex flex-col gap-3 min-h-0">
                    <h3 className="text-xl font-bold">Execution Trace & Analysis</h3>
                     <div className="flex-grow bg-surface border rounded p-2 overflow-y-auto">
                         {isLoading.profile && <div className="h-full w-full flex items-center justify-center"><LoadingSpinner/></div>}
                         {profile && <WaterfallTrace traces={profile.traces} />}
                    </div>
                     <div className={`h-48 flex-shrink-0 bg-surface border rounded p-3 overflow-y-auto ${profile?.nPlusOneDetected ? 'border-red-500' : 'border-border'}`}>
                        <h4 className="font-bold text-sm">N+1 Annihilator Report</h4>
                         {profile?.nPlusOneDetected ? (
                             <div>
                                 <p className="text-xs text-red-400 font-bold">N+1 ANOMALY DETECTED at path: `{profile.nPlusOnePath}`</p>
                                 {patch && <div className="mt-2"><MarkdownRenderer content={'```javascript\n' + patch.dataloaderCode + '\n```'} /></div>}
                             </div>
                         ) : <p className="text-xs text-text-secondary">No N+1 cascades detected in this execution.</p>
                         }
                    </div>
                </div>
            </div>
        </div>
    );
};