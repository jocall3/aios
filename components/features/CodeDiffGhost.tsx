import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useGlobalState } from '../../contexts/GlobalStateContext';
import { getFileHistory, analyzeSemanticDrift } from '../../services/CodeOntologyAI'; // Invented
import type { FileVersion, SemanticDriftReport } from '../../types/CodeOntology'; // Invented
import { EyeIcon, GitBranchIcon } from '../icons';
import { LoadingSpinner } from '../shared/LoadingSpinner';

const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

// Simplified text-based palimpsest renderer for this context
const PalimpsestRenderer: React.FC<{ versions: FileVersion[], activeIndex: number }> = ({ versions, activeIndex }) => {
    return (
        <div className="relative w-full h-full p-4 bg-black font-mono text-sm overflow-auto">
            {versions.map((version, index) => {
                const isActive = index === activeIndex;
                const distance = Math.abs(activeIndex - index);
                const opacity = isActive ? 1 : Math.max(0, 0.15 - distance * 0.05);
                const color = version.changeType === 'feat' ? 'text-green-300' : version.changeType === 'fix' ? 'text-yellow-300' : 'text-gray-400';
                
                if (opacity <= 0) return null;
                
                return (
                    <pre key={version.sha}
                         className="absolute inset-0 p-4 transition-opacity duration-300"
                         style={{
                             opacity: opacity,
                             color: isActive ? 'white' : color,
                             zIndex: versions.length - distance,
                         }}
                    >
                        {version.content}
                    </pre>
                );
            })}
        </div>
    );
};

export const CodeDiffGhost: React.FC = () => {
    const { state } = useGlobalState();
    const { projectFiles, selectedRepo } = state;
    const [selectedFile, setSelectedFile] = useState('');
    const [fileHistory, setFileHistory] = useState<FileVersion[]>([]);
    const [driftReport, setDriftReport] = useState<SemanticDriftReport | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const availableFiles = useMemo(() => {
        const files: { path: string }[] = [];
        const traverse = (node: any) => {
            if (node.type === 'file') files.push({ path: node.path });
            if (node.children) node.children.forEach(traverse);
        };
        if (projectFiles) traverse(projectFiles);
        return files;
    }, [projectFiles]);

    const handleAnalyze = useCallback(async () => {
        if (!selectedRepo || !selectedFile) return;
        setIsLoading(true);
        setFileHistory([]);
        setDriftReport(null);
        try {
            const history = await getFileHistory(selectedRepo, selectedFile);
            setFileHistory(history);
            setActiveIndex(history.length - 1);
            const report = await analyzeSemanticDrift(history);
            setDriftReport(report);
        } finally {
            setIsLoading(false);
        }
    }, [selectedFile, selectedRepo]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl flex items-center"><EyeIcon /><span className="ml-3">Codebase Palimpsest & Semantic Drift Visualizer</span></h1>
                <p className="text-text-secondary mt-1">Travel through a file's history to witness the echoes of its creation.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
                <div className="md:col-span-1 flex flex-col gap-3">
                    <h3 className="text-xl font-bold">Chronological Controls</h3>
                     <div>
                        <label className="text-sm font-medium">Target File</label>
                        <select value={selectedFile} onChange={e => setSelectedFile(e.target.value)} className="w-full mt-1 p-2 bg-surface border rounded text-sm" disabled={!projectFiles}>
                             <option value="" disabled>{projectFiles ? "Select a file..." : "Load a project first"}</option>
                             {availableFiles.map(f => <option key={f.path} value={f.path}>{f.path}</option>)}
                        </select>
                    </div>
                    <button onClick={handleAnalyze} disabled={isLoading || !selectedFile} className="btn-primary w-full py-2">
                        {isLoading ? <LoadingSpinner/> : 'Ingest History'}
                    </button>
                     <div className="flex-grow bg-surface border rounded-lg p-3 min-h-[200px] flex flex-col">
                         <h4 className="font-semibold text-sm mb-2">Semantic Drift Timeline</h4>
                         {driftReport && (
                            <div className="relative flex-grow">
                                {driftReport.driftScores.map((score, index) => {
                                    const version = fileHistory[index];
                                    const left = `${(index / (fileHistory.length-1)) * 100}%`;
                                    const height = `${score * 80 + 20}%`; // 20-100% height
                                    return <div key={version.sha} className="absolute bottom-0 w-1 bg-red-500 hover:bg-red-300" style={{ left, height, cursor: 'pointer' }} onClick={() => setActiveIndex(index)} title={`Drift: ${(score*100).toFixed(1)}%`}></div>
                                })}
                            </div>
                         )}
                    </div>
                </div>
                
                <div className="md:col-span-2 flex flex-col min-h-0">
                     <h3 className="text-xl font-bold mb-2">Palimpsest View</h3>
                      <div className="flex-grow bg-black rounded-lg border-2 border-primary overflow-hidden">
                        {isLoading && <div className="h-full flex items-center justify-center"><LoadingSpinner/></div>}
                        {!isLoading && fileHistory.length > 0 && <PalimpsestRenderer versions={fileHistory} activeIndex={activeIndex} />}
                      </div>
                       <div className="flex-shrink-0 mt-2">
                           <input type="range" min="0" max={fileHistory.length-1} value={activeIndex} onChange={e => setActiveIndex(parseInt(e.target.value,10))} disabled={fileHistory.length === 0} className="w-full"/>
                            <div className="text-xs text-center font-mono text-text-secondary mt-1">
                               {fileHistory[activeIndex]?.sha.substring(0,12) || '...'}
                            </div>
                       </div>
                </div>
            </div>
        </div>
    );
};