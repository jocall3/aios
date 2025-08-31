import React, { useState, useCallback, useMemo } from 'eact';
import * as Diff from 'diff';
import { realignCodeIdeology } from '../../services/IdeologicalComputationAI'; // Invented, superior service
import type { IdeologicalAlignmentReport } from '../../types/IdeologicalComputation'; // Invented type
import { SparklesIcon } from '../icons';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { MarkdownRenderer } from '../shared/MarkdownRenderer';

const exampleCode = `
class UserManager {
    constructor(api) {
        this.api = api;
        this.users = [];
    }

    async fetchUsers() {
        const data = await this.api.get('/users');
        this.users = data.users;
        this.render();
    }
    
    render() {
        const container = document.getElementById('user-list');
        container.innerHTML = '';
        for (let i = 0; i < this.users.length; i++) {
            const user = this.users[i];
            const el = document.createElement('div');
            el.textContent = user.name;
            container.appendChild(el);
        }
    }
}
`;

type Ideology = 'functional_purity' | 'brutalist_performance' | 'enterprise_solid' | 'ken_thompson_minimalism';

const ideologies: Record<Ideology, string> = {
    functional_purity: 'Functional Purity (Haskell-like)',
    brutalist_performance: 'Brutalist Performance (Carmack-like)',
    enterprise_solid: 'Enterprise SOLID (Java-like)',
    ken_thompson_minimalism: "The Ken Thompson Minimalism (Plan 9-like)"
};

const DiffViewer: React.FC<{ oldCode: string, newCode: string }> = ({ oldCode, newCode }) => {
    const diff = Diff.diffLines(oldCode, newCode, { newlineIsToken: true });
    return (
        <pre className="whitespace-pre-wrap font-mono text-xs w-full h-full">
            {diff.map((part, index) => (
                <div key={index} className={`w-full ${part.added ? 'bg-green-500/10' : part.removed ? 'bg-red-500/10' : ''}`}>
                    <span className="select-none px-2">{part.added ? '+' : part.removed ? '-' : ' '}</span>
                    <span>{part.value}</span>
                </div>
            ))}
        </pre>
    );
};

export const AiStyleTransfer: React.FC = () => {
    const [inputCode, setInputCode] = useState<string>(exampleCode);
    const [targetIdeology, setTargetIdeology] = useState<Ideology>('functional_purity');
    const [alignmentReport, setAlignmentReport] = useState<IdeologicalAlignmentReport | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleRealign = useCallback(async () => {
        setIsLoading(true);
        setAlignmentReport(null);
        try {
            const report = await realignCodeIdeology(inputCode, targetIdeology);
            setAlignmentReport(report);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [inputCode, targetIdeology]);
    
    const deltaColor = useMemo(() => {
        if (!alignmentReport) return 'bg-gray-500';
        const delta = alignmentReport.alignmentDelta;
        if (delta < 0.2) return 'bg-green-500';
        if (delta < 0.6) return 'bg-yellow-500';
        return 'bg-red-500';
    }, [alignmentReport]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><SparklesIcon />
                    <span className="ml-3">Codebase Rosetta Stone & Ideological Re-aligner</span></h1>
                <p className="text-text-secondary mt-1">Select a coding ideology. We will rewrite history.</p>
            </header>
            <div className="flex-grow grid grid-cols-2 gap-4 min-h-0">
                <div className="flex flex-col gap-2 min-h-0">
                    <label className="text-sm font-medium">Source Code Substrate</label>
                    <textarea value={inputCode} onChange={(e) => setInputCode(e.target.value)}
                        className="flex-grow p-2 bg-surface border rounded font-mono text-xs resize-none" />
                    <div className="flex gap-2 items-end">
                        <div className="flex-grow">
                             <label className="text-sm font-medium">Target Ideology</label>
                             <select value={targetIdeology} onChange={(e) => setTargetIdeology(e.target.value as Ideology)} className="w-full mt-1 p-2 bg-surface border rounded text-sm">
                                {Object.entries(ideologies).map(([key, name]) => <option key={key} value={key}>{name}</option>)}
                             </select>
                        </div>
                        <button onClick={handleRealign} disabled={isLoading} className="btn-primary py-2 px-6 h-10 flex items-center justify-center">
                            {isLoading ? <LoadingSpinner /> : 'Re-align'}
                        </button>
                    </div>
                </div>
                
                <div className="flex flex-col gap-2 min-h-0">
                   <div className="flex justify-between items-center">
                        <label className="text-sm font-medium">Ideologically Aligned Output</label>
                        {alignmentReport && (
                            <div className="flex items-center gap-2" title="Alignment Delta: How much the code was rewritten.">
                                <span className="text-xs font-mono">DELTA</span>
                                <div className="w-24 bg-background rounded-full h-2.5 border"><div className={`${deltaColor} h-2.5 rounded-full`} style={{ width: `${alignmentReport.alignmentDelta * 100}%` }}></div></div>
                            </div>
                        )}
                   </div>
                   <div className="flex-grow p-1 bg-background border rounded overflow-auto">
                     {isLoading && <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>}
                     {!isLoading && alignmentReport && <DiffViewer oldCode={inputCode} newCode={alignmentReport.realignedCode} />}
                   </div>
                   <div className="h-40 flex-shrink-0">
                        <label className="text-sm font-medium">Rationale Manifest</label>
                        <div className="w-full h-full p-2 bg-surface border rounded overflow-y-auto mt-1">
                             {alignmentReport && <MarkdownRenderer content={alignmentReport.rationaleManifest} />}
                        </div>
                   </div>
                </div>
            </div>
        </div>
    );
};