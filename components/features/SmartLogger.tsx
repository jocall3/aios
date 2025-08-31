import React, { useState, useCallback, useRef, useEffect } from 'react';
import { instrumentAndRunCode } from '../../services/ExecutionTracerAI'; // Invented, powerful AI service
import type { TraceEvent } from '../../types/ExecutionTracer'; // Invented
import { TerminalIcon, PlayIcon } from '../icons';
import { LoadingSpinner } from '../shared';

const exampleCode = `function processData(data) {
  if (!data || data.length === 0) {
    return [];
  }
  const results = data.filter(item => item.value > 10);
  // Introduce a delay to make visualization visible
  let final = [];
  for(let i=0; i<results.length; i++){
    final.push({ ...results[i], processed: true });
  }
  return final;
}`;


const CodeVisualizer: React.FC<{ code: string; activeLine: number | null; variableState: Record<string, any> }> = ({ code, activeLine, variableState }) => {
    return (
        <div className="relative font-mono text-xs bg-black/80 p-4 rounded-lg h-full overflow-auto">
            {code.split('\n').map((line, index) => {
                const isActive = (index + 1) === activeLine;
                return (
                    <div key={index} className={`relative transition-colors ${isActive ? 'bg-primary/30' : ''}`}>
                        <span className="select-none text-gray-600 w-8 inline-block">{index + 1}</span>
                        <span>{line}</span>
                         {isActive && Object.keys(variableState).length > 0 && (
                            <div className="absolute left-full top-0 ml-2 p-2 bg-surface border rounded-lg text-text-primary z-10 w-64 shadow-lg">
                               <p className="font-bold border-b pb-1 mb-1">Live State</p>
                               {Object.entries(variableState).map(([key, value]) => (
                                   <p key={key}><strong>{key}:</strong> {JSON.stringify(value)}</p>
                               ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export const SmartLogger: React.FC = () => {
    const [code, setCode] = useState(exampleCode);
    const [traceEvents, setTraceEvents] = useState<TraceEvent[]>([]);
    const [currentTraceIndex, setCurrentTraceIndex] = useState(-1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const playbackInterval = useRef<number | null>(null);

    const handleTrace = useCallback(async () => {
        setIsLoading(true);
        setTraceEvents([]);
        setCurrentTraceIndex(-1);
        try {
            const results = await instrumentAndRunCode(code);
            setTraceEvents(results);
        } finally {
            setIsLoading(false);
        }
    }, [code]);

    useEffect(() => {
        if (isPlaying) {
            playbackInterval.current = window.setInterval(() => {
                setCurrentTraceIndex(i => {
                    if (i < traceEvents.length - 1) return i + 1;
                    setIsPlaying(false); // Stop at the end
                    return i;
                });
            }, 300);
        } else {
            if (playbackInterval.current) clearInterval(playbackInterval.current);
        }
        return () => { if (playbackInterval.current) clearInterval(playbackInterval.current) };
    }, [isPlaying, traceEvents.length]);
    
    const activeEvent = traceEvents[currentTraceIndex];

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><TerminalIcon /><span className="ml-3">Dynamic Tracepoint Injection & Live Execution Visualizer</span></h1>
                <p className="text-text-secondary mt-1">Witness your code's execution. Do not read logs; observe the flow of logic and state.</p>
            </header>

            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                 <div className="flex flex-col min-h-0 gap-3">
                     <h3 className="text-xl font-bold">Source Code Logic</h3>
                     <textarea value={code} onChange={e => setCode(e.target.value)}
                               className="flex-grow p-2 bg-surface border rounded font-mono text-xs"/>
                     <button onClick={handleTrace} disabled={isLoading} className="btn-primary w-full py-2">
                        {isLoading ? <LoadingSpinner/> : 'Instrument & Trace Execution'}
                     </button>
                 </div>

                <div className="flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xl font-bold">Live Execution Playback</h3>
                        <div className="flex items-center gap-2">
                             <input type="range" min="0" max={traceEvents.length - 1} value={currentTraceIndex}
                                 onChange={e => setCurrentTraceIndex(parseInt(e.target.value))} disabled={traceEvents.length === 0}/>
                            <button onClick={() => setIsPlaying(p => !p)} disabled={traceEvents.length === 0} className="p-2 bg-surface border rounded">
                                 <PlayIcon/>
                            </button>
                        </div>
                    </div>
                     <div className="flex-grow">
                         {isLoading ? <div className="h-full flex items-center justify-center bg-black/80 rounded-lg"><LoadingSpinner /></div> :
                            <CodeVisualizer code={code} activeLine={activeEvent?.line || null} variableState={activeEvent?.state || {}} />
                         }
                    </div>
                </div>
            </div>
        </div>
    );
};