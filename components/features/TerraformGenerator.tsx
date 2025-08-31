import React, { useState, useCallback, useMemo } from 'react';
import { ingestCloudState, generateContextAwareTerraform, simulateTerraformPlan } from '../../services/TerraformOracleAI'; // Invented
import type { CloudState, TerraformPlan } from '../../types/TerraformOracle'; // Invented
import { CpuChipIcon, SparklesIcon, ExclamationTriangleIcon } from '../icons';
import { LoadingSpinner, MarkdownRenderer } from '../shared/LoadingSpinner';

const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

// Simplified text-based plan renderer
const PlanRenderer: React.FC<{ plan: TerraformPlan }> = ({ plan }) => {
    const renderLine = (line: string) => {
        if (line.startsWith('+')) return <p className="text-green-400">{line}</p>;
        if (line.startsWith('-')) return <p className="text-red-500">{line}</p>;
        if (line.startsWith('~')) return <p className="text-yellow-400">{line}</p>;
        return <p>{line}</p>;
    };
    return <pre className="font-mono text-xs p-2 bg-black/50 rounded">{plan.rawPlan.split('\n').map(renderLine)}</pre>;
};

export const TerraformGenerator: React.FC = () => {
    const [cloud, setCloud] = useState<'aws' | 'gcp'>('aws');
    const [description, setDescription] = useState('An S3 bucket for static website hosting with CloudFront distribution');
    const [cloudState, setCloudState] = useState<CloudState | null>(null);
    const [generatedConfig, setGeneratedConfig] = useState('');
    const [simulatedPlan, setSimulatedPlan] = useState<TerraformPlan | null>(null);
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

    const handleIngest = useCallback(async () => {
        setIsLoading(p => ({ ...p, state: true }));
        setCloudState(null);
        try {
            const state = await ingestCloudState(cloud);
            setCloudState(state);
        } finally {
            setIsLoading(p => ({ ...p, state: false }));
        }
    }, [cloud]);

    const handleGenerate = useCallback(async () => {
        setIsLoading(p => ({ ...p, generate: true }));
        setGeneratedConfig(''); setSimulatedPlan(null);
        try {
            const config = await generateContextAwareTerraform(cloud, description, cloudState);
            setGeneratedConfig(config);
            
            // Immediately kick off the plan simulation
            setIsLoading(p => ({ ...p, plan: true }));
            const plan = await simulateTerraformPlan(config, cloudState);
            setSimulatedPlan(plan);
        } finally {
            setIsLoading({});
        }
    }, [description, cloud, cloudState]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><CpuChipIcon /><span className="ml-3">Terraform State Oracle & Dry Run Simulator</span></h1>
                <p className="text-text-secondary mt-1">Generate context-aware IaC and simulate its consequences against live cloud state.</p>
            </header>

            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col gap-3 min-h-0">
                    <div className="bg-surface border rounded p-3">
                        <p className="font-bold text-sm">1. Select Provider & Ingest Live State</p>
                        <div className="flex gap-2 mt-2">
                             <select value={cloud} onChange={e => setCloud(e.target.value as 'aws' | 'gcp')} className="w-1/3 p-2 bg-background border rounded">
                                <option value="aws">AWS</option><option value="gcp">GCP</option>
                             </select>
                             <button onClick={handleIngest} disabled={isLoading.state} className="btn-primary flex-grow py-2">{isLoading.state ? <LoadingSpinner/> : "Ingest Live State"}</button>
                        </div>
                    </div>

                    <div className="bg-surface border rounded p-3">
                        <p className="font-bold text-sm">2. Describe Desired Infrastructure</p>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full mt-2 h-20 p-2 bg-background border rounded"/>
                    </div>
                     <button onClick={handleGenerate} disabled={!cloudState || isLoading.generate || isLoading.plan} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                       <SparklesIcon/>{isLoading.generate ? 'Generating HCL...' : isLoading.plan ? 'Simulating Plan...' : 'Generate & Simulate Plan'}
                     </button>
                    
                    <div className="flex-grow bg-surface border rounded-lg p-3 min-h-[150px] overflow-y-auto">
                        <p className="font-bold text-sm mb-2">Generated Terraform (.tf)</p>
                         <div className="p-1 bg-background rounded">
                             <MarkdownRenderer content={'```terraform\n'+generatedConfig+'\n```'}/>
                         </div>
                    </div>
                </div>

                 <div className="flex flex-col gap-3 min-h-0">
                      <h3 className="text-xl font-bold">Simulated `terraform plan`</h3>
                       <div className="flex-grow border rounded-lg overflow-y-auto">
                           {isLoading.plan && <div className="h-full flex items-center justify-center"><LoadingSpinner/></div>}
                           {simulatedPlan && <PlanRenderer plan={simulatedPlan} />}
                      </div>
                       <div className="flex-shrink-0 bg-surface border rounded-lg p-3 space-y-2">
                         <h4 className="font-bold text-sm">Strategic Analysis</h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                             <div className="font-mono p-2 bg-background rounded"><strong>Cost Delta:</strong> <span className="font-bold text-green-400">{simulatedPlan?.costDelta || 'N/A'}</span></div>
                             <div className={`font-mono p-2 rounded ${simulatedPlan?.blastRadius ? 'bg-red-900/80' : 'bg-background'}`}>
                                 <strong className="flex items-center gap-1">{simulatedPlan?.blastRadius && <ExclamationTriangleIcon />} Blast Radius:</strong> 
                                 <span className={simulatedPlan?.blastRadius ? "text-red-400 font-bold" : ""}>{simulatedPlan?.blastRadius || 'None detected.'}</span>
                             </div>
                          </div>
                      </div>
                 </div>
            </div>
        </div>
    );
};