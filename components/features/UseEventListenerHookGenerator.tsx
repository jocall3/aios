import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { synthesizeFormFromSchema } from '../../services/FormOntologyAI'; // Invented AI service
import type { SynthesizedForm } from '../../types/FormOntology'; // Invented types
import { CodeBracketSquareIcon } from '../icons';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { MarkdownRenderer } from '../shared/MarkdownRenderer';

const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

// Simplified live validation for the demo.
const runValidation = (schema: string, values: any) => {
    const errors: Record<string, string> = {};
    const rules = schema.split(',').map(s => s.trim());
    for(const rule of rules) {
        const [key, type] = rule.split(':').map(s => s.trim());
        if (!values[key]) errors[key] = "Required";
        else if (type.includes('email') && !/\S+@\S+\.\S+/.test(values[key])) errors[key] = "Invalid email";
        else if (type.includes('min(2)') && values[key].length < 2) errors[key] = "Min 2 chars";
    }
    return errors;
};


export const UseFormHookGenerator: React.FC = () => {
    const [schema, setSchema] = useState("name: string().min(2), email: string().email(), role: enum(['Admin', 'User'])");
    const [synthesis, setSynthesis] = useState<SynthesizedForm | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Live Demo State
    const [formValues, setFormValues] = useState<Record<string, any>>({});
    const validationErrors = useMemo(() => runValidation(schema, formValues), [schema, formValues]);
    
    const handleSynthesis = useCallback(async () => {
        setIsLoading(true);
        setSynthesis(null);
        try {
            const result = await synthesizeFormFromSchema(schema);
            setSynthesis(result);
            // Initialize form state from schema keys
            const initialValues = Object.fromEntries(schema.split(',').map(s => [s.split(':')[0].trim(), '']));
            setFormValues(initialValues);
        } finally {
            setIsLoading(false);
        }
    }, [schema]);

    // Initial synthesis on mount
    useEffect(() => { handleSynthesis() }, [handleSynthesis]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormValues(v => ({ ...v, [e.target.name]: e.target.value }));
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center">
                    <CodeBracketSquareIcon />
                    <span className="ml-3">Form Ontology & Validation Schema Synthesizer</span>
                </h1>
                <p className="text-text-secondary mt-1">Define a data contract. The engine synthesizes the form, hook, and validation schema.</p>
            </header>
            
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col gap-3 min-h-0">
                    <h3 className="text-xl font-bold">1. Define Form Ontology</h3>
                     <div className="flex gap-2">
                        <input value={schema} onChange={e => setSchema(e.target.value)} placeholder="name: string().min(2)..." className="flex-grow p-2 bg-surface border rounded font-mono text-sm"/>
                        <button onClick={handleSynthesis} disabled={isLoading} className="btn-primary px-4 py-2">{isLoading ? <LoadingSpinner/> : 'Synthesize'}</button>
                    </div>
                     <div className="flex-grow flex flex-col min-h-0">
                        <h3 className="text-xl font-bold mt-2">2. Live Demo & Validation</h3>
                         <div className="flex-grow bg-surface border rounded-lg p-4 mt-2">
                             {synthesis?.formComponent ? (
                                <div className="space-y-3">
                                 {Object.keys(formValues).map(key => {
                                    const error = validationErrors[key];
                                    return <div key={key}>
                                        <label className="text-sm capitalize flex justify-between">{key} {error && <span className="text-red-500 text-xs">{error}</span>}</label>
                                        <input name={key} value={formValues[key]} onChange={handleFormChange} className={`w-full p-2 bg-background border rounded mt-1 ${error ? 'border-red-500' : 'border-border'}`}/>
                                     </div>
                                 })}
                                </div>
                             ) : <p className="text-text-secondary text-sm">Form will be synthesized here.</p>}
                         </div>
                    </div>
                </div>

                <div className="flex flex-col min-h-0">
                    <h3 className="text-xl font-bold">3. Synthesized Artifacts</h3>
                     <div className="flex-grow flex flex-col gap-3 mt-2 min-h-0">
                        <div className="h-1/2 flex flex-col">
                            <label className="text-sm font-medium">Synthesized Hook (`useForm.ts`)</label>
                            <div className="flex-grow bg-background border rounded mt-1 overflow-auto"><MarkdownRenderer content={'```typescript\n' + (synthesis?.hookCode || '') + '\n```'} /></div>
                        </div>
                         <div className="h-1/2 flex flex-col">
                            <label className="text-sm font-medium">Synthesized UI Component (`Form.tsx`)</label>
                            <div className="flex-grow bg-background border rounded mt-1 overflow-auto"><MarkdownRenderer content={'```typescript\n' + (synthesis?.formComponent || '') + '\n```'} /></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};