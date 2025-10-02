// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback, useMemo } from 'react';
import { synthesizeExploitSuite } from '../../services/FaultInjectionAI'; // Invented, powerful service
import type { ExploitSuite, ExploitVector } from '../../types/FaultInjection'; // Invented types
import { BugAntIcon, ShieldExclamationIcon, ClockIcon, LockClosedIcon } from '../icons';
import { LoadingSpinner, MarkdownRenderer } from '../shared/LoadingSpinner';

const exampleStackTrace = `TypeError: Cannot read properties of undefined (reading 'name')
    at UserProfile (UserProfile.jsx:5:21)
    at renderWithHooks (react-dom.development.js:14985:18)`;

const exampleContext = `const UserProfile = ({ user }) => <div>Hello, {user.name}</div>;`;

const ExploitVectorResult: React.FC<{ vector: ExploitVector }> = ({ vector }) => {
    const severityStyles: Record<string, string> = {
        Critical: 'border-red-700 bg-red-900/50',
        High: 'border-red-500 bg-red-700/50',
        Medium: 'border-yellow-500 bg-yellow-700/50',
        Low: 'border-blue-500 bg-blue-700/50'
    };
    const iconMap: Record<string, React.ReactNode> = {
        Reproduction: <BugAntIcon />,
        Permutation: <BeakerIcon />, // Assumed import
        'Denial-of-Service': <ClockIcon />, // Assumed import
        Security: <ShieldExclamationIcon />
    }

    return (
        <details className={`p-3 rounded-lg border-l-4 transition-colors ${severityStyles[vector.severity] || 'border-gray-500'}`} open>
            <summary className="font-bold text-lg flex items-center justify-between cursor-pointer">
                <span>{vector.title}</span>
                <div className="flex items-center gap-2 text-sm">
                    {iconMap[vector.type]}
                    <span>{vector.severity}</span>
                </div>
            </summary>
            <div className="mt-2 pt-2 border-t border-white/10">
                <p className="text-sm text-text-secondary mb-2">{vector.description}</p>
                <div className="bg-black/50 p-1 rounded">
                     <MarkdownRenderer content={'```javascript\n' + vector.testCaseCode + '\n```'} />
                </div>
            </div>
        </details>
    )
};

export const BugReproducer: React.FC = () => {
    const [stackTrace, setStackTrace] = useState(exampleStackTrace);
    const [context, setContext] = useState(exampleContext);
    const [exploitSuite, setExploitSuite] = useState<ExploitSuite | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSynthesize = useCallback(async () => {
        setIsLoading(true);
        setExploitSuite(null);
        try {
            const suite = await synthesizeExploitSuite(stackTrace, context);
            setExploitSuite(suite);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [stackTrace, context]);
    
    const sortedVectors = useMemo(() => {
        if (!exploitSuite) return [];
        const severityOrder = { "Critical": 0, "High": 1, "Medium": 2, "Low": 3 };
        return [...exploitSuite.vectors].sort((a,b) => severityOrder[a.severity] - severityOrder[b.severity]);
    }, [exploitSuite]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <BugAntIcon />
                    <span className="ml-3">Fault Injection & Exploit Synthesis Engine</span>
                </h1>
                <p className="text-text-secondary mt-1">Provide failure evidence. We will map the vulnerability landscape and forge the weapons to conquer it.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col flex-1 min-h-0">
                        <label htmlFor="stack-trace" className="text-sm font-medium mb-2">Failure Evidence (Stack Trace)</label>
                        <textarea id="stack-trace" value={stackTrace} onChange={e => setStackTrace(e.target.value)} className="flex-grow p-2 bg-surface border rounded font-mono text-xs"/>
                    </div>
                    <div className="flex flex-col flex-1 min-h-0">
                        <label htmlFor="context" className="text-sm font-medium mb-2">Code Context</label>
                        <textarea id="context" value={context} onChange={e => setContext(e.target.value)} className="flex-grow p-2 bg-surface border rounded font-mono text-xs"/>
                    </div>
                    <button onClick={handleSynthesize} disabled={isLoading} className="btn-primary w-full py-3">
                        {isLoading ? <LoadingSpinner/> : 'Synthesize Exploit Suite'}
                    </button>
                </div>

                <div className="flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium">Synthesized Exploit Vectors</label>
                        {exploitSuite && <p className="text-xs font-mono">Fault Vector: {exploitSuite.faultVector}</p>}
                    </div>
                    <div className="flex-grow p-2 bg-background border rounded overflow-auto space-y-3">
                        {isLoading && (
                            <div className="flex justify-center items-center h-full">
                                <div className="text-center">
                                    <LoadingSpinner />
                                    <p className="mt-2 text-sm text-text-secondary">Analyzing fault vector... generating exploit permutations...</p>
                                </div>
                            </div>
                        )}
                        {sortedVectors.map(vector => <ExploitVectorResult key={vector.title} vector={vector}/>)}
                    </div>
                </div>
            </div>
        </div>
    );
};