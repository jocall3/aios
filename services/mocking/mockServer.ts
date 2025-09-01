/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { logEvent, logError } from '../telemetryService';

// --- SELF-CONTAINED TYPES FOR THE SUBSTRATE ---
export type InterventionAction = 'DELAY' | 'SET_STATUS' | 'REPLACE_BODY';
export interface InterventionRule {
    urlPattern: string; // Will be compiled to RegExp in the agent
    action: InterventionAction;
    value: any; // e.g., number for DELAY/SET_STATUS, object for REPLACE_BODY
}
export interface AgentState {
    chaosMode: boolean;
    ruleCount: number;
    precognitionCacheSize: number;
}


// --- MODULE STATE ---
const SERVICE_WORKER_URL = '/mock-service-worker.js';
let registration: ServiceWorkerRegistration | null = null;
let psionicChannel: MessageChannel | null = null;


// --- BI-DIRECTIONAL COMMAND PROTOCOL ---
// Fix: Corrected function name
const sendCommandToAgent = <T>(command: {type: string, payload?: any}): Promise<T> => {
    return new Promise((resolve, reject) => {
        if (!navigator.serviceWorker.controller) {
            return reject(new Error("Psionic Interface Error: Reality Manifold agent is not active."));
        }

        // Establish channel on first command
        if (!psionicChannel) {
            psionicChannel = new MessageChannel();
            navigator.serviceWorker.controller.postMessage({ type: 'INIT_PORT' }, [psionicChannel.port2]);
            
            // Listen for telemetry events from the agent
            psionicChannel.port1.onmessage = (event) => {
                 if(event.data.type === 'CHAOS_INTERVENTION') {
                     logEvent('agent.chaos_intervention', event.data.payload);
                 }
                 // More telemetry handlers can be added
            };
        }
        
        // This is a one-shot handler for the command response
        const tempChannel = new MessageChannel();
        tempChannel.port1.onmessage = ({ data }) => {
            tempChannel.port1.close();
            if (data.error) {
                reject(new Error(data.error));
            } else {
                resolve(data.payload);
            }
        };
        
        navigator.serviceWorker.controller.postMessage(command, [tempChannel.port2]);
    });
};


// --- PUBLIC API: AGENT LIFECYCLE ---

/**
 * Instantiates and activates the Reality Manifold agent.
 */
export const startCausalAgent = async (): Promise<void> => {
    if ('serviceWorker' in navigator) {
        try {
            registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: '/' });
            logEvent('agent.registered', { scope: registration.scope });
            await navigator.serviceWorker.ready; // Wait for the agent to be active
            logEvent('agent.activated');
        } catch (error) {
            logError(error as Error, { context: 'startCausalAgent' });
            throw new Error('Causal agent failed to instantiate.');
        }
    } else {
        throw new Error('System substrate does not support Causal Intervention Agents.');
    }
};

/**
 * Terminates the Reality Manifold agent and collapses its interventions.
 */
export const stopCausalAgent = async (): Promise<void> => {
    if (registration) {
        await registration.unregister();
        registration = null;
        psionicChannel?.port1.close();
        psionicChannel = null;
        logEvent('agent.terminated');
    }
};

export const isAgentActive = (): boolean => {
    return !!registration && !!navigator.serviceWorker.controller;
};


// --- PUBLIC API: AGENT TASKING & QUERIES ---

/**
 * Tasks the agent with a new set of reality intervention rules.
 * @param rules The array of intervention rules to apply.
 */
export const task_setInterventionRules = (rules: InterventionRule[]): Promise<void> => {
    // Fix: Corrected function name
    return sendCommandToAgent({ type: 'SET_INTERVENTION_RULES', payload: { rules } });
};

/**
 * Commands the agent to enter or exit Chaos Mode.
 * @param enabled True to enable autonomous anomaly injection.
 * @param options Configuration for Chaos Mode behavior.
 */
export const task_enableChaosMode = (enabled: boolean, options?: { intensity?: number, target?: 'api'|'assets' }): Promise<void> => {
    // Fix: Corrected function name
    return sendCommandToAgent({ type: 'TOGGLE_CHAOS_MODE', payload: { enabled, options }});
};

/**
 * Informs the agent of a potential future resource requirement for precognitive caching.
 * @param url The URL of the resource to hint.
 */
export const hint_prefetchResource = (url: string): void => {
    if (navigator.serviceWorker.controller) {
        // This is fire-and-forget, no response needed.
        navigator.serviceWorker.controller.postMessage({ type: 'USER_ACTIVITY_HINT', payload: { url }});
    }
};

/**
 * Queries the agent for its current operational state.
 * @returns A promise resolving with the agent's current state.
 */
export const query_getAgentState = (): Promise<AgentState> => {
    // Fix: Corrected function name
    return sendCommandToAgent({ type: 'GET_AGENT_STATE' });
};