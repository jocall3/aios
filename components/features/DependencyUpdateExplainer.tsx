import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useGlobalState } from '../../contexts/GlobalStateContext';
import { auditDependencyChain, simulateDependencyUpgrade } from '../../services/SupplyChainAI'; // Invented
import type { DependencyReport, UpgradeSimulation } from '../../types/SupplyChain'; // Invented
import { GitBranchIcon, ShieldExclamationIcon, ArrowUpCircleIcon } from '../icons';
import { LoadingSpinner, MarkdownRenderer } from '../shared';

const HealthIndicator: React.FC<{ score: number }> = ({ score }) => {
    const color = score > 0.8 ? 'bg-green-500' : score > 0.5 ? 'bg-yellow-500' : 'bg-red-500';
    return <div className={`w-12 h-2 rounded-full ${color}`} title={`Maintainer Health: ${(score*100).toFixed(0)}%`}></div>;
};

export const DependencyUpdateExplainer: React.FC = () => {
    const { state } = useGlobalState();
    const [report, setReport] = useState<DependencyReport | null>(null);
    const [simulation, setSimulation] = useState<UpgradeSimulation | null>(null);
    const [selectedDependency, setSelectedDependency] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

    const handleAudit = useCallback(async () => {
        if (!state.projectFiles) return; // Need project context
        setIsLoading(p=>({...p, audit:true})); setReport(null); setSimulation(null);
        try {
            const packageJsonContent = ""; // In reality, getFileContent('package.json')
            const lockFileContent = "";   // In reality, getFileContent('package-lock.json')
            const result = await auditDependencyChain(packageJsonContent, lockFileContent);
            setReport(result);
        } finally { setIsLoading(p=>({...p, audit:false})); }
    }, [state.projectFiles]);
    
    const handleSimulate = useCallback(async (depName: string, targetVersion: string) => {
        if (!report) return;
        setSelectedDependency(depName);
        setIsLoading(p=>({...p, sim:true})); setSimulation(null);
        try {
            const dependency = report.dependencies.find(d => d.name === depName);
            const result = await simulateDependencyUpgrade(dependency!, targetVersion);
            setSimulation(result);
        } finally { setIsLoading(p=>({...p, sim:false})); }
    }, [report]);


    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><GitBranchIcon /><span className="ml-3">Dependency Supply Chain & Exploit Forecaster</span></h1>
                <p className="text-text-secondary mt-1">Audit, simulate, and forecast the strategic implications of your software supply chain.</p>
            </header>
             <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 min-h-0">
                <div className="lg:col-span-2 flex flex-col gap-3">
                     <button onClick={handleAudit} disabled={isLoading.audit} className="btn-primary w-full py-2">{isLoading.audit ? <LoadingSpinner/> : 'Audit Live Supply Chain'}</button>
                     <h3 className="font-bold">Dependency Audit</h3>
                     <div className="flex-grow bg-surface border rounded overflow-y-auto">
                        <table className="w-full text-xs">
                           <thead><tr className="bg-background"><th>Package</th><th>Current</th><th>Latest</th><th>Health</th><th>CVEs</th></tr></thead>
                           <tbody>{report?.dependencies.map(dep => (
                               <tr key={dep.name} onClick={()=>handleSimulate(dep.name, dep.latestVersion)} className={`cursor-pointer hover:bg-primary/10 ${selectedDependency===dep.name && 'bg-primary/20'}`}>
                               <td>{dep.name}</td><td>{dep.version}</td><td>{dep.latestVersion}</td>
                               <td><HealthIndicator score={dep.maintainerHealth}/></td><td>{dep.vulnerabilities.length}</td>
                               </tr>
                           ))}</tbody>
                        </table>
                     </div>
                </div>

                <div className="lg:col-span-3 flex flex-col min-h-0">
                    <h3 className="font-bold">Upgrade Simulation & Exploit Forecast</h3>
                    <div className="flex-grow bg-surface border rounded-lg p-3 mt-3">
                         {isLoading.sim && <div className="h-full w-full flex items-center justify-center"><LoadingSpinner/></div>}
                         {simulation && (
                             <div className="h-full flex flex-col gap-3">
                                 <div className="bg-background rounded p-2">
                                     <p className="text-lg font-bold">{simulation.dependencyName}: {simulation.fromVersion} → {simulation.toVersion}</p>
                                 </div>
                                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                                     <div className="p-2 bg-background rounded">Disruption Index: <span className="font-bold text-yellow-400">{simulation.disruptionIndex.toFixed(2)}</span></div>
                                     <div className="p-2 bg-background rounded">Net Security Change: <span className="font-bold text-green-400">+{simulation.securityDelta}</span></div>
                                </div>
                                 <div className="flex-grow flex flex-col min-h-0">
                                     <p className="font-bold text-sm">Predicted Breaking Changes:</p>
                                     <div className="flex-grow bg-background rounded p-2 overflow-y-auto mt-1"><MarkdownRenderer content={simulation.predictedBreakingChanges}/></div>
                                 </div>
                                  <div className="flex-shrink-0 flex flex-col">
                                      <p className="font-bold text-sm">Exploit Forecast:</p>
                                      <p className="text-xs p-2 bg-background border border-yellow-500/50 rounded mt-1">{simulation.exploitForecast}</p>
                                 </div>
                                <button className="btn-primary w-full py-2 mt-2">Forge Upgrade PR</button>
                             </div>
                         )}
                    </div>
                </div>
             </div>
        </div>
    );
};