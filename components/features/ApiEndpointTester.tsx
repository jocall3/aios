// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, SparklesIcon } from '../icons';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { useNotification } from '../../contexts/NotificationContext';
import { generateRequestPayloads, probeApiResponse } from '../../services/APIIncursionAI'; // Invented

interface SalvoResult {
    id: number;
    status: number;
    latency: number;
}

const TelemetryChart: React.FC<{ results: SalvoResult[] }> = ({ results }) => {
    const maxLatency = Math.max(...results.map(r => r.latency), 500);

    return (
        <div className="w-full h-full bg-black rounded p-2 flex gap-4">
            <div className="w-2/3 h-full relative">
                {results.map(r => (
                    <div
                        key={r.id}
                        className={`absolute w-1 h-1 rounded-full animate-pop-in ${r.status >= 200 && r.status < 300 ? 'bg-green-400' : r.status >= 400 && r.status < 500 ? 'bg-yellow-400' : 'bg-red-500'}`}
                        style={{
                            left: `${(r.id / 50) * 100}%`,
                            bottom: `${(r.latency / maxLatency) * 90}%` // 90% to leave space
                        }}
                        title={`Status: ${r.status}, Latency: ${r.latency.toFixed(0)}ms`}
                    />
                ))}
            </div>
            <div className="w-1/3 h-full flex flex-col justify-end text-xs text-gray-400 font-mono gap-1">
                 <div>2xx: {results.filter(r => r.status >= 200 && r.status < 300).length}</div>
                 <div>4xx: {results.filter(r => r.status >= 400 && r.status < 500).length}</div>
                 <div>5xx: {results.filter(r => r.status >= 500).length}</div>
            </div>
        </div>
    );
};

export const ApiEndpointTester: React.FC = () => {
    const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts');
    const [method, setMethod] = useState('POST');
    const [payloadPrompt, setPayloadPrompt] = useState('A valid new post with a title and body');
    const [generatedPayloads, setGeneratedPayloads] = useState<Record<string, string>>({});
    const [selectedPayload, setSelectedPayload] = useState<string>('');
    const [salvoResults, setSalvoResults] = useState<SalvoResult[]>([]);
    const [aiProbeReport, setAiProbeReport] = useState<string>('');
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
    const { addNotification } = useNotification();
    
    const handleGeneratePayloads = useCallback(async () => {
        setIsLoading(prev => ({ ...prev, payloads: true }));
        try {
            const payloads = await generateRequestPayloads(payloadPrompt);
            setGeneratedPayloads(payloads);
            setSelectedPayload(Object.values(payloads)[0] || '');
        } catch (err) { addNotification('Failed to generate payloads', 'error'); } 
        finally { setIsLoading(prev => ({ ...prev, payloads: false })); }
    }, [payloadPrompt, addNotification]);
    
    const handleLaunchIncursion = async () => {
        setIsLoading(prev => ({ ...prev, incursion: true }));
        setSalvoResults([]);
        setAiProbeReport('');
        
        const requests = Array.from({ length: 50 }).map(async (_, i) => {
            const startTime = performance.now();
            try {
                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: (method !== 'GET' && selectedPayload) ? selectedPayload : undefined
                });
                return { id: i, status: response.status, latency: performance.now() - startTime, response };
            } catch {
                return { id: i, status: 0, latency: performance.now() - startTime, response: null };
            }
        });
        
        const responses = await Promise.all(requests);
        setSalvoResults(responses.map(r => ({id: r.id, status: r.status, latency: r.latency })));
        
        // AI Probe on the first successful response
        const firstSuccess = responses.find(r => r.response && r.response.ok);
        if (firstSuccess && firstSuccess.response) {
            const report = await probeApiResponse(firstSuccess.response);
            setAiProbeReport(report);
        } else {
            setAiProbeReport("No successful responses to analyze.");
        }

        setIsLoading(prev => ({ ...prev, incursion: false }));
        addNotification('Incursion complete.', 'success');
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><PaperAirplaneIcon /><span className="ml-3">API Incursion & Payload Dynamics Simulator</span></h1>
                <p className="text-text-secondary mt-1">Simulate high-throughput assaults to expose endpoint weaknesses.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col gap-3">
                    <h3 className="text-lg font-bold">Target Vector</h3>
                    <div className="flex gap-2">
                        <select value={method} onChange={e => setMethod(e.target.value)} className="p-2 bg-surface border rounded">
                            <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option>
                        </select>
                        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://api.example.com/data" className="flex-grow p-2 bg-surface border rounded"/>
                    </div>
                    <h3 className="text-lg font-bold mt-2">Payload Generation</h3>
                    <div className="flex gap-2">
                         <input value={payloadPrompt} onChange={e => setPayloadPrompt(e.target.value)} placeholder="Describe payload..." className="flex-grow p-2 bg-surface border rounded text-sm"/>
                         <button onClick={handleGeneratePayloads} disabled={isLoading.payloads} className="btn-primary px-4 py-2">{isLoading.payloads ? <LoadingSpinner/> : <SparklesIcon />}</button>
                    </div>
                    {Object.keys(generatedPayloads).length > 0 && <select value={selectedPayload} onChange={e => setSelectedPayload(e.target.value)} className="w-full mt-1 p-2 bg-surface border rounded"><option disabled value="">Select Forged Payload</option>{Object.entries(generatedPayloads).map(([name, payload]) => (<option key={name} value={payload}>{name}</option>))}</select>}
                    <textarea value={selectedPayload} onChange={e => setSelectedPayload(e.target.value)} className="flex-grow p-2 bg-background border rounded font-mono text-xs h-32"/>
                    <button onClick={handleLaunchIncursion} disabled={isLoading.incursion} className="btn-primary w-full py-3">{isLoading.incursion ? <LoadingSpinner /> : 'Launch Incursion (50 requests)'}</button>
                </div>

                <div className="flex flex-col gap-3 min-h-0">
                   <div className="flex-grow flex flex-col min-h-0">
                        <h3 className="text-lg font-bold mb-2">Real-time Telemetry</h3>
                        <div className="flex-grow h-48 border rounded-lg"><TelemetryChart results={salvoResults} /></div>
                   </div>
                    <div className="flex-grow flex flex-col min-h-0">
                        <h3 className="text-lg font-bold mb-2">Automated Probe Report</h3>
                         <div className="flex-grow p-2 bg-background border rounded overflow-auto font-mono text-xs text-amber-400">
                             {aiProbeReport ? aiProbeReport : 'Analysis will appear after incursion.'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};