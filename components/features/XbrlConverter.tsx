// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback } from 'react';
import { validateAndTranspileFinancialJson } from '../../services/GeosIngestionAI'; // Invented, advanced service
import type { FinancialIngestionReport } from '../../types/GeosIngestion'; // Invented, structured type
import { XbrlConverterIcon } from '../icons';
import { LoadingSpinner, MarkdownRenderer } from '../shared/LoadingSpinner';

const exampleJson = `{
  "company": "ExampleCorp",
  "cik": "0001234567",
  "reporting_date": "2024-06-30",
  "quarterly_revenue": 1500000,
  "net_income": 250000,
  "currency": "USD"
}`;

const AnomalyReport: React.FC<{ anomalies: string[] }> = ({ anomalies }) => (
    <div>
        <h4 className="font-bold text-sm text-yellow-400">Compliance Anomalies Detected:</h4>
        <ul className="list-disc list-inside text-xs mt-1 space-y-1">
            {anomalies.map((a, i) => <li key={i}>{a}</li>)}
        </ul>
    </div>
);

export const XbrlConverter: React.FC = () => {
    const [jsonInput, setJsonInput] = useState<string>(exampleJson);
    const [jurisdiction, setJurisdiction] = useState<'us-sec' | 'eu-esma'>('us-sec');
    const [report, setReport] = useState<FinancialIngestionReport | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    
    const handleIngest = useCallback(async () => {
        setIsLoading(true);
        setReport(null);
        try {
            const result = await validateAndTranspileFinancialJson(jsonInput, jurisdiction);
            setReport(result);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [jsonInput, jurisdiction]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center">
                    <XbrlConverterIcon />
                    <span className="ml-3">GEOS Ingestion & Compliance Validator</span>
                </h1>
                <p className="text-text-secondary mt-1">Ingest, validate, and transpile economic data against global financial ontologies.</p>
            </header>
            
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col gap-3 min-h-0">
                    <h3 className="text-xl font-bold">Data Ingestion</h3>
                    <div>
                        <label className="text-sm font-medium">Reporting Jurisdiction</label>
                         <select value={jurisdiction} onChange={e => setJurisdiction(e.target.value as any)} className="w-full mt-1 p-2 bg-surface border rounded text-sm">
                            <option value="us-sec">USA - SEC (US-GAAP)</option>
                            <option value="eu-esma">EU - ESMA (IFRS)</option>
                         </select>
                    </div>
                    <div className="flex-grow flex flex-col min-h-0">
                        <label htmlFor="json-input" className="text-sm font-medium mb-1">Source Financial Data (JSON)</label>
                        <textarea id="json-input" value={jsonInput} onChange={(e) => setJsonInput(e.target.value)}
                                  className="flex-grow p-2 bg-surface border rounded font-mono text-xs"/>
                    </div>
                    <button onClick={handleIngest} disabled={isLoading} className="btn-primary w-full py-2">
                        {isLoading ? <LoadingSpinner/> : 'Validate & Ingest'}
                    </button>
                </div>
                
                <div className="flex flex-col gap-3 min-h-0">
                    <h3 className="text-xl font-bold">Transpiled Output & Compliance Report</h3>
                    {isLoading ? <div className="h-full w-full flex items-center justify-center bg-background border rounded"><LoadingSpinner/></div> :
                     !report ? <div className="h-full w-full flex items-center justify-center bg-background border rounded text-text-secondary">Awaiting ingestion...</div> :
                     (
                        <>
                             <div className="flex-grow p-1 bg-background border rounded overflow-y-auto">
                                <MarkdownRenderer content={'```xml\n' + report.transpiledXbrl + '\n```'} />
                             </div>
                             <div className="flex-shrink-0 h-40 bg-surface border rounded p-3 overflow-y-auto">
                                {report.anomalies.length > 0 ? (
                                    <AnomalyReport anomalies={report.anomalies} />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center">
                                        <p className="font-bold text-green-400">Compliance Check Passed</p>
                                        <p className="text-xs text-text-secondary">No semantic or statistical anomalies detected.</p>
                                    </div>
                                )}
                             </div>
                        </>
                     )
                    }
                </div>
            </div>
        </div>
    );
};