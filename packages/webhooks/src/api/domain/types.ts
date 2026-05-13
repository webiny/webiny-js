export type WebhookDeliveryStatus = "pending" | "delivering" | "delivered" | "failed";

export interface IWebhookValues {
    name: string;
    slug: string;
    endpointUrl: string;
    description?: string;
    enabled: boolean;
    events: string[];
    signingSecret: string | null;
}

export interface IWebhook extends IWebhookValues {
    id: string;
    createdOn: string;
    savedOn: string;
}

/** Delivery as read back from CMS (fields decompressed). */
export interface IWebhookDeliveryValues {
    webhookId: string;
    backgroundTaskId: string | null;
    eventType: string;
    status: WebhookDeliveryStatus;
    payload: object | null;
    requestHeaders: object | null;
    responseTime: number | null;
    responseStatus: number | null;
    responseBody: string | null;
    expiresAt: string;
}

export interface IWebhookDelivery {
    id: string;
    values: IWebhookDeliveryValues;
    createdOn?: string;
}

/** Raw input for creating a delivery (before compression). */
export interface ICreateDeliveryInput {
    webhookId: string;
    backgroundTaskId?: string | null;
    eventType: string;
    status: WebhookDeliveryStatus;
    payload?: object | null;
    requestHeaders?: object | null;
    responseTime?: number | null;
    responseStatus?: number | null;
    responseBody?: string | null;
    expiresAt: string;
}

/** Partial update for an existing delivery. */
export interface IUpdateDeliveryInput {
    backgroundTaskId?: string;
    status?: WebhookDeliveryStatus;
    payload?: object;
    requestHeaders?: object;
    responseTime?: number;
    responseStatus?: number;
    responseBody?: string;
}

export interface IWebhookEventDefinition {
    app: string;
    modelId: string;
    eventName: string;
    label: string;
}

export interface IListMeta {
    cursor: string | null;
    hasMoreItems: boolean;
    totalCount: number;
}

export interface IListWebhooksInput {
    where?: {
        enabled?: boolean;
        events?: string;
    };
    limit?: number;
    after?: string;
}

export interface IListWebhookDeliveriesInput {
    webhookId: string;
    limit?: number;
    after?: string;
}

/** Full JSON body sent to the endpoint. */
export interface IWebhookPayload {
    id: string;
    event: string;
    timestamp: string;
    webhookId: string;
    tenant: string;
    data: object;
}
