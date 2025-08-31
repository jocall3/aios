import React, { useState, useCallback, useMemo } from 'react';
import { analyzeGitArchaeology } from '../../services/GitCognitionAI'; // Invented, advanced service
import type { GitArchaeologyReport } from '../../types/GitCognition'; // Invented, structured type
import { GitBranchIcon } from '../icons';
import { LoadingSpinner, MarkdownRenderer } from '../shared/LoadingSpinner';

const exampleLog = `commit 3a4b5c...
tree 1a2b3d...
parent 1a2b3c...
author Dev One <dev.one@example.com> 1721057400 -0400
committer Dev One <dev.one@example.com> 1721057400 -0400

    feat: add user login page

commit 1a2b3c...
tree 2d3e4f...
parent 0z9y8x...
author Dev Two <dev.two@example.com> 1721053200 -0400
committer Dev Two <dev.two@example.com> 1721053200 -0400

    fix: correct typo in header
`;

const MetricCard: React.FC<{ title: string; value: string | number; description: string }> = ({ title, value, description }) => (
    <div className="bg-background p-3 rounded-lg border border-border" title={description}>
        <p className="text-xs text-text-secondary uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold font-mono text-primary">{typeof value === 'number' ? value.toFixed(3) : value}</p>
    </div>
);


export const ChangelogGenerator: React.FC = () => {
    const [log, setLog] = useState(exampleLog);
    const [report, setReport] = useState<GitArchaeologyReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAnalyze = useCallback(async () => {
        setIsLoading(true);
        setReport(null);
        try {
            const result = await analyzeGitArchaeology(log);
            setReport(result);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [log]);

    const TopContributors = ({ data }: {data: Record<string, number>}) => (
        <div>
             <h4 className="font-semibold text-sm mb-2">Commit Gravitational Wells</h4>
             {Object.entries(data).sort(([,a],[,b])=>b-a).slice(0,3).map(([author, commits])=>(
                <div key={author} className="flex justify-between items-center text-xs p-1">
                    <span>{author}</span>
                    <span className="font-mono">{commits} commits</span>
                </div>
             ))}
        </div>
    );
     const KnowledgeSilos = ({ data }: {data: Record<string, string[]>}) => (
        <div>
             <h4 className="font-semibold text-sm mb-2">Knowledge Silo Triangulation</h4>
             {Object.entries(data).slice(0,3).map(([path, authors])=>(
                <div key={path} className="p-2 bg-background border rounded mb-1">
                    <p className="font-mono text-xs truncate">{path}</p>
                    <p className="text-xs text-text-secondary">Owned by: {authors.join(', ')}</p>
                </div>
             ))}
        </div>
    );


    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center">
                    <GitBranchIcon />
                    <span className="ml-3">Git Archaeologist & K/V Tunneler</span>
                </h1>
                <p className="text-text-secondary mt-1">Mine the repository's past to quantify its velocity and predict its future.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-0">
                <div className="lg:col-span-1 flex flex-col gap-4">
                    <div className="flex flex-col flex-1 min-h-0">
                        <label className="text-sm font-medium mb-2">Raw Git Log (`git log --pretty=raw`)</label>
                        <textarea
                            value={log}
                            onChange={(e) => setLog(e.target.value)}
                            className="flex-grow p-2 bg-surface border rounded font-mono text-xs"
                        />
                    </div>
                    <button onClick={handleAnalyze} disabled={isLoading} className="btn-primary w-full py-2">
                        {isLoading ? <LoadingSpinner /> : 'Run Archaeological Dig'}
                    </button>
                </div>

                <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
                    <h3 className="text-xl font-bold">Strategic Dashboard</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                         <MetricCard title="Velocity Index" value={report?.velocityIndex || 0} description="Ratio of 'feat' commits to 'fix/chore' commits."/>
                         <MetricCard title="Merge Entropy" value={report?.mergeEntropy || 0} description="Score based on frequency/complexity of merges."/>
                         <MetricCard title="Bus Factor" value={report?.busFactor || 0} description="Lowest number of developers that would halt the project if they left."/>
                         <MetricCard title="Next Crisis ETA" value={report?.predictedCrisisDate || 'N/A'} description="Predicted date of major integration failure."/>
                    </div>
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
                        <div className="bg-surface border rounded p-3 overflow-y-auto space-y-4">
                            {report && <TopContributors data={report.commitGravityWells}/>}
                            {report && <KnowledgeSilos data={report.knowledgeSilos}/>}
                        </div>
                        <div className="bg-surface border rounded p-3 overflow-y-auto">
                            <h4 className="font-semibold text-sm mb-2">K/V Tunnel Report</h4>
                            <div className="prose prose-sm max-w-none">
                                {report && <MarkdownRenderer content={report.kvTunnelReport}/>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};