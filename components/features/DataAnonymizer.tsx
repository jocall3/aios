// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback, useMemo } from 'react';
import { piiRecognition, runKAnonymityEngine } from '../../services/AnonymityAI'; // Invented AI Service
import type { PiiField, AnonymityReport } from '../../types/Anonymity'; // Invented
import { ShieldCheckIcon, SparklesIcon } from '../icons';
import { LoadingSpinner, MarkdownRenderer } from '../shared';

const exampleJson = `[
  { "id": 1, "name": "Alice Smith", "email": "alice.smith@example.com", "zip_code": "90210", "age": 34 },
  { "id": 2, "name": "Bob Johnson", "email": "bob.j@workplace.net", "zip_code": "90211", "age": 35 }
]`;


const KAnonymityGauge: React.FC<{ report: AnonymityReport | null }> = ({ report }) => (
    <div className="bg-background border p-3 rounded-lg text-center">
        <p className="text-4xl font-bold font-mono text-primary">{report?.kAnonymityScore || '-'}</p>
        <p className="text-xs font-semibold">Achieved K-Anonymity</p>
    </div>
);

const UtilityGauge: React.FC<{ report: AnonymityReport | null }> = ({ report }) => (
     <div className="bg-background border p-3 rounded-lg text-center">
        <p className="text-4xl font-bold font-mono text-green-400">{report ? (report.dataUtilityScore * 100).toFixed(1) : '-'}<span className="text-lg">%</span></p>
        <p className="text-xs font-semibold">Data Utility Score</p>
    </div>
);

export const DataAnonymizer: React.FC = () => {
    const [data, setData] = useState(exampleJson);
    const [detectedPii, setDetectedPii] = useState<PiiField[]>([]);
    const [kValue, setKValue] = useState(2);
    const [report, setReport] = useState<AnonymityReport | null>(null);
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

    const handleDetect = useCallback(async () => {
        setIsLoading(p => ({ ...p, detect: true }));
        setReport(null);
        try {
            const pii = await piiRecognition(data);
            setDetectedPii(pii);
        } finally { setIsLoading(p => ({ ...p, detect: false })); }
    }, [data]);
    
    useEffect(() => { handleDetect(); }, [handleDetect]);
    
    const handleAnonymize = async () => {
        setIsLoading(p => ({ ...p, anonymize: true }));
        setReport(null);
        try {
            const result = await runKAnonymityEngine(data, detectedPii, kValue);
            setReport(result);
        } finally { setIsLoading(p => ({ ...p, anonymize: false })); }
    };
    
    const updateStrategy = (key: string, strategy: PiiField['strategy']) => {
        setDetectedPii(pii => pii.map(p => p.key === key ? { ...p, strategy } : p));
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><ShieldCheckIcon /><span className="ml-3">PII De-Structuring & K-Anonymity Engine</span></h1>
                <p className="text-text-secondary mt-1">Guarantee quantifiable anonymity while maximizing data utility.</p>
            </header>
            
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 min-h-0">
                <div className="lg:col-span-2 flex flex-col gap-3">
                    <h3 className="text-xl font-bold">1. Data Input</h3>
                    <textarea value={data} onChange={e => setData(e.target.value)} onBlur={handleDetect} className="flex-grow p-2 bg-surface border rounded font-mono text-xs"/>
                    <h3 className="text-xl font-bold mt-2">2. PII Profile & Anonymization Strategy</h3>
                     <div className="flex-grow bg-surface border rounded p-2 overflow-y-auto space-y-2">
                        {isLoading.detect ? <LoadingSpinner/> : detectedPii.map(pii => (
                             <div key={pii.key} className="grid grid-cols-2 gap-2 text-sm items-center">
                                <span>{pii.key} <em className="text-xs text-text-secondary">({pii.type})</em></span>
                                <select value={pii.strategy} onChange={e => updateStrategy(pii.key, e.target.value as any)} className="w-full p-1 bg-background border text-xs rounded">
                                     <option value="redact">Redact</option><option value="substitute">Substitute</option><option value="generalize">Generalize</option>
                                </select>
                             </div>
                        ))}
                    </div>
                </div>
                <div className="lg:col-span-3 flex flex-col gap-3 min-h-0">
                     <h3 className="text-xl font-bold">3. Set Anonymity Guarantee & Execute</h3>
                     <div className="p-3 bg-surface border rounded flex items-center gap-4">
                        <label className="font-bold">k = {kValue}</label>
                        <input type="range" min="2" max="20" value={kValue} onChange={e => setKValue(parseInt(e.target.value))} className="flex-grow"/>
                        <button onClick={handleAnonymize} disabled={isLoading.anonymize} className="btn-primary py-2 px-6">
                            {isLoading.anonymize ? <LoadingSpinner/> : "Anonymize"}
                        </button>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <KAnonymityGauge report={report} />
                        <UtilityGauge report={report} />
                    </div>
                      <div className="flex-grow bg-background border rounded overflow-auto min-h-[200px]">
                        <pre className="p-2 font-mono text-xs whitespace-pre-wrap">{report?.anonymizedData || 'Anonymized dataset will be generated here...'}</pre>
                    </div>
                </div>
            </div>
        </div>
    );
};