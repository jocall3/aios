// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback, useMemo, Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three-fiber';
import { Text, Plane, Image as DreiImage } from '@react-three/drei';
import * as THREE from 'three';
import { marked } from 'marked';
import { synthesizeNarrative } from '../../services/NarrativeSynthesisAI'; // Invented
import type { SynthesizedSlide } from '../../types/NarrativeSynthesis'; // Invented
import { PhotoIcon, SparklesIcon } from '../icons';
import { LoadingSpinner } from '../shared';

const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

// --- 3D Presentation Engine ---
const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

const SlidePlane: React.FC<{ slide: SynthesizedSlide; index: number; activeIndex: number; }> = ({ slide, index, activeIndex }) => {
    const groupRef = useRef<THREE.Group>(null);
    const html = useMemo(() => marked.parse(slide.markdownContent), [slide.markdownContent]);

    useFrame(() => {
        if(groupRef.current) {
            const targetX = (index - activeIndex) * 18; // 18 units between slides
            groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.1);
        }
    });

    return (
        <group ref={groupRef}>
            <DreiImage url={slide.backgroundImageUrl} position-z={-0.1} scale={[16,9]} />
            <Plane args={[16, 9]} material-color="#000000" material-opacity={0.2} material-transparent />
             <Html transform zIndexRange={[10,0]} position={[-7.5, 4, 0.1]} style={{ width: '1500px', height: '800px', color: slide.theme.textColor, pointerEvents: 'none'}}>
                 <div className="prose prose-lg" dangerouslySetInnerHTML={{ __html: html as string }}/>
            </Html>
        </group>
    );
};

export const MarkdownSlides: React.FC = () => {
    const [thesis, setThesis] = useState('Our Q3 growth, driven by Project Chimera, has introduced significant, unaddressed technical debt.');
    const [slides, setSlides] = useState<SynthesizedSlide[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const handleSynthesize = useCallback(async () => {
        setIsLoading(true); setSlides([]);
        try {
            const result = await synthesizeNarrative(thesis);
            setSlides(result);
        } finally { setIsLoading(false); }
    }, [thesis]);

    const goToNext = useCallback(() => setCurrentSlide(s => Math.min(s + 1, slides.length - 1)), [slides.length]);
    const goToPrev = useCallback(() => setCurrentSlide(s => Math.max(s - 1, 0)), []);

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><PhotoIcon /><span className="ml-3">Thematic Narrative Synthesizer & Presentation Engine</span></h1>
                <p className="text-text-secondary mt-1">Provide the core thesis. The Engine will forge the narrative, content, and visual theme.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
                <div className="md:col-span-1 flex flex-col gap-3">
                    <h3 className="text-xl font-bold">Core Thesis</h3>
                    <textarea value={thesis} onChange={e=>setThesis(e.target.value)} className="h-24 p-2 bg-surface border rounded" />
                    <button onClick={handleSynthesize} disabled={isLoading} className="btn-primary w-full py-2 flex items-center justify-center gap-2">
                        {isLoading ? <LoadingSpinner/> : <><SparklesIcon/>Synthesize Narrative</>}
                    </button>
                    <div className="flex-grow bg-surface border rounded-lg p-3 min-h-[200px]">
                        <h4 className="font-bold text-sm">Speaker Notes</h4>
                        <div className="text-xs mt-2 overflow-y-auto h-full">
                           <p>{slides[currentSlide]?.speakerNotes}</p>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 flex flex-col min-h-0">
                    <h3 className="text-xl font-bold mb-2">Presentation Manifold</h3>
                     <div className="flex-grow bg-black rounded-lg relative">
                        {isLoading && <div className="absolute inset-0 z-10 flex items-center justify-center"><LoadingSpinner/></div>}
                        {slides.length > 0 && (
                            <Suspense fallback={null}>
                                 <Canvas camera={{ position: [0, 0, 12], fov: 75 }}>
                                    <ambientLight intensity={1.5} />
                                    <pointLight position={[0, 5, 15]} intensity={10}/>
                                     {slides.map((s, i) => <SlidePlane key={s.id} slide={s} index={i} activeIndex={currentSlide} />)}
                                </Canvas>
                            </Suspense>
                        )}
                         <button onClick={goToPrev} disabled={currentSlide === 0} className="absolute left-2 top-1/2 -translate-y-1/2 z-20">◀</button>
                         <button onClick={goToNext} disabled={currentSlide === slides.length - 1} className="absolute right-2 top-1/2 -translate-y-1/2 z-20">▶</button>
                          <div className="absolute bottom-2 right-2 text-xs z-20 bg-black/50 p-1 rounded">{currentSlide + 1} / {slides.length}</div>
                     </div>
                </div>
            </div>
        </div>
    );
};