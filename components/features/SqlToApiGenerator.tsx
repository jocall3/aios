import React, { useState, useCallback, useMemo, Suspense } from 'react';
import { synthesizeQueryPlane, generateInteractiveDocs } from '../../services/DataOntologyAI'; // Invented AI Service
import type { GeneratedFile, QueryPlane } from '../../types/DataOntology'; // Invented Types
import { ServerStackIcon, ShareIcon } from '../icons';
import { LoadingSpinner, MarkdownRenderer } from '../shared';

// Mocked SwaggerUI for live testbed
const SwaggerUIMock: React.FC<{ spec: any }> = ({ spec }) => (
    <div className="bg-white h-full w-full p-4 text-black overflow-y-auto">
        <h2 className="text-2xl font-bold">{spec.info.title}</h2>
        {Object.entries(spec.paths).map(([path, methods]: [string, any]) => (
            <div key={path} className="my-4">
                <p className="font-mono font-bold text-lg"><span className="text-green-600 font-bold mr-2">{Object.keys(methods)[0].toUpperCase()}</span> {path}</p>
                <p className="text-xs">{methods[Object.keys(methods)[0]].summary}</p>
            </div>
        ))}
    </div>
);

export const SqlToApiGenerator: React.FC = () => {
    const [schema, setSchema] = useState('CREATE TABLE users (id SERIAL PRIMARY KEY, email VARCHAR(255) UNIQUE); CREATE TABLE posts (id SERIAL PRIMARY KEY, author_id INTEGER REFERENCES users(id), title VARCHAR(255));');
    const [target, setTarget] = useState<'rest-express' | 'graphql-apollo'>('rest-express');
    const [queryPlane, setQueryPlane] = useState<QueryPlane | null>(null);
    const [activeTab, setActiveTab] = useState('interactive-docs');
    const [isLoading, setIsLoading] = useState(false);
    
    const handleSynthesize = useCallback(async () => {
        setIsLoading(true); setQueryPlane(null); setActiveTab('interactive-docs');
        try {
            const result = await synthesizeQueryPlane(schema, target);
            setQueryPlane(result);
        } finally { setIsLoading(false); }
    }, [schema, target]);

    const activeFile = useMemo(() => queryPlane?.generatedFiles.find(f => f.filePath === activeTab), [queryPlane, activeTab]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><ServerStackIcon /><span className="ml-3">Data Ontology & Query-Plane Synthesizer</span></h1>
                <p className="text-text-secondary mt-1">Synthesize a complete, intelligent, and secure data access layer from a relational schema.</p>
            </header>

            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 min-h-0">
                <div className="lg:col-span-2 flex flex-col gap-3 min-h-0">
                     <h3 className="text-xl font-bold">1. Input: Database Ontology (SQL DDL)</h3>
                     <textarea value={schema} onChange={e => setSchema(e.target.value)} className="flex-grow p-2 bg-surface border rounded font-mono text-xs"/>
                     <div className="grid grid-cols-2 gap-2">
                        <div>
                             <label className="text-sm">Target Synthesis</label>
                             <select value={target} onChange={e => setTarget(e.target.value as any)} className="w-full mt-1 p-2 bg-surface border rounded text-xs">
                                <option value="rest-express">REST API (Express)</option>
                                <option value="graphql-apollo">GraphQL API (Apollo)</option>
                            </select>
                        </div>
                        <button onClick={handleSynthesize} disabled={isLoading} className="btn-primary py-2 self-end">
                            {isLoading ? <LoadingSpinner/> : 'Synthesize Query Plane'}
                        </button>
                    </div>
                     <h3 className="text-xl font-bold mt-2 flex items-center gap-2"><ShareIcon/>Relational Entity Graph</h3>
                     <div className="flex-grow bg-black border rounded-lg text-white p-2">
                        {queryPlane?.relationalGraph || "Graph will appear after synthesis."}
                    </div>
                </div>

                 <div className="lg:col-span-3 flex flex-col min-h-0">
                     <h3 className="text-xl font-bold mb-2">2. Output: Synthesized Plane</h3>
                      <div className="flex border-b border-border">
                          <button onClick={() => setActiveTab('interactive-docs')} className={`px-4 py-2 text-sm ${activeTab === 'interactive-docs' ? 'bg-background border-b-2 border-primary':''}`}>Interactive Testbed</button>
                          {queryPlane?.generatedFiles.map(file => (
                              <button key={file.filePath} onClick={() => setActiveTab(file.filePath)} className={`px-4 py-2 text-sm ${activeTab === file.filePath ? 'bg-background border-b-2 border-primary':''}`}>
                                {file.filePath}
                              </button>
                          ))}
                      </div>
                       <div className="flex-grow bg-background border border-t-0 rounded-b-md overflow-hidden">
                        {isLoading && <div className="h-full flex items-center justify-center"><LoadingSpinner /></div>}
                        {!isLoading && queryPlane && (
                            activeTab === 'interactive-docs' ? (
                                <SwaggerUIMock spec={queryPlane.interactiveSpec} />
                            ) : (
                                activeFile && <MarkdownRenderer content={'```javascript\n' + activeFile.content + '\n```'} />
                            )
                        )}
                        </div>
                 </div>
            </div>
        </div>
    );
};