import React, { useState, useCallback, useMemo } from 'react';
import { estimateCloudCost, synthesizeCostOptimizationPathway } from '../../services/aiService'; // Synthesize function is new but assumed in the existing service file
import { GcpIcon, SparklesIcon, ChartBarIcon } from '../icons';
import { LoadingSpinner, MarkdownRenderer } from '../shared/index';
import { useNotification } from '../../contexts/NotificationContext';

interface CostVector {
    id: string;
    scenario: string;
    totalCost: number;
    breakdown: Record<string, number>;
}

const Treemap: React.FC<{ data: Record<string, number>, total: number }> = ({ data, total }) => {
    // A simplified treemap renderer using flexbox
    const items = useMemo(() => Object.entries(data).sort(([,a], [,b]) => b - a), [data]);
    return (
        <div className="w-full h-48 bg-background border rounded flex p-1 gap-1">
            {items.map(([name, cost], index) => {
                const percentage = (cost / total) * 100;
                return (
                    <div key={name} style={{ width: `${percentage}%` }} 
                         className="h-full bg-primary/20 rounded p-1 flex flex-col justify-end"
                         title={`${name}: $${cost.toFixed(2)} (${percentage.toFixed(1)}%)`}>
                        <p className="text-xs text-text-on-primary truncate font-bold writing-mode-vertical-rl text-orientation-mixed">{name}</p>
                    </div>
                );
            })}
        </div>
    );
};

export const CloudCostEstimator: React.FC = () => {
    const [description, setDescription] = useState('A web app with 2 vCPUs, a 50GB SQL database, and a load balancer in us-central1');
    const [costVectors, setCostVectors] = useState<CostVector[]>([]);
    const [selectedVectorId, setSelectedVectorId] = useState<string | null>(null);
    const [optimizationPathway, setOptimizationPathway] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { addNotification } = useNotification();

    const handleAnalysis = useCallback(async () => {
        setIsLoading(true);
        setCostVectors([]);
        setSelectedVectorId(null);
        setOptimizationPathway('');
        addNotification('Analyzing economic vectors...', 'info');

        try {
            const scenarios = {
                'Baseline': description,
                'High-Availability': `${description}, but geo-redundant across multiple zones`,
                'Cost-Optimized': `${description}, using preemptible / spot instances where possible`,
                'Serverless': `A serverless equivalent of: ${description}, using Cloud Functions and managed databases`
            };
            
            const vectorPromises = Object.entries(scenarios).map(async ([scenario, desc]) => {
                const rawEstimate = await estimateCloudCost(desc);
                // Crude parsing for demo; a real implementation would use structured JSON output
                const totalCostMatch = rawEstimate.match(/Total Estimated Monthly Cost:\s*\$([\d,]+\.\d+)/);
                const totalCost = totalCostMatch ? parseFloat(totalCostMatch[1].replace(/,/g, '')) : 0;
                const breakdownMatches = [...rawEstimate.matchAll(/-\s*(.*?):\s*\$([\d,]+\.\d+)/g)];
                const breakdown = Object.fromEntries(breakdownMatches.map(m => [m[1], parseFloat(m[2].replace(/,/g, ''))]));
                return { id: scenario, scenario, totalCost, breakdown };
            });

            const resolvedVectors = await Promise.all(vectorPromises);
            setCostVectors(resolvedVectors);
            setSelectedVectorId(resolvedVectors[0]?.id);
            addNotification('Economic vectors mapped.', 'success');

            // Generate optimization pathway
            const pathway = await synthesizeCostOptimizationPathway(resolvedVectors);
            setOptimizationPathway(pathway);

        } catch (err) {
            addNotification(err instanceof Error ? err.message : 'Failed to analyze vectors', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [description, addNotification]);
    
    const selectedVector = useMemo(() => {
        return costVectors.find(v => v.id === selectedVectorId);
    }, [costVectors, selectedVectorId]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><GcpIcon /><span className="ml-3">Economic Vector Analysis Dashboard</span></h1>
                <p className="text-text-secondary mt-1">Map the economic possibility space for any given cloud objective.</p>
            </header>
            
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col gap-3">
                    <h3 className="text-xl font-bold">Mission Objective</h3>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} className="h-24 p-2 bg-surface border rounded"/>
                    <button onClick={handleAnalysis} disabled={isLoading} className="btn-primary w-full py-2">
                        {isLoading ? <LoadingSpinner/> : 'Analyze Economic Vectors'}
                    </button>
                     <h3 className="text-xl font-bold mt-2 flex items-center gap-2"><ChartBarIcon/> Cost Decomposition</h3>
                     <div className="flex-grow p-2 bg-surface border rounded-lg min-h-[150px]">
                        {isLoading ? <div className="h-full flex items-center justify-center"><LoadingSpinner/></div> 
                        : selectedVector && <Treemap data={selectedVector.breakdown} total={selectedVector.totalCost} />}
                    </div>
                </div>
                
                <div className="flex flex-col gap-3 min-h-0">
                    <h3 className="text-xl font-bold">Economic Vector Table</h3>
                    <div className="flex-grow bg-surface border rounded-lg overflow-y-auto">
                        <table className="w-full text-sm">
                           <thead><tr className="border-b bg-background"><th className="p-2 text-left">Scenario</th><th className="p-2 text-right">Total Monthly Cost</th></tr></thead>
                            <tbody>
                                {costVectors.map(vector => (
                                    <tr key={vector.id} onClick={() => setSelectedVectorId(vector.id)} className={`cursor-pointer hover:bg-primary/5 ${selectedVectorId === vector.id && 'bg-primary/10'}`}>
                                        <td className="p-2 font-semibold">{vector.scenario}</td>
                                        <td className="p-2 text-right font-mono">${vector.totalCost.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="h-48 flex-shrink-0 flex flex-col">
                         <h3 className="text-xl font-bold flex items-center gap-2 mb-2"><SparklesIcon/> Optimization Pathway</h3>
                         <div className="flex-grow bg-surface border rounded-lg p-3 text-sm overflow-y-auto">
                           <MarkdownRenderer content={optimizationPathway} />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};