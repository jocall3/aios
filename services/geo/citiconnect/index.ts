import { getDecryptedCredential } from '../../index';
import type { CitiConnectEnvironment, FICCancellationRequest, FIReconfirmationRequest, PaymentsRequest, PaymentsResponse, FIResponse } from './types';
import { buildRequestContextHeaders } from './gatewayscript';
import { initiatePayment, initiateLegacyPayment } from './initiation';
import { inquirePaymentStatus, inquirePaymentStatusById, inquirePaymentStatusByParams, inquireEnhancedPayment } from './inquiry';
import { requestPaymentStop, requestPaymentReconfirmation } from './lifecycle';

const configurationMatrix: Record<CitiConnectEnvironment, Record<string, string>> = {
    "PROD": { PaymentInitiation: "https://payments-inbound-168554.cloudgsl.nam.nsroot.net/v3/router", PaymentInitiationAkamai: "https://payments-inbound-168554.wlb3.nam.nsroot.net/v3/router", BE_EnquiriesService: "https://payment-inquiry-legacy-168554.cloudgsl.nam.nsroot.net/paymentservices/v3/inquiry", FIPaymentsStops: "https://payments-168554.nam.nsroot.net", FIPayments: "https://payments-168554.nam.nsroot.net", PaymentInquiryECS: "https://payment-inquiry-168554.cloudgsl.nam.nsroot.net"},
    "UAT1": { PaymentInitiation: "https://payments-inbound-uat-168554.nam.nsroot.net/v3/router", BE_EnquiriesService: "https://payment-inquiry-ms-uat-168554.namicgswd11u.nam.nsroot.net/paymentservices/v3/inquiry", FIPaymentsStops: 'https://payments-uat-168554.nam.nsroot.net' },
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
    
    // --- API Service Implementations ---
    public payments = {
        initiate: async (payload: PaymentsRequest, headers: { clientAppName: string, isAkamai?: boolean, contentType: 'application/json' | 'application/xml' }) => {
            const accessToken = await getDecryptedCredential('citi_access_token');
            if(!accessToken) throw new Error("Not authenticated");
            const endpointMap = configurationMatrix[this.env];
            return initiatePayment({
                env: this.env,
                payload,
                accessToken,
                clientId: this.clientId,
                clientIp: this.clientIp,
                clientAppName: headers.clientAppName,
                isAkamai: headers.isAkamai
            }, endpointMap);
        },
        initiateLegacy: async (payload: PaymentsRequest, headers: { clientAppName: string, contentType: 'application/json' | 'application/xml' }) => {
            const accessToken = await getDecryptedCredential('citi_access_token');
            if(!accessToken) throw new Error("Not authenticated");
            const endpointMap = configurationMatrix[this.env];
            return initiateLegacyPayment({
                env: this.env,
                payload,
                accessToken,
                clientId: this.clientId,
                clientIp: this.clientIp,
                clientAppName: headers.clientAppName,
            }, endpointMap);
        },
        requestStop: async (payload: FICCancellationRequest, headers: { clientAppName: string, contentType: 'application/json' | 'application/xml' }) => {
             const accessToken = await getDecryptedCredential('citi_access_token');
            if(!accessToken) throw new Error("Not authenticated");
            const endpointMap = configurationMatrix[this.env];
            return requestPaymentStop({
                 env: this.env,
                 accessToken,
                 clientId: this.clientId,
                 clientIp: this.clientIp,
                 ...headers
            }, payload, endpointMap);
        },
        requestReconfirmation: async (payload: FIReconfirmationRequest, headers: { clientAppName: string, contentType: 'application/json' | 'application/xml', request_type: 'RECNFRM' | 'RJCTCNFRM'}) => {
            const accessToken = await getDecryptedCredential('citi_access_token');
            if(!accessToken) throw new Error("Not authenticated");
            const endpointMap = configurationMatrix[this.env];
             return requestPaymentReconfirmation({
                 env: this.env,
                 accessToken,
                 clientId: this.clientId,
                 clientIp: this.clientIp,
                 contentType: headers.contentType,
                 clientAppName: headers.clientAppName
             }, payload, headers.request_type, endpointMap);
        }
    };
    
    public inquiry = {
        postInquiry: async (payload: any, headers: { clientAppName: string, contentType: 'application/json' | 'application/xml'}) => {
            const accessToken = await getDecryptedCredential('citi_access_token');
            if(!accessToken) throw new Error("Not authenticated");
            const endpointMap = configurationMatrix[this.env];
             return inquirePaymentStatus({
                 env: this.env,
                 accessToken,
                 clientId: this.clientId,
                 clientIp: this.clientIp,
                 ...headers
             }, payload, endpointMap);
        },
        getInquiryById: async (endToEndId: string, headers: { clientAppName: string }) => {
            const accessToken = await getDecryptedCredential('citi_access_token');
            if(!accessToken) throw new Error("Not authenticated");
            const endpointMap = configurationMatrix[this.env];
            return inquirePaymentStatusById({
                 env: this.env,
                 accessToken,
                 clientId: this.clientId,
                 clientIp: this.clientIp,
                 ...headers
            }, endToEndId, endpointMap);
        },
        getInquiryByParams: async (params: Record<string, string>, headers: { clientAppName: string }) => {
            const accessToken = await getDecryptedCredential('citi_access_token');
            if(!accessToken) throw new Error("Not authenticated");
            const endpointMap = configurationMatrix[this.env];
            return inquirePaymentStatusByParams({
                 env: this.env,
                 accessToken,
                 clientId: this.clientId,
                 clientIp: this.clientIp,
                 ...headers
            }, params, endpointMap);
        },
        postEnhancedInquiry: async (payload: any, headers: { clientAppName: string }) => {
            const accessToken = await getDecryptedCredential('citi_access_token');
            if(!accessToken) throw new Error("Not authenticated");
            const endpointMap = configurationMatrix[this.env];
            return inquireEnhancedPayment({
                 env: this.env,
                 accessToken,
                 clientId: this.clientId,
                 clientIp: this.clientIp,
                 ...headers
            }, payload, endpointMap);
        }
    };
}

export const CitiConnect = new CitiConnectGateway();