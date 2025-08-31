import React, { useState, useCallback, useMemo } from 'react';
import { generatePsychographicCohort, runFunnelSimulation } from '../../services/BehavioralEconomicsAI'; // Invented AI Service
import type { PsychographicUser, FunnelStage, FunnelSimulationResult } from '../../types/BehavioralEconomics'; // Invented
import { DocumentTextIcon, UserGroupIcon, PlusIcon, TrashIcon } from '../icons';
import { LoadingSpinner, MarkdownRenderer } from '../shared/LoadingSpinner';

const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

// Simplified Sankey Chart using divs
const FunnelChart: React.FC<{ result: FunnelSimulationResult }> = ({ result }) => {
    const total = result.initialCohortSize;
    let runningTotal = total;
    
    return (
        <div className="w-full h-full flex flex-col justify-around font-mono text-xs">
            {result.stages.map((stage, i) => {
                const dropOff = runningTotal - stage.completions;
                const dropOffPercent = (dropOff / runningTotal) * 100;
                runningTotal = stage.completions;
                const completionWidth = (stage.completions / total) * 100;

                return (
                    <div key={stage.name} className="flex items-center gap-2">
                        <div className="w-24 text-right truncate">{stage.name}</div>
                        <div className="flex-grow h-8 bg-surface rounded flex items-center">
                            <div className="h-full bg-primary rounded-l transition-all duration-500" style={{width: `${completionWidth}%`}} />
                             <div className="h-full bg-yellow-500/50 rounded-r" style={{width: `${(dropOff/total)*100}%`}} title={`Drop-off: ${dropOff} users`}/>
                        </div>
                        <div className="w-24 text-left font-bold">{stage.completions.toLocaleString()}</div>
                    </div>
                )
            })}
        </div>
    )
};

export const UserPersonaGenerator: React.FC = () => {
    const [demographics, setDemographics] = useState('Age: 25-45, tech-savvy, global distribution');
    const [psychographics, setPsychographics] = useState('High price sensitivity, aversion to complex onboarding, values social proof.');
    const [cohortSize, setCohortSize] = useState(10000);
    const [funnel, setFunnel] = useState<FunnelStage[]>([
        { id: 1, name: 'Lands on Page'}, { id: 2, name: 'Clicks Sign Up'}, { id: 3, name: 'Completes Onboarding'}
    ]);
    const [simulation, setSimulation] = useState<FunnelSimulationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSimulate = useCallback(async () => {
        setIsLoading(true); setSimulation(null);
        try {
            const cohort = await generatePsychographicCohort({ demographics, psychographics, size: cohortSize });
            const result = await runFunnelSimulation(cohort, funnel);
            setSimulation(result);
        } finally {
            setIsLoading(false);
        }
    }, [demographics, psychographics, cohortSize, funnel]);
    
    const addStage = () => setFunnel(f => [...f, { id: Date.now(), name: `New Stage ${f.length+1}` }]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><UserGroupIcon /><span className="ml-3">Psychographic Cohort & Behavioral Funnel Simulator</span></h1>
                <p className="text-text-secondary mt-1">Simulate market behavior at scale. Identify and eliminate conversion bottlenecks.</p>
            </header>
             <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-0">
                 <div className="lg:col-span-1 flex flex-col gap-4">
                     <div className="p-4 bg-surface border rounded-lg">
                        <h3 className="font-bold">1. Define Target Cohort</h3>
                         <label className="text-xs mt-2">Demographics</label>
                         <textarea value={demographics} onChange={e => setDemographics(e.target.value)} className="w-full text-xs p-1 bg-background border rounded h-16"/>
                         <label className="text-xs mt-2">Psychographics</label>
                         <textarea value={psychographics} onChange={e => setPsychographics(e.target.value)} className="w-full text-xs p-1 bg-background border rounded h-16"/>
                    </div>
                     <div className="p-4 bg-surface border rounded-lg flex-grow flex flex-col min-h-0">
                         <h3 className="font-bold">2. Define Behavioral Funnel</h3>
                          <div className="flex-grow space-y-2 mt-2 overflow-y-auto">
                            {funnel.map((stage, i) => <div key={stage.id} className="text-sm p-2 bg-background border rounded">{i+1}. {stage.name}</div>)}
                          </div>
                          <button onClick={addStage} className="w-full text-sm mt-2 p-1 bg-background border rounded hover:border-primary hover:text-primary"><PlusIcon /></button>
                     </div>
                      <button onClick={handleSimulate} disabled={isLoading} className="btn-primary w-full py-3">{isLoading ? <LoadingSpinner/> : 'Run Simulation'}</button>
                </div>

                 <div className="lg:col-span-2 flex flex-col gap-3 min-h-0">
                    <h3 className="text-xl font-bold">Funnel Simulation Results</h3>
                    <div className="h-1/2 flex-shrink-0 bg-surface border rounded-lg p-4">
                         {isLoading ? <div className="h-full flex items-center justify-center"><LoadingSpinner/></div> :
                         simulation && <FunnelChart result={simulation}/>
                         }
                    </div>
                    <div className="flex-grow flex flex-col min-h-0 bg-surface border rounded-lg p-4">
                        <h4 className="font-bold text-sm mb-2 flex-shrink-0">AI Bottleneck Analysis</h4>
                        <div className="flex-grow overflow-y-auto">
                         {simulation?.bottleneckAnalysis && (
                           <div className="prose prose-sm max-w-none">
                              <MarkdownRenderer content={simulation.bottleneckAnalysis} />
                               <button className="btn-primary py-1 px-3 mt-4 text-xs">Forge A/B Test for this Bottleneck</button>
                           </div>
                         )}
                        </div>
                    </div>
                </div>

             </div>
        </div>
    );
};