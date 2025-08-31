/**
 * ==================================================================================
 * ==                                                                              ==
 * ==         CITICONNECT PAYMENTS: UNIFIED MONOLITHIC GATEWAY v1.0                ==
 * ==                                                                              ==
 * ==   All types, logic, and endpoint implementations for the CitiConnect API     ==
 * ==    are contained within this single, self-sufficient, stateful service.      ==
 * ==                                                                              ==
 * ==================================================================================
 * @license SPDX-License-Identifier: Apache-2.0
 */


// ==================================================================================
// == SECTION I: UNIFIED DATA ONTOLOGY (INLINED TYPES)                             ==
// ==================================================================================
export type CitiConnectEnvironment = 'SIT5' | 'UAT1' | 'UAT2' | 'PTE' | 'PROD' | 'Sandbox';
export type PaymentContentType = 'application/json' | 'application/xml';
export interface FICCancellationRequest { citi_reference?: string; end_to_end_id?: string; instruction_id?: string; interbank_settlement_date?: string; reason: string; reason_description?: string; uetr?: string; }
export interface FIReconfirmationRequest { citi_reference?: string; instruction_id?: string; interbank_settlement_date?: string; reason: string; uetr?: string; }
export interface PaymentsRequest { paymentBase64: string; }
export interface PaymentsResponse { psrDocument: string; }
export interface FIResponse { transaction_status: { status: string; type?: string; }; }
export interface PaymentsErrorResponse { correlationId: string; message: string; status: string; }
export interface PaymentInquiryPostPayload { EndToEndId: string; CreDt?: string; InstdAmt?: number; Ccy?: string; ReqdExctnDt?: string; }
export interface PaymentInquiryGetParams { endToEndId?: string; globalTranNo?: string; creationDate?: string; amount?: string; requiredExecutionDate?: string; }


// ==================================================================================
// == SECTION II: GATEWAY SINGLETON IMPLEMENTATION                                 ==
// ==================================================================================
const configurationMatrix: Record<CitiConnectEnvironment, Record<string, string>> = {
    "PROD": { PaymentInitiation: "https://payments-inbound-168554.cloudgsl.nam.nsroot.net/v3/router", PaymentInitiationAkamai: "https://payments-inbound-168554.wlb3.nam.nsroot.net/v3/router", BE_EnquiriesService: "https://payment-inquiry-legacy-168554.cloudgsl.nam.nsroot.net/paymentservices/v3/inquiry", FIPaymentsStops: "https://payments-168554.nam.nsroot.net", FIPayments: "https://payments-168554.nam.nsroot.net", PaymentInquiryECS: "https://payment-inquiry-168554.cloudgsl.nam.nsroot.net"},
    "UAT1": { PaymentInitiation: "https://payments-inbound-uat-168554.nam.nsroot.net/v3/router", BE_EnquiriesService: "https://payment-inquiry-ms-uat-168554.namicgswd11u.nam.nsroot.net/paymentservices/v3/inquiry", FIPaymentsStops: 'https://payments-uat-168554.nam.nsroot.net' },
    "SIT5": { PaymentInitiation: "https://payments-inbound-dev-168554.nam.nsroot.net/v3/router", BE_EnquiriesService: "https://payment-inquiry-ms-168554.namicggtd10d.nam.nsroot.net/paymentservices/v3/inquiry"},
    "Sandbox": { PaymentInitiation: "https://payments-inbound-cte-168554.nam.nsroot.net/v3/router", BE_EnquiriesService: "https://payment-inquiry-ms-168554.namicgswd11u.nam.nsroot.net/paymentservices/v3/inquiry"},
    "PTE": { PaymentInitiation: "https://payments-inbound-pte-wip-168554.cloudgsl.nam.nsroot.net/v3/router", BE_EnquiriesService: 'https://payment-inquiry-ms-pte-168554.namicgswd12u.nam.nsroot.net/paymentservices/v3/inquiry'},
    "UAT2": { PaymentInitiation: "https://payments-inbound-uat-168554.nam.nsroot.net/v3/router", FIPaymentsStops: 'https://payments-uat-168554.nam.nsroot.net'}
};

interface BaseRequestContext {
    clientAppName: string;
    isAkamai?: boolean;
    contentType: PaymentContentType;
}

class CitiConnectGateway {
    private env: CitiConnectEnvironment = 'PROD';
    private clientId: string = '';
    private clientIp: string = '192.168.1.1';
    private accessToken: string | null = null;
    private initialized: boolean = false;

    public async initialize(clientId: string): Promise<void> {
        this.clientId = clientId;
        this.accessToken = await getDecryptedCredential('citi_access_token');
        if (!this.accessToken) {
            throw new Error("CitiConnectGateway Initialization Failed: Access Token not found in vault.");
        }
        this.initialized = true;
    }

    public setEnvironment(env: CitiConnectEnvironment): void { this.env = env; }

    private buildHeaders(context: BaseRequestContext & { request_type?: string }): Headers {
        const headers = new Headers();
        const sourceContent = context.contentType === 'application/json' ? 'json' : 'xml';
        const portalTraffic = context.clientAppName === 'ccapidevportal_internal' ? 'Y' : 'N';
        
        headers.set('Authorization', `Bearer ${this.accessToken}`);
        headers.set('Content-Type', context.contentType);
        headers.set('client_id', this.clientId);
        headers.set('X-Client-IP-Address', this.clientIp);
        headers.set('X-Source-Content', sourceContent);
        headers.set('X-Portal-Traffic', portalTraffic);
        if (context.isAkamai) headers.set('icg-akamai-b2b-flag', 'true');
        if (context.request_type) headers.set('request_type', context.request_type);
        headers.set('X-Request-ID', `engine-${Date.now()}`);
        
        return headers;
    }
    
    private async execute(
        serviceKey: string,
        path: string,
        verb: 'GET' | 'POST',
        context: BaseRequestContext & { request_type?: string },
        body?: any,
    ): Promise<any> {
        if (!this.initialized) throw new Error("CitiConnectGateway is not initialized.");
        const endpoint = configurationMatrix[this.env]?.[serviceKey];
        if (!endpoint) throw new Error(`Service key "${serviceKey}" not configured for "${this.env}".`);

        const headers = this.buildHeaders(context);
        const url = `${endpoint}${path}`;
        const options = { method: verb, headers, body: body ? JSON.stringify(body) : undefined };
        
        const response = await sentinelled.mutateProductionDB(url, options as any); // Use guarded fetch
        if (!response.ok) throw new Error(`CitiConnect API Error (${response.status}): ${await response.text()}`);
        return response.json();
    }
    
    // --- Public API Surface ---
    public payments = {
        initiate: (p: PaymentsRequest, ctx: BaseRequestContext) => this.execute(ctx.isAkamai ? 'PaymentInitiationAkamai' : 'PaymentInitiation', '', 'POST', ctx, p),
        initiateLegacy: (p: PaymentsRequest, ctx: BaseRequestContext) => this.execute('Payments', '?pvt=true', 'POST', ctx, p),
        requestStop: (p: FICCancellationRequest, ctx: BaseRequestContext) => this.execute('FIPaymentsStops', '/v3/payments/stops', 'POST', {...ctx, request_type: 'STOP_REQUEST'}, p),
        requestReconfirmation: (p: FIReconfirmationRequest, ctx: BaseRequestContext, type: 'RECNFRM' | 'RJCTCNFRM') => this.execute('FIPayments', '/v3/payments/reconfirmations', 'POST', {...ctx, request_type: type}, p),
    };
    
    public inquiry = {
        byPayload: (p: PaymentInquiryPostPayload, ctx: BaseRequestContext) => this.execute('BE_EnquiriesService', '', 'POST', ctx, p),
        byId: (id: string, ctx: BaseRequestContext) => this.execute('BE_EnquiriesService', `/${id}`, 'GET', ctx),
        byParams: (p: PaymentInquiryGetParams, ctx: BaseRequestContext) => {
            const query = new URLSearchParams(p as Record<string,string>).toString();
            return this.execute('BE_EnquiriesService', `?${query}`, 'GET', ctx);
        },
        enhanced: (p: any, ctx: BaseRequestContext) => {
            const base = new URL(configurationMatrix[this.env]['PaymentInquiryECS']).origin;
            return this.execute(base, '/payment/enhancedinquiry', 'POST', ctx, p);
        }
    };
}

/**
 * The single, globally accessible, stateful instance of the CitiConnect Intelligent Gateway.
 */
export const CitiConnect = new CitiConnectGateway();