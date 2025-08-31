import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { synthesizeHook, transpileAST } from '../../services/MetaprogrammingAI'; // Invented, powerful service
import type { HookBlueprint, AbstractSyntaxTree } from '../../types/Metaprogramming'; // Invented types
import { CodeBracketSquareIcon, CubeIcon } from '../icons';
import { MarkdownRenderer } from '../shared/MarkdownRenderer';

const ASTNode: React.FC<{ node: AbstractSyntaxTree, level?: number }> = ({ node, level = 0 }) => (
    <div style={{ marginLeft: `${level * 16}px` }}>
        <p className="text-xs font-mono"><span className="text-purple-400">{node.type}</span>: {node.name}</p>
        {node.children && node.children.map((child, i) => <ASTNode key={i} node={child} level={level + 1} />)}
    </div>
);

export const UseLocalStorageHookGenerator: React.FC = () => {
    const [blueprint, setBlueprint] = useState<HookBlueprint>({
        name: 'usePersistentState',
        stateSource: 'localStorage',
        dataType: 'JSON.stringify<T>',
        enableSsr: true,
        syncTabs: false,
        addReset: true,
    });
    
    const [synthesized, setSynthesized] = useState<{ ast: AbstractSyntaxTree, code: string } | null>(null);
    
    const handleBlueprintChange = <K extends keyof HookBlueprint>(key: K, value: HookBlueprint[K]) => {
        setBlueprint(prev => ({ ...prev, [key]: value }));
    };

    useEffect(() => {
        const transpile = async () => {
            const ast = await synthesizeHook(blueprint);
            const code = await transpileAST(ast);
            setSynthesized({ ast, code });
        };
        transpile();
    }, [blueprint]);
    
    // Live demo state, needs to be dynamic based on blueprint in a real scenario
    const [demoValue, setDemoValue] = useState('Live Demo Value');

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center">
                    <CodeBracketSquareIcon />
                    <span className="ml-3">Hook Synthesis & Metaprogramming Lathe</span>
                </h1>
                <p className="text-text-secondary mt-1">Define behavioral axioms. The engine synthesizes the corresponding state primitive.</p>
            </header>
            
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-0">
                <div className="lg:col-span-1 flex flex-col gap-3">
                    <h3 className="text-xl font-bold">Axiom Controls</h3>
                    <div className="bg-surface border rounded-lg p-4 space-y-3">
                        <div>
                            <label className="text-sm">State Source</label>
                            <select value={blueprint.stateSource} onChange={e => handleBlueprintChange('stateSource', e.target.value as any)}
                                    className="w-full mt-1 p-2 bg-background border rounded text-xs">
                                <option>localStorage</option><option>sessionStorage</option><option>URLQueryParam</option>
                            </select>
                        </div>
                         <label className="text-sm flex items-center justify-between"><span>SSR Safe</span><input type="checkbox" checked={blueprint.enableSsr} onChange={e=>handleBlueprintChange('enableSsr', e.target.checked)}/></label>
                         <label className="text-sm flex items-center justify-between"><span>Sync Across Tabs</span><input type="checkbox" checked={blueprint.syncTabs} onChange={e=>handleBlueprintChange('syncTabs', e.target.checked)}/></label>
                         <label className="text-sm flex items-center justify-between"><span>Add Reset Function</span><input type="checkbox" checked={blueprint.addReset} onChange={e=>handleBlueprintChange('addReset', e.target.checked)}/></label>
                    </div>
                     <div className="bg-surface border rounded-lg p-4 flex-grow flex flex-col min-h-0">
                         <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><CubeIcon/> Live AST Visualization</h4>
                         <div className="flex-grow bg-black/80 rounded p-2 text-white overflow-y-auto">
                            {synthesized?.ast && <ASTNode node={synthesized.ast} />}
                         </div>
                    </div>
                </div>

                 <div className="lg:col-span-2 flex flex-col min-h-0 gap-3">
                    <h3 className="text-xl font-bold">Synthesized Code & Live Demo</h3>
                     <div className="flex-grow flex flex-col min-h-0">
                        <div className="h-2/3 flex-grow p-1 bg-background border rounded overflow-y-auto">
                            <MarkdownRenderer content={'```typescript\n' + (synthesized?.code || '// Synthesizing...') + '\n```'} />
                        </div>
                        <div className="h-1/3 flex-shrink-0 p-4 bg-surface border rounded mt-3">
                             <label className="text-sm font-medium mb-2">Dynamically Generated Demo</label>
                            <input type="text" value={demoValue} onChange={e => setDemoValue(e.target.value)}
                                className="w-full p-2 bg-background border rounded"
                            />
                            <p className="text-xs text-text-secondary mt-2">
                                State is currently backed by: <strong>{blueprint.stateSource}</strong>. {blueprint.syncTabs && "Tab sync is active."}
                            </p>
                        </div>
                    </div>
                 </div>

            </div>
        </div>
    );
};