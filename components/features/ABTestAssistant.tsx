import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { generateUIVariantsForGoal } from '../../services/ConversionWarfareAI'; // Invented, advanced service
import { BeakerIcon, PlayIcon, PauseIcon, ArrowPathIcon } from '../icons';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { MarkdownRenderer } from '../shared/MarkdownRenderer';

interface UIVariant {
  id: string;
  code: string;
  description: string;
  predictedConversionRate: number;
}

interface SimulationResult {
  variantId: string;
  impressions: number;
  conversions: number;
  currentRate: number;
}

const PSYCHOMETRIC_PROFILES = [
  'Pragmatic Skimmer', 'Anxious Perfectionist', 'Novelty Seeker', 
  'Trust-Oriented Traditionalist', 'Data-Driven Analyst'
];

export const ABTestAssistant: React.FC = () => {
  const [goal, setGoal] = useState('Get the user to request a demo for a complex enterprise SaaS product.');
  const [psychometricProfile, setPsychometricProfile] = useState(PSYCHOMETRIC_PROFILES[0]);
  const [variants, setVariants] = useState<UIVariant[]>([]);
  const [activeVariant, setActiveVariant] = useState<UIVariant | null>(null);
  const [simulationResults, setSimulationResults] = useState<Record<string, SimulationResult>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const simulationInterval = useRef<NodeJS.Timeout | null>(null);
  const { addNotification } = useNotification();

  const handleGeneration = useCallback(async () => {
    setIsGenerating(true);
    setVariants([]);
    setActiveVariant(null);
    setSimulationResults({});
    if (simulationInterval.current) clearInterval(simulationInterval.current);
    try {
      const result = await generateUIVariantsForGoal(goal, psychometricProfile);
      setVariants(result);
      setActiveVariant(result[0]);
      const initialResults: Record<string, SimulationResult> = {};
      result.forEach(v => {
        initialResults[v.id] = { variantId: v.id, impressions: 0, conversions: 0, currentRate: 0 };
      });
      setSimulationResults(initialResults);
      addNotification(`Generated ${result.length} strategic variants.`, 'success');
    } catch (error) {
      addNotification(error instanceof Error ? error.message : "Variant generation failed", 'error');
    } finally {
      setIsGenerating(false);
    }
  }, [goal, psychometricProfile, addNotification]);

  const runSimulationTick = useCallback(() => {
    setSimulationResults(prevResults => {
      const newResults = { ...prevResults };
      variants.forEach(variant => {
        const result = newResults[variant.id];
        result.impressions += Math.floor(Math.random() * 20) + 5;
        // Simulate conversion based on the AI's predicted rate, with some noise
        const noise = (Math.random() - 0.5) * 0.05; // +/- 2.5% noise
        if (Math.random() < (variant.predictedConversionRate + noise)) {
          result.conversions++;
        }
        result.currentRate = result.impressions > 0 ? (result.conversions / result.impressions) * 100 : 0;
      });
      return newResults;
    });
  }, [variants]);

  const toggleSimulation = () => {
    setIsSimulating(prev => !prev);
  };

  useEffect(() => {
    if (isSimulating) {
      simulationInterval.current = setInterval(runSimulationTick, 100);
    } else {
      if (simulationInterval.current) clearInterval(simulationInterval.current);
    }
    return () => { if (simulationInterval.current) clearInterval(simulationInterval.current) };
  }, [isSimulating, runSimulationTick]);
  
  const winningVariantId = useMemo(() => {
      if (Object.keys(simulationResults).length === 0) return null;
      return Object.values(simulationResults).reduce((winner, current) => current.currentRate > winner.currentRate ? current : winner).variantId;
  }, [simulationResults]);


  return (
    <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
      <header className="mb-6">
        <h1 className="text-3xl font-bold flex items-center"><BeakerIcon /><span className="ml-3">Conversion Warfare Engine</span></h1>
        <p className="text-text-secondary mt-1">Define goal. Target psyche. Simulate victory. Deploy winner.</p>
      </header>

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-0">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-surface p-4 rounded-lg border flex-grow flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium">Conversion Goal</label>
              <textarea value={goal} onChange={(e) => setGoal(e.target.value)} className="w-full mt-1 p-2 bg-background border rounded h-24 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Target Psychometric Profile</label>
              <select value={psychometricProfile} onChange={(e) => setPsychometricProfile(e.target.value)} className="w-full mt-1 p-2 bg-background border rounded text-sm">
                  {PSYCHOMETRIC_PROFILES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <button onClick={handleGeneration} disabled={isGenerating} className="btn-primary w-full py-2 flex items-center justify-center gap-2">{isGenerating ? <LoadingSpinner /> : 'Generate Variants'}</button>
          </div>
          <div className="bg-surface p-4 rounded-lg border flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">Live Simulation</h3>
                <div className="flex gap-2 items-center">
                    <span className="text-xs font-mono">{Object.values(simulationResults).reduce((acc, r) => acc + r.impressions, 0)} Impressions</span>
                    <button onClick={toggleSimulation} disabled={variants.length === 0} className="p-2 bg-background rounded-full disabled:opacity-50">
                        {isSimulating ? <PauseIcon /> : <PlayIcon />}
                    </button>
                </div>
              </div>
              <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                {variants.map(v => {
                    const result = simulationResults[v.id];
                    if (!result) return null;
                    const isWinning = winningVariantId === v.id;
                    return (
                        <div key={v.id} className={`p-2 rounded border-l-4 ${isWinning ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}>
                            <div className="flex justify-between text-xs items-center">
                                <span className="font-bold truncate" title={v.description}>{v.description}</span>
                                <span className={`font-mono font-bold ${isWinning ? 'text-primary' : ''}`}>{result.currentRate.toFixed(2)}%</span>
                            </div>
                        </div>
                    );
                })}
              </div>
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col min-h-0">
            <div className="flex-shrink-0 flex items-center border-b border-border mb-2">
                {variants.map(v => (
                    <button key={v.id} onClick={() => setActiveVariant(v)} className={`px-4 py-2 text-sm truncate ${activeVariant?.id === v.id ? 'font-bold text-primary border-b-2 border-primary' : 'text-text-secondary'}`} title={v.description}>
                        Variant {variants.indexOf(v)+1}
                    </button>
                ))}
            </div>
          <div className="flex-grow bg-background border rounded overflow-hidden">
            {isGenerating ? <div className="h-full flex items-center justify-center"><LoadingSpinner/></div> :
            <iframe
                key={activeVariant?.id}
                srcDoc={`<script src="https://cdn.tailwindcss.com"></script><body class="bg-white"><div class="p-8">${activeVariant?.code || ''}</div></body>`}
                title="Variant Preview"
                sandbox="allow-scripts"
                className="w-full h-full border-0"
             />
            }
          </div>
           <div className="flex-shrink-0 mt-2 bg-surface p-2 border rounded-md">
             <label className="text-xs font-bold text-text-secondary">AI-Generated Code for "{activeVariant?.description || 'N/A'}"</label>
             <div className="w-full max-h-32 overflow-y-auto mt-1">
                {activeVariant && <MarkdownRenderer content={'```html\n' + activeVariant.code + '\n```'}/>}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};