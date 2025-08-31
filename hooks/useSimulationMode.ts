import { useCallback, useState, useEffect } from 'react';
import { useGlobalState } from '../contexts/GlobalStateContext';
import { dispatchGlobalSystemEvent } from '../services/EngineEventBus'; // Invented, but necessary for decoupling
import type { RealityStratumID } from '../types';

export enum ShiftStatus {
    STABLE,
    SHIFTING,
    COOLDOWN
}

// Manages the visual/audio "Cognitive Dissonance" effect during a shift
const useCognitiveDissonanceFx = (status: ShiftStatus) => {
    useEffect(() => {
        const root = document.getElementById('reality-containment-field');
        if (!root) return;

        if (status === ShiftStatus.SHIFTING) {
            // Apply visual tear/static effect
            const existingShader = document.getElementById('dissonance-shader');
            if(existingShader) existingShader.remove();
            
            const shader = document.createElement('div');
            shader.id = 'dissonance-shader';
            shader.style.position = 'fixed';
            shader.style.top = '0';
            shader.style.left = '0';
            shader.style.width = '100vw';
            shader.style.height = '100vh';
            shader.style.pointerEvents = 'none';
            shader.style.zIndex = '999999';
            shader.style.opacity = '0.1';
            shader.style.background = 'url("data:image/svg+xml,...")'; // complex SVG for static effect
            shader.animate([ { opacity: 0 }, { opacity: 0.1 }, { opacity: 0 }], { duration: 1500, iterations: 1 });
            root.appendChild(shader);
            setTimeout(() => shader.remove(), 1500);

            // Play audio cue
            // new Audio('/sounds/reality_shift.mp3').play();
        }

    }, [status]);
};

/**
 * An active temporal and ontological control interface for shifting the Engine's
 * operational reality.
 */
export const useRealityShifter = () => {
    const { state, dispatch } = useGlobalState();
    const [status, setStatus] = useState<ShiftStatus>(ShiftStatus.STABLE);
    
    useCognitiveDissonanceFx(status);

    const shiftReality = useCallback(async (targetStratum: RealityStratumID) => {
        if (status !== ShiftStatus.STABLE || state.engineState.activeStratum === targetStratum) {
            return;
        }

        const previousStratum = state.engineState.activeStratum;

        // Initiate the shift
        setStatus(ShiftStatus.SHIFTING);
        
        // Announce the impending shift to all systems
        await dispatchGlobalSystemEvent('onOntologicalShift_Begin', { from: previousStratum, to: targetStratum });

        // Update the core state. This is the moment of change.
        dispatch({ type: 'SET_REALITY_STRATUM', payload: targetStratum });
        
        // Simulate the high computational cost and allow effects to play
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Announce shift completion
        await dispatchGlobalSystemEvent('onOntologicalShift_Complete', { from: previousStratum, to: targetStratum });

        // Enter cooldown period
        setStatus(ShiftStatus.COOLDOWN);
        setTimeout(() => setStatus(ShiftStatus.STABLE), 3000); // 3-second cooldown

    }, [dispatch, state.engineState.activeStratum, status]);

    return {
        currentStratum: state.engineState.activeStratum,
        shiftStatus: status,
        shiftReality,
    };
};