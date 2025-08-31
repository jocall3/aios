import React, 'useState, useCallback, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { performGeoSigintSweep } from '../../services/GeoSigintAI'; // Invented
import type { GeoSigintReport, StrategicThreatNode } from '../../types/GeoSigint'; // Invented
import { MagnifyingGlassIcon, ExclamationTriangleIcon } from '../icons';
import { LoadingSpinner, MarkdownRenderer } from '../shared/LoadingSpinner';
import { useNotification } from '../../contexts/NotificationContext';

const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

// Simplified 2D Canvas Graph for this implementation
const ThreatGraph: React.FC<{ nodes: StrategicThreatNode[] }> = ({ nodes }) => {
    return (
        <div className="w-full h-full bg-black rounded relative">
            {nodes.map(node => (
                <div key={node.id}
                     className={`absolute p-1 border rounded-lg text-xs font-bold text-white text-center animate-pop-in ${node.type === 'WEAKNESS' ? 'bg-red-900 border-red-500' : 'bg-blue-900 border-blue-500'}`}
                     style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)' }}
                     title={node.description}>
                    {node.label}
                </div>
            ))}
        </div>
    );
};

export const CompetitiveAnalysisBot: React.FC = () => {
    const [target, setTarget] = useState('Stripe');
    const [report, setReport] = useState<GeoSigintReport | null>(null);
    const [liveSignal, setLiveSignal] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { addNotification } = useNotification();

    const handleSweep = useCallback(async () => {
        setIsLoading(true);
        setReport(null);
        setLiveSignal('');
        try {
            const result = await performGeoSigintSweep(target);
            setReport(result);
        } catch (err) {
            addNotification(err instanceof Error ? err.message : 'Sweep failed', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [target, addNotification]);

    useEffect(() => {
        if (!report || isLoading) return;
        const signals = [
            `SENTIMENT SHIFT: +0.8% developer community (API wrapper release)`,
            `TALENT FLOW: Senior SRE (ex-Google) joins Payments Infrastructure`,
            `FINANCIAL: Rumored Series H funding round closing next week`,
            `GEO-POLITICAL: EU regulatory inquiry into processing fees initiated`
        ];
        let i = 0;
        const interval = setInterval(() => {
            setLiveSignal(signals[i % signals.length]);
            i++;
        }, 5000);
        return () => clearInterval(interval);
    }, [report, isLoading]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><MagnifyingGlassIcon /><span className="ml-3">Market Hegemony & GEO-SIGINT Engine</span></h1>
                <p className="text-text-secondary mt-1">Execute multi-vector analysis to map the strategic battlefield.</p>
            </header>
            
            <div className="flex items-center gap-2 mb-4">
                <input value={target} onChange={e => setTarget(e.target.value)} placeholder="Target Entity (e.g., Stripe, OpenAI)" className="flex-grow p-2 bg-surface border rounded"/>
                <button onClick={handleSweep} disabled={isLoading} className="btn-primary px-6 py-2">{isLoading ? <LoadingSpinner /> : 'Execute Sweep'}</button>
            </div>
            
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col gap-3 min-h-0">
                    <h3 className="text-xl font-bold">Strategic Threat Graph</h3>
                    <div className="flex-grow bg-surface border rounded-lg">
                        {report && <ThreatGraph nodes={report.threatGraph.nodes}/>}
                        {isLoading && <div className="h-full w-full flex items-center justify-center"><LoadingSpinner/></div>}
                    </div>
                     <div className="flex-shrink-0 h-10 bg-surface border rounded-lg flex items-center px-4 font-mono text-xs">
                        <span className="text-red-500 animate-pulse mr-2">LIVE SIGINT //</span>
                        <span className="text-text-primary">{liveSignal || 'Awaiting signal acquisition...'}</span>
                    </div>
                </div>

                <div className="flex flex-col min-h-0 gap-3">
                    <h3 className="text-xl font-bold">Actionable Exploit Scenarios</h3>
                     <div className="flex-grow bg-background border rounded overflow-y-auto p-3 space-y-3">
                        {isLoading && <div className="h-full w-full flex items-center justify-center"><LoadingSpinner/></div>}
                        {report && report.exploitScenarios.map((scenario, i) => (
                             <details key={i} className="bg-surface p-3 rounded-lg border border-border" open>
                                <summary className="font-bold flex items-center gap-2 cursor-pointer text-sm">
                                    <ExclamationTriangleIcon className="text-yellow-500"/>
                                    <span>Vector {i+1}: {scenario.title}</span>
                                </summary>
                                <div className="mt-2 pt-2 border-t border-border/50 text-xs">
                                    <p>{scenario.description}</p>
                                </div>
                             </details>
                        ))}
                     </div>
                </div>
            </div>
        </div>
    );
};