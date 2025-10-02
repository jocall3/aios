// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { getDomMetrics, runReflowTsunami } from '../../services/DomCognitionAI'; // Invented AI Service
import type { DomMetrics, ReflowReport } from '../../types/DomCognition'; // Invented types
import { ChartBarIcon, ExclamationTriangleIcon } from '../icons';
import { LoadingSpinner } from '../shared';

const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

// --- COMPONENTS ---
const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

const StatCard: React.FC<{ value: number; label: string }> = ({ value, label }) => (
    <div className="bg-background border p-3 rounded-lg text-center">
        <p className="text-3xl font-bold font-mono text-primary">{value.toLocaleString()}</p>
        <p className="text-xs text-text-secondary">{label}</p>
    </div>
);


export const DomTreeAnalyzer: React.FC = () => {
    const [url, setUrl] = useState('https://vercel.com/home');
    const [scanUrl, setScanUrl] = useState('');
    const [metrics, setMetrics] = useState<DomMetrics | null>(null);
    const [tsunamiReport, setTsunamiReport] = useState<ReflowReport | null>(null);
    const [isLoading, setIsLoading] = useState<Record<string,boolean>>({});
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const handleScan = useCallback(() => {
        setIsLoading({ scan: true }); setMetrics(null); setTsunamiReport(null);
        setScanUrl(url.startsWith('http') ? url : `https://${url}`);
    }, [url]);

    const handleIframeLoad = useCallback(async () => {
        if (!isLoading.scan || !iframeRef.current?.contentWindow) return;
        try {
            const result = await getDomMetrics(iframeRef.current.contentWindow.document);
            setMetrics(result);
        } finally { setIsLoading({}); }
    }, [isLoading.scan]);

    const handleTsunami = async () => {
        if (!iframeRef.current?.contentWindow) return;
        setIsLoading({ tsunami: true }); setTsunamiReport(null);
        try {
            const report = await runReflowTsunami(iframeRef.current.contentWindow.document);
            setTsunamiReport(report);
        } finally { setIsLoading({}); }
    };
    
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><ChartBarIcon /><span className="ml-3">Live DOM Neutron Scanner & Reflow Tsunami Simulator</span></h1>
                <p className="text-text-secondary mt-1">Perform live structural analysis and destructive stress tests on any web application.</p>
            </header>
            
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                 <div className="flex flex-col gap-3 min-h-0">
                    <h3 className="text-xl font-bold">Target Vector</h3>
                     <div className="flex gap-2">
                        <input type="text" value={url} onChange={e => setUrl(e.target.value)} className="flex-grow p-2 bg-surface border rounded-md"/>
                        <button onClick={handleScan} disabled={isLoading.scan} className="btn-primary px-4 py-2 font-bold">{isLoading.scan ? <LoadingSpinner/> : "Initiate Scan"}</button>
                     </div>
                     <h3 className="text-xl font-bold mt-2">Live DOM Sandbox</h3>
                     <div className="flex-grow bg-white border-2 border-dashed border-border rounded-lg overflow-hidden relative">
                         {isLoading.scan && <div className="absolute inset-0 bg-surface/80 flex items-center justify-center"><LoadingSpinner/></div>}
                         <iframe ref={iframeRef} src={scanUrl} title="DOM Target" className="w-full h-full" onLoad={handleIframeLoad} sandbox="allow-scripts allow-same-origin"/>
                     </div>
                 </div>
                 <div className="flex flex-col min-h-0 gap-3">
                     <h3 className="text-xl font-bold">Empirical Metrics</h3>
                     <div className="grid grid-cols-3 gap-3">
                        <StatCard value={metrics?.nodeCount || 0} label="Total Nodes"/>
                        <StatCard value={metrics?.maxDepth || 0} label="Max Depth"/>
                        <StatCard value={metrics?.complexNodeCount || 0} label="Complex Nodes"/>
                    </div>
                     <h3 className="text-xl font-bold mt-2">Reflow Tsunami Simulation</h3>
                      <button onClick={handleTsunami} disabled={!metrics || isLoading.tsunami} className="btn-primary w-full py-2 bg-red-600 hover:bg-red-700">{isLoading.tsunami ? <LoadingSpinner/> : "Trigger Reflow Tsunami"}</button>
                      <div className="flex-grow bg-surface border rounded-lg p-3">
                          {tsunamiReport ? (
                            <div className="text-sm space-y-2">
                                <p><strong>Reflow Cost:</strong> <span className="font-mono font-bold text-yellow-400">{tsunamiReport.reflowTimeMs.toFixed(2)}ms</span></p>
                                <p><strong>Blast Radius:</strong> <span className="font-mono font-bold text-red-500">{tsunamiReport.affectedNodeCount} Nodes</span></p>
                                 <div className="pt-2 border-t">
                                     <p className="font-bold text-xs">AI Directive:</p>
                                     <p className="text-xs font-mono p-2 bg-background rounded mt-1">{tsunamiReport.optimizationDirective}</p>
                                </div>
                            </div>
                          ): <p className="text-xs text-text-secondary">Run simulation to analyze layout shift performance.</p>}
                      </div>
                 </div>
            </div>
        </div>
    );
};