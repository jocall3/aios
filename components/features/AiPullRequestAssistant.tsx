

import React, { useState, useMemo, useCallback } from 'react';
import * as Diff from 'diff';
import { generatePrSummaryStructured, generateTechnicalSpecFromDiff, downloadFile, createDocument, insertText } from '../../services/index.ts';
import type { StructuredPrSummary } from '../../types.ts';
import { AiPullRequestAssistantIcon, DocumentIcon } from '../icons.tsx';
import { LoadingSpinner } from '../shared/index.tsx';
import { useNotification } from '../../contexts/NotificationContext.tsx';
import { useGlobalState } from '../../contexts/GlobalStateContext.tsx';

const exampleBefore = `function Greeter(props) {
  return <h1>Hello, {props.name}!</h1>;
}`;
const exampleAfter = `function Greeter({ name, enthusiasmLevel = 1 }) {
  const punctuation = '!'.repeat(enthusiasmLevel);
  return <h1>Hello, {name}{punctuation}</h1>;
}`;

export const AiPullRequestAssistant: React.FC = () => {
    const [beforeCode, setBeforeCode] = useState<string>(exampleBefore);
    const [afterCode, setAfterCode] = useState<string>(exampleAfter);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [summary, setSummary] = useState<StructuredPrSummary | null>(null);

    const { addNotification } = useNotification();
    const { state } = useGlobalState();
    const { user } = state;

    const diff = useMemo(() => Diff.createPatch('component.tsx', beforeCode, afterCode), [beforeCode, afterCode]);

    const handleGenerateSummary = useCallback(async () => {
        if (!beforeCode.trim() && !afterCode.trim()) {
            setError('Please provide code to generate a summary.');
            return;
        }
        setIsLoading(true);
        setError('');
        setSummary(null);
        
        try {
            const result: StructuredPrSummary = await generatePrSummaryStructured(diff);
            setSummary(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate summary: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, [diff, beforeCode, afterCode]);

    const handleExportToDocs = async () => {
        if (!summary || !user) {
            addNotification('Please generate a summary first and ensure you are signed in.', 'error');
            return;
        }
        setIsExporting(true);
        try {
            const specContent = await generateTechnicalSpecFromDiff(diff, summary);
            const doc = await createDocument(`Tech Spec: ${summary.title}`);
            await insertText(doc.documentId, specContent);
            addNotification('Successfully exported to Google Docs!', 'success');
            window.open(doc.webViewLink, '_blank');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            addNotification(`Failed to export: ${errorMessage}`, 'error');
        } finally {
            setIsExporting(false);
        }
    };
    
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <AiPullRequestAssistantIcon />
                    <span className="ml-3">AI Pull Request Assistant</span>
                </h1>
                <p className="text-text-secondary mt-1">Generate a PR summary from code changes and export a full tech spec.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                {/* Left side: Inputs and Generator */}
                <div className="flex flex-col gap-4 min-h-0">
                    <div className="flex flex-col flex-1 min-h-0">
                        <label htmlFor="before-code" className="text-sm font-medium text-text-secondary mb-2">Before</label>
                        <textarea id="before-code" value={beforeCode} onChange={e => setBeforeCode(e.target.value)} className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm" />
                    </div>
                    <div className="flex flex-col flex-1 min-h-0">
                        <label htmlFor="after-code" className="text-sm font-medium text-text-secondary mb-2">After</label>
                        <textarea id="after-code" value={afterCode} onChange={e => setAfterCode(e.target.value)} className="flex-grow p-4 bg-surface border border-border rounded-md resize-none font-mono text-sm" />
                    </div>
                    <button
                        onClick={handleGenerateSummary}
                        disabled={isLoading}
                        className="btn-primary w-full mt-4 flex items-center justify-center gap-2 py-2"
                    >
                        {isLoading ? <LoadingSpinner/> : 'Generate Summary'}
                    </button>
                </div>
                {/* Right side: Summary and actions */}
                <div className="flex flex-col gap-4 min-h-0">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold">Generated Summary</h3>
                        {summary && (
                             <button
                                onClick={() => downloadFile(`${summary.title}\n\n${summary.summary}\n\n${summary.changes.join('\n')}`, `pr_${summary.title.slice(0,10)}.md`, 'text/markdown')}
                                disabled={!summary} 
                                className="btn-primary px-3 py-1 text-sm disabled:bg-gray-400"
                            >
                                Download .md
                           </button>
                        )}
                    </div>
                    <div className="flex-grow bg-surface p-4 border rounded-lg overflow-y-auto">
                        {isLoading && <div className="flex justify-center items-center h-full"><LoadingSpinner/></div>}
                        {error && <p className="text-red-500">{error}</p>}
                        {summary && (
                            <div className="space-y-4">
                                <input type="text" value={summary.title} readOnly className="w-full p-2 bg-background border rounded font-bold"/>
                                <div className="p-2 bg-background border rounded space-y-2">
                                    <h4 className="font-semibold">Summary</h4>
                                    <p className="text-sm">{summary.summary}</p>
                                    <h4 className="font-semibold">Changes</h4>
                                    <ul className="list-disc list-inside text-sm">
                                        {summary.changes.map((c, i) => <li key={i}>{c}</li>)}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                     <button
                        onClick={handleExportToDocs}
                        disabled={isExporting || !summary || !user}
                        className="btn-primary w-full mt-4 flex items-center justify-center gap-2 py-2"
                        title={!user ? "Sign in to export to Google Docs" : !summary ? "Generate summary first" : "Export a full tech spec to Google Docs"}
                    >
                        {isExporting ? <LoadingSpinner/> : <DocumentIcon/>} Export Tech Spec to Docs
                    </button>
                </div>
            </div>
        </div>
    );
};
