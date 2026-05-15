import type { GenericRecord } from "@webiny/api/types.js";

export type WebhookDeliveryStatus = "pending" | "delivering" | "delivered" | "failed";

export interface WebhookDeliveryCmsEntryValues {
    webhookId: string;
    backgroundTaskId: string | null;
    eventType: string;
    status: WebhookDeliveryStatus;
    payload: string;
    requestHeaders: string | null;
    responseTime: number | null;
    responseStatus: number | null;
    responseHeaders: string | null;
    responseBody: string | null;
}

/* Shape of webhook delivery data stored in the CMS. */
export interface WebhookDeliveryCmsEntry {
    id: string;
    createdOn: string;
    savedOn: string;
    expiresAt: string;
    values: WebhookDeliveryCmsEntryValues;
}

/* Flat runtime shape. */
export interface WebhookDelivery {
    id: string;
    createdOn: string;
    savedOn: string;
    webhookId: string;
    backgroundTaskId: string | null;
    eventType: string;
    status: WebhookDeliveryStatus;
    payload: GenericRecord;
    requestHeaders: GenericRecord | null;
    responseTime: number | null;
    responseStatus: number | null;
    responseHeaders: GenericRecord | null;
    responseBody: string | null;
}
