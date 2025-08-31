import React, { useState, useCallback, useEffect } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { generateWebhookPermutations } from '../../services/CausalitySplicerAI'; // Invented AI Service
import { PaperAirplaneIcon, BeakerIcon, ArrowPathIcon } from '../icons';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface WebhookEvent {
    id: string;
    receivedAt: number;
    headers: Record<string, string>;
    payload: object;
}

const INGESTION_ENDPOINT = "https://a7b3-c4d1-e6f7.engine.reality/ingest";

export const WebhookEventSimulator: React.FC = () => {
    const [events, setEvents] = useState<WebhookEvent[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);
    const [modifiedPayload, setModifiedPayload] = useState('');
    const [replayTarget, setReplayTarget] = useState('http://localhost:3000/api/webhooks');
    const [isReplaying, setIsReplaying] = useState(false);
    const [isGeneratingSwarm, setIsGeneratingSwarm] = useState(false);
    const { addNotification } = useNotification();

    // Simulate receiving a live webhook
    useEffect(() => {
        const interval = setInterval(() => {
            const newEvent: WebhookEvent = {
                id: `evt_${Date.now()}`,
                receivedAt: Date.now(),
                headers: { 'x-github-event': 'push', 'x-hub-signature-256': 'sha256=...'},
                payload: { ref: "refs/heads/main", commits: [{id: 'commit123', message: 'feat: new feature'}]}
            };
            setEvents(prev => [newEvent, ...prev.slice(0, 49)]); // Keep last 50 events
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleSelectEvent = (event: WebhookEvent) => {
        setSelectedEvent(event);
        setModifiedPayload(JSON.stringify(event.payload, null, 2));
    };

    const handleReplay = async () => {
        if (!selectedEvent || !replayTarget) return;
        setIsReplaying(true);
        try {
            // In a real implementation, this would re-sign and send the request
            await new Promise(res => setTimeout(res, 500)); // Simulate network request
            addNotification(`Spliced event replayed to ${replayTarget}`, 'success');
        } catch (e) {
            addNotification(`Replay failed`, 'error');
        } finally {
            setIsReplaying(false);
        }
    };
    
    const handleGenerateSwarm = async () => {
        if (!selectedEvent) return;
        setIsGeneratingSwarm(true);
        try {
            const swarmPayloads = await generateWebhookPermutations(selectedEvent.payload);
            const swarmEvents = swarmPayloads.map((payload, i) => ({
                ...selectedEvent,
                id: `swarm_${selectedEvent.id}_${i}`,
                payload: payload,
            }));
            setEvents(prev => [...swarmEvents, ...prev]);
             addNotification(`Generated permutation swarm of ${swarmPayloads.length} events.`, 'info');
        } catch(e) {
            addNotification(`Swarm generation failed`, 'error');
        } finally {
            setIsGeneratingSwarm(false);
        }
    }

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><PaperAirplaneIcon /><span className="ml-3">Live Webhook Interceptor & Causality Splicer</span></h1>
                <p className="text-text-secondary mt-1">Intercept, modify, and replay live system events to control the causal chain.</p>
            </header>
            
            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
                <div className="md:col-span-1 flex flex-col gap-3 min-h-0">
                    <h3 className="text-xl font-bold">Live Ingestion Stream</h3>
                     <div className="bg-surface border rounded p-2 text-xs font-mono text-center">
                        Endpoint: <span className="text-primary">{INGESTION_ENDPOINT}</span>
                    </div>
                     <div className="flex-grow bg-background border rounded p-2 overflow-y-auto space-y-1">
                        {events.map(e => (
                            <div key={e.id} onClick={() => handleSelectEvent(e)} className={`p-2 rounded cursor-pointer ${selectedEvent?.id === e.id ? 'bg-primary/20' : 'bg-surface'}`}>
                                <p className="font-mono text-xs truncate">ID: {e.id}</p>
                                <p className="text-xs text-text-secondary">{new Date(e.receivedAt).toISOString()}</p>
                            </div>
                        ))}
                     </div>
                </div>

                <div className="md:col-span-2 flex flex-col gap-3 min-h-0">
                     <h3 className="text-xl font-bold">Causality Splicer</h3>
                     <div className="flex-grow flex flex-col min-h-0 gap-3">
                         <div className="h-1/2 flex flex-col min-h-0">
                             <label className="text-sm font-medium mb-1">Deconstructed Payload (Editable)</label>
                             <textarea value={modifiedPayload} onChange={e => setModifiedPayload(e.target.value)} 
                                       className="flex-grow bg-surface border rounded p-2 font-mono text-xs" 
                                       disabled={!selectedEvent}/>
                         </div>
                          <div className="h-1/2 flex flex-col min-h-0 gap-2">
                             <div className="flex gap-2">
                                <button onClick={handleGenerateSwarm} disabled={!selectedEvent || isGeneratingSwarm} className="btn-primary flex items-center justify-center gap-2 p-2 flex-1 text-sm">{isGeneratingSwarm ? <LoadingSpinner/> : <><BeakerIcon /> Generate Permutation Swarm</>}</button>
                                <input value={replayTarget} onChange={e => setReplayTarget(e.target.value)} placeholder="Replay Target URL..." className="p-2 bg-surface border rounded flex-1"/>
                             </div>
                             <button onClick={handleReplay} disabled={!selectedEvent || isReplaying} className="btn-primary w-full p-2 flex items-center justify-center gap-2">{isReplaying ? <LoadingSpinner/> : <><ArrowPathIcon /> Replay Spliced Event</>}</button>
                          </div>
                     </div>
                </div>
            </div>
        </div>
    );
};