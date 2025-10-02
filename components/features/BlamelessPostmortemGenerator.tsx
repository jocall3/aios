// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback, Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { auditCausality, runPremortemSimulation } from '../../services/CausalityEngineAI'; // Invented service
import type { CausalityAudit, PremortemScenario } from '../../types/CausalityEngine'; // Invented types
import { DocumentTextIcon, BeakerIcon } from '../icons';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { MarkdownRenderer } from '../shared/MarkdownRenderer';

const CausalityGraphNode: React.FC<{ node: { id: string; label: string; x: number; y: number }; isCritical: boolean }> = ({ node, isCritical }) => {
    return (
        <group position={[node.x, node.y, 0]}>
            <mesh>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshStandardMaterial color={isCritical ? '#ef4444' : '#3b82f6'} roughness={0.5} metalness={0.5} />
            </mesh>
            <Text position={[0, -0.3, 0]} fontSize={0.1} color="white" anchorX="center" anchorY="middle" maxWidth={2}>
                {node.label}
            </Text>
        </group>
    );
};

const CausalityGraph: React.FC<{ audit: CausalityAudit }> = ({ audit }) => {
    const nodes = useMemo(() => audit.timeline.map((event, i) => ({
        id: event.timestamp,
        label: event.description,
        x: (i % 5 - 2) * 2,
        y: Math.floor(i / 5) * -2
    })), [audit]);

    return (
        <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
            <Suspense fallback={null}>
                <ambientLight intensity={1.5} />
                <pointLight position={[0, 5, 5]} intensity={5}/>
                {nodes.map(node => (
                    <CausalityGraphNode key={node.id} node={node} isCritical={audit.criticalPath.includes(node.id)} />
                ))}
                {/* Lines would be more complex, mapping parent/child relations from the audit */}
            </Suspense>
        </Canvas>
    );
};


export const BlamelessPostmortemGenerator: React.FC = () => {
    const [mode, setMode] = useState<'audit' | 'wargame'>('audit');
    const [rawTimeline, setRawTimeline] = useState('14:30 - Alert received.\n14:50 - Bad migration identified.\n15:10 - Service restored.');
    const [futureObjective, setFutureObjective] = useState('Deploy new trading algorithm to production mainnet.');
    const [audit, setAudit] = useState<CausalityAudit | null>(null);
    const [premortem, setPremortem] = useState<PremortemScenario | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const handleAudit = useCallback(async () => {
        setIsLoading(true); setAudit(null);
        try {
            const result = await auditCausality(rawTimeline);
            setAudit(result);
        } finally { setIsLoading(false); }
    }, [rawTimeline]);
    
    const handleWargame = useCallback(async () => {
        setIsLoading(true); setPremortem(null);
        try {
            const result = await runPremortemSimulation(futureObjective);
            setPremortem(result);
        } finally { setIsLoading(false); }
    }, [futureObjective]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><DocumentTextIcon /><span className="ml-3">Causality Auditor & Pre-mortem Simulator</span></h1>
                <p className="text-text-secondary mt-1">Audit past failures to harvest data. Wargame future objectives to ensure victory.</p>
            </header>

            <div className="flex border-b border-border mb-4">
                <button onClick={() => setMode('audit')} className={`px-4 py-2 text-sm ${mode==='audit' && 'border-b-2 border-primary text-primary'}`}>Audit Mode (Post-Mortem)</button>
                <button onClick={() => setMode('wargame')} className={`px-4 py-2 text-sm ${mode==='wargame' && 'border-b-2 border-primary text-primary'}`}>Wargame Mode (Pre-Mortem)</button>
            </div>

            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col gap-4">
                    {mode === 'audit' ? (
                        <>
                            <h3 className="text-xl font-bold">Incident Timeline Input</h3>
                            <textarea value={rawTimeline} onChange={e => setRawTimeline(e.target.value)} placeholder="Enter events, one per line..." className="flex-grow p-2 bg-surface border rounded font-mono text-xs"/>
                            <button onClick={handleAudit} disabled={isLoading} className="btn-primary w-full py-2">{isLoading ? <LoadingSpinner/> : 'Run Causality Audit'}</button>
                        </>
                    ) : (
                         <>
                            <h3 className="text-xl font-bold">Future Objective Input</h3>
                            <textarea value={futureObjective} onChange={e => setFutureObjective(e.target.value)} placeholder="Describe the future goal..." className="flex-grow p-2 bg-surface border rounded font-mono text-xs"/>
                            <button onClick={handleWargame} disabled={isLoading} className="btn-primary w-full py-2">{isLoading ? <LoadingSpinner/> : 'Run Pre-mortem Simulation'}</button>
                         </>
                    )}
                     <div className="flex-grow bg-black border rounded-lg min-h-[200px]">
                        {isLoading && <div className="h-full flex items-center justify-center"><LoadingSpinner /></div>}
                        {audit && <CausalityGraph audit={audit} />}
                        {premortem && <CausalityGraph audit={premortem.causalityAudit} />}
                    </div>
                </div>

                <div className="flex flex-col min-h-0">
                    <h3 className="text-xl font-bold mb-2">Engine Output</h3>
                    <div className="flex-grow bg-surface border rounded-lg overflow-y-auto p-4 space-y-4">
                       {mode === 'audit' && audit && (
                           <>
                             <div><p className="font-bold text-sm">Systemic Fragility Index:</p><p className="font-mono text-primary text-lg">{audit.fragilityIndex.toFixed(4)}</p></div>
                             <div><p className="font-bold text-sm">Golden Intervention Points:</p><ul className="list-disc list-inside text-xs">{audit.interventionPoints.map((p,i)=><li key={i}>{p}</li>)}</ul></div>
                             <div><p className="font-bold text-sm">Full Report:</p><div className="text-xs prose prose-sm max-w-none"><MarkdownRenderer content={audit.fullReport} /></div></div>
                           </>
                       )}
                       {mode === 'wargame' && premortem && (
                            <>
                             <div><p className="font-bold text-sm">Predicted Failure Scenario:</p><p className="text-xs italic p-2 bg-background rounded border">{premortem.failureScenario}</p></div>
                             <div><p className="font-bold text-sm">Pre-emptive Action Plan:</p><div className="text-xs prose prose-sm max-w-none"><MarkdownRenderer content={premortem.preventativePlan} /></div></div>
                           </>
                       )}
                    </div>
                </div>
            </div>
        </div>
    );
};