/**
 * ==================================================================================
 * ==                                                                              ==
 * ==          CITICONNECT PAYMENTS: THE UNABRIDGED DATA ONTOLOGY                  ==
 * ==                                                                              ==
 * ==   This file contains the complete, unabridged set of TypeScript interfaces   ==
 * ==     synthesized from the CitiConnect Payment Services Swagger v2.0 YAML.     ==
 * ==    It represents the absolute data contract for all service interactions.    ==
 * ==                                                                              ==
 * ==================================================================================
 * @license SPDX-License-Identifier: Apache-2.0
 */

// --- Foundational Enumerations & Aliases ---

/**
 * Defines the operational environments for the CitiConnect API.
 * The selection of an environment dictates the target URL for all API calls.
 */
export type CitiConnectEnvironment = 'SIT5' | 'UAT1' | 'UAT2' | 'PTE' | 'PROD' | 'Sandbox';

/**
 * Supported Content-Type headers for payment initiation.
 */
export type PaymentContentType = 'application/json' | 'application/xml';

/**
 * The reason code for a payment stop/recall request.
 * Based on ISO 20022 `camt.056` and common usage.
 * @example "DUPL" for Duplicate Payment
 * @example "CUST" for Customer Request
 */
export type CancellationReasonCode = 'DUPL' | 'CUST' | 'TECH' | 'FRAUD' | string;

/**
 * The reason code for a payment reconfirmation or rejection.
 * @example "MS03"
 */
export type ReconfirmationReasonCode = 'MS03' | string;


// --- Core Data Structures (from `definitions`) ---

/**
 * A detailed breakdown of a single API error.
 */
export interface ErrorDetail {
    /**
     * Corrective action to be taken by the client to resolve the reported issue.
     * @maxLength 350
     */
    action: string;
    /**
     * A detailed, human-readable description of the specific issue encountered.
     * @maxLength 200
     */
    issue: string;
}

/**
 * A standard error payload returned by multiple CitiConnect endpoints upon failure.
 */
export interface StandardErrorResponse {
    /**
     * A list of all errors that occurred during the request processing.
     */
    errors: ErrorDetail[];
    /**
     * The HTTP status code associated with this error response (e.g., 400, 500).
     */
    http_code: number;
    /**
     * A high-level status string indicating the overall result of the request.
     * Typically "FAILED".
     * @maxLength 6
     */
    status: string;
}

/**
 * The request body payload for initiating a payment cancellation or stop request.
 * One of `uetr`, `citi_reference` (with `interbank_settlement_date`), or `instruction_id` (with `interbank_settlement_date`) is mandatory.
 */
export interface FICCancellationRequest {
    /**
     * The unique Product Processor Reference Number for the transaction.
     * @maxLength 32
     */
    citi_reference?: string;
    /**
     * The unique, client-provided end-to-end reference for the transaction.
     * @maxLength 35
     */
    end_to_end_id?: string;
    /**
     * The unique, client-provided instruction ID for the transaction.
     * @maxLength 35
     */
    instruction_id?: string;
    /**
     * The value date (in `yyyy-MM-dd` format) of the original transaction. Required if not using `uetr`.
     */
    interbank_settlement_date?: string;
    /**
     * The four-digit cancellation reason code.
     */
    reason: CancellationReasonCode;
    /**
     * Further details elaborating on the cancellation reason. Required for specific reason codes like 'CUST'.
     * @maxLength 150
     */
    reason_description?: string;
    /**
     * The Unique End-to-end Transaction Reference (UETR) in UUID v4 format. This is the globally unique transaction identifier.
     */
    uetr?: string;
}

/**
 * The request body payload for reconfirming or rejecting a previously queried FI payment.
 * One of `uetr`, `citi_reference` (with `interbank_settlement_date`), or `instruction_id` (with `interbank_settlement_date`) is mandatory.
 */
export interface FIReconfirmationRequest {
    /**
     * The unique Product Processor Reference Number for the transaction.
     * @maxLength 32
     */
    citi_reference?: string;
    /**
     * The unique instruction ID that identifies the transaction.
     * @maxLength 35
     */
    instruction_id?: string;
    /**
     * The value date (in `yyyy-MM-dd` format) of the original transaction. Required if not using `uetr`.
     */
    interbank_settlement_date?: string; // format: date
    /**
     * The five-digit reconfirmation or rejection reason code.
     * @maxLength 5
     */
    reason: ReconfirmationReasonCode;
    /**
     * The Unique End-to-end Transaction Reference (UETR) in UUID v4 format.
     */
    uetr?: string;
}

/**
 * A standardized response structure for financial instrument (FI) lifecycle events.
 */
export interface FIResponse {
    transaction_status: {
        /**
         * Indicates the resulting status of the request (e.g., 'ACCP' for Accepted, 'RJCT' for Rejected).
         * @maxLength 4
         */
        status: string;
        /**
         * Additional human-readable information about the transaction's status.
         * @maxLength 500
         */
        type?: string;
    };
}

/**
 * Request payload for the primary `/payments` and `/payment/initiation` endpoints.
 */
export interface PaymentsRequest {
    /**
     * The complete ISO 20022 XML payment message (e.g., `pain.001.001.03`), encoded in Base64.
     */
    paymentBase64: string;
}

/**
 * Response payload for the primary `/payments` and `/payment/initiation` endpoints.
 */
export interface PaymentsResponse {
    /**
     * The Payment Status Report (PSR) document (e.g., `pain.002.001.10`), encoded in Base64.
     */
    psrDocument: string;
}

/**
 * A specialized, simpler error format used by some legacy payment endpoints.
 */
export interface PaymentsErrorResponse {
    /**
     * A unique tracking ID for the specific request that failed.
     */
    correlationId: string;
    /**
     * A human-readable message describing the error.
     */
    message: string;
    /**
     * The error status code.
     */
    status: string;
}


// --- Composite & Contextual Types ---

/**
 * Defines the parameters for a `POST /payment/inquiry` call.
 */
export interface PaymentInquiryPostPayload {
    EndToEndId: string;
    CreDt?: string; // YYYY-MM-DD
    InstdAmt?: number;
    Ccy?: string;
    ReqdExctnDt?: string; // YYYY-MM-DD
}

/**
 * Defines the query parameters for a `GET /payment/inquiry` call.
 */
export interface PaymentInquiryGetParams {
    endToEndId?: string;
    globalTranNo?: string;
    creationDate?: string;
    amount?: string;
    requiredExecutionDate?: string;
    directDebitInd?: string;
}