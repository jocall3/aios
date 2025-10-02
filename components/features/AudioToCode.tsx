// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { streamAndAnalyzeAudioIntent } from '../../services/NeuralWeaverAI'; // Invented, advanced service
import { MicrophoneIcon } from '../icons';
import { MarkdownRenderer } from '../shared/MarkdownRenderer';

type CognitiveState = 'IDLE' | 'FOCUSED' | 'BRAINSTORMING' | 'FRUSTRATED';

const CognitiveStateIndicator: React.FC<{ state: CognitiveState }> = ({ state }) => {
    const styles: Record<CognitiveState, string> = {
        IDLE: 'bg-gray-500',
        FOCUSED: 'bg-blue-500',
        BRAINSTORMING: 'bg-purple-500',
        FRUSTRATED: 'bg-orange-500',
    };
    return (
        <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full animate-pulse ${styles[state]}`}></div>
            <span className="text-xs font-mono">{state}</span>
        </div>
    );
};

const LiveIntentVisualizer: React.FC<{ probabilities: Record<string, number> }> = ({ probabilities }) => (
    <div className="w-full h-full p-2 flex flex-col justify-end gap-1">
        {Object.entries(probabilities).sort(([, a], [, b]) => a - b).map(([intent, prob]) => (
            <div key={intent} className="w-full bg-surface/50 rounded-full h-4 overflow-hidden border border-border">
                <div className="bg-primary h-full transition-all duration-100" style={{ width: `${prob * 100}%` }} />
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-mono mix-blend-difference text-white">{intent}</span>
            </div>
        ))}
    </div>
);


export const AudioToCode: React.FC = () => {
    const [isListening, setIsListening] = useState(false);
    const [transpiledCode, setTranspiledCode] = useState('');
    const [cognitiveState, setCognitiveState] = useState<CognitiveState>('IDLE');
    const [liveProbabilities, setLiveProbabilities] = useState<Record<string, number>>({});
    const mediaStreamRef = useRef<MediaStream | null>(null);

    const stopListener = useCallback(() => {
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        setIsListening(false);
        setCognitiveState('IDLE');
    }, []);
    
    const startListener = useCallback(async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('Audio context is not available.');
            return;
        }
        setIsListening(true);
        setTranspiledCode('// Awaiting neural input...');
        
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        try {
            const stream = streamAndAnalyzeAudioIntent(mediaStreamRef.current);
            for await (const analysis of stream) {
                if (analysis.type === 'INTERIM_TRANSCRIPT') {
                     // Can display this somewhere if needed
                } else if (analysis.type === 'LIVE_PROBABILITIES') {
                    setLiveProbabilities(analysis.payload);
                    setCognitiveState(analysis.cognitiveState);
                } else if (analysis.type === 'CODE_CHUNK') {
                    setTranspiledCode(prev => prev.replace('// Awaiting neural input...', '') + analysis.payload);
                } else if (analysis.type === 'FINAL_CODE') {
                    setTranspiledCode(analysis.payload);
                }
            }
        } catch(err) {
            setTranspiledCode(`// Transpilation Error: ${err instanceof Error ? err.message : 'Unknown'}`);
            stopListener();
        }
        
    }, [stopListener]);

    const handleToggleListening = () => {
        isListening ? stopListener() : startListener();
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center"><MicrophoneIcon /><span className="ml-3">Neural Weaver: Intent & Intonation Transpiler</span></h1>
                <p className="text-text-secondary mt-1">Speak. Your intent, tone, and cognitive state are transpiled into code.</p>
            </header>

            <div className="flex-grow grid grid-cols-1 md:grid-cols-5 gap-6 min-h-0">
                <div className="md:col-span-2 flex flex-col gap-4">
                    <div className="relative bg-surface p-4 border rounded-lg h-48 flex items-center justify-center">
                        <button
                            onClick={handleToggleListening}
                            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500' : 'bg-primary'}`}
                        >
                            <MicrophoneIcon />
                        </button>
                        <div className="absolute top-3 left-3"><CognitiveStateIndicator state={cognitiveState}/></div>
                        <p className="absolute bottom-3 text-sm text-text-secondary">{isListening ? "Weaver is Active. Speak your intent." : "Weaver Idle."}</p>
                    </div>
                     <div className="bg-surface p-4 border rounded-lg flex-grow flex flex-col">
                        <h3 className="text-lg font-bold flex-shrink-0">Live Intent Analysis</h3>
                        <div className="flex-grow mt-2">
                            <LiveIntentVisualizer probabilities={liveProbabilities} />
                        </div>
                    </div>
                </div>

                <div className="md:col-span-3 flex flex-col h-full min-h-0">
                    <label className="text-sm font-medium mb-2">Transpiled Code Manifest</label>
                    <div className="flex-grow bg-background border border-border rounded-md overflow-y-auto">
                        <MarkdownRenderer content={'```typescript\n' + transpiledCode + '\n```'} />
                    </div>
                </div>
            </div>
        </div>
    );
};