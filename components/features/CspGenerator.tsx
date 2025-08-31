import React, { useState, useCallback, useEffect } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { synthesizeCspFromProfile } from '../../services/SecurityOntologyAI'; // Invented AI Service
import { ShieldCheckIcon } from '../icons';
import { LoadingSpinner, MarkdownRenderer } from '../shared';

// --- SELF-CONTAINED MODULE LOGIC ---

type CspDirective = 'script-src' | 'style-src' | 'img-src' | 'connect-src' | 'font-src';
type NetworkProfile = Record<CspDirective, Set<string>>;

const useNetworkProfiler = (isMonitoring: boolean): NetworkProfile => {
    const [profile, setProfile] = useState<NetworkProfile>({ 'script-src': new Set(), 'style-src': new Set(), 'img-src': new Set(), 'connect-src': new Set(), 'font-src': new Set()});

    useEffect(() => {
        if (!isMonitoring) return;
        
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    const el = node as HTMLElement;
                    if(el.tagName === 'SCRIPT' && el.src) profile['script-src'].add(new URL(el.src).origin);
                    if(el.tagName === 'LINK' && el.rel === 'stylesheet' && el.href) profile['style-src'].add(new URL(el.href).origin);
                });
            });
            setProfile({...profile});
        });
        
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
             if (typeof args[0] === 'string') profile['connect-src'].add(new URL(args[0]).origin);
             setProfile({...profile});
             return originalFetch(...args);
        }
        
        observer.observe(document.body, { childList: true, subtree: true });
        
        return () => {
            observer.disconnect();
            window.fetch = originalFetch;
        };
    }, [isMonitoring]); // Rerunning this effect is tricky, simple implementation here

    return profile;
};


export const CspGenerator: React.FC = () => {
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [policy, setPolicy] = useState('');
    const [violations, setViolations] = useState<SecurityPolicyViolationEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { addNotification } = useNotification();
    const networkProfile = useNetworkProfiler(isMonitoring);
    
    const handleSynthesize = useCallback(async () => {
        setIsLoading(true); setPolicy('');
        try {
            const result = await synthesizeCspFromProfile(networkProfile);
            setPolicy(result);
            addNotification('CSP Synthesized from Live Profile!', 'success');
        } finally {
            setIsLoading(false);
        }
    }, [networkProfile, addNotification]);

    useEffect(() => {
        const handleViolation = (e: SecurityPolicyViolationEvent) => {
            setViolations(v => [e, ...v].slice(0, 50));
        };
        document.addEventListener('securitypolicyviolation', handleViolation);
        return () => document.removeEventListener('securitypolicyviolation', handleViolation);
    }, []);
    
    const applyPolicy = () => {
        let meta = document.getElementById('csp-shield') as HTMLMetaElement;
        if(!meta) {
            meta = document.createElement('meta');
            meta.id = 'csp-shield';
            meta.httpEquiv = "Content-Security-Policy";
            document.head.appendChild(meta);
        }
        meta.content = policy;
        addNotification('Active Shield Enabled!', 'info');
    };
    
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><ShieldCheckIcon /><span className="ml-3">Live CSP Auditor & Active Threat Surface Shield</span></h1>
                <p className="text-text-secondary mt-1">Discover, synthesize, and enforce a maximally restrictive Content Security Policy based on live application behavior.</p>
            </header>
            
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                 <div className="flex flex-col gap-3 min-h-0">
                    <h3 className="text-xl font-bold">1. Network Egress Profiler</h3>
                     <div className="bg-surface border rounded-lg p-4 space-y-3">
                         <button onClick={() => setIsMonitoring(!isMonitoring)} className={`w-full py-2 font-bold rounded ${isMonitoring ? 'bg-red-500 text-white animate-pulse' : 'btn-primary'}`}>
                             {isMonitoring ? 'STOP MONITORING' : 'START LIVE MONITORING'}
                         </button>
                         <p className="text-xs text-text-secondary text-center">Activate monitoring and interact with the application to build a profile of all external network requests.</p>
                     </div>
                      <div className="flex-grow bg-background border rounded-lg p-3 overflow-y-auto">
                        {Object.entries(networkProfile).map(([directive, origins]) => (
                            <div key={directive}>
                                <p className="text-xs font-bold font-mono">{directive}:</p>
                                <div className="pl-4">
                                {Array.from(origins).map(o => <p key={o} className="text-xs text-primary font-mono truncate">{o}</p>)}
                                </div>
                            </div>
                        ))}
                      </div>
                     <button onClick={handleSynthesize} disabled={isLoading || !Object.v