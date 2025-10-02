// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TypographyLabIcon, SparklesIcon } from '../icons';
import { forgeTypeface, analyzeReadability } from '../../services/GlyphicSynthesisAI'; // Invented
import type { ForgedTypeface, ReadabilityReport } from '../../types/GlyphicSynthesis'; // Invented
import { LoadingSpinner } from '../shared';

const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

// --- COMPONENTS ---
const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

const AxiomSlider: React.FC<{ label:string, left:string, right:string, value:number, onChange:(v:number)=>void }> = ({label, left, right, value, onChange})=>(
    <div>
        <div className="flex justify-between items-center text-xs"><span className="text-text-secondary">{left}</span><span className="font-bold">{label}</span><span className="text-text-secondary">{right}</span></div>
        <input type="range" min="-1" max="1" step="0.1" value={value} onChange={e=>onChange(parseFloat(e.target.value))} className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer"/>
    </div>
);

const ScoreDisplay: React.FC<{ label: string, score: number }> = ({ label, score }) => (
    <div className="text-center bg-background p-2 rounded-lg border">
        <p className="text-2xl font-bold font-mono text-primary">{(score * 100).toFixed(1)}</p>
        <p className="text-xs text-text-secondary">{label}</p>
    </div>
);


export const TypographyLab: React.FC = () => {
    const [concept, setConcept] = useState('Aggressive Fintech');
    const [axioms, setAxioms] = useState({ tradition: -0.5, seriousness: 0.8, elegance: 0.2 });
    const [forged, setForged] = useState<ForgedTypeface | null>(null);
    const [report, setReport] = useState<ReadabilityReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleForge = useCallback(async () => {
        setIsLoading(true); setForged(null); setReport(null);
        try {
            const typeface = await forgeTypeface(concept, axioms);
            setForged(typeface);

            // Inject the new font into the document
            const styleId = 'forged-typeface-style';
            let styleEl = document.getElementById(styleId);
            if (styleEl) styleEl.remove();
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            styleEl.innerHTML = `
                ${typeface.display.fontFaceCss}
                ${typeface.text.fontFaceCss}
            `;
            document.head.appendChild(styleEl);
            
            // Run analysis after a short delay to allow for rendering
            setTimeout(async () => {
                const readabilityReport = await analyzeReadability(typeface);
                setReport(readabilityReport);
            }, 100);
            
        } finally {
            setIsLoading(false);
        }
    }, [concept, axioms]);
    
    return (
        <div className="h-full flex flex-col p-4 sm-p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><TypographyLabIcon /><span className="ml-3">Semantic Font Forge & Glyphic Synthesizer</span></h1>
                <p className="text-text-secondary mt-1">Forge bespoke, semantically-aware typefaces from first principles.</p>
            </header>
             <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                <div className="lg:col-span-1 flex flex-col gap-4">
                    <div className="bg-surface border p-4 rounded-lg">
                        <h3 className="font-bold">1. Define Core Concept</h3>
                        <input value={concept} onChange={e => setConcept(e.target.value)} className="w-full mt-1 p-2 bg-background border rounded"/>
                    </div>
                    <div className="bg-surface border p-4 rounded-lg space-y-3">
                        <h3 className="font-bold">2. Tune Axiomatic Sliders</h3>
                        <AxiomSlider label="Formality" left="Playful" right="Serious" value={axioms.seriousness} onChange={v=>setAxioms(a=>({...a, seriousness:v}))}/>
                        <AxiomSlider label="Era" left="Futuristic" right="Traditional" value={axioms.tradition} onChange={v=>setAxioms(a=>({...a, tradition:v}))}/>
                        <AxiomSlider label="Style" left="Brutalist" right="Elegant" value={axioms.elegance} onChange={v=>setAxioms(a=>({...a, elegance:v}))}/>
                    </div>
                    <button onClick={handleForge} disabled={isLoading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                        {isLoading ? <LoadingSpinner/> : <><SparklesIcon /> Forge Typeface</>}
                    </button>
                     <div className="bg-surface border rounded-lg p-4 grid grid-cols-2 gap-3">
                         <h3 className="font-bold col-span-2">3. Cognitive Analysis</h3>
                         <ScoreDisplay label="Readability Score" score={report?.cognitiveReadabilityScore || 0}/>
                         <ScoreDisplay label="Legibility Score" score={report?.glyphicLegibilityScore || 0}/>
                     </div>
                </div>
                <div className="lg:col-span-2 bg-background border rounded-lg p-8 overflow-y-auto">
                    {!forged && !isLoading && <div className="h-full flex items-center justify-center text-text-secondary">Awaiting typeface genesis...</div>}
                    {isLoading && <div className="h-full flex items-center justify-center"><LoadingSpinner/></div>}
                    {forged && (
                        <div>
                             <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: forged.display.fontFamily }}>
                                The Quick Brown Fox Jumps Over the Lazy Dog
                            </h2>
                            <p className="text-lg" style={{ fontFamily: forged.text.fontFamily }}>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat.
                            </p>
                            <div className="mt-8 pt-4 border-t">
                                <h4 className="font-bold text-sm">Generated CSS:</h4>
                                <pre className="text-xs bg-surface p-2 rounded mt-2 overflow-auto">
                                    {forged.display.fontFaceCss}\n\n{forged.text.fontFaceCss}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};