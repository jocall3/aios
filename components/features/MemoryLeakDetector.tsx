import React, { useState, useCallback, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { instrumentForHeapAnalysis, analyzeHeapRetainers } from '../../services/MemoryForensicsAI'; // Invented AI Service
import type { HeapSnapshot, RetainerAnalysis } from '../../types/MemoryForensics'; // Invented Types
import { BeakerIcon, CameraIcon, ShieldExclamationIcon } from '../icons';
import { LoadingSpinner, MarkdownRenderer } from '../shared';

// This is a mock of the performance.memory API
const useMemoryPolyfill = (isProfiling: boolean) => {
    const [memory, setMemory] = useState({ usedJSHeapSize: 0 });
    useEffect(() => {
        if (!isProfiling) return;
        let heap = 10 * 1024 * 1024; // Start at 10MB
        const interval = setInterval(() => {
            const leak = Math.random() < 0.5 ? 0 : 0.2; // 50% chance to leak
            heap += (leak - (Math.random() * 0.1)) * 1024 * 1024;
            setMemory({ usedJSHeapSize: Math.max(0, heap) });
        }, 500);
        return () => clearInterval(interval);
    }, [isProfiling]);
    return { memory };
};


export const MemoryLeakDetector: React.FC = () => {
    const [code, setCode] = useState(`() => { useEffect(() => { const timer = setInterval(()=>{}, 1000); /* return () => clearInterval(timer); */ }, []) }`);
    const [snapshots, setSnapshots] = useState<HeapSnapshot[]>([]);
    const [analysis, setAnalysis] = useState<RetainerAnalysis | null>(null);
    const [isProfiling, setIsProfiling] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const memory = useMemoryPolyfill(isProfiling); // Use our mock

    const handleToggleProfiling = () => setIsProfiling(p => !p);

    const handleSnapshot = () => {
        setSnapshots(s => [...s, { timestamp: Date.now(), heapSize: memory.memory.usedJSHeapSize }]);
    };
    
    const handleAnalyze = async () => {
        if (snapshots.length < 2) return;
        setIsLoading(true); setAnalysis(null);
        try {
            const result = await analyzeHeapRetainers(code, snapshots);
            setAnalysis(result);
        } finally { setIsLoading(false); }
    };
    
    const chartData = snapshots.map(s => ({ name: new Date(s.timestamp).toLocaleTimeString(), Heap: (s.heapSize / 1024 / 1024).toFixed(2)}));

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><BeakerIcon /><span className="ml-3">Live Heap Profiler & Memory De-allocation Sentry</span></h1>
                <p className="text-text-secondary mt-1">Execute code in a monitored sandbox to visually prove and annihilate memory leaks.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 min-h-0">
                <div className="lg:col-span-2 flex flex-col gap-3 min-h-0">
                    <h3 className="text-xl font-bold">Component Logic to Profile</h3>
                    <textarea value={code} onChange={e => setCode(e.target.value)} className="flex-grow p-2 bg-surface border rounded font-mono text-xs"/>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={handleToggleProfiling} className={`py-2 font-bold rounded ${isProfiling ? 'bg-red-600 text-white' : 'btn-primary'}`}>
                           {isProfiling ? 'Stop Profiling' : 'Start Profiling'}
                        </button>
                        <button onClick={handleSnapshot} disabled={!isProfiling} className="flex items-center justify-center gap-2 py-2 bg-surface border rounded"><CameraIcon /> Capture Heap Snapshot</button>
                    </div>
                </div>
                <div className="lg:col-span-3 flex flex-col gap-3 min-h-0">
                     <h3 className="text-xl font-bold">Live Heap Visualization</h3>
                     <div className="h-48 flex-shrink-0 bg-surface border rounded p-2">
                         <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}><Tooltip/><YAxis unit="MB" width={30}/><Line type="monotone" dataKey="Heap" stroke="var(--color-primary)" isAnimationActive={false}/></LineChart>
                         </ResponsiveContainer>
                     </div>
                      <button onClick={handleAnalyze} disabled={snapshots.length < 2 || isLoading} className="btn-primary py-2 w-full">
                         {isLoading ? <LoadingSpinner/> : `Analyze ${snapshots.length} Snapshots`}
                      </button>
                      <div className="flex-grow bg-surface border rounded-lg p-3 overflow-y-auto">
                        <h4 className="font-bold text-sm">Leak Triangulation Report</h4>
                         {analysis?.isLeaking && (
                             <div className="p-2 border-l-4 border-red-500 bg-red-900/50 mt-2">
                                <p className="font-bold flex items-center gap-1"><ShieldExclamationIcon/> MEMORY LEAK CONFIRMED</p>
                                <p className="text-xs mt-1">{analysis.explanation}</p>
                                <div className="mt-2 bg-black/50 p-1 rounded">
                                     <MarkdownRenderer content={'```diff\n'+analysis.suggestedPatch+'\n```'}/>
                                </div>
                             </div>
                         )}
                         {analysis && !analysis.isLeaking && <p className="text-sm text-green-400">No significant memory leaks detected between snapshots.</p>}
                     </div>
                </div>
            </div>
        </div>
    );
};