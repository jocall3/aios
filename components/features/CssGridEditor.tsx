import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { synthesizeGridLayout } from '../../services/LayoutCognitionAI'; // Invented AI Service
import type { LayoutAxiom, ContentItem, GridLayoutSolution } from '../../types/LayoutCognition'; // Invented
import { CodeBracketSquareIcon, SparklesIcon, PlusIcon, TrashIcon } from '../icons';
import { LoadingSpinner } from '../shared/LoadingSpinner';

const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

// --- COMPONENTS ---
const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

const FluxingContent: React.FC<{ item: ContentItem; isFluxing: boolean }> = ({ item, isFluxing }) => {
    const [textLength, setTextLength] = useState(1);
    
    useEffect(() => {
        if(isFluxing && item.type.startsWith('text')) {
            const interval = setInterval(() => setTextLength(Math.random()), 1500);
            return () => clearInterval(interval);
        }
    }, [isFluxing, item.type]);
    
    const baseClasses = "border-2 border-dashed border-primary/50 flex items-center justify-center text-primary text-xs";
    if (item.type === 'image') return <div className={`${baseClasses} bg-primary/10`}>IMAGE ({item.size})</div>
    if (item.type === 'interactive') return <button className={`${baseClasses} bg-primary/20 w-full h-full`}>INTERACTIVE</button>
    
    const textContent = useMemo(() => {
        if (item.size === 'small') return "Lorem ipsum.";
        if (item.size === 'medium') return "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
        return "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";
    }, [item.size]);
    
    return <div className={`${baseClasses} bg-primary/5 p-2 overflow-hidden`}>{textContent.substring(0, Math.floor(textContent.length * textLength))}</div>
};


export const CssGridEditor: React.FC = () => {
    const [content, setContent] = useState<ContentItem[]>([
        { id: 1, type: 'text', size: 'large' }, { id: 2, type: 'image', size: 'portrait' }, { id: 3, type: 'interactive', size: 'small' }
    ]);
    const [axiom, setAxiom] = useState<LayoutAxiom>('hierarchical_order');
    const [solution, setSolution] = useState<GridLayoutSolution | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFluxing, setIsFluxing] = useState(false);

    const handleSynthesize = useCallback(async () => {
        setIsLoading(true); setSolution(null);
        try {
            const result = await synthesizeGridLayout(content, axiom);
            setSolution(result);
        } finally { setIsLoading(false); }
    }, [content, axiom]);

    const addContent = (type: ContentItem['type'], size: ContentItem['size']) => {
        setContent(c => [...c, { id: Date.now(), type, size }]);
    }
    
    const gridStyle = useMemo(() => {
        if (!solution) return {};
        return {
            display: 'grid',
            gridTemplateAreas: solution.gridTemplateAreas,
            gridTemplateColumns: solution.gridTemplateColumns,
            gridTemplateRows: solution.gridTemplateRows,
            gap: `${solution.gap}rem`,
            height: '100%', width: '100%',
            transition: 'all 0.5s ease-in-out'
        };
    }, [solution]);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><CodeBracketSquareIcon /><span className="ml-3">Adaptive Layout & Content-Flux Simulator</span></h1>
                <p className="text-text-secondary mt-1">Define content and intent. The engine forges and stress-tests the optimal grid structure.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                <div className="lg:col-span-1 flex flex-col gap-3 min-h-0">
                    <div className="bg-surface border p-4 rounded-lg">
                        <h3 className="font-bold">1. Define Content Manifest</h3>
                        <div className="space-y-1 mt-2 text-xs h-32 overflow-y-auto">
                            {content.map(c => <div key={c.id} className="flex justify-between items-center p-1 bg-background rounded"><span>{c.type} ({c.size})</span><button onClick={()=>setContent(ct=>ct.filter(i=>i.id!==c.id))}><TrashIcon/></button></div>)}
                        </div>
                        <div className="grid grid-cols-3 gap-1 mt-1 text-xs">
                             <button onClick={()=>addContent('text', 'medium')} className="p-1 bg-background border rounded hover:bg-gray-100">+ Text</button>
                             <button onClick={()=>addContent('image', 'landscape')} className="p-1 bg-background border rounded hover:bg-gray-100">+ Image</button>
                             <button onClick={()=>addContent('interactive', 'small')} className="p-1 bg-background border rounded hover:bg-gray-100">+ Button</button>
                        </div>
                    </div>
                     <div className="bg-surface border p-4 rounded-lg">
                        <h3 className="font-bold">2. Select Layout Axiom</h3>
                         <select value={axiom} onChange={e=>setAxiom(e.target.value as any)} className="w-full mt-1 p-2 bg-background border rounded">
                            <option value="hierarchical_order">Hierarchical Order</option><option value="information_density">Information Density</option><option value="golden_ratio">Golden Ratio</option><option value="brutalist_impact">Brutalist Impact</option>
                         </select>
                     </div>
                      <button onClick={handleSynthesize} disabled={isLoading} className="btn-primary w-full py-2 flex items-center justify-center gap-2"><SparklesIcon/>{isLoading?<LoadingSpinner/>:"Synthesize Layout"}</button>
                     <div className="flex-grow bg-surface border p-4 rounded-lg overflow-y-auto min-h-[150px]">
                        <h3 className="font-bold">Generated CSS</h3>
                        <div className="p-1 bg-background rounded mt-2"><MarkdownRenderer content={'```css\n'+(solution?.css||'')+'\n```'}/></div>
                     </div>
                </div>
                <div className="lg:col-span-2 flex flex-col min-h-0">
                     <div className="flex justify-between items-center mb-2">
                         <h3 className="font-bold">Layout Crucible & Flux Simulator</h3>
                         <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isFluxing} onChange={()=>setIsFluxing(!isFluxing)}/> Flux Content</label>
                     </div>
                     <div className="flex-grow bg-background rounded-lg p-4 border-2 border-dashed border-border">
                         <div style={gridStyle}>
                            {isLoading && <div className="absolute inset-0 flex items-center justify-center"><LoadingSpinner/></div>}
                            {solution && content.map(item => (
                                <div key={item.id} style={{ gridArea: `item${item.id}` }}>
                                    <FluxingContent item={item} isFluxing={isFluxing} />
                                </div>
                            ))}
                         </div>
                     </div>
                </div>
            </div>
        </div>
    );
};