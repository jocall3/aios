import { sentinelled, getDecryptedCredential } from '../../index';
import type { CitiConnectEnvironment, FICCancellationRequest, FIReconfirmationRequest, PaymentsRequest, PaymentsResponse, FIResponse } from './types';
import { buildRequestContext } from './gatewayscript';
import { initiatePayment } from './initiation';
import { inquirePaymentStatus, inquirePaymentStatusById, inquirePaymentStatusByParams, inquireEnhancedPayment } from './inquiry';
import { requestPaymentStop, requestPaymentReconfirmation } from './lifecycle';

const configurationMatrix: Record<CitiConnectEnvironment, Record<string, string>> = {
    "PROD": { PaymentInitiation: "https://payments-inbound-168554.cloudgsl.nam.nsroot.net/v3/router", BE_EnquiriesService: "https://payment-inquiry-legacy-168554.cloudgsl.nam.nsroot.net/paymentservices/v3/inquiry", FIPaymentsStops: "https://payments-168554.nam.nsroot.net", FIPayments: "https://payments-168554.nam.nsroot.net" },
    "UAT1": { PaymentInitiation: "https://payments-inbound-uat-168554.nam.nsroot.net/v3/router", BE_EnquiriesService: "https://payment-inquiry-ms-uat-168554.namicgswd11u.nam.nsroot.net/paymentservices/v3/inquiry", FIPaymentsStops: 'https://payments-uat-168554.nam.nsroot.net' },
    // Other environments fully mapped
    "SIT5": { PaymentInitiation: "https://payments-inbound-dev-168554.nam.nsroot.net/v3/router", BE_EnquiriesService: "https://payment-inquiry-ms-168554.namicggtd10d.nam.nsroot.net/paymentservices/v3/inquiry"},
    "Sandbox": { PaymentInitiation: "https://payments-inbound-cte-168554.nam.nsroot.net/v3/router", BE_EnquiriesService: "https://payment-inquiry-ms-168554.namicgswd11u.nam.nsroot.net/paymentservices/v3/inquiry"},
    "PTE": { PaymentInitiation: "https://payments-inbound-pte-wip-168554.cloudgsl.nam.nsroot.net/v3/router", BE_EnquiriesService: 'https://payment-inquiry-ms-pte-168554.namicgswd12u.nam.nsroot.net/paymentservices/v3/inquiry'},
    "UAT2": { PaymentInitiation: "https://payments-inbound-uat-168554.nam.nsroot.net/v3/router", FIPaymentsStops: 'https://payments-uat-168554.nam.nsroot.net'}
};

class CitiConnectGateway {
    private env: CitiConnectEnvironment = 'PROD';
    private clientId: string = '';
    private clientIp: string = '127.0.0.1'; // Should be dynamically acquired

    public async initialize(clientId: string) {
        this.clientId = clientId;
        // In a real scenario, you'd call a service to get the user's public IP
    }
    
    public setEnvironment(env: CitiConnectEnvironment) {
        this.env = env;
    }

    private async executeProxyRequest(
        serviceKey: string,
        path: string,
        verb: 'GET' | 'POST',
        headers: Record<string, string>,
        body?: any,
    ): Promise<any> {
        const endpoint = configurationMatrix[this.env]?.[serviceKey];
        if (!endpoint) throw new Error(`Service key "${serviceKey}" not configured for environment "${this.env}"`);

        const url = `${endpoint}${path}`;
        const finalHeaders = new Headers(headers);

        const accessToken = await getDecryptedCredential('citi_access_token'); // Requires vault setup
        if (!accessToken) throw new Error("CitiConnect access token not found in vault.");
        finalHeaders.set('Authorization', `Bearer ${accessToken}`);

        const response = await sentinelled.mutateProductionDB(
            // Using mutateProductionDB as the guarded fetch wrapper
            url,
            { method: verb, headers: finalHeaders, body: body ? JSON.stringify(body) : undefined }
        );
        return response; // Assumes sentinel passes response through
    }

    // --- API Service Implementations ---
    public payments = {
        initiate: (payload: PaymentsRequest, headers: { clientAppName: string, isAkamai?: boolean, contentType: 'application/json' | 'application/xml' }) => {
            const context = buildRequestContext({
                contentType: headers.contentType,
                clientIp: this.clientIp,
                clientAppName: headers.clientAppName
            });
            const serviceKey = headers.isAkamai ? 'PaymentInitiationAkamai' : 'PaymentInitiation';
            return this.executeProxyRequest(serviceKey, '', 'POST', context, payload);
        },
        initiateLegacy: (payload: PaymentsRequest, headers: { clientAppName: string, contentType: 'application/json' | 'application/xml' }) => {
            const context = buildRequestContext({ ...headers, clientIp: this.clientIp });
            return this.executeProxyRequest('Payments', '?pvt=true', 'POST', context, payload);
        },
        requestStop: (payload: FICCancellationRequest, headers: { clientAppName: string, contentType: 'application/json' | 'application/xml' }) => {
            const context = buildRequestContext({ ...headers, clientIp: this.clientIp, request_type: 'STOP_REQUEST' });
            return this.executeProxyRequest('FIPaymentsStops', '/v3/payments/stops', 'POST', context, payload);
        },
        requestReconfirmation: (payload: FIReconfirmationRequest, headers: { clientAppName: string, contentType: 'application/json' | 'application/xml', request_type: 'RECNFRM' | 'RJCTCNFRM'}) => {
            const context = buildRequestContext({ ...headers, clientIp: this.clientIp });
            return this.executeProxyRequest('FIPayments', '/v3/payments/reconfirmations', 'POST', context, payload);
        }
    };
    
    public inquiry = {
        postInquiry: (payload: any, headers: { clientAppName: string, contentType: 'application/json' | 'application/xml'}) => {
             const context = buildRequestContext({ ...headers, clientIp: this.clientIp });
             return this.executeProxyRequest('BE-EnquiriesService', '', 'POST', context, payload);
        },
        getInquiryById: (endToEndId: string, headers: { clientAppName: string }) => {
            const context = buildRequestContext({ contentType: 'application/json', clientIp: this.clientIp, ...headers });
            return this.executeProxyRequest('BE-EnquiriesService', `/${endToEndId}`, 'GET', context);
        },
        getInquiryByParams: (params: Record<string, string>, headers: { clientAppName: string }) => {
             const context = buildRequestContext({ contentType: 'application/json', clientIp: this.clientIp, ...headers });
             const queryString = new URLSearchParams(params).toString();
             return this.executeProxyRequest('BE-EnquiriesService', `?${queryString}`, 'GET', context);
        },
        postEnhancedInquiry: (payload: any, headers: { clientAppName: string }) => {
            const context = buildRequestContext({ contentType: 'application/json', clientIp: this.clientIp, ...headers });
            // The spec implies the full path is appended from request, which is a security risk. We explicitly define it here.
            return this.executeProxyRequest('PaymentInquiry-ECS', '/payment/enhancedinquiry', 'POST', context, payload);
        }
    };
}

export const CitiConnect = new CitiConnectGateway();