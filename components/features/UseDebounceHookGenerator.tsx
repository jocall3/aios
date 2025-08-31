import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { synthesizePacingHook } from '../../services/TemporalWeaverAI'; // Invented AI Service
import type { PacingStrategyBlueprint } from '../../types/TemporalWeaver'; // Invented Types
import { CodeBracketSquareIcon, ClockIcon } from '../icons';
import { MarkdownRenderer } from '../shared/LoadingSpinner';

const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();

// --- Live Chronodynamic Visualization Component ---
const ChronoVisualizer: React.FC<{ rawEvents: number[]; pacedEvents: number[]; strategy: PacingStrategyBlueprint['strategy'] }> = ({ rawEvents, pacedEvents, strategy }) => {
    return (
        <div className="w-full h-full bg-black rounded p-4 grid grid-cols-2 gap-4">
            <div className="relative border-r border-white/10">
                <p className="absolute top-0 left-0 text-xs font-mono text-red-400">RAW STREAM</p>
                {rawEvents.map(event => <div key={event} className="absolute w-full h-px bg-red-500 animate-fade-out" style={{ top: `${(Date.now() - event) / 20}%`}}></div>)}
            </div>
             <div className="relative">
                 <p className="absolute top-0 left-0 text-xs font-mono text-green-400">PACED STREAM ({strategy})</p>
                 {pacedEvents.map(event => <div key={event} className="absolute w-full h-px bg-green-400 animate-fade-out" style={{ top: `${(Date.now() - event) / 20}%`}}></div>)}
            </div>
             <style>{`.animate-fade-out { animation: fadeOut 2s forwards; } @keyframes fadeOut { to { opacity: 0; } }`}</style>
        </div>
    );
};

export const UseDebounceHookGenerator: React.FC = () => {
    const [blueprint, setBlueprint] = useState<PacingStrategyBlueprint>({
        strategy: 'debounce_trailing',
        delay: 500,
    });
    const [synthesizedCode, setSynthesizedCode] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    
    // Live Demo State
    const demoRef = useRef<HTMLDivElement>(null);
    const [rawEvents, setRawEvents] = useState<number[]>([]);
    const [pacedEvents, setPacedEvents] = useState<number[]>([]);
    
    // This is the LIVE synthesized hook logic, applied for the demo
    const debouncedValueRef = useRef<number>(0);
    useEffect(() => {
        if(blueprint.strategy === 'debounce_trailing') {
            const handler = setTimeout(() => {
                 if (debouncedValueRef.current !== 0) {
                     setPacedEvents(p => [...p, Date.now()]);
                 }
            }, blueprint.delay);
            return () => clearTimeout(handler);
        }
    }, [rawEvents, blueprint]);


    const handleMouseMove = (e: React.MouseEvent) => {
        setRawEvents(p => [...p, Date.now()].slice(-50));
        debouncedValueRef.current = Date.now();
    };

    useEffect(() => {
        const synthesize = async () => {
            setIsLoading(true);
            const code = await synthesizePacingHook(blueprint);
            setSynthesizedCode(code);
            setIsLoading(false);
        };
        synthesize();
    }, [blueprint]);
    
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center">
                    <ClockIcon />
                    <span className="ml-3">Temporal Flow & Stream Pacing Engine</span>
                </h1>
                <p className="text-text-secondary mt-1">Visually design event stream pacing strategies and synthesize the corresponding temporal hooks.</p>
            </header>
            
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                 <div className="flex flex-col gap-3 min-h-0">
                     <h3 className="text-xl font-bold">Pacing Strategy Controls</h3>
                      <div className="grid grid-cols-2 gap-4 p-4 bg-surface border rounded-lg">
                         <div>
                            <label className="text-sm">Pacing Strategy</label>
                            <select value={blueprint.strategy} onChange={e => setBlueprint(p => ({ ...p, strategy: e.target.value as any }))}
                                    className="w-full mt-1 p-2 bg-background border rounded text-xs">
                                <option value="debounce_trailing">Debounce (Trailing Edge)</option>
                                <option value="debounce_leading">Debounce (Leading Edge)</option>
                                <option value="throttle">Throttle</option>
                                <option value="adaptive_throttle">AI Adaptive Throttle</option>
                            </select>
                        </div>
                          <div>
                            <label className="text-sm">Delay / Frequency (ms)</label>
                             <input type="number" step="50" value={blueprint.delay} onChange={e => setBlueprint(p => ({ ...p, delay: parseInt(e.target.value,10) }))}
                                 className="w-full mt-1 p-2 bg-background border rounded text-xs"/>
                          </div>
                      </div>
                     <h3 className="text-xl font-bold mt-2">Live Demo & Visualization</h3>
                      <div ref={demoRef} onMouseMove={handleMouseMove}
                          className="flex-grow bg-surface border rounded-lg overflow-hidden relative"
                      >
                         <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none text-center">
                            <div>
                                <p className="font-bold">MOVE CURSOR RAPIDLY</p>
                                <p className="text-xs text-text-secondary">Observe the stream pacing</p>
                            </div>
                         </div>
                         <ChronoVisualizer rawEvents={rawEvents} pacedEvents={pacedEvents} strategy={blueprint.strategy} />
                      </div>
                </div>
                
                 <div className="flex flex-col min-h-0">
                     <h3 className="text-xl font-bold">Synthesized Temporal Hook</h3>
                      <div className="flex-grow mt-3 bg-background border rounded overflow-auto">
                        {isLoading ? <div className="h-full flex items-center justify-center"><LoadingSpinner/></div> :
                        <MarkdownRenderer content={'```typescript\n' + synthesizedCode + '\n```'} />}
                    </div>
                </div>
            </div>
        </div>
    );
};