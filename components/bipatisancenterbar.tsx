import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useGlobalState, GlobalAction } from '../contexts/GlobalStateContext';
import { analyzeDichotomy, SynthesisResult } from '../services/SocioPoliticalAI'; // Invented AI Service

const STATUS_MESSAGES = {
    IDLE: "AWAITING IDEOLOGICAL INPUTS",
    AWAITING_LEFT: "AWAITING COMPASSION MANDATE",
    AWAITING_RIGHT: "AWAITING SOVEREIGN IMPERATIVE",
    SYNTHESIZING: "FORGING SYNTHESIS...",
    SUCCESS: "SYNTHESIS ACHIEVED",
    ERROR: "PARADOX DETECTED",
};

export const BipartisanCenterBar: React.FC<{ style: React.CSSProperties }> = ({ style }) => {
    const { state, dispatch } = useGlobalState();
    const { activeMandate } = state.leftSidebarState;
    const { activeImperative } = state.rightSidebarState;
    
    const [status, setStatus] = useState<keyof typeof STATUS_MESSAGES>('IDLE');
    const prevMandate = useRef(activeMandate);
    const prevImperative = useRef(activeImperative);

    useEffect(() => {
        // Trigger synthesis only on a new pair combination
        if ((activeMandate && activeImperative) && (activeMandate !== prevMandate.current || activeImperative !== prevImperative.current)) {
            prevMandate.current = activeMandate;
            prevImperative.current = activeImperative;

            setStatus('SYNTHESIZING');
            dispatch({ type: 'CLEAR_SYNTHESIS' } as GlobalAction);

            analyzeDichotomy(activeMandate, activeImperative)
                .then((result: SynthesisResult) => {
                    dispatch({ type: 'SET_SYNTHESIS_RESULT', payload: result } as GlobalAction);
                    setStatus('SUCCESS');
                })
                .catch((error) => {
                    console.error("Synthesis Core Failure:", error);
                    dispatch({ 
                        type: 'SET_SYNTHESIS_RESULT', 
                        payload: { 
                            title: 'SYNTHESIS FAILURE', 
                            synthesizedPolicy: 'The fundamental axioms of the selected Mandate and Imperative are irreconcilable within current ethical constraints.', 
                            paradoxAlert: 'Ontological Paradox Detected. Requires Archon override.' 
                        } 
                    } as GlobalAction);
                    setStatus('ERROR');
                });
        } else if (!activeMandate && !activeImperative) {
            setStatus('IDLE');
        } else if (activeMandate && !activeImperative) {
            setStatus('AWAITING_RIGHT');
        } else if (!activeMandate && activeImperative) {
            setStatus('AWAITING_LEFT');
        }

    }, [activeMandate, activeImperative, dispatch]);
    
    const synthesis = state.synthesisState.currentSynthesis;

    const coreStyle = useMemo((): React.CSSProperties => {
        switch (status) {
            case 'SYNTHESIZING':
                return { animation: 'pulse-blue 1.5s infinite', borderColor: 'var(--color-primary)' };
            case 'SUCCESS':
                return { animation: 'pulse-blue 3s infinite', borderColor: 'var(--color-primary)', boxShadow: '0 0 25px 8px rgba(var(--color-primary-rgb), 0.5)' };
            case 'ERROR':
                 return { animation: 'pulse-red 1s infinite', borderColor: '#ef4444' }; // Red-500
            default:
                return { borderColor: 'var(--color-border)' };
        }
    }, [status]);

    return (
        <div style={style} className="bg-background border-x border-border flex items-center justify-center p-2">
            <div className="relative group w-full h-full">
                <div 
                    style={coreStyle}
                    className="w-full h-full transition-all duration-500 border-2 border-dashed rounded-lg flex items-center justify-center font-bold text-xs uppercase tracking-widest overflow-hidden"
                >
                   <span className={status === 'SUCCESS' ? 'text-primary' : 'text-text-secondary'}>
                        {STATUS_MESSAGES[status]}
                   </span>
                </div>

                {synthesis && (
                     <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[400px] bg-surface border border-primary p-4 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 animate-pop-in">
                        <h3 className={`font-bold text-lg ${status === 'ERROR' ? 'text-red-500' : 'text-primary'}`}>{synthesis.title}</h3>
                        <p className="text-sm text-text-secondary my-2 font-sans normal-case tracking-normal">{synthesis.synthesizedPolicy}</p>
                        {synthesis.paradoxAlert && <p className="text-sm font-bold font-mono text-red-500 uppercase tracking-widest mt-3 pt-3 border-t border-red-500/30">ALERT: {synthesis.paradoxAlert}</p>}
                    </div>
                 )}
            </div>
        </div>
    );
};