import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useGlobalState } from '../../contexts/GlobalStateContext';
import { analyzeCodeLexicon, harmonizeAnomaly } from '../../services/LexicalGravityAI'; // Invented
import type { LexicalAnomaly, AnomalyType } from '../../types/LexicalGravity'; // Invented
import { BeakerIcon } from '../icons';
import { LoadingSpinner } from '../shared/LoadingSpinner';

const exampleCode = `
// Fetches the primary user object
function retrieveUser(id) {
    // Note: also logs the user out for security
    logoutUser(id);
    return fetch('/api/users/' + id);
}

// Another funtion for getting posts
const getPostsByUser = (userId) => {
    // ... logic
}
`;

const AnomalyMarker: React.FC<{ anomaly: LexicalAnomaly; onHarmonize: () => void }> = ({ anomaly, onHarmonize }) => {
    const severityStyles: Record<AnomalyType, string> = {
        'Conceptual Dissonance': 'bg-red-500/50 border-red-400',
        'Lexical Inconsistency': 'bg-yellow-500/50 border-yellow-400',
        'Comment/Code Divergence': 'bg-purple-500/50 border-purple-400',
    };
    return (
        <div className={`p-3 rounded-lg border-l-4 ${severityStyles[anomaly.type]}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold">{anomaly.type}</p>
                    <p className="text-xs font-mono">Line {anomaly.line}</p>
                </div>
                <button onClick={onHarmonize} className="text-xs btn-primary px-3 py-1">Harmonize</button>
            </div>
            <p className="text-sm mt-2">{anomaly.explanation}</p>
        </div>
    );
};


export const CodeSpellChecker: React.FC = () => {
    const [code, setCode] = useState(exampleCode);
    const [anomalies, setAnomalies] = useState<LexicalAnomaly[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const { state } = useGlobalState();
    const { projectFiles } = state;

    const handleAnalysis = useCallback(async () => {
        setIsScanning(true);
        setAnomalies([]);
        try {
            // In a real implementation, `projectFiles` would be passed to the AI to build the lexicon.
            // For this self-contained example, we only pass the current code.
            const results = await analyzeCodeLexicon(code, projectFiles);
            setAnomalies(results);
        } finally {
            setIsScanning(false);
        }
    }, [code, projectFiles]);
    
    // Auto-analyze on mount
    useEffect(() => {
        handleAnalysis();
    }, [handleAnalysis]);

    const handleHarmonize = async (anomalyToFix: LexicalAnomaly) => {
        const originalCode = code;
        try {
            // Optimistically update the UI to show a harmonizing state
            setAnomalies(prev => prev.filter(a => a.line !== anomalyToFix.line));
            const newCode = await harmonizeAnomaly(originalCode, anomalyToFix);
            setCode(newCode);
        } catch(e) {
            console.error(e);
            setCode(originalCode); // Revert on failure
            setAnomalies(anomalies);
        }
    };
    
    const highlightedCode = useMemo(() => {
        const lines = code.split('\n');
        anomalies.forEach(anomaly => {
            const lineIndex = anomaly.line - 1;
            if (lines[lineIndex]) {
                const severity = anomaly.type === 'Conceptual Dissonance' ? 'bg-red-500/10' : 'bg-yellow-500/10';
                lines[lineIndex] = `<span class="relative block ${severity}">${lines[lineIndex]}</span>`;
            }
        });
        return lines.join('\n');
    }, [code, anomalies]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl flex items-center">
                    <BeakerIcon />
                    <span className="ml-3">Semantic Anomaly Detector & Lexical Harmonizer</span>
                </h1>
                <p className="text-text-secondary mt-1">Detecting conceptual drift and enforcing project-specific linguistic coherence.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col h-full min-h-0">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium">Code Editor</label>
                         <button onClick={handleAnalysis} className="text-xs px-3 py-1 bg-surface border rounded hover:bg-background disabled:opacity-50" disabled={isScanning}>
                             {isScanning ? <LoadingSpinner/> : 'Re-Scan'}
                        </button>
                    </div>
                     <div className="relative flex-grow font-mono text-sm bg-surface border rounded-lg p-4 overflow-auto">
                        <textarea value={code} onChange={(e) => setCode(e.target.value)}
                                  className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-primary resize-none z-10"
                                  spellCheck="false" />
                        <pre className="absolute inset-0 w-full h-full p-4 pointer-events-none whitespace-pre-wrap" 
                             dangerouslySetInnerHTML={{ __html: highlightedCode }}/>
                    </div>
                </div>
                <div className="flex flex-col min-h-0">
                     <label className="text-sm font-medium mb-2">Anomaly Report</label>
                     <div className="flex-grow bg-background border rounded p-3 space-y-3 overflow-y-auto">
                        {isScanning && <div className="h-full w-full flex items-center justify-center"><LoadingSpinner/></div>}
                        {!isScanning && anomalies.length === 0 && <p className="text-center text-sm p-8 text-text-secondary">No semantic anomalies detected. System is lexically coherent.</p>}
                        {anomalies.map(anomaly => (
                            <AnomalyMarker key={`${anomaly.line}-${anomaly.type}`} anomaly={anomaly} onHarmonize={() => handleHarmonize(anomaly)} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};