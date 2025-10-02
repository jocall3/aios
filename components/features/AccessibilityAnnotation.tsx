// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback } from 'react';
import * as Diff from 'diff';
import { reforgeHtmlForA11y } from '../../services/AccessibilityOntologyAI'; // An invented, far more powerful service
import { EyeIcon, SpeakerWaveIcon, PlayIcon } from '../icons';
import { LoadingSpinner } from '../shared/LoadingSpinner';

const exampleHtml = `<div class="menu-bar">
  <div onclick="select(1)" class="menu-item">Products</div>
  <div onclick="select(2)" class="menu-item-active">Pricing</div>
  <div onclick="select(3)" class="menu-item">Docs</div>
  <input placeholder="Search...">
</div>`;

interface ReforgedPayload {
  reforgedHtml: string;
  cognitiveLoadScore: {
    before: number; // 0.0 to 1.0 (higher is worse)
    after: number;
  };
  screenReaderTranscript: { word: string; htmlId?: string }[];
  focusPath: string[];
}

const OntologicalDiff: React.FC<{ oldCode: string; newCode: string }> = ({ oldCode, newCode }) => {
    const diff = Diff.diffWordsWithSpace(oldCode, newCode);
    return (
        <pre className="whitespace-pre-wrap font-mono text-xs p-2 bg-background rounded-md">
            {diff.map((part, index) => (
                <span key={index} className={part.added ? 'bg-green-500/20' : part.removed ? 'bg-red-500/20 line-through' : ''}>
                    {part.value}
                </span>
            ))}
        </pre>
    );
};

export const AccessibilityAnnotation: React.FC = () => {
  const [html, setHtml] = useState(exampleHtml);
  const [reforgedPayload, setReforgedPayload] = useState<ReforgedPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSpeechWord, setCurrentSpeechWord] = useState<number | null>(null);

  const handleReforge = useCallback(async () => {
    setIsLoading(true);
    setReforgedPayload(null);
    try {
      const result = await reforgeHtmlForA11y(html);
      setReforgedPayload(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [html]);

  const simulateScreenReader = useCallback(() => {
    if (!reforgedPayload) return;
    let wordIndex = 0;
    const utterance = new SpeechSynthesisUtterance();
    utterance.rate = 1.2;
    utterance.onboundary = (event) => {
        if (event.name === 'word') {
             setCurrentSpeechWord(wordIndex++);
        }
    };
     utterance.onend = () => setCurrentSpeechWord(null);

    const fullText = reforgedPayload.screenReaderTranscript.map(t => t.word).join(' ');
    utterance.text = fullText;
    speechSynthesis.speak(utterance);
  }, [reforgedPayload]);

  const CognitiveScoreBar: React.FC<{ before: number; after: number }> = ({ before, after }) => (
      <div className="space-y-1">
        <p className="text-xs">Before: {(before * 100).toFixed(1)}%</p>
        <div className="w-full bg-red-500/20 rounded-full h-2.5"><div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${before * 100}%`}}></div></div>
        <p className="text-xs">After: {(after * 100).toFixed(1)}%</p>
        <div className="w-full bg-green-500/20 rounded-full h-2.5"><div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${after * 100}%` }}></div></div>
      </div>
  );


  return (
    <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
      <header className="mb-6">
        <h1 className="text-3xl font-bold flex items-center"><EyeIcon /><span className="ml-3">A11y-Driven UI Forge</span></h1>
        <p className="text-text-secondary mt-1">Reforge, not just annotate. Re-engineer HTML for total semantic clarity.</p>
      </header>
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col flex-1 min-h-0">
            <label className="text-sm font-medium mb-2">Original Substrate (HTML)</label>
            <textarea value={html} onChange={e => setHtml(e.target.value)} className="flex-grow p-2 bg-surface border rounded font-mono text-xs" />
          </div>
          <button onClick={handleReforge} disabled={isLoading} className="btn-primary w-full py-3">{isLoading ? <LoadingSpinner /> : 'Reforge for A11y'}</button>
          {reforgedPayload && !isLoading && (
              <div className="bg-surface border rounded-lg p-4 space-y-3 animate-pop-in">
                <div>
                  <h4 className="font-bold">Cognitive Load Score</h4>
                  <CognitiveScoreBar before={reforgedPayload.cognitiveLoadScore.before} after={reforgedPayload.cognitiveLoadScore.after} />
                </div>
                <div>
                    <h4 className="font-bold">Kinetic Pathing (Tab Order)</h4>
                    <p className="text-xs font-mono bg-background p-2 rounded">{reforgedPayload.focusPath.join(' → ')}</p>
                </div>
              </div>
          )}
        </div>
        <div className="flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-2">
                 <label className="text-sm font-medium">Reforged Construct & Transcript</label>
                  {reforgedPayload && <button onClick={simulateScreenReader} className="flex items-center gap-1 text-xs px-2 py-1 bg-surface border rounded font-bold"><SpeakerWaveIcon /> Simulate Reader</button>}
            </div>
            {isLoading ? <div className="h-full flex-grow flex items-center justify-center bg-surface border rounded"><LoadingSpinner /></div> : 
             <div className="h-full flex-grow flex flex-col gap-2 min-h-0">
                 <div className="h-3/5 flex-grow overflow-y-auto"><OntologicalDiff oldCode={html} newCode={reforgedPayload?.reforgedHtml || ''} /></div>
                 <div className="h-2/5 flex-grow p-2 bg-background border rounded overflow-y-auto">
                    <p className="text-xs font-bold uppercase tracking-wider mb-2 text-primary">Simulated Screen Reader Transcript</p>
                    {reforgedPayload && (
                        <p className="text-sm">
                            {reforgedPayload.screenReaderTranscript.map((word, index) => (
                                <span key={index} className={currentSpeechWord === index ? 'bg-primary/20 rounded' : ''}>
                                    {word.word}{' '}
                                </span>
                            ))}
                        </p>
                    )}
                 </div>
             </div>
            }
        </div>
      </div>
    </div>
  );
};