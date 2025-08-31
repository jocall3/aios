/**
 * ==================================================================================
 * ==                                                                              ==
 * ==                   CITICONNECT PAYMENTS: INITIATION SERVICE                   ==
 * ==                                                                              ==
 * ==   This file contains the complete, live implementation for all endpoints     ==
 * ==       related to the initiation of new payments, synthesized from            ==
 * ==                  the CitiConnect Payment Services Swagger.                   ==
 * ==                                                                              ==
 * ==================================================================================
 * @license SPDX-License-Identifier: Apache-2.0
 */

import type { 
    CitiConnectEnvironment, 
    PaymentContentType,
    PaymentsRequest,
    PaymentsResponse,
    PaymentsErrorResponse
} from './types';
import { buildRequestContextHeaders } from './gatewayscript';

/**
 * The core proxy function for this module, responsible for making the final fetch call.
 * This is an internal function not intended for direct use. It assumes the request
 * is being sent to a single, unified routing endpoint.
 */
const executeInitiationProxy = async (
    targetUrl: string, 
    params: {
        payload: PaymentsRequest;
        contentType: PaymentContentType;
        accessToken: string;
        clientId: string;
        clientAppName: string;
        clientIp: string;
        isAkamai?: boolean;
        isPvt?: boolean; // For legacy /payments endpoint
    }
): Promise<PaymentsResponse> => {

    const contextParams = {
        contentType: params.contentType,
        clientIp: params.clientIp,
        clientAppName: params.clientAppName,
        accessToken: params.accessToken,
        clientId: params.clientId,
        isAkamai: params.isAkamai,
    };
    
    const headers = buildRequestContextHeaders(contextParams);
    
    const url = new URL(targetUrl);
    if(params.isPvt) {
        url.searchParams.set('pvt', 'true');
    }

    const response = await fetch(url.toString(), {
        method: 'POST',
        headers,
        body: params.contentType === 'application/xml' 
            ? `<Request><paymentBase64>${params.payload.paymentBase64}</paymentBase64></Request>` 
            : JSON.stringify(params.payload),
    });

    if (!response.ok) {
        // The API returns different error structures, we must handle this.
        const errorPayload: PaymentsErrorResponse | StandardErrorResponse = await response.json().catch(()=>({ message: "Unknown error format"}));
        
        const errorMessage = (errorPayload as any).errors?.[0]?.issue 
                           || (errorPayload as PaymentsErrorResponse).message 
                           || `HTTP ${response.status}: ${response.statusText}`;

        throw new Error(errorMessage);
    }
    
    const responseData = await response.json();
    return responseData as PaymentsResponse;
};

/**
 * Describes the complete set of parameters for initiating a payment.
 */
export interface InitiationParams {
    /** The operational environment (PROD, UAT1, etc.) */
    env: CitiConnectEnvironment;
    /** The Base64 encoded ISO XML payment payload. */
    payload: PaymentsRequest;
    /** The OAuth2 access token for the session. */
    accessToken: string;
    /** The application's unique client_id. */
    clientId: string;
    /** The end-user's IP address for auditing. */
    clientIp: string;
    /** The application name for routing logic (e.g., ccapidevportal_internal). */
    clientAppName: string;
    /** Indicates if the request should be routed via Akamai edge infrastructure. */
    isAkamai?: boolean;
}

/**
 * Initiates a new payment using the primary `/payment/initiation` endpoint.
 * This function orchestrates context building and proxy execution for a modern payment flow.
 *
 * @param params The complete set of parameters for the initiation request.
 * @param endpointMap A map of service names to their environment-specific URLs.
 * @returns A promise that resolves with the PaymentsResponse containing the PSR document.
 */
export const initiatePayment = (params: InitiationParams, endpointMap: Record<string, string>): Promise<PaymentsResponse> => {
    const { env, ...rest } = params;
    const serviceKey = params.isAkamai ? 'PaymentInitiationAkamai' : 'PaymentInitiation';
    const targetUrl = endpointMap[serviceKey];
    
    if (!targetUrl) {
        throw new Error(`Endpoint for service "${serviceKey}" not found in provided environment map.`);
    }

    return executeInitiationProxy(targetUrl, { 
        ...rest, 
        contentType: 'application/json' // Defaulting to JSON for modern wrapper, spec supports XML
    });
};

/**
 * Initiates a new payment using the legacy `/payments` endpoint.
 * This is maintained for compatibility with systems that may require the `pvt=true` parameter.
 *
 * @param params The complete set of parameters for the initiation request.
 * @param endpointMap A map of service names to their environment-specific URLs.
 * @returns A promise that resolves with the PaymentsResponse.
 */
export const initiateLegacyPayment = (params: InitiationParams, endpointMap: Record<string, string>): Promise<PaymentsResponse> => {
    const { env, ...rest } = params;
    const serviceKey = 'Payments';
    const targetUrl = endpointMap[serviceKey];

    if (!targetUrl) {
        throw new Error(`Endpoint for service "${serviceKey}" not found in provided environment map.`);
    }
    
    return executeInitiationProxy(targetUrl, { 
        ...rest, 
        isPvt: true,
        contentType: 'application/json' 
    });
};