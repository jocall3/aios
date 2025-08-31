/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Octokit } from 'octokit';
import type { GitHubUser as User } from '../types';
import { logEvent, logError } from './telemetryService';

// --- SELF-CONTAINED TYPES FOR THIS SUBSTRATE ---

export type GitHubScope = 'repo' | 'read:user' | 'admin:org' | 'delete_repo';

export interface RateLimitStatus {
    limit: number;
    remaining: number;
    resetsAt: number; // Unix timestamp in seconds
    predictedThrottleDelayMs: number;
}

// The rich context object representing a live, adjudicated identity
export interface GitHubContext {
    user: User;
    scopes: GitHubScope[];
    octokit: Octokit;
    getRateLimitStatus: () => RateLimitStatus;
    // Capability-aware API surfaces. Presence implies permission.
    repos?: {
        list: () => Promise<any[]>;
    };
    orgs?: {
        list: () => Promise<any[]>;
    };
}


// --- THE SINGLETON INSTANCE & STATE ---
class IdentityBroker {
    private context: GitHubContext | null = null;
    private rateLimit: Omit<RateLimitStatus, 'predictedThrottleDelayMs'> = { limit: 5000, remaining: 5000, resetsAt: 0 };

    private createCapabilityAwareClient(token: string): Octokit {
        const octokit = new Octokit({ auth: token });

        // Intercept every request to monitor rate limits
        octokit.hook.wrap("request", async (request, options) => {
            const response = await request(options);
            const headers = response.headers;
            const newStatus = {
                limit: parseInt(headers['x-ratelimit-limit'] || '0', 10),
                remaining: parseInt(headers['x-ratelimit-remaining'] || '0', 10),
                resetsAt: parseInt(headers['x-ratelimit-reset'] || '0', 10),
            };
            this.rateLimit = newStatus;
            logEvent('github.ratelimit_update', newStatus);
            return response;
        });

        return octokit;
    }

    /**
     * Initializes the broker with a token, performing a full adjudication of identity and permissions.
     */
    public async adjudicateIdentity(token: string): Promise<GitHubContext> {
        if (!token) throw new Error("Adjudication requires a valid token.");
        logEvent('github.adjudication_started');
        
        try {
            const octokit = this.createCapabilityAwareClient(token);
            const { data: user, headers } = await octokit.request('GET /user');
            
            const scopes = (headers['x-oauth-scopes']?.split(', ') || []) as GitHubScope[];

            this.context = {
                user: user as unknown as User,
                scopes,
                octokit,
                getRateLimitStatus: this.getRateLimitStatus.bind(this),
            };

            // Dynamically construct the API surface based on adjudicated scopes
            if (scopes.includes('repo')) {
                this.context.repos = {
                    list: () => octokit.request('GET /user/repos', { per_page: 100 }).then(res => res.data),
                };
            }
            if (scopes.includes('admin:org')) {
                this.context.orgs = {
                    list: () => octokit.request('GET /user/orgs').then(res => res.data),
                };
            }
            
            logEvent('github.adjudication_success', { user: user.login, scopes: scopes });
            return this.context;
            
        } catch (error) {
            logError(error as Error, { context: 'github.adjudicateIdentity' });
            this.context = null;
            throw new Error(`GitHub Identity Adjudication Failed: ${(error as Error).message}`);
        }
    }
    
    /**
     * Retrieves the current, live rate limit status and calculates a recommended delay.
     */
    public getRateLimitStatus(): RateLimitStatus {
        const now = Date.now() / 1000;
        const secondsUntilReset = Math.max(0, this.rateLimit.resetsAt - now);
        
        // Simple predictive model: aim to have 10% of rate limit left at window reset
        const targetRemaining = this.rateLimit.limit * 0.1;
        const usableRequests = this.rateLimit.remaining - targetRemaining;

        const predictedThrottleDelayMs = (secondsUntilReset > 0 && usableRequests > 0)
            ? (secondsUntilReset / usableRequests) * 1000
            : (this.rateLimit.remaining > 0 ? 0 : 5000); // 5s delay if exhausted

        return {
            ...this.rateLimit,
            predictedThrottleDelayMs: Math.min(predictedThrottleDelayMs, 3000) // Cap delay at 3s
        };
    }
    
    public
 
getContext(): GitHubContext | null {
        return this.context;
    }

    public disconnect(): void {
        this.context = null;
        logEvent('github.disconnected');
    }
}

// Export a single instance to act as the stateful broker
export const GitHubIdentityBroker = new IdentityBroker();


// --- LEGACY EXPORTS FOR BACKWARD COMPATIBILITY ---
export const initializeOctokit = (token: string): Octokit => {
    // Legacy function now acts as a simple wrapper
    return new Octokit({ auth: token, request: { headers: { 'X-GitHub-Api-Version': '2022-11-28' } } });
};

export const validateToken = async (token: string): Promise<User> => {
    // We adjudicate a temporary identity to validate, then discard it.
    const tempBroker = new IdentityBroker();
    const context = await tempBroker.adjudicateIdentity(token);
    return context.user;
};