// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

/**
 * ==================================================================================
 * ==                                                                              ==
 * ==                    CITICONNECT PAYMENTS: INQUIRY SERVICE                     ==
 * ==                                                                              ==
 * ==   This file contains the complete, live implementation for all endpoints     ==
 * ==       related to inquiring about the status of existing payments,            ==
 * ==            synthesized from the CitiConnect Swagger specification.           ==
 * ==                                                                              ==
 * ==================================================================================
 * @license SPDX-License-Identifier: Apache-2.0
 */

import type {
    CitiConnectEnvironment,
    PaymentContentType,
    PaymentInquiryPostPayload,
    PaymentInquiryGetParams
} from './types';
import { buildRequestContextHeaders } from './gatewayscript';

/**
 * The core proxy function for this module, responsible for making the final fetch call.
 * This is an internal function not intended for direct use.
 */
const executeInquiryProxy = async (
    targetUrl: string, 
    path: string,
    verb: 'GET' | 'POST',
    params: {
        accessToken: string;
        clientId: string;
        clientAppName: string;
        clientIp: string;
        contentType?: PaymentContentType;
        body?: any;
    }
): Promise<any> => {

    const contextParams = {
        contentType: params.contentType || 'application/json', // Default to JSON for GETs
        clientIp: params.clientIp,
        clientAppName: params.clientAppName,
        accessToken: params.accessToken,
        clientId: params.clientId,
    };
    
    const headers = buildRequestContextHeaders(contextParams);
    
    const finalUrl = `${targetUrl}${path}`;
    
    const response = await fetch(finalUrl, {
        method: verb,
        headers,
        body: params.body ? JSON.stringify(params.body) : undefined,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ issue: 'Failed to parse error response' }));
        throw new Error(`CitiConnect Inquiry Error (${response.status}): ${errorData.issue || response.statusText}`);
    }
    
    return response.json();
};

/**
 * Base parameters required for any inquiry operation.
 */
export interface InquiryParams {
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
}

/**
 * Submits a payment status inquiry via a POST request with a JSON body.
 * This is the primary method for bulk or detailed inquiries.
 * @param params The base inquiry parameters.
 * @param payload The inquiry payload, containing identifiers like EndToEndId.
 * @param endpointMap A map of service names to their environment-specific URLs.
 * @returns A promise resolving with the status report.
 */
export const inquirePaymentStatus = (params: InquiryParams, payload: PaymentInquiryPostPayload, endpointMap: Record<string, string>): Promise<any> => {
    const { env, ...rest } = params;
    const targetUrl = endpointMap['BE-EnquiriesService'];
    if (!targetUrl) throw new Error(`Endpoint for 'BE-EnquiriesService' not found.`);
    
    return executeInquiryProxy(targetUrl, '', 'POST', { ...rest, contentType: 'application/json', body: payload });
};

/**
 * Retrieves the status of a single payment via its unique EndToEndId in the URL path.
 * @param params The base inquiry parameters.
 * @param endToEndId The unique transaction identifier.
 * @param endpointMap A map of service names to their environment-specific URLs.
 * @returns A promise resolving with the status report.
 */
export const inquirePaymentStatusById = (params: InquiryParams, endToEndId: string, endpointMap: Record<string, string>): Promise<any> => {
    const { env, ...rest } = params;
    const targetUrl = endpointMap['BE-EnquiriesService'];
    if (!targetUrl) throw new Error(`Endpoint for 'BE-EnquiriesService' not found.`);

    return executeInquiryProxy(targetUrl, `/${endToEndId}`, 'GET', { ...rest });
};

/**
 * Retrieves payment statuses using a set of optional query parameters.
 * @param params The base inquiry parameters.
 * @param queryParams A key-value object of query parameters (e.g., { endToEndId, creationDate }).
 * @param endpointMap A map of service names to their environment-specific URLs.
 * @returns A promise resolving with the status report.
 */
export const inquirePaymentStatusByParams = (params: InquiryParams, queryParams: PaymentInquiryGetParams, endpointMap: Record<string, string>): Promise<any> => {
    const { env, ...rest } = params;
    const targetUrl = endpointMap['BE-EnquiriesService'];
    if (!targetUrl) throw new Error(`Endpoint for 'BE-EnquiriesService' not found.`);
    
    const queryString = new URLSearchParams(queryParams as Record<string, string>).toString();
    return executeInquiryProxy(targetUrl, `?${queryString}`, 'GET', { ...rest });
};

/**
 * Submits an "enhanced" payment inquiry, likely to a different or more modern backend service.
 * @param params The base inquiry parameters.
 * @param payload The specific payload for the enhanced inquiry.
 * @param endpointMap A map of service names to their environment-specific URLs.
 * @returns A promise resolving with the enhanced status report.
 */
export const inquireEnhancedPayment = (params: InquiryParams, payload: any, endpointMap: Record<string, string>): Promise<any> => {
    const { env, ...rest } = params;
    // NOTE: The Swagger doc implies the request path is appended, like `$(PaymentInquiry-ECS)$(request.path)`.
    // We explicitly target the known path for security and clarity.
    const path = '/payment/enhancedinquiry'; 
    const targetUrl = endpointMap['PaymentInquiry-ECS'];
    if (!targetUrl) throw new Error(`Endpoint for 'PaymentInquiry-ECS' not found.`);
    
    // We strip the path from the targetUrl base to avoid duplication.
    const urlBase = new URL(targetUrl).origin;
    
    return executeInquiryProxy(urlBase, path, 'POST', { ...rest, contentType: 'application/json', body: payload });
};