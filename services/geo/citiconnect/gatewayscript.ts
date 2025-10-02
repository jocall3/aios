// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

/**
 * ==================================================================================
 * ==                                                                              ==
 * ==          CITICONNECT GATEWAYSCRIPT: LOGIC RECONSTRUCTION MODULE              ==
 * ==                                                                              ==
 * ==   This file contains a complete, typed, and fully implemented TypeScript     ==
 * ==    reconstruction of the business logic embedded within the IBM DataPower    ==
 * ==      gatewayscript sections of the original CitiConnect Swagger YAML.        ==
 * ==                                                                              ==
 * ==================================================================================
 * @license SPDX-License-Identifier: Apache-2.0
 */

import type { PaymentContentType } from './types';

/**
 * Defines the raw inputs required before header construction.
 * These are the variables that the original gatewayscript would read
 * from the API Management context.
 */
export interface RequestContextParams {
    /**
     * The `Content-Type` header of the incoming request. Determines the `sourceContent` variable.
     */
    contentType: PaymentContentType;
    /**
     * The end-user's IP address. Corresponds to `x-archived-client-ip`.
     */
    clientIp: string;
    /**
     * The name of the application making the request, used to determine if it is internal traffic.
     * Corresponds to `clientapp_name`.
     */
    clientAppName: string;
    /**
     * The OAuth2 Bearer token for authenticating the request.
     */
    accessToken: string;
    /**
     * The client_id associated with the application.
     */
    clientId: string;
    /**
     * An optional flag indicating the request should be routed via the Akamai endpoint.
     * Corresponds to `icg-akamai-b2b-flag`.
     */
    isAkamai?: boolean;
    /**
     * An optional header for payment lifecycle services like stops and reconfirmations.
     * Corresponds to `request_type`.
     */
    requestType?: 'STOP_REQUEST' | 'RECNFRM' | 'RJCTCNFRM';
}

/**
 * Builds the complete, compliant set of HTTP headers required for a CitiConnect API request.
 * This function is a pure, testable reconstruction of the imperative gatewayscript logic,
 * transforming high-level intent into the specific key-value pairs the backend expects.
 *
 * @param params - The contextual parameters for the request.
 * @returns A fully constructed `Headers` object ready to be used in a `fetch` call.
 */
export const buildRequestContextHeaders = (params: RequestContextParams): Headers => {
    
    // Logic from the first switch: apim.getvariable('request.headers.content-type')
    // apim.setvariable("request.headers.sourceContent", "json" | "xml");
    // apim.setvariable("message.headers.sourceContent", "json" | "xml");
    // apim.setvariable("request.headers.Content-Type", "application/json" | "application/xml");
    const sourceContent = params.contentType === 'application/json' ? 'json' : 'xml';
    
    // Logic reconstructed from: if("ccapidevportal_internal" == appname)
    // apim.setvariable("request.headers.portalTraffic", "Y" | "N");
    const portalTraffic = params.clientAppName === 'ccapidevportal_internal' ? 'Y' : 'N';

    // Base header construction
    const headers = new Headers();
    
    // These headers are set based on the gatewayscript's logic for every relevant operation.
    headers.set('Authorization', `Bearer ${params.accessToken}`);
    headers.set('Content-Type', params.contentType);
    headers.set('client_id', params.clientId);
    
    // Custom variables that were being set on the message/request context for backend processing.
    // We prefix with 'X-' to follow standard custom header conventions.
    headers.set('X-Source-Content', sourceContent);
    headers.set('X-Portal-Traffic', portalTraffic);
    headers.set('X-Client-IP-Address', params.clientIp);

    // Add optional headers based on the context of the specific API call.
    if (params.requestType) {
        headers.set('request_type', params.requestType);
    }

    if (params.isAkamai) {
        headers.set('icg-akamai-b2b-flag', 'true');
    }

    // Add a unique tracing ID, a best practice for enterprise systems.
    headers.set('X-Request-ID', `engine-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`);

    return headers;
};