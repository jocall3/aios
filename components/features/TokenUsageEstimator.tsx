// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback, useMemo } from 'react';
import { estimateTokenCount, optimizePromptForTokenomics } from '../../services/TokenomicAI'; // Invented AI Service
import type { TokenomicAnalysis } from '../../types/TokenomicAI'; // Invented types
import { CpuChipIcon, SparklesIcon } from '../icons';
import { LoadingSpinner, MarkdownRenderer } from '../shared/LoadingSpinner';

const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

// --- SELF-CONTAINED MODULES & TYPES ---
const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

// --- The Reforged Component ---
const ModelCostRow: React.FC<{ analysis: TokenomicAnalysis['models'][0] }> = ({ analysis }) => (
    <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs p-2 border-b border-border last:border-b-0">
        <p className="text-left font-sans font-bold">{analysis.modelName}</p>
        <p>{analysis.inputTokens}</p>
        <p className="text-text-secondary">{analysis.predictedOutputTokens}</p>
        <p className="font-bold text-primary">${analysis.totalPredictedCost.toFixed(5)}</p>
    </div>
);

export const TokenUsageEstimator: React.FC = () => {
    const [prompt, setPrompt] = useState('Analyze this user feedback and provide a detailed summary with three actionable engineering tasks: "The new dashboard is okay, but it feels slow to load on mobile, and the charts are hard to read on a small screen. Also, I wish I could export the data to CSV."');
    const [optimizedPrompt, setOptimizedPrompt] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<TokenomicAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState<Record<string,boolean>>({});

    const handleAnalysis = useCallback(async (text: string) => {
        setIsLoading(prev => ({ ...prev, analysis: true }));
        setAnalysis(null);
        try {
            // estimateTokenCount would be a more complex service now
            const result = await estimateTokenCount(text);
            setAnalysis(result);
        } finally { setIsLoading(prev => ({ ...prev, analysis: false })); }
    }, []);

    const handleOptimize = useCallback(async () => {
        setIsLoading(prev => ({ ...prev, optimize: true }));
        setOptimizedPrompt(null);
        try {
            const result = await optimizePromptForTokenomics(prompt);
            setOptimizedPrompt(result.optimalPrompt);
            // Re-run analysis on the new, better prompt
            await handleAnalysis(result.optimalPrompt);
        } finally { setIsLoading(prev => ({ ...prev, optimize: false })); }
    }, [prompt, handleAnalysis]);


    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><CpuChipIcon /><span className="ml-3">Tokenomic Modeling & Prompt Optimization Engine</span></h1>
                <p className="text-text-secondary mt-1">Analyze and optimize the economic and semantic efficiency of LLM interactions.</p>
            </header>

            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col gap-3">
                     <h3 className="text-xl font-bold">Input Prompt</h3>
                     <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
                        className="h-40 p-2 bg-surface border rounded-lg resize-none"/>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleAnalysis(prompt)} disabled={isLoading.analysis} className="btn-primary py-2">
                            {isLoading.analysis ? <LoadingSpinner/> : 'Analyze Tokenomics'}
                        </button>
                        <button onClick={handleOptimize} disabled={isLoading.optimize} className="btn-primary py-2 flex items-center justify-center gap-2">
                            {isLoading.optimize ? <LoadingSpinner/> : <><SparklesIcon /> Synthesize Optimal Prompt</>}
                        </button>
                    </div>

                    {optimizedPrompt && (
                        <div className="flex-grow p-3 bg-surface border rounded-lg min-h-[150px] animate-pop-in">
                            <p className="font-bold text-sm">Synthesized Optimal Prompt:</p>
                            <p className="text-xs italic bg-background p-2 rounded mt-2">{optimizedPrompt}</p>
                            {analysis && <p className="text-xs font-mono mt-2">Noetic Density Score: <span className="font-bold text-green-400">{analysis.noeticDensity.toFixed(3)}</span></p>}
                        </div>
                    )}
                </div>

                <div className="flex flex-col min-h-0">
                    <h3 className="text-xl font-bold">Comparative Cost Analysis</h3>
                     <div className="flex-grow bg-surface border rounded-lg mt-3 flex flex-col">
                        <div className="grid grid-cols-4 gap-2 text-center font-bold text-xs p-2 bg-background rounded-t-lg">
                           <p className="text-left">Model</p>
                           <p>Input Tokens</p>
                           <p>Est. Output</p>
                           <p>Predicted Cost</p>
                        </div>
                        <div className="overflow-y-auto">
                            {isLoading.analysis && <div className="h-48 w-full flex items-center justify-center"><LoadingSpinner/></div>}
                            {analysis?.models.map(modelAnalysis => (
                                <ModelCostRow key={modelAnalysis.modelName} analysis={modelAnalysis}/>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};