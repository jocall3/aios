/**
 * ==================================================================================
 * ==                                                                              ==
 * ==          DYNAMIC GAPI CONDUIT & ON-DEMAND SERVICE INGESTION ENGINE           ==
 * ==                                                                              ==
 * ==     This substrate does not initialize a static list of APIs. It treats      ==
 * ==      Google's API surface as a dynamic universe, loading and creating       ==
 * ==             typed proxies for any service on demand.                         ==
 * ==                                                                              ==
 * ==================================================================================
 * @license SPDX-License-Identifier: Apache-2.0
 */

// Fix: Import measurePerformance to resolve missing name error.
import { logEvent, logError, measurePerformance } from './telemetryService';
declare var gapi: any;
declare var google: any;

// --- MODULE STATE ---
const CLIENT_ID = "555179712981-36hlicm802genhfo9iq1ufnp1n8cikt9.apps.googleusercontent.com";
let scriptLoaded = false;
let isInitializing = false;
const loadedServices = new Set<string>(); // e.g., "drive:v3"

// --- PRIVATE HELPERS ---
const loadGapiScript = (): Promise<void> => {
    if (scriptLoaded) return Promise.resolve();
    if (isInitializing) return new Promise(resolve => setTimeout(() => resolve(loadGapiScript()), 100)); // Wait for ongoing load

    isInitializing = true;
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
            window.gapi.load('client', () => {
                scriptLoaded = true;
                isInitializing = false;
                logEvent('gapi.script_loaded');
                resolve();
            });
        };
        script.onerror = () => {
            isInitializing = false;
            logError(new Error('Failed to load GAPI script'));
            reject();
        };
        document.body.appendChild(script);
    });
};

const internalInitializeGapiClient = async (): Promise<boolean> => {
    try {
        await loadGapiScript();
        // Client init only needs to be called once
        if (!gapi.client.getToken()) {
            await gapi.client.init({
                clientId: CLIENT_ID,
                // The API key is now only a fallback
                // apiKey: process.env.GEMINI_API_KEY, 
                scope: 'openid profile email https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/iam https://www.googleapis.com/auth/gmail.addons.current'
            });

            const accessToken = sessionStorage.getItem('google_access_token');
            if (!accessToken) {
                logError(new Error("GAPI: Access token not found. User authentication required."));
                return false;
            }
            gapi.client.setToken({ access_token: accessToken });
            logEvent('gapi.client_initialized');
        }
        return true;
    } catch (error) {
        logError(error as Error, { context: 'internalInitializeGapiClient'});
        return false;
    }
};

const executeGuardedRequest = async (request: any) => {
    // This is the wrapper for automatic token refresh logic
    // Conceptual implementation:
    const token = gapi.client.getToken();
    const isExpired = token.expires_at < Date.now();
    
    if(isExpired) {
        logEvent('gapi.token_expired_refreshing');
        // `googleTokenClient` would be from our auth service, ideally.
        // For self-containment, this implies the auth service would need to expose it.
        // googleTokenClient.requestAccessToken({prompt: ''}); 
        // Then retry the request...
    }
    
    return await request;
};

// ==================================================================================
// ==                         PUBLIC API                                           ==
// ==================================================================================

/**
 * Ensures a specific Google API service is loaded and returns a strongly-typed proxy.
 * This is the primary entry point for interacting with Google APIs.
 * @param serviceName The name of the service (e.g., 'drive').
 * @param version The version of the service (e.g., 'v3').
 * @returns A promise that resolves to the loaded service client API.
 */
export const activateGoogleService = async <T,>(serviceName: string, version: string): Promise<T> => {
    const isReady = await internalInitializeGapiClient();
    if (!isReady) {
        throw new Error("Google API Conduit could not be initialized. Authentication might be required.");
    }
    
    const serviceId = `${serviceName}:${version}`;
    if (!loadedServices.has(serviceId)) {
        // Fix: Use measurePerformance wrapper
        await measurePerformance(`gapi.load_service.${serviceId}`, async () => {
             await gapi.client.load(serviceName, version);
        });
        loadedServices.add(serviceId);
        logEvent('gapi.service_activated', { service: serviceId });
    }
    
    // Create a proxy to wrap every method in our resiliency logic
    const serviceClient = (gapi.client as any)[serviceName];
    const proxyClient = new Proxy(serviceClient, {
        get(target, propKey, receiver) {
            const originalMethod = target[propKey];
            if(typeof originalMethod === 'object' && originalMethod !== null) {
                // Recursively wrap nested objects like `gapi.client.drive.files`
                return new Proxy(originalMethod, this);
            }
            if(typeof originalMethod === 'function') {
                return function (...args: any[]) {
                    logEvent('gapi.request_sent', { service: serviceName, method: String(propKey) });
                    const request = originalMethod.apply(target, args);
                    return executeGuardedRequest(request);
                };
            }
            return Reflect.get(target, propKey, receiver);
        }
    });

    return proxyClient as T;
};

/**
 * Creates and executes a batch request for multiple Google API calls in a single HTTP roundtrip.
 * @param requests An array of gapi.client.Request objects.
 * @returns A promise that resolves with the batch response object.
 */
export const executeRequestBatch = async (requests: any[]): Promise<any> => {
    if(!gapi.client.newBatch) {
         await activateGoogleService('batch', 'v1'); // Ensure batching itself is available
    }
    const batch = gapi.client.newBatch();
    requests.forEach(req => batch.add(req));
    
    logEvent('gapi.batch_execute', { request_count: requests.length });
    // Fix: Use measurePerformance wrapper
    return measurePerformance('gapi.batch_execution', () => batch);
};


/**
 * Legacy function, preserved for compatibility.
 * Checks if the core client is ready, without loading a specific service.
 * @deprecated Use `activateGoogleService` to ensure a specific API is ready.
 */
export const ensureGapiClient = async (): Promise<boolean> => {
    return internalInitializeGapiClient();
};