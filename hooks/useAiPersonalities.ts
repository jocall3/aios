// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { SystemPrompt } from '../types';
import { fetchFoundationalEngrams, refineEngramWithInteraction, fuseEngrams } from '../services/CognitiveRefinementAI'; // Invented AI service

// The engram is augmented with metadata for self-improvement.
export interface CognitiveEngram extends SystemPrompt {
    lineage: 'foundational' | 'forked' | 'fused'; // Where it came from
    parentIds?: [string, string]; // For fused engrams
    refinementHistory: number; // Number of times it has been refined
    learningRate: number; // 0.0 (static) to 1.0 (highly adaptive)
}

// The API exposed by the hook is no longer a raw state setter.
export interface EngramAPI {
    engrams: CognitiveEngram[];
    isLoading: boolean;
    getEngramById: (id: string) => CognitiveEngram | undefined;
    createEngram: (name: string) => void;
    forkEngram: (sourceId: string) => void;
    fuseEngrams: (idA: string, idB: string, ratio: number) => Promise<void>;
    logInteraction: (engramId: string, input: string, output: string, userFeedback: 'up' | 'down') => Promise<void>;
}

export const useEvolvingCognitiveEngram = (): EngramAPI => {
    const [engrams, setEngrams] = useLocalStorage<CognitiveEngram[]>('engine_cognitive_engrams', []);
    const [isLoading, setIsLoading] = useState(true);

    // Initial seeding from the "Noosphere Registry"
    useEffect(() => {
        const seedInitialEngrams = async () => {
            if (engrams.length === 0) {
                const foundational = await fetchFoundationalEngrams();
                setEngrams(foundational);
            }
            setIsLoading(false);
        };
        seedInitialEngrams();
    }, []); // Run only once if local storage is empty

    const getEngramById = useCallback((id: string) => {
        return engrams.find(e => e.id === id);
    }, [engrams]);

    const createEngram = (name: string) => {
        const newEngram: CognitiveEngram = {
            id: `custom-${Date.now()}`,
            name,
            persona: 'A new AI persona.',
            rules: [],
            outputFormat: 'markdown',
            exampleIO: [],
            lineage: 'forked', // Created from scratch is like forking from nothing
            refinementHistory: 0,
            learningRate: 0.5
        };
        setEngrams(prev => [...prev, newEngram]);
    };
    
    const forkEngram = (sourceId: string) => {
        const source = getEngramById(sourceId);
        if (!source) return;
        const forkedEngram: CognitiveEngram = {
            ...source,
            id: `fork-${source.id}-${Date.now()}`,
            name: `${source.name} (Fork)`,
            lineage: 'forked',
            parentIds: [source.id, ''],
            refinementHistory: 0,
        };
        setEngrams(prev => [...prev, forkedEngram]);
    };

    const _fuseEngrams = async (idA: string, idB: string, ratio: number) => {
        const engramA = getEngramById(idA);
        const engramB = getEngramById(idB);
        if (!engramA || !engramB) return;

        setIsLoading(true);
        try {
            const fusedEngram = await fuseEngrams(engramA, engramB, ratio);
            // Fix: Check if fusedEngram is not void before updating state
            if (fusedEngram) {
                setEngrams(prev => [...prev, fusedEngram as CognitiveEngram]);
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const _logInteraction = async (engramId: string, input: string, output: string, userFeedback: 'up' | 'down') => {
        const sourceEngram = getEngramById(engramId);
        if (!sourceEngram) return;
        
        // Use AI to rewrite the engram based on feedback
        const refined = await refineEngramWithInteraction(sourceEngram, { input, output, userFeedback });
        // Fix: Check if refined is not void before updating state
        if (refined) {
            setEngrams(prev => prev.map(e => e.id === engramId ? refined as CognitiveEngram : e));
        }
    };

    return {
        engrams,
        isLoading,
        getEngramById,
        createEngram,
        forkEngram,
        fuseEngrams: _fuseEngrams,
        logInteraction: _logInteraction
    };
};