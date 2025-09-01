import { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { generatePsychometricTheme } from '../services/index.ts';
import type { ThemeState, ColorTheme, PsychoEmotionalTarget, PsychometricTheme } from '../types';

// Self-contained audio context for multi-sensory feedback
let audioContext: AudioContext | null = null;
let oscillator: OscillatorNode | null = null;
let gainNode: GainNode | null = null;

const applyResonance = (theme: PsychometricTheme | null) => {
    const root = window.document.documentElement;
    if (theme?.visuals) {
        Object.entries(theme.visuals).forEach(([key, value]) => {
            const cssVar = `--color-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
            root.style.setProperty(cssVar, value);
        });
        const primaryColor = theme.visuals.primary;
        if (primaryColor.startsWith('#')) {
             const r = parseInt(primaryColor.slice(1, 3), 16);
             const g = parseInt(primaryColor.slice(3, 5), 16);
             const b = parseInt(primaryColor.slice(5, 7), 16);
             root.style.setProperty('--color-primary-rgb', `${r}, ${g}, ${b}`);
        } else {
             const rgb = theme.visuals.primary.match(/\d+/g)?.slice(0, 3).join(', ');
             if (rgb) root.style.setProperty('--color-primary-rgb', rgb);
        }

    } else {
        ['primary', 'background', 'surface', 'text-primary', 'text-secondary', 'text-on-primary', 'border', 'primary-rgb']
            .forEach(prop => root.style.removeProperty(`--color-${prop}`));
    }
    
    // Auditory Subsystem
    if(theme?.audio) {
        if (!audioContext) audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (oscillator) oscillator.stop();
        oscillator = audioContext.createOscillator();
        gainNode = audioContext.createGain();
        oscillator.type = theme.audio.backgroundDrone.waveform.toLowerCase() as OscillatorType;
        oscillator.frequency.setValueAtTime(theme.audio.backgroundDrone.frequency, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(theme.audio.backgroundDrone.amplitude, audioContext.currentTime + 1.0);
        oscillator.connect(gainNode).connect(audioContext.destination);
        oscillator.start();
    } else if (oscillator) {
        gainNode?.gain.linearRampToValueAtTime(0, audioContext!.currentTime + 1.0);
        oscillator.stop(audioContext!.currentTime + 1.0);
        oscillator = null;
    }
};

/**
 * An active, adaptive, psychometric interface for orchestrating the Engine's
 * multi-sensory user experience to resonate with a target cognitive state.
 */
export const usePsychoAestheticResonance = (): { 
    currentResonance: PsychometricTheme | null; 
    setTheme: (value: PsychometricTheme | null | ((val: PsychometricTheme | null) => PsychometricTheme | null)) => void;
    resonateWith: (target: PsychoEmotionalTarget) => Promise<void>;
    revertToDefault: () => void;
    isLoading: boolean;
} => {
    const [theme, setTheme] = useLocalStorage<PsychometricTheme | null>('engine_psychometric_resonance', null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const root = window.document.documentElement;
        const mode = theme?.mode || 'dark'; // Default to dark if no theme
        root.classList.remove('light', 'dark');
        root.classList.add(mode);
        applyResonance(theme);
    }, [theme]);
    
    const resonateWith = useCallback(async (target: PsychoEmotionalTarget) => {
        setIsLoading(true);
        try {
            // Here, userCognitiveSignature would be fetched from global state.
            const newResonance = await generatePsychometricTheme(target, "user_signature_placeholder");
            setTheme(newResonance);
        } catch(error) {
            console.error("Failed to generate new psychometric resonance:", error);
        } finally {
            setIsLoading(false);
        }
    }, [setTheme]);
    
    const revertToDefault = useCallback(() => {
        setTheme(null); // Clear custom theme, revert to CSS defaults
    }, [setTheme]);
    
    // --- Conceptual Self-Correction based on Telemetry ---
    useEffect(() => {
        const handleSystemEvent = (event: any) => {
            if (event.detail.type === 'HIGH_USER_FRUSTRATION_DETECTED' && theme?.targetState !== 'CALM_FOCUS') {
                console.warn("High user frustration detected. Auto-shifting resonance to 'CALM_FOCUS'.");
                resonateWith('CALM_FOCUS');
            }
        };
        // window.addEventListener('engineTelemetryEvent', handleSystemEvent);
        // return () => window.removeEventListener('engineTelemetryEvent', handleSystemEvent);
    }, [theme, resonateWith]);

    return { 
        currentResonance: theme, 
        setTheme,
        resonateWith,
        revertToDefault,
        isLoading
    };
};

// Original useTheme hook kept for compatibility, but now it's a simplified wrapper
export const useTheme = (): [ThemeState, () => void, (colors: ColorTheme, mode: any) => void, () => void] => {
    // Fix: Get setTheme from the hook to resolve "Cannot find name 'setTheme'"
    const { currentResonance, resonateWith, revertToDefault, setTheme } = usePsychoAestheticResonance();

    const legacyThemeState: ThemeState = {
        // Fix: Property 'mode' does not exist on type 'PsychometricTheme'. (Added to type in types.ts)
        mode: currentResonance?.mode || 'dark',
        customColors: (currentResonance?.visuals as ColorTheme) || null
    };

    const toggleTheme = () => {
        // Fix: Property 'mode' does not exist on type 'PsychometricTheme'. (Added to type in types.ts)
        const newTarget = (currentResonance?.mode === 'light' || !currentResonance) ? 'AGGRESSIVE_EXECUTION' /* Dark-like */ : 'CALM_FOCUS' /* Light-like */;
        // Fix: Type '"FOCUS"' is not assignable to type 'PsychoEmotionalTarget'.
        resonateWith(newTarget);
    };
    
    const applyCustomTheme = (colors: ColorTheme, mode: any) => {
         // This bypasses the AI generation for direct application, but we frame it as a resonance
        const mockResonance: PsychometricTheme = {
            // Fix: Type '"FOCUS"' is not assignable to type 'PsychoEmotionalTarget'. Corrected to a valid target.
            targetState: 'AGGRESSIVE_EXECUTION', mode,
            // Fix: Type 'ColorTheme' is not assignable to type '{...}' because of ChromaticResonance. (Relaxed type in types.ts)
            visuals: colors,
            // Fix: Add missing properties
            audio: { backgroundDrone: { frequency: 40, waveform: 'SINE', amplitude: 0.01}, notificationChime: { frequency: 440, waveform: 'SINE', amplitude: 0.1 } },
            haptics: { idlePattern: 'pattern(0)', confirmationPattern: 'pattern(1)' }
        };
        // Fix: Cannot find name 'setTheme'.
        setTheme(mockResonance); // Uses the raw setter from the underlying useLocalStorage hook
    };

    const clearCustomTheme = () => {
        revertToDefault();
    };

    return [legacyThemeState, toggleTheme, applyCustomTheme, clearCustomTheme];
};