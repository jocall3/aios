// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { analyzeKCA, asymptoticRefactor } from '../../services/CodeChromodynamicsAI'; // Invented service
import type { KCAScore, AsymptoticRefactorResult, RefactorAxiom } from '../../types/Chromodynamics'; // Invented types
import { CodeBracketSquareIcon } from '../icons';
import { LoadingSpinner, MarkdownRenderer } from '../shared/LoadingSpinner';

const exampleCode = `// Find all prime numbers up to n
function getPrimes(n) {
  const primes = [];
  for (let i = 2; i <= n; i++) {
    let isPrime = true;
    for (let j = 2; j < i; j++) {
      if (i % j === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) {
      primes.push(i);
    }
  }
  return primes;
}`;

const ScoreGauge: React.FC<{ score: number; label: string }> = ({ score, label }) => {
    const color = score > 80 ? 'text-red-500' : score > 50 ? 'text-yellow-500' : 'text-green-500';
    return (
        <div className="text-center p-2 bg-background rounded-lg border">
            <p className={`text-3xl font-bold font-mono ${color}`}>{score.toFixed(1)}</p>
            <p className="text-xs text-text-secondary">{label}</p>
        </div>
    );
};

export const CodeFormatter: React.FC = () => {
    const [inputCode, setInputCode] = useState<string>(exampleCode);
    const [axiom, setAxiom] = useState<RefactorAxiom>('axiom_of_speed');
    const [initialKCA, setInitialKCA] = useState<KCAScore | null>(null);
    const [refactorResult, setRefactorResult] = useState<AsymptoticRefactorResult | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    
    const handleAnalysisAndRefactor = useCallback(async () => {
        setIsLoading(true);
        setInitialKCA(null);
        setRefactorResult(null);
        try {
            const initialScore = await analyzeKCA(inputCode);
            setInitialKCA(initialScore);
            const result = await asymptoticRefactor(inputCode, axiom);
            setRefactorResult(result);
        } catch (err) { console.error(err); } 
        finally { setIsLoading(false); }
    }, [inputCode, axiom]);
    
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center">
                    <CodeBracketSquareIcon />
                    <span className="ml-3">Code Chromodynamics & Asymptotic Refactor Engine</span>
                </h1>
                <p className="text-text-secondary mt-1">Submit your logic. We will return its platonic ideal.</p>
            </header>
            
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col gap-2 min-h-0">
                    <label className="text-sm font-medium">Source Code Logic</label>
                    <textarea value={inputCode} onChange={e => setInputCode(e.target.value)}
                        className="flex-grow p-2 bg-surface border rounded font-mono text-xs resize-none" />
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                             <label className="text-sm font-medium">Refactoring Axiom</label>
                             <select value={axiom} onChange={e => setAxiom(e.target.value as RefactorAxiom)} className="w-full mt-1 p-2 bg-surface border rounded text-sm">
                                <option value="axiom_of_speed">Axiom of Speed (O(1))</option>
                                <option value="axiom_of_memory">Axiom of Memory (Bitpacking)</option>
                                <option value="axiom_of_elegance">Axiom of Elegance (Point-Free)</option>
                             </select>
                        </div>
                         <button onClick={handleAnalysisAndRefactor} disabled={isLoading} className="btn-primary py-2 px-6 h-10 self-end">
                            {isLoading ? <LoadingSpinner /> : 'Refactor'}
                        </button>
                    </div>
                </div>

                 <div className="flex flex-col gap-2 min-h-0">
                    <h3 className="text-xl font-bold">KCA (K-Complexity & Asymptotic) Analysis</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-surface p-3 rounded-lg border">
                             <p className="text-center font-bold text-sm mb-2">BEFORE</p>
                            {initialKCA ? (
                                <div className="grid grid-cols-3 gap-2">
                                <ScoreGauge score={initialKCA.cyclomatic} label="Cyclomatic" />
                                <ScoreGauge score={initialKCA.cognitive} label="Cognitive" />
                                <Text className="font-mono text-2xl">{initialKCA.bigO}</Text>
                                </div>
                            ) : <p className="text-xs text-text-secondary text-center">Run refactor to analyze</p>}
                        </div>
                        <div className="bg-surface p-3 rounded-lg border">
                            <p className="text-center font-bold text-sm mb-2">AFTER</p>
                            {refactorResult ? (
                                 <div className="grid grid-cols-3 gap-2">
                                    <ScoreGauge score={refactorResult.finalKCA.cyclomatic} label="Cyclomatic" />
                                    <ScoreGauge score={refactorResult.finalKCA.cognitive} label="Cognitive" />
                                    <Text className="font-mono text-2xl">{refactorResult.finalKCA.bigO}</Text>
                                </div>
                            ) : <p className="text-xs text-text-secondary text-center">-</p>}
                        </div>
                    </div>
                     <div className="flex-grow bg-background border rounded-lg p-1 overflow-auto">
                        {isLoading && <div className="h-full w-full flex items-center justify-center"><LoadingSpinner/></div>}
                        {refactorResult && (
                           <>
                           <MarkdownRenderer content={"```javascript\n" + refactorResult.refactoredCode + "\n```"}/>
                           <div className="p-2 border-t mt-2">
                            <h5 className="font-bold text-xs">AI Rationale:</h5>
                            <MarkdownRenderer content={refactorResult.rationale} />
                           </div>
                           </>
                        )}
                     </div>
                 </div>
            </div>
        </div>
    );
};