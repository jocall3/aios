import React, { useState, useCallback, useMemo } from 'react';
import { bridgeCrossOriginRequest, forgeCorsPolicy } from '../../services/RealityBridgeAI'; // Invented AI Service
import type { BridgedResponse, ForgedPolicy } from '../../types/RealityBridge'; // Invented
import { PaperAirplaneIcon, HammerIcon, ShieldCheckIcon } from '../icons';
import { LoadingSpinner, MarkdownRenderer } from '../shared';

const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

// --- COMPONENTS ---
const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

const PolicyConflictDisplay: React.FC<{ conflict: { header: string; requested: string; received: string } }> = ({ conflict }) => (
    <div>
        <p className="font-mono text-xs font-bold">{conflict.header}</p>
        <div className="grid grid-cols-2 gap-2 text-xs mt-1">
            <div className="bg-red-900/50 p-2 rounded">
                <p className="font-bold text-red-400">REQUESTED (FROM ORIGIN)</p>
                <p>{conflict.requested}</p>
            </div>
            <div className="bg-red-900/50 p-2 rounded">
                <p className="font-bold text-red-400">RECEIVED (FROM TARGET)</p>
                <p>{conflict.received || '<em>Not Sent</em>'}</p>
            </div>
        </div>
    </div>
);

export const CorsProxySimulator: React.FC = () => {
    const [origin, setOrigin] = useState('https://inquisitive-app.com');
    const [target, setTarget] = useState('https://api.legacy-corp.com/data');
    const [bridgedResponse, setBridgedResponse] = useState<BridgedResponse | null>(null);
    const [forgedPolicy, setForgedPolicy] = useState<ForgedPolicy | null>(null);
    const [isBridging, setIsBridging] = useState(false);
    
    const handleBridge = useCallback(async () => {
        setIsBridging(true);
        setBridgedResponse(null);
        setForgedPolicy(null);
        try {
            const result = await bridgeCrossOriginRequest(origin, target, { 'X-Requested-With': 'XMLHttpRequest' });
            setBridgedResponse(result);
            if (!result.wasSuccessful) {
                const policy = await forgeCorsPolicy(result.requestHeaders, result.responseHeaders);
                setForgedPolicy(policy);
            }
        } finally {
            setIsBridging(false);
        }
    }, [origin, target]);
    
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center">
                    <PaperAirplaneIcon />
                    <span className="ml-3">Cross-Origin Reality Bridge & Policy Forge</span>
                </h1>
                <p className="text-text-secondary mt-1">Bypass the Same-Origin Policy through a live proxy and forge the exact policies needed to neutralize it.</p>
            </header>

            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col gap-3 min-h-0">
                    <h3 className="text-xl font-bold">Request Vector</h3>
                    <div className="p-4 bg-surface border rounded-lg space-y-3">
                         <div className="grid grid-cols-2 gap-3">
                            <div><label className="text-sm">Origin Reality</label><input value={origin} onChange={e => setOrigin(e.target.value)} className="w-full p-2 bg-background border rounded mt-1"/></div>
                            <div><label className="text-sm">Target Reality</label><input value={target} onChange={e => setTarget(e.target.value)} className="w-full p-2 bg-background border rounded mt-1"/></div>
                         </div>
                         <button onClick={handleBridge} disabled={isBridging} className="btn-primary w-full py-2">{isBridging ? <LoadingSpinner/> : 'Bridge Realities'}</button>
                    </div>
                     <h3 className="text-xl font-bold mt-2">Policy Conflict Analysis</h3>
                     <div className="flex-grow p-3 bg-surface border rounded-lg overflow-y-auto space-y-3">
                        {isBridging && <div className="h-full flex items-center justify-center"><LoadingSpinner/></div>}
                        {bridgedResponse?.wasSuccessful && <p className="text-center text-green-400">No CORS conflict detected. Request was successful.</p>}
                        {bridgedResponse && !bridgedResponse.wasSuccessful && bridgedResponse.conflicts.map(c => <PolicyConflictDisplay key={c.header} conflict={c} />)}
                     </div>
                </div>

                <div className="flex flex-col min-h-0 gap-3">
                    <h3 className="text-xl font-bold flex items-center gap-2"><HammerIcon/> Policy Forge</h3>
                     <div className="h-48 flex-shrink-0 bg-surface border rounded-lg p-3">
                        <p className="font-semibold text-sm mb-2">Forged Headers (Correct Policy)</p>
                        <div className="h-full overflow-y-auto">
                            {forgedPolicy ? <MarkdownRenderer content={'```\n'+forgedPolicy.requiredHeaders.map(h => `${h.header}: ${h.value}`).join('\n')+'\n```'}/> : <p className="text-xs text-text-secondary">Awaiting conflict analysis...</p>}
                        </div>
                     </div>
                     <div className="flex-grow flex flex-col">
                        <h3 className="text-xl font-bold mb-2">Live Replay with Forged Policy</h3>
                        <div className="flex-grow bg-white text-black p-4 border rounded-lg">
                           <pre className="text-xs whitespace-pre-wrap">
                                {bridgedResponse?.wasSuccessful ? JSON.stringify(bridgedResponse.body, null, 2)
                                 : bridgedResponse ? `// Request failed. Awaiting policy forge and replay...`
                                 : `// Awaiting bridged request...`}
                           </pre>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    );
};