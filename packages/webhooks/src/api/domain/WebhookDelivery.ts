import type { GenericRecord } from "@webiny/api/types.js";

export type WebhookDeliveryStatus = "pending" | "delivering" | "delivered" | "failed";

/* Shape of webhook delivery data stored in the CMS (compressed strings). */
export interface WebhookDeliveryCmsEntry {
    id: string;
    createdOn: string;
    savedOn: string;
    expiresAt: string;
    values: {
        webhookId: string;
        backgroundTaskId: string | null;
        eventType: string;
        status: WebhookDeliveryStatus;
        /* Compressed stringified payload. */
        payload: string;
        /* Compressed stringified request headers. */
        requestHeaders: string | null;
        responseTime: number | null;
        responseStatus: number | null;
        /* Compressed stringified response headers. */
        responseHeaders: string | null;
        /* Compressed stringified response body. */
        responseBody: string | null;
    };
}

/* Flat runtime shape with decompressed fields. */
export interface WebhookDelivery {
    id: string;
    createdOn: string;
    savedOn: string;
    webhookId: string;
    backgroundTaskId: string | null;
    eventType: string;
    status: WebhookDeliveryStatus;
    payload: GenericRecord;
    /* Decompressed request headers. */
    requestHeaders: GenericRecord | null;
    responseTime: number | null;
    responseStatus: number | null;
    /* Decompressed response headers. */
    responseHeaders: GenericRecord | null;
    /* Decompressed response body (raw text). */
    responseBody: string | null;
}
