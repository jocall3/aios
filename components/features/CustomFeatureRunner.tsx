import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { CustomFeature } from '../../types';
import { modelThreatSurface, predictiveTrace } from '../../services'; // Using the monolithic index
import type { SecurityIssue, QuantumEvent } from '../../types'; // Assuming QuantumEvent is in types
import { LoadingSpinner } from '../shared';
import { ShieldCheckIcon, ClockIcon } from '../icons';

// --- SELF-CONTAINED MODULE LOGIC ---
const generateIframeSrcDoc = (code: string) => `<!DOCTYPE html><html><head><meta charset="UTF-8"/><script type="importmap">{"imports":{"react":"https://esm.sh/react@18.3.1","react-dom/client":"https://esm.sh/react-dom@18.3.1/client"}}</script><script src="https://cdn.tailwindcss.com"></script><script src="https://unpkg.com/@babel/standalone/babel.min.js"></script></head><body style="margin:0;padding:0;"><div id="root"></div><script type="text/babel">${code}</script></body></html>`;

type BootPhase = 'PENDING' | 'SECURITY_SCAN' | 'PERF_PROFILE' | 'RENDERING' | 'ACTIVE' | 'FAILED';

const BootStatus: React.FC<{ phase: BootPhase, status: 'running'|'pass'|'fail'|'idle', details?: string }> = ({ phase, status, details }) => {
    const color = status === 'pass' ? 'text-green-400' : status === 'fail' ? 'text-red-500' : 'text-yellow-400';
    return (
        <div className="flex items-center gap-2 font-mono text-xs">
            <span className={color}>
                {status === 'running' && '>>'}
                {status === 'pass' && 'OK'}
                {status === 'fail' && 'XX'}
                {status === 'idle' && '--'}
            </span>
            <span>{phase}</span>
            {status === 'running' && <LoadingSpinner />}
            {details && <span className="text-text-secondary truncate">{details}</span>}
        </div>
    );
};

export const CustomFeatureRunner: React.FC<{ feature: CustomFeature }> = ({ feature }) => {
    const [bootPhase, setBootPhase] = useState<BootPhase>('PENDING');
    const [dossier, setDossier] = useState({
        securityIssues: [] as SecurityIssue[],
        performanceProfile: null as QuantumEvent | null,
    });
    const [error, setError] = useState<string | null>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        let isCancelled = false;
        
        const runGenesisSequence = async () => {
            if (isCancelled) return;
            // Phase 1: Security Audit
            setBootPhase('SECURITY_SCAN');
            await new Promise(res => setTimeout(res, 500)); // Simulate async work
            const securityIssues = modelThreatSurface(feature.code);
            if (securityIssues.some(issue => issue.severity === 'High' || issue.severity === 'Critical')) {
                if(isCancelled) return;
                setError(`Genesis aborted. Critical security vulnerabilities detected: ${securityIssues.map(s => s.type).join(', ')}`);
                setDossier(d => ({...d, securityIssues}));
                setBootPhase('FAILED');
                return;
            }

            // Phase 2: Performance Profiling
            if (isCancelled) return;
            setBootPhase('PERF_PROFILE');
            setDossier(d => ({...d, securityIssues}));
            await new Promise(res => setTimeout(res, 500));
            const performanceProfile = await predictiveTrace(() => { 
                // This is a very rough simulation of executing the code's logic
                try { new Function(feature.code)(); } catch {} 
            }, 100);
            if (performanceProfile[0]?.chronons > 500) { // Reject if predicted to be very slow
                if(isCancelled) return;
                setError(`Genesis aborted. Performance profile exceeds cognitive load tolerance (${performanceProfile[0].chronons.toFixed(0)}ms).`);
                setDossier(d => ({...d, performanceProfile: performanceProfile[0]}));
                setBootPhase('FAILED');
                return;
            }
            
            // Phase 3 & 4: Render and Activate
            if (isCancelled) return;
            setBootPhase('RENDERING');
            setDossier(d => ({...d, performanceProfile: performanceProfile[0]}));
            await new Promise(res => setTimeout(res, 500));
            
            if (isCancelled) return;
            setBootPhase('ACTIVE');
        };

        runGenesisSequence();
        return () => { isCancelled = true; };
    }, [feature]);

    const finalSrcDoc = useMemo(() => {
        if(bootPhase !== 'ACTIVE') return '';
        return `
            <!DOCTYPE html><html><head><meta charset="UTF-8" /><script type="importmap">{"imports": {"react": "https://esm.sh/react@18.3.1","react-dom/client": "https://esm.sh/react-dom@18.3.1/client"}}</script><script src="https://cdn.tailwindcss.com"></script><script src="https://unpkg.com/@babel/standalone/babel.min.js"></script></head><body style="margin:0; background: transparent;"><div id="root" class="p-4"></div><script type="text/babel">
            try { const App = (function(){const module={exports:{}};(function(module,exports,React){${feature.code}})(module,module.exports,React);return module.exports.default;})(); const root = ReactDOM.createRoot(document.getElementById('root'));root.render(<App />); } catch (e) { document.getElementById('root').innerHTML = \`<div style="color:red;font-family:monospace"><h3>Runtime Error</h3><pre>${e.stack}</pre></div>\`; }
            </script></body></html>`;
    }, [bootPhase, feature.code]);

    return (
        <div className="h-full w-full flex bg-background">
            <div className="w-2/3 h-full relative">
                {bootPhase !== 'ACTIVE' && (
                     <div className="w-full h-full flex flex-col items-center justify-center bg-black/50 text-white p-4">
                        <h3 className="text-lg font-bold">Genesis Chamber Initializing...</h3>
                        <p className="text-xs text-gray-400 mb-4">{feature.name}</p>
                        <div className="w-full max-w-sm space-y-2">
                             <BootStatus phase="SECURITY SCAN" status={bootPhase === 'SECURITY_SCAN' ? 'running' : bootPhase > 'SECURITY_SCAN' ? 'pass' : 'idle'}/>
                             <BootStatus phase="PERFORMANCE PROFILE" status={bootPhase === 'PERF_PROFILE' ? 'running' : bootPhase > 'PERF_PROFILE' ? 'pass' : 'idle'}/>
                             <BootStatus phase="SANDBOX INJECTION" status={bootPhase === 'RENDERING' ? 'running' : bootPhase > 'RENDERING' ? 'pass' : 'idle'}/>
                             <BootStatus phase="LIFECYCLE MONITORING" status={bootPhase === 'ACTIVE' ? 'pass' : 'idle'}/>
                             {bootPhase === 'FAILED' && <p className="text-red-500 text-xs pt-4">{error}</p>}
                        </div>
                    </div>
                )}
                <iframe
                    key={feature.id}
                    srcDoc={finalSrcDoc}
                    title={`Genesis Chamber: ${feature.name}`}
                    sandbox="allow-scripts"
                    className={`w-full h-full border-0 transition-opacity duration-500 ${bootPhase === 'ACTIVE' ? 'opacity-100' : 'opacity-0'}`}
                />
            </div>
            <aside className="w-1/3 h-full bg-surface border-l border-border p-4 flex flex-col gap-4">
                <h3 className="text-lg font-bold">Feature Dossier</h3>
                <div className="bg-background rounded p-2">
                    <p className="text-xs font-bold uppercase flex items-center gap-1"><ShieldCheckIcon /> Security Analysis</p>
                    <div className="mt-1 text-xs space-y-1">
                        {dossier.securityIssues.length > 0 
                         ? dossier.securityIssues.map((s,i) => <p key={i} className="text-yellow-400">{s.severity}: {s.type} (Line {s.line})</p>)
                         : <p className="text-green-400">No high-severity issues found.</p>
                        }
                    </div>
                </div>
                 <div className="bg-background rounded p-2">
                    <p className="text-xs font-bold uppercase flex items-center gap-1"><ClockIcon /> Performance Profile</p>
                    <div className="mt-1 text-xs">
                        {dossier.performanceProfile ? 
                            <p>Est. Chronon Cost: <span className="font-mono text-primary">{dossier.performanceProfile.chronons.toFixed(2)}ms</span></p> 
                            : <p className="text-text-secondary">Awaiting profile...</p>}
                    </div>
                </div>
            </aside>
        </div>
    );
};