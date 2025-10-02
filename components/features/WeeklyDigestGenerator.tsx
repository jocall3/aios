// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback } from 'react';
import { synthesizeStrategy } from '../../services/EnterpriseCognitionAI'; // Invented AI Service
import type { EnterpriseSignalReport, StrategicMandate } from '../../types/EnterpriseCognition'; // Invented
import { useNotification } from '../../contexts/NotificationContext';
import { MailIcon, SparklesIcon, ExclamationTriangleIcon } from '../icons';
import { LoadingSpinner, MarkdownRenderer } from '../shared/LoadingSpinner';

const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

const DataStreamIndicator: React.FC<{ name: string; status: 'connected' | 'degraded' | 'error' }> = ({ name, status }) => {
    const color = { connected: 'bg-green-500', degraded: 'bg-yellow-500', error: 'bg-red-500' }[status];
    return <div className="flex items-center gap-2 p-2 bg-background border rounded text-xs"><div className={`w-2 h-2 rounded-full ${color}`}></div><span>{name}</span></div>
}

const MandateCard: React.FC<{ mandate: StrategicMandate, onSelect: () => void }> = ({ mandate, onSelect }) => {
    return (
        <div className="bg-surface p-4 border rounded-lg h-full flex flex-col">
            <h4 className="font-bold flex items-center gap-2"><SparklesIcon /> {mandate.name}</h4>
            <p className="text-xs text-text-secondary mt-2 flex-grow">{mandate.summary}</p>
            <button onClick={onSelect} className="btn-primary w-full py-2 mt-4 text-sm">Select Mandate</button>
        </div>
    )
}

export const WeeklyDigestGenerator: React.FC = () => {
    const { addNotification } = useNotification();
    const [report, setReport] = useState<EnterpriseSignalReport | null>(null);
    const [selectedMandate, setSelectedMandate] = useState<StrategicMandate | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSynthesize = useCallback(async () => {
        setIsLoading(true);
        setReport(null);
        setSelectedMandate(null);
        try {
            // In a real system, this would trigger live data fetches. Here, we simulate it.
            const synthesizedReport = await synthesizeStrategy();
            setReport(synthesizedReport);
            addNotification('Enterprise signals synthesized.', 'success');
        } catch (e) {
            addNotification(e instanceof Error ? e.message : 'Synthesis failed', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addNotification]);
    
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><MailIcon /><span className="ml-3">Signal Intelligence & Automated Strategy Synthesizer</span></h1>
                <p className="text-text-secondary mt-1">Ingest live enterprise data streams. Synthesize strategy. Execute mandate.</p>
            </header>

            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
                <div className="md:col-span-1 flex flex-col gap-4">
                     <h3 className="text-xl font-bold">Live Data Streams</h3>
                     <div className="grid grid-cols-2 gap-2">
                        <DataStreamIndicator name="GitHub API" status={report?.streamStatus.github || 'degraded'} />
                        <DataStreamIndicator name="Jira API" status={report?.streamStatus.jira || 'degraded'}/>
                        <DataStreamIndicator name="Telemetry" status={report?.streamStatus.telemetry || 'degraded'}/>
                        <DataStreamIndicator name="Financials" status={report?.streamStatus.financial || 'degraded'}/>
                     </div>
                      <button onClick={handleSynthesize} disabled={isLoading} className="btn-primary flex items-center justify-center gap-2 py-3 w-full">
                          {isLoading ? <LoadingSpinner /> : <><SparklesIcon /> Synthesize Strategy</>}
                      </button>
                      <div className="bg-surface border rounded-lg p-4 flex-grow overflow-y-auto">
                        <h4 className="font-bold text-sm mb-2">Correlated Insights</h4>
                         {isLoading && <div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}
                         {report && (
                            <ul className="list-disc list-inside text-xs space-y-2">
                                {report.correlatedInsights.map((insight, i) => <li key={i}>{insight}</li>)}
                            </ul>
                         )}
                      </div>
                </div>

                <div className="md:col-span-2 flex flex-col min-h-0">
                    {!report && !isLoading && <div className="h-full w-full flex flex-col items-center justify-center text-center bg-surface border rounded-lg">
                        <p className="font-bold">Awaiting Strategic Synthesis</p>
                        <p className="text-sm text-text-secondary mt-2">The engine will present actionable mandates here.</p>
                    </div>}
                    {isLoading && <div className="h-full w-full flex items-center justify-center bg-surface border rounded-lg"><LoadingSpinner /></div>}
                    
                    {report && !selectedMandate && (
                         <div className="h-full">
                            <h3 className="text-xl font-bold mb-2">Select Strategic Mandate</h3>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100%-2rem)]">
                                {report.generatedMandates.map(m => <MandateCard key={m.name} mandate={m} onSelect={()=> setSelectedMandate(m)} />)}
                            </div>
                         </div>
                    )}
                    {selectedMandate && (
                         <div className="h-full flex flex-col">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-xl font-bold">Mandate Artifacts: "{selectedMandate.name}"</h3>
                                <button onClick={()=> setSelectedMandate(null)} className="text-xs underline">Change Mandate</button>
                            </div>
                            <div className="flex-grow bg-white border rounded overflow-hidden">
                                <iframe srcDoc={selectedMandate.artifacts.emailHtml} title="Email Preview" className="w-full h-full" />
                            </div>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};