// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useMemo } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { SparklesIcon, CpuChipIcon } from '../icons';
import { getSimulatedResponses } from '../../services/AxiomSimulationAI'; // Invented

type AxiomMatrix = {
    pragmatism: number; // -1 (Idealist) to 1 (Pragmatist)
    risk: number;       // -1 (Averse) to 1 (Gambit)
    data: number;       // -1 (Intuitive) to 1 (Data-Driven)
    clarity: number;    // -1 (Dense) to 1 (Clear)
};

interface SimulatedResponse {
    persona: string;
    response: string;
}

const AxiomSlider: React.FC<{
    label: string;
    left: string;
    right: string;
    value: number;
    onChange: (val: number) => void;
}> = ({ label, left, right, value, onChange }) => (
    <div>
        <div className="flex justify-between items-center text-xs text-text-secondary">
            <span>{left}</span>
            <span className="font-bold text-text-primary">{label}</span>
            <span>{right}</span>
        </div>
        <input
            type="range" min="-1" max="1" step="0.1" value={value}
            onChange={e => onChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
    </div>
);

const PsychometricVisualizer: React.FC<{ matrix: AxiomMatrix }> = ({ matrix }) => {
    // Simple 2D Radar chart for this implementation
    const points = useMemo(() => {
        const size = 50;
        const center = size / 2;
        const p1 = `${center + matrix.clarity * center},${center - 0}`; // Clarity on X+
        const p2 = `${center + 0},${center - matrix.pragmatism * center}`; // Pragmatism on Y-
        const p3 = `${center - matrix.data * center},${center - 0}`; // Data on X-
        const p4 = `${center + 0},${center + matrix.risk * center}`; // Risk on Y+
        return `${p1} ${p2} ${p3} ${p4}`;
    }, [matrix]);

    return (
        <svg viewBox="0 0 50 50" className="w-full h-full">
            <line x1="25" y1="0" x2="25" y2="50" stroke="var(--color-border)" strokeWidth="0.5" />
            <line x1="0" y1="25" x2="50" y2="25" stroke="var(--color-border)" strokeWidth="0.5" />
            <polygon points={points} fill="rgba(var(--color-primary-rgb), 0.5)" stroke="var(--color-primary)" strokeWidth="1" />
        </svg>
    );
};

export const EngineAxiomConfigurator: React.FC = () => {
    const [matrix, setMatrix] = useLocalStorage<AxiomMatrix>('engine_axiom_matrix', {
        pragmatism: 0.5,
        risk: -0.2,
        data: 0.8,
        clarity: 0.5,
    });
    
    const [simCommand, setSimCommand] = useState('Design a database schema for a social media app.');
    const [simResponses, setSimResponses] = useState<SimulatedResponse[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const updateMatrix = (key: keyof AxiomMatrix, value: number) => {
        setMatrix(prev => ({...prev, [key]: value }));
    };

    const handleSimulate = async () => {
        setIsLoading(true);
        const responses = await getSimulatedResponses(simCommand, matrix);
        setSimResponses(responses);
        setIsLoading(false);
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 text-text-primary">
            <header className="mb-4">
                <h1 className="text-3xl font-bold flex items-center">
                    <CpuChipIcon />
                    <span className="ml-3">Psycho-Heuristic Configuration Matrix</span>
                </h1>
                <p className="text-text-secondary mt-1">Fine-tune the core behavioral axioms of the Reality Engine's AI.</p>
            </header>
            
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                <div className="flex flex-col gap-6">
                    <div className="p-4 bg-surface border rounded-lg space-y-4">
                        <AxiomSlider label="Disposition" left="Idealistic" right="Pragmatic" value={matrix.pragmatism} onChange={v => updateMatrix('pragmatism', v)} />
                        <AxiomSlider label="Strategy" left="Risk-Averse" right="High-Yield Gambit" value={matrix.risk} onChange={v => updateMatrix('risk', v)} />
                        <AxiomSlider label="Reasoning" left="Intuitive Leap" right="Data-Driven" value={matrix.data} onChange={v => updateMatrix('data', v)} />
                        <AxiomSlider label="Communication" left="Information-Dense" right="Clarity-Focused" value={matrix.clarity} onChange={v => updateMatrix('clarity', v)} />
                    </div>
                    <div className="p-4 bg-surface border rounded-lg flex-grow flex flex-col">
                        <h3 className="font-bold text-center mb-2">Live Psychometric Profile</h3>
                        <div className="flex-grow w-full h-full max-w-xs mx-auto">
                            <PsychometricVisualizer matrix={matrix}/>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col min-h-0 gap-3">
                     <h3 className="font-bold">Command Simulation Sandbox</h3>
                     <div className="flex gap-2">
                        <input type="text" value={simCommand} onChange={e => setSimCommand(e.target.value)} className="flex-grow p-2 bg-surface border rounded text-sm"/>
                        <button onClick={handleSimulate} disabled={isLoading} className="btn-primary px-4 py-2">{isLoading ? <LoadingSpinner/> : 'Simulate'}</button>
                    </div>
                     <div className="flex-grow p-3 bg-background border rounded overflow-y-auto space-y-4">
                        {simResponses.map((res, i) => (
                            <div key={i} className="bg-surface p-3 border rounded-lg">
                                <p className="font-bold text-sm text-primary">{res.persona}</p>
                                <p className="text-xs mt-1">{res.response}</p>
                            </div>
                        ))}
                     </div>
                </div>
            </div>
        </div>
    );
};