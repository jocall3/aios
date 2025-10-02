// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback, useMemo } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { inferAndModelData, synthesizeCodeFromModel } from '../../services/DataOntologyAI'; // Invented AI
import type { DataOntologyModel, SynthesisTarget } from '../../types/DataOntology'; // Invented
import { ArrowPathIcon, CodeBracketSquareIcon } from '../icons';
import { LoadingSpinner, MarkdownRenderer } from '../shared';

const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

// --- COMPONENTS ---
const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

const OntologyVisualizer: React.FC<{ model: DataOntologyModel | null }> = ({ model }) => (
    <div className="bg-background border rounded p-2 h-full overflow-y-auto">
        <h4 className="font-bold text-sm">Inferred Ontology (Schema)</h4>
        {model && (
            <pre className="text-xs font-mono text-primary mt-2">
                {JSON.stringify(model.schema, null, 2)}
            </pre>
        )}
    </div>
);

export const DataTransformer: React.FC = () => {
    const [input, setInput] = useState(`[{"id":1, "name":"Alice", "active":true}, {"id":2, "name":"Bob", "active":false}]`);
    const [model, setModel] = useState<DataOntologyModel | null>(null);
    const [target, setTarget] = useState<SynthesisTarget>({ language: 'typescript', representation: 'type_definition' });
    const [output, setOutput] = useState('');
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

    const handleInferAndSynthesize = useCallback(async () => {
        setIsLoading({ infer: true, synth: true });
        try {
            const inferredModel = await inferAndModelData(input);
            setModel(inferredModel);
            const synthesizedCode = await synthesizeCodeFromModel(inferredModel, target);
            setOutput(synthesizedCode);
        } finally {
            setIsLoading({});
        }
    }, [input, target]);
    
    // Re-synthesize when target changes
    useEffect(() => {
        const reSynth = async () => {
            if (!model) return;
            setIsLoading(p => ({ ...p, synth: true }));
            try {
                const synthesizedCode = await synthesizeCodeFromModel(model, target);
                setOutput(synthesizedCode);
            } finally { setIsLoading(p => ({ ...p, synth: false })); }
        };
        reSynth();
    }, [target, model]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><ArrowPathIcon /><span className="ml-3">Universal Data & Code Synthesizer</span></h1>
                <p className="text-text-secondary mt-1">Ingest any data structure, model its ontology, and synthesize idiomatic code in any language.</p>
            </header>

            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                 <div className="flex flex-col gap-3 min-h-0">
                     <h3 className="text-xl font-bold">1. Input Data</h3>
                     <textarea value={input} onChange={e => setInput(e.target.value)} onBlur={handleInferAndSynthesize} className="flex-grow p-2 bg-surface border rounded font-mono text-xs"/>
                     <div className="grid grid-cols-2 gap-2">
                        <div>
                             <label className="text-sm">Target Language</label>
                             <select value={target.language} onChange={e => setTarget(t => ({...t, language: e.target.value as any}))} className="w-full mt-1 p-2 bg-surface border rounded text-xs">
                                 <option value="typescript">TypeScript</option><option value="python">Python</option><option value="go">Go</option><option value="rust">Rust</option>
                             </select>
                        </div>
                        <div>
                             <label className="text-sm">Representation</label>
                              <select value={target.representation} onChange={e => setTarget(t => ({...t, representation: e.target.value as any}))} className="w-full mt-1 p-2 bg-surface border rounded text-xs">
                                 <option value="type_definition">Type Definition</option><option value="data_initialization">Data Initialization</option><option value="orm_model">ORM Model</option>
                             </select>
                        </div>
                     </div>
                 </div>
                 
                 <div className="flex flex-col gap-3 min-h-0">
                    <h3 className="text-xl font-bold">2. Inferred Ontology & 3. Synthesized Code</h3>
                     <div className="h-1/3 flex-shrink-0">
                         {isLoading.infer ? <div className="h-full flex items-center justify-center bg-background rounded"><LoadingSpinner/></div> : <OntologyVisualizer model={model}/>}
                    </div>
                     <div className="flex-grow bg-background border rounded overflow-hidden">
                        {isLoading.synth ? <div className="h-full flex items-center justify-center"><LoadingSpinner/></div> : <MarkdownRenderer content={'```'+target.language+'\n' + output + '\n```'}/>}
                    </div>
                 </div>

            </div>
        </div>
    );
};