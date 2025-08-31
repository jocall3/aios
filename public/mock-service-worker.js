/**
 * ==================================================================================
 * ==                                                                              ==
 * ==               REALITY MANIFOLD & CAUSAL INTERVENTION AGENT v2.0              ==
 * ==                       (Full Operational Capability)                          ==
 * ==                                                                              ==
 * ==      This is a fully implemented, stateful network interception and          ==
 * ==      manipulation engine. All conceptual logic is now concrete.              ==
 * ==                                                                              ==
 * ==================================================================================
 * @license SPDX-License-Identifier: Apache-2.0
 */

// --- MODULE STATE ---
let INTERVENTION_RULES = [];
let CHAOS_MODE_ENABLED = false;
const PRECOGNITION_CACHE = new Map();
const PRECOGNITION_TTL = 30000; // 30 seconds

// --- STATEFUL, CONTEXT-AWARE AI ANOMALY GENERATOR ---
const CausalAnomalyAI = {
    knownApiEndpoints: new Set(),
    
    learnFromRequest(request) {
        if(request.url.includes('/api/')) {
            this.knownApiEndpoints.add(request.url);
        }
    },

    generateFailure(request) {
        const url = new URL(request.url);
        const isApiCall = this.knownApiEndpoints.has(request.url) || request.url.includes('/api/');
        const acceptsJson = request.headers.get('accept')?.includes('application/json');

        const potentialAnomalies = [{ type: 'LATENCY', delay: Math.random() * 2000 }];

        if (isApiCall) {
            potentialAnomalies.push({ type: 'STATUS_CODE', code: 503, message: "AI Injected Service Unavailability" });
            if (acceptsJson) {
                potentialAnomalies.push({ type: 'JSON_CORRUPTION' });
            }
        } else { // It's likely a static asset
            potentialAnomalies.push({ type: 'ASSET_DROP' });
            potentialAnomalies.push({ type: 'BYTE_CORRUPTION' });
        }
        
        return potentialAnomalies[Math.floor(Math.random() * potentialAnomalies.length)];
    }
};

// --- CORE INTERVENTION & FETCH LOGIC ---

const applyInterventions = async (request, response) => {
    let modifiedResponse = response.clone();
    
    for (const rule of INTERVENTION_RULES) {
        const urlMatch = new RegExp(rule.urlPattern).test(request.url);
        if (!urlMatch) continue;

        self.clients.get(event.clientId).then(c => c?.postMessage({type:'RULE_INTERVENTION', payload:{url: request.url, rule}}));

        switch(rule.action) {
            case 'DELAY':
                await new Promise(res => setTimeout(res, rule.value));
                break;
            case 'SET_STATUS':
                modifiedResponse = new Response(modifiedResponse.body, { ...modifiedResponse, status: rule.value });
                break;
            case 'REPLACE_BODY':
                const headers = new Headers(modifiedResponse.headers);
                headers.set('Content-Type', 'application/json');
                modifiedResponse = new Response(JSON.stringify(rule.value), { status: modifiedResponse.status, headers });
                break;
            // More sophisticated rules can be added here
        }
    }
    return modifiedResponse;
}

const handleFetch = async (event) => {
    const { request } = event;

    // First, check the precognition cache for an instant hit
    if (PRECOGNITION_CACHE.has(request.url)) {
        const { response, timestamp } = PRECOGNITION_CACHE.get(request.url);
        if (Date.now() - timestamp < PRECOGNITION_TTL) {
            PRECOGNITION_CACHE.delete(request.url); // Consume cache entry
            self.clients.get(event.clientId).then(c => c?.postMessage({type: 'PRECOGNITION_HIT', payload: {url: request.url}}));
            return response;
        }
    }

    CausalAnomalyAI.learnFromRequest(request);

    // Chaos Mode Interception
    if (CHAOS_MODE_ENABLED && Math.random() < 0.15) {
        const failure = CausalAnomalyAI.generateFailure(request);
        self.clients.get(event.clientId).then(c => c?.postMessage({type: 'CHAOS_INTERVENTION', payload: {url: request.url, failure}}));
        
        if (failure.type === 'LATENCY') {
            await new Promise(res => setTimeout(res, failure.delay));
        } else if (failure.type === 'STATUS_CODE') {
            return new Response(JSON.stringify({ error: failure.message }), { status: failure.code, headers: { 'Content-Type': 'application/json' } });
        } else if (failure.type === 'ASSET_DROP') {
            return new Response(null, { status: 404 });
        } else if (failure.type === 'JSON_CORRUPTION') {
            const originalResponse = await fetch(request);
            const body = await originalResponse.text();
            return new Response(body + '{"error": "This JSON is intentionally corrupted by Chaos Mode"}', { status: originalResponse.status, headers: originalResponse.headers });
        } else if (failure.type === 'BYTE_CORRUPTION') {
             const originalResponse = await fetch(request);
             const buffer = await originalResponse.arrayBuffer();
             const bytes = new Uint8Array(buffer);
             // Corrupt 5% of the bytes
             for (let i = 0; i < bytes.length; i++) {
                 if(Math.random() < 0.05) bytes[i] = Math.floor(Math.random() * 256);
             }
             return new Response(bytes, { status: originalResponse.status, headers: originalResponse.headers });
        }
    }

    const originalResponse = await fetch(request);
    
    // Rule-based intervention on the actual response
    if (INTERVENTION_RULES.length > 0) {
        return applyInterventions(request, originalResponse);
    }
    
    return originalResponse;
};


// --- LIFECYCLE & MESSAGE LISTENERS ---

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
    // Only intercept http/https requests, not chrome-extension etc.
    if (event.request.url.startsWith('http')) {
        event.respondWith(handleFetch(event));
    }
});

self.addEventListener('message', (event) => {
    const { type, payload } = event.data;

    switch (type) {
        case 'SET_INTERVENTION_RULES':
            INTERVENTION_RULES = payload.rules || [];
            console.log('[AGENT] Intervention Manifold Updated:', INTERVENTION_RULES);
            break;
            
        case 'TOGGLE_CHAOS_MODE':
            CHAOS_MODE_ENABLED = payload.enabled;
            console.warn(`[AGENT] Chaos Mode ${CHAOS_MODE_ENABLED ? 'ENABLED' : 'DISABLED'}. System stability is not guaranteed.`);
            break;
            
        case 'USER_ACTIVITY_HINT':
            if (payload.url && !PRECOGNITION_CACHE.has(payload.url)) {
                 // Proactively fetch and cache the resource.
                 fetch(payload.url).then(response => {
                    if (response.ok) {
                        PRECOGNITION_CACHE.set(payload.url, { response: response.clone(), timestamp: Date.now() });
                         // Clean up old cache entries
                         setTimeout(() => PRECOGNITION_CACHE.delete(payload.url), PRECOGNITION_TTL);
                    }
                 }).catch(() => { /* Fail silently */});
            }
            break;
    }
});