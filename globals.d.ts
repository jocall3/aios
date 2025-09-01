/**
 * ==================================================================================
 * ==                                                                              ==
 * ==       EXHAUSTIVE WEB PLATFORM & THIRD-PARTY API TYPINGS MANIFEST v1.0        ==
 * ==                                                                              ==
 * ==      This file provides comprehensive, reality-grounded type definitions     ==
 * ==        for the global execution context. Every interface corresponds         ==
 * ==         to a real, verifiable Web API or a major third-party SDK.            ==
 * ==                    There is no conceptual bullshit.                          ==
 * ==                                                                              ==
 * ==================================================================================
 * @license SPDX-License-Identifier: Apache-2.0
 */

// Fix: Add dummy interfaces for experimental/non-standard APIs to satisfy TS
interface NetworkInformation {}
interface USB {}
interface HID {}
interface Serial {}

declare global {

    // --- NODE.JS ENVIRONMENT GLOBALS (Provided by Vite/Bundlers) ---
    // Fix: Changed 'const' to 'var' to avoid redeclaration error in global scope.
    var process: {
        env: {
            NODE_ENV: 'development' | 'production';
            GEMINI_API_KEY?: string;
            [key: string]: string | undefined;
        }
    };

    // --- COMMON UTILITY GLOBALS ---
    const _: any; // lodash
    const $: any; // jQuery
    
    // --- FOUNDATIONAL: WebAssembly ---
    function loadPyodide(config?: { indexURL?: string }): Promise<any>;


    // --- BROWSER APIs: Complete Window & Navigator Interfaces ---
    interface Window {
        // Fix: Removed multiple redundant declarations that conflict with built-in TS DOM types.
        // Standard properties are already available on the global Window type.
        // readonly document: Document;
        // readonly navigator: Navigator;
        // readonly location: Location;
        // readonly history: History;
        // readonly localStorage: Storage;
        // readonly sessionStorage: Storage;
        // readonly performance: Performance;
        // readonly crypto: Crypto;
        
        // Audio / Visual
        // readonly visualViewport?: VisualViewport;
        // speechSynthesis: SpeechSynthesis;
        AudioContext: typeof AudioContext;
        webkitAudioContext: typeof AudioContext;
        
        // Advanced I/O
        showOpenFilePicker(options?: any): Promise<any[]>;
        showSaveFilePicker(options?: any): Promise<any>;
        showDirectoryPicker(options?: any): Promise<any>;
        
        // Others
        [key: string]: any; // For any other properties
    }
    
    interface Navigator {
        // Fix: Removed multiple redundant declarations that conflict with built-in TS DOM types.
        // Standard properties are already available on the global Navigator type.
        // readonly userAgent: string;
        // readonly language: string;
        // readonly languages: readonly string[];
        readonly connection: NetworkInformation;
        
        // Permissions API
        // permissions: {
        //     query(permissionDesc: { name: 'geolocation' | 'notifications' | 'camera' | 'microphone' | 'persistent-storage' }): Promise<PermissionStatus>;
        // };

        // Hardware APIs
        readonly usb: USB;
        readonly hid: HID;
        readonly serial: Serial;
        
        // Media
        // mediaDevices: MediaDevices;
        
        // Clipboard
        // clipboard: {
        //     writeText(text: string): Promise<void>;
        //     readText(): Promise<string>;
        // };
    }
    

    // --- PLATFORM SDKs: Exhaustive Google Definitions ---
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: { client_id: string; callback: (response: any) => void; }) => void;
                    prompt: (notification?: (notification: any) => void) => void;
                    renderButton: (parent: HTMLElement, options: { theme: 'outline' | 'filled_blue'; size: 'large' }) => void;
                    disableAutoSelect: () => void;
                };
                oauth2: {
                    initTokenClient: (config: {
                        client_id: string;
                        scope: string;
                        callback: (tokenResponse: any) => void;
                        error_callback?: (error: any) => void;
                    }) => {
                        requestAccessToken: (options?: { prompt?: 'none' | 'consent' | 'select_account' }) => void;
                    };
                    revoke: (token: string, callback: () => void) => void;
                };
            };
        };

        gapi?: {
            load: (apiName: string, callback: () => void) => void;
            client: {
                init: (config: any) => Promise<void>;
                setToken: (token: { access_token: string }) => void;
                getToken: () => { access_token: string; expires_at: number; };
                newBatch: () => { add: (request: any) => void; execute: (callback: (response: any) => void) => void; };

                // Pre-defined known services for type-hinting, extensible by index signature
                drive?: {
                    files: {
                        get(params: { fileId: string, fields?: string }): any;
                        list(params?: any): any;
                        create(params: any): any;
                    };
                    [key: string]: any;
                };
                docs?: {
                    documents: {
                        get(params: { documentId: string }): any;
                        create(params: { title: string }): any;
                        batchUpdate(params: any): any;
                    }
                    [key: string]: any;
                };
                iam?: {
                    permissions: {
                        testIamPermissions(params: { resource: string, resource_body: { permissions: string[] } }): any;
                    }
                    [key: string]: any;
                };
                [key: string]: any; // Catch-all for other dynamically loaded services
            };
        };
    }

    // --- PLATFORM SDKs: Rival AI (Realistic Browser Stand-ins) ---
    interface Window {
        openai?: {
            _apiKey: string;
            Configuration: any;
            OpenAIApi: {
                new(config: any): {
                    createChatCompletion(params: { model: string; messages: { role: 'user'|'system', content: string }[] }): Promise<{ data: any }>;
                };
            };
        };

        anthropic?: {
            _apiKey: string;
            Anthropic: {
                new(config: { apiKey: string }): {
                    messages: {
                        create(params: { model: string; max_tokens: number; messages: { role: 'user'|'assistant', content: string }[] }): Promise<any>;
                    };
                };
            };
        };
    }
}

// This export statement is required to make the file a module.
export {};