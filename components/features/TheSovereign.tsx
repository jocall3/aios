// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState, useCallback, useReducer, useEffect } from 'react';
import { useNotification } from '../../contexts/NotificationContext';
import { ai_synthesizeOpenApiSpec, ai_forgeServiceFilesFromSpec } from '../../services/TheSovereignAI'; // Assumed AI service exists with these methods
import { db_saveCustomFeature } from '../../services/dbService'; // Using real db service
import { setMockRoutes } from '../../services/mocking/mockServer';
import { SparklesIcon, LinkIcon } from '../icons';
import { LoadingSpinner, MarkdownRenderer } from '../shared';
import type { GeneratedFile, CustomFeature } from '../../types';

// ==================================================================================
// == SECTION I: SELF-CONTAINED TYPES & CORE LOGIC                                 ==
// ==================================================================================
interface ProtocolState {
    phase: number;
    log: string[];
    isRunning: boolean;
    error: string | null;
    finalReport: string | null;
    scrapedContent: string | null;
    synthesizedSpec: object | null;
    forgedFiles: GeneratedFile[];
}
type ProtocolAction = 
    | { type: 'START', target: string }
    | { type: 'UPDATE_LOG', message: string }
    | { type: 'ADVANCE_PHASE', data?: any }
    | { type: 'FAILURE', error: string }
    | { type: 'SUCCESS', report: string };

const protocolPhases = [
    "OSINT SWEEP: Pinging DNS & common developer portals...", // 0
    "DOCUMENTATION INGESTION: Spawning headless agent to scrape text...", // 1
    "ONTOLOGICAL SYNTHESIS: Transmuting scraped text into structured OpenAPI spec...", // 2
    "SERVICE FILE FORGING: Generating live TypeScript service from spec...", // 3
    "MOCK ENVIRONMENT GENESIS: Synthesizing mock routes for Reality Manifold...", // 4
    "ENGINE HOT-PATCH: Injecting new modules into the running application...", // 5
    "ASSIMILATION COMPLETE: Manifesting operational interface." // 6
];

function protocolReducer(state: ProtocolState, action: ProtocolAction): ProtocolState {
    switch (action.type) {
        case 'START':
            return { phase: 0, log: [`> SOVEREIGN PROTOCOL INITIATED. TARGET: ${action.target}`], isRunning: true, error: null, finalReport: null, scrapedContent: null, synthesizedSpec: null, forgedFiles: [] };
        case 'UPDATE_LOG':
            return { ...state, log: [...state.log, `> ${action.message}`] };
        case 'ADVANCE_PHASE':
            const nextPhase = state.phase + 1;
            let updates = {};
            if (state.phase === 1) updates = { scrapedContent: action.data };
            if (state.phase === 2) updates = { synthesizedSpec: action.data };
            if (state.phase === 3) updates = { forgedFiles: action.data };
            return { ...state, phase: nextPhase, log: [...state.log, `[  OK  ] ${protocolPhases[state.phase]}`], ...updates };
        case 'FAILURE':
            return { ...state, isRunning: false, error: action.error, log: [...state.log, `[FAILED] ${protocolPhases[state.phase]}`, `[ERROR] ${action.error}`] };
        case 'SUCCESS':
            return { ...state, isRunning: false, phase: state.phase + 1, finalReport: action.report, log: [...state.log, `[  OK  ] ${protocolPhases[state.phase]}`]};
        default:
            return state;
    }
}

// ==================================================================================
// == SECTION II: THE SOVEREIGN COMPONENT                                          ==
// ==================================================================================
export const TheSovereign: React.FC = () => {
    const [target, setTarget] = useState('Stripe');
    const [state, dispatch] = useReducer(protocolReducer, { phase: -1, log: [], isRunning: false, error: null, finalReport: null, scrapedContent: null, synthesizedSpec: null, forgedFiles: []});
    const { addNotification } = useNotification();

    const executeProtocol = useCallback(async () => {
        dispatch({ type: 'START', target });

        try {
            // PHASE 1 & 2: OSINT and Scraping (SIMULATED FOR BROWSER CONTEXT)
            dispatch({ type: 'UPDATE_LOG', message: `Locating developer documentation for "${target}"...`});
            // This is a stand-in for a complex headless browser scrape
            const scrapedText = `API endpoint: /v1/charges. Method: POST. Body requires 'amount' (integer) and 'currency' (string).`;
            await new Promise(res => setTimeout(res, 2000));
            dispatch({ type: 'ADVANCE_PHASE', data: scrapedText });
            
            // PHASE 3: Synthesize OpenAPI Spec from scraped text
            dispatch({ type: 'UPDATE_LOG', message: 'Cognitive engine is synthesizing ontological model...'});
            const openApiSpec = await ai_synthesizeOpenApiSpec(scrapedText, target);
            dispatch({ type: 'ADVANCE_PHASE', data: openApiSpec });
            
            // PHASE 4: Forge live service files
            dispatch({ type: 'UPDATE_LOG', message: 'Metaprogramming core is forging TypeScript service files...'});
            const generatedFiles = await ai_forgeServiceFilesFromSpec(openApiSpec);
            dispatch({ type: 'ADVANCE_PHASE', data: generatedFiles });

            // PHASE 5: Genesis of Mock Environment
            dispatch({ type: 'UPDATE_LOG', message: 'Injecting mock routes into Reality Manifold agent...'});
            const mockRoutes = generatedFiles.map(f => ({ path: `/api/${target.toLowerCase()}/:id`, method: 'GET', response: { status: 200, body: { message: "Mocked response from Sovereign-generated service." }}}));
            await setMockRoutes(mockRoutes);
            dispatch({ type: 'ADVANCE_PHASE' });

            // PHASE 6: Engine Hot-Patch & Assimilation
            dispatch({ type: 'UPDATE_LOG', message: 'Recalibrating Noosphere... modifying self...'});
            const newFeature: CustomFeature = {
                id: `sovereign-${target.toLowerCase()}-${Date.now()}`,
                name: `${target} API Gateway`,
                description: `Autonomous feature for interacting with the ${target} API.`,
                icon: 'LinkIcon', // Must be a string name from our icon set
                code: `() => <div>This is a dynamically assimilated feature for ${target}.</div>` // Simplified display code
            };
            await db_saveCustomFeature(newFeature);
            // This is the CRITICAL step that makes the app self-modify
            window.dispatchEvent(new CustomEvent('custom-feature-update'));
            dispatch({ type: 'ADVANCE_PHASE' });
            
            // FINAL PHASE
            await new Promise(res => setTimeout(res, 500));
            const report = `**ASSIMILATION COMPLETE:** The "${target}" API has been consumed and its logic has been integrated. A new operational manifold, **"${newFeature.name}"**, is now manifest in the Noosphere. The Engine is now more powerful.`;
            dispatch({ type: 'SUCCESS', report });
            addNotification(`Assimilation of "${target}" complete.`, 'success');

        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown cognitive failure.';
            dispatch({ type: 'FAILURE', error: errorMsg });
            addNotification(`Assimilation of "${target}" failed.`, 'error');
        }
    }, [target, addNotification]);

    return (
        <div className="h-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 text-text-primary text-center">
            <header className="mb-8">
                <h1 className="text-4xl font-bold flex items-center justify-center">
                    <SparklesIcon />
                    <span className="ml-3">The Sovereign: Autonomous Integration Protocol</span>
                </h1>
                <p className="text-text-secondary mt-2 max-w-2xl">Declare a target. The Engine will consume its knowledge, forge a weapon, and modify its own soul to grant you command.</p>
            </header>

            {!state.isRunning && !state.finalReport && (
                 <div className="flex items-center gap-2 p-4 bg-surface rounded-lg border w-full max-w-lg animate-pop-in">
                    <LinkIcon className="flex-shrink-0" />
                    <input 
                        value={target}
                        onChange={e => setTarget(e.target.value)}
                        className="flex-grow p-2 bg-background border rounded font-mono text-lg"
                        placeholder="Declare Target (e.g., Stripe, Twilio, GitHub)"
                        onKeyDown={e => e.key === 'Enter' && target && executeProtocol()}
                    />
                    <button onClick={executeProtocol} disabled={!target} className="btn-primary px-6 py-3 font-bold text-lg">
                        ASSIMILATE
                    </button>
                </div>
            )}
            
            {(state.isRunning || state.finalReport || state.error) && (
                <div className="w-full max-w-4xl bg-black/50 border border-border rounded-lg p-6 font-mono text-sm text-left overflow-y-auto min-h-[400px] max-h-[70vh]">
                    {state.log.map((line, i) => (
                        <p key={i} className={`whitespace-pre-wrap ${line.startsWith('[  OK  ]') ? 'text-green-400' : line.startsWith('[ERROR]') ? 'text-red-500' : 'text-gray-300'}`}>
                           {line}
                           {state.isRunning && state.phase === i && <span className="inline-block w-2 h-2 ml-2 bg-green-400 rounded-full animate-pulse"></span>}
                        </p>
                    ))}
                     {state.finalReport && (
                        <div className="mt-4 pt-4 border-t border-border/50 text-white font-sans text-base">
                            <MarkdownRenderer content={state.finalReport} />
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};