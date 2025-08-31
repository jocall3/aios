import React, { useState } from 'react';
import { BugAntIcon } from '../icons.tsx';
import { analyzeRegexForRedosStream } from '../../services/index.ts';
import { LoadingSpinner, MarkdownRenderer } from '../shared/index.tsx';

export const RedosScanner: React.FC = () => {
    const [regex, setRegex] = useState('(a+)+');
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleScan = async () => {
        setIsLoading(true);
        setAnalysis('');
        try {
            const stream = analyzeRegexForRedosStream(regex);
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setAnalysis(fullResponse);
            }
        } catch (e) {
            setAnalysis(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <BugAntIcon />
                    <span className="ml-3">Regex DoS Scanner</span>
                </h1>
                <p className="text-text-secondary mt-1">Scan regular expressions for potential Denial of Service vulnerabilities.</p>
            </header>
            <div className="flex-grow flex flex-col items-center justify-center gap-4">
                <div className="w-full max-w-lg">
                    <label className="text-sm font-medium mb-2">Regular Expression</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={regex}
                            onChange={e => setRegex(e.target.value)}
                            className="flex-grow p-2 bg-surface border rounded-md font-mono"
                        />
                        <button onClick={handleScan} disabled={isLoading} className="btn-primary px-6 py-2">{isLoading ? <LoadingSpinner /> : 'Scan'}</button>
                    </div>
                </div>
                <div className="mt-6 w-full max-w-2xl flex-grow flex flex-col min-h-[200px]">
                    <label className="text-sm font-medium mb-2">AI Analysis</label>
                    <div className="flex-grow p-4 bg-background border rounded-lg overflow-y-auto">
                        {isLoading && !analysis && <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>}
                        {analysis && <MarkdownRenderer content={analysis} />}
                    </div>
                </div>
            </div>
        </div>
    );
};