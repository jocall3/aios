// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

/**
 * ==================================================================================
 * ==                                                                              ==
 * ==                  CITICONNECT PAYMENTS: LIFECYCLE SERVICE                     ==
 * ==                                                                              ==
 * ==     This file contains the complete, live implementation for all endpoints   ==
 * ==    related to managing the lifecycle of in-flight payments (stops, recalls,  ==
 * ==       reconfirmations), synthesized from the CitiConnect Swagger spec.       ==
 * ==                                                                              ==
 * ==================================================================================
 * @license SPDX-License-Identifier: Apache-2.0
 */

import type {
    CitiConnectEnvironment,
    PaymentContentType,
    FICCancellationRequest,
    FIReconfirmationRequest,
    FIResponse
} from './types';
import { buildRequestContextHeaders } from './gatewayscript';

/**
 * The core proxy function for this module, responsible for making the final fetch call.
 * This is an internal function not intended for direct use.
 */
const executeLifecycleProxy = async (
    targetUrl: string,
    path: string,
    params: {
        payload: FICCancellationRequest | FIReconfirmationRequest;
        contentType: PaymentContentType;
        accessToken: string;
        clientId: string;
        clientAppName: string;
        clientIp: string;
        requestType: 'STOP_REQUEST' | 'RECNFRM' | 'RJCTCNFRM';
    }
): Promise<FIResponse> => {
    
    const contextParams = {
        contentType: params.contentType,
        clientIp: params.clientIp,
        clientAppName: params.clientAppName,
        accessToken: params.accessToken,
        clientId: params.clientId,
        requestType: params.requestType,
    };

    const headers = buildRequestContextHeaders(contextParams);
    const finalUrl = `${targetUrl}${path}`;

    const response = await fetch(finalUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(params.payload),
    });

    if (response.status !== 202) { // The spec explicitly uses 202 Accepted
        const errorData = await response.json().catch(() => ({ issue: 'Failed to parse error response' }));
        throw new Error(`CitiConnect Lifecycle Error (${response.status}): ${errorData.issue || response.statusText}`);
    }

    return response.json();
};

/**
 * Base parameters required for any payment lifecycle operation.
 */
export interface LifecycleParams {
    /** The operational environment (PROD, UAT1, etc.) */
    env: CitiConnectEnvironment;
    /** The OAuth2 access token for the session. */
    accessToken: string;
    /** The application's unique client_id. */
    clientId: string;
    /** The end-user's IP address for auditing. */
    clientIp: string;
    /** The application name for routing logic (e.g., ccapidevportal_internal). */
    clientAppName: string;
    /** The content type of the payload. */
    contentType: PaymentContentType;
}

/**
 * Initiates a stop or recall request for a previously initiated FI payment.
 * This is an irreversible command to halt a transaction.
 * @param params The base lifecycle parameters.
 * @param payload The cancellation payload identifying the transaction and reason.
 * @param endpointMap A map of service names to their environment-specific URLs.
 * @returns A promise resolving with the FIResponse, indicating acceptance or rejection of the request.
 */
export const requestPaymentStop = (params: LifecycleParams, payload: FICCancellationRequest, endpointMap: Record<string, string>): Promise<FIResponse> => {
    const { env, ...rest } = params;
    const targetUrl = endpointMap['FIPaymentsStops'];
    if (!targetUrl) throw new Error(`Endpoint for 'FIPaymentsStops' not found.`);
    
    return executeLifecycleProxy(targetUrl, '/v3/payments/stops', { ...rest, payload, requestType: 'STOP_REQUEST' });
};

/**
 * Submits a reconfirmation or a rejection in response to a prior inquiry about a payment.
 * @param params The base lifecycle parameters.
 * @param payload The reconfirmation payload identifying the transaction and reason.
 * @param confirmationType Whether to reconfirm ('RECNFRM') or reject ('RJCTCNFRM') the payment.
 * @param endpointMap A map of service names to their environment-specific URLs.
 * @returns A promise resolving with the FIResponse.
 */
export const requestPaymentReconfirmation = (
    params: LifecycleParams,
    payload: FIReconfirmationRequest,
    confirmationType: 'RECNFRM' | 'RJCTCNFRM',
    endpointMap: Record<string, string>
): Promise<FIResponse> => {
    const { env, ...rest } = params;
    const targetUrl = endpointMap['FIPayments'];
    if (!targetUrl) throw new Error(`Endpoint for 'FIPayments' not found.`);
    
    return executeLifecycleProxy(targetUrl, '/v3/payments/reconfirmations', { ...rest, payload, requestType: confirmationType });
};