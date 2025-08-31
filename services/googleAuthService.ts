/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { logError, logEvent } from './telemetryService';
import { saveCredential, getDecryptedCredential, isUnlocked, unlockVault } from './vaultService';
import type { AppUser, ExtendedAppUser } from '../types'; // Assumes ExtendedAppUser exists

const GOOGLE_CLIENT_ID = "555179712981-36hlicm802genhfo9iq1ufnp1n8cikt9.apps.googleusercontent.com";
const REDIRECT_URI = window.location.origin;

let onUserChangedCallback: (user: ExtendedAppUser | null) => void = () => {};
let activeToken: { accessToken: string; expiresAt: number; } | null = null;


// --- PKCE HELPER FUNCTIONS (SELF-CONTAINED) ---
const generateCodeVerifier = (): string => {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    return btoa(String.fromCharCode.apply(null, randomBytes as any)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

const generateCodeChallenge = async (verifier: string): Promise<string> => {
    const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer) as any)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};


// --- CORE AUTHENTICATION FLOW ---

const fetchTokenFromCode = async (code: string, verifier: string): Promise<any> => {
    const params = new URLSearchParams();
    params.append('code', code);
    params.append('client_id', GOOGLE_CLIENT_ID);
    params.append('redirect_uri', REDIRECT_URI);
    params.append('grant_type', 'authorization_code');
    params.append('code_verifier', verifier);

    const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: params });
    if (!response.ok) throw new Error('Token exchange failed.');
    return response.json();
};

const fetchTokenFromRefresh = async (refreshToken: string): Promise<any> => {
    const secret = await getDecryptedCredential('google_client_secret'); // This would need to be securely set by the architect
    if(!secret) throw new Error("Client secret is required for token refresh.");
    const params = new URLSearchParams();
    params.append('client_id', GOOGLE_CLIENT_ID);
    params.append('client_secret', secret);
    params.append('refresh_token', refreshToken);
    params.append('grant_type', 'refresh_token');

    const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: params });
    if (!response.ok) throw new Error('Token refresh failed.');
    return response.json();
}

const getGoogleUserProfile = async (accessToken: string): Promise<any> => {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!response.ok) throw new Error('Failed to fetch user profile');
    return response.json();
};

const forgeCognitiveSignature = async (profile: any): Promise<string> => {
    const entropy = `${profile.sub}|${navigator.userAgent}|${new Date().getTimezoneOffset()}`;
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(entropy));
    const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    return `sig_cognitron::${hash.substring(0, 32)}`;
};

const processTokenResponse = async (tokenData: any) => {
    activeToken = {
        accessToken: tokenData.access_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000)
    };
    if (tokenData.refresh_token) {
        if(!isUnlocked()) await unlockVault("password-placeholder"); // This would need user interaction
        await saveCredential('google_refresh_token', tokenData.refresh_token);
    }
    const profile = await getGoogleUserProfile(activeToken.accessToken);
    
    // Check if signature already exists, if not, forge it.
    let signature = localStorage.getItem(`cognitivesig_${profile.sub}`);
    if (!signature) {
        signature = await forgeCognitiveSignature(profile);
        localStorage.setItem(`cognitivesig_${profile.sub}`, signature);
    }

    const appUser: ExtendedAppUser = {
        uid: profile.sub,
        displayName: profile.name,
        email: profile.email,
        photoURL: profile.picture,
        tier: 'archon', // Elevated status
        cognitiveSignature: signature as any,
        maxVolition: 100, // Default value
        currentEntropyFactor: 0.1, // Default value
    };
    onUserChangedCallback(appUser);
};

// --- PUBLIC API ---
export async function initGoogleAuth(callback: (user: ExtendedAppUser | null) => void) {
  onUserChangedCallback = callback;
  
  // Handle redirect from OAuth
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (code) {
      const verifier = sessionStorage.getItem('pkce_verifier');
      if(verifier) {
         try {
            const tokenData = await fetchTokenFromCode(code, verifier);
            await processTokenResponse(tokenData);
         } finally {
            // Clean up URL
             window.history.replaceState({}, '', window.location.pathname);
             sessionStorage.removeItem('pkce_verifier');
         }
      }
  } else {
      // Attempt silent refresh on init
      if(!isUnlocked()) return;
      const refreshToken = await getDecryptedCredential('google_refresh_token');
      if (refreshToken) {
          try {
             const tokenData = await fetchTokenFromRefresh(refreshToken);
             await processTokenResponse(tokenData);
          } catch(e) {
            logError(e as Error, {context: "silent_refresh_failed"});
          }
      }
  }
}

export async function signInWithGoogle() {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    sessionStorage.setItem('pkce_verifier', verifier);

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid profile email');
    authUrl.searchParams.set('code_challenge', challenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('access_type', 'offline'); // Request a refresh token

    window.location.assign(authUrl.toString());
}

export async function signOutUser() {
    if(activeToken) {
         await fetch(`https://oauth2.googleapis.com/revoke?token=${activeToken.accessToken}`, { method: 'POST'});
    }
    activeToken = null;
    if(isUnlocked()) await saveCredential('google_refresh_token', '');
    onUserChangedCallback(null);
}

// LEGACY WRAPPERS - KEPT FOR COMPATIBILITY BUT DO NOTHING
export function getGoogleUserProfile() {}