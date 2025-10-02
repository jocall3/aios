// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { generateMemeticPayload } from '../../services/PsychoStrategicAI'; // An invented, high-concept service
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { MarkdownRenderer } from '../shared/MarkdownRenderer';
import { SparklesIcon, DocumentTextIcon, ClipboardDocumentIcon } from '../icons';
import type { PsychoEmotionalTarget } from '../../types';

interface MemeticPayload {
  headline: string;
  body: string;
  cognitiveHook: string;
  visualBrief: string;
  emotionalResonanceScore: number; // 0.0 to 1.0
  predictedViralCoefficient: number;
}

const ArchetypeSelector: React.FC<{ value: string; onChange: (val: string) => void }> = ({ value, onChange }) => {
  const archetypes = ["The Innocent", "The Orphan", "The Hero", "The Caregiver", "The Explorer", "The Rebel", "The Lover", "The Creator", "The Jester", "The Sage", "The Magician", "The Ruler"];
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full p-2 bg-background border border-border rounded text-sm">
      {archetypes.map(a => <option key={a} value={a}>{a}</option>)}
    </select>
  );
};

const PsychometricSelector: React.FC<{ value: PsychoEmotionalTarget; onChange: (val: PsychoEmotionalTarget) => void }> = ({ value, onChange }) => {
    return (
        <select value={value} onChange={(e) => onChange(e.target.value as PsychoEmotionalTarget)} className="w-full p-2 bg-background border border-border rounded text-sm">
            <option value="CALM_FOCUS">Calm Focus</option>
            <option value="INHIBITED_CREATIVITY">Inhibited Creativity</option>
            <option value="AGGRESSIVE_EXECUTION">Aggressive Execution</option>
            <option value="DREAMLIKE_EXPLORATION">Dreamlike Exploration</option>
            <option value="ABSOLUTE_SECURITY">Absolute Security</option>
        </select>
    );
};

export const AdCopyGenerator: React.FC = () => {
  const [coreTruth, setCoreTruth] = useState('Our product grants absolute control over complex systems.');
  const [targetArchetype, setTargetArchetype] = useState('The Ruler');
  const [psychometricTarget, setPsychometricTarget] = useState<PsychoEmotionalTarget>('AGGRESSIVE_EXECUTION');
  const [memeticPayload, setMemeticPayload] = useState<MemeticPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { addNotification } = useNotification();

  const handleIgnition = useCallback(async () => {
    setIsLoading(true);
    setMemeticPayload(null);
    try {
      const result = await generateMemeticPayload(coreTruth, targetArchetype, psychometricTarget);
      setMemeticPayload(result);
      addNotification('Memetic Payload Forged.', 'success');
    } catch (error) {
      addNotification(error instanceof Error ? `Crucible Failure: ${error.message}` : 'An unknown crucible error occurred.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [coreTruth, targetArchetype, psychometricTarget, addNotification]);
  
  const handleCopyPayload = () => {
      if (!memeticPayload) return;
      const payloadString = `Headline: ${memeticPayload.headline}\n\nBody:\n${memeticPayload.body}\n\nCognitive Hook: ${memeticPayload.cognitiveHook}\n\nVisual Brief:\n${memeticPayload.visualBrief}`;
      navigator.clipboard.writeText(payloadString);
      addNotification('Payload text copied to clipboard.', 'info');
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
      <header className="mb-6">
        <h1 className="text-3xl font-bold flex items-center"><SparklesIcon /><span className="ml-3">Memetic Payload Generator</span></h1>
        <p className="text-text-secondary mt-1">Forge weaponized narratives, not advertisements. Target the subconscious.</p>
      </header>
      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
        <div className="md:col-span-1 flex flex-col gap-4 bg-surface p-6 border border-border rounded-lg">
          <h3 className="text-xl font-bold">The Crucible</h3>
          <div>
            <label className="text-sm font-medium">Core Truth of Product</label>
            <textarea value={coreTruth} onChange={(e) => setCoreTruth(e.target.value)} className="w-full mt-1 p-2 bg-background border rounded h-24" />
          </div>
          <div>
            <label className="text-sm font-medium">Target Subconscious Archetype</label>
            <ArchetypeSelector value={targetArchetype} onChange={setTargetArchetype} />
          </div>
           <div>
            <label className="text-sm font-medium">Desired Psychometric Impact</label>
            <PsychometricSelector value={psychometricTarget} onChange={setPsychometricTarget} />
          </div>
          <button onClick={handleIgnition} disabled={isLoading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            {isLoading ? <LoadingSpinner /> : 'Ignite Crucible'}
          </button>
        </div>
        <div className="md:col-span-1 flex flex-col bg-surface p-6 border border-border rounded-lg overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-bold">Forged Payload</h3>
                 {memeticPayload && (
                    <button onClick={handleCopyPayload} className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-xs font-semibold rounded-md"><ClipboardDocumentIcon /> Copy Text</button>
                 )}
            </div>
          {isLoading && <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>}
          {memeticPayload && (
            <div className="space-y-6">
                <div>
                    <p className="text-xs font-bold text-primary uppercase tracking-wider">Headline</p>
                    <p className="text-2xl font-serif font-bold mt-1 text-text-primary">{memeticPayload.headline}</p>
                </div>
                 <div>
                    <p className="text-xs font-bold text-primary uppercase tracking-wider">Body</p>
                    <div className="mt-1 text-sm text-text-secondary prose prose-sm max-w-none">
                         <MarkdownRenderer content={memeticPayload.body} />
                    </div>
                </div>
                <div>
                    <p className="text-xs font-bold text-primary uppercase tracking-wider">Cognitive Hook</p>
                    <p className="text-sm italic font-serif mt-1 text-text-primary bg-background p-3 rounded border border-dashed border-border">{memeticPayload.cognitiveHook}</p>
                </div>
                 <div>
                    <p className="text-xs font-bold text-primary uppercase tracking-wider">Visual Brief for Generative AI</p>
                    <pre className="text-xs mt-1 p-3 bg-background rounded border whitespace-pre-wrap font-mono">{memeticPayload.visualBrief}</pre>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                     <div>
                        <p className="text-xs font-bold text-primary uppercase tracking-wider">Emotional Resonance</p>
                         <div className="w-full bg-background rounded-full h-2.5 mt-2 border border-border">
                            <div className="bg-primary h-2.5 rounded-full" style={{ width: `${memeticPayload.emotionalResonanceScore * 100}%` }}></div>
                        </div>
                    </div>
                     <div>
                        <p className="text-xs font-bold text-primary uppercase tracking-wider">Predicted Virality</p>
                        <p className="text-2xl font-bold font-mono text-text-primary mt-1">x{memeticPayload.predictedViralCoefficient.toFixed(2)}</p>
                    </div>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};